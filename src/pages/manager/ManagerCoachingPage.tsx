import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  RotateCcw,
  Upload,
  FileSpreadsheet,
  Camera,
  X,
  Calendar,
  FileText,
  UserCheck,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Tabs } from '../../components/ui/Tabs';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { filterByManager } from '../../lib/perimeter';
import { Agent, WeeklyPerformance, MonthlyResult, CoachingRecord } from '../../types';
import { calculateAssiduiteFromPerf } from '../../lib/kpi-utils';

export const ManagerCoachingPage: React.FC = () => {
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);

  // Period management
  const [periodType, setPeriodType] = useState<'week' | 'month'>('week');
  const [selectedSemaine, setSelectedSemaine] = useState<number>(31);
  const [selectedMoisKey, setSelectedMoisKey] = useState<string>('2026-07');

  // Coaching state & UI
  const [coachingMap, setCoachingMap] = useState<Record<string, CoachingRecord>>({});
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null);
  const [agentErrors, setAgentErrors] = useState<Record<string, string>>({});
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');

  // Team Generation Progress State
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [teamProgress, setTeamProgress] = useState<{
    current: number;
    total: number;
    success: number;
    failed: number;
  } | null>(null);
  const [teamSummary, setTeamSummary] = useState<string | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFeedbackMsg, setImportFeedbackMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentPeriodVal = periodType === 'week' ? String(selectedSemaine) : selectedMoisKey;

  // Load Agents & Existing Coaching Records
  const loadData = () => {
    const allAgents = store.getAgents();
    const myAgents = filterByManager(allAgents);
    setAgents(myAgents);

    const records = store.getCoachingRecords();
    const map: Record<string, CoachingRecord> = {};
    records.forEach((r) => {
      if (r.period_type === periodType && String(r.period_value) === currentPeriodVal) {
        map[r.agent_id] = r;
      }
    });
    setCoachingMap(map);
  };

  useEffect(() => {
    loadData();
    return store.subscribe(loadData);
  }, [periodType, selectedSemaine, selectedMoisKey]);

  // Fetch Agent Context
  const getAgentContextData = (agent: Agent) => {
    if (periodType === 'week') {
      const allPerfs = store.getWeeklyPerformances();
      const perfs = allPerfs.filter((p) => p.agent_id === agent.id && p.semaine === selectedSemaine);
      const perf = perfs[0];
      const assid = perf ? calculateAssiduiteFromPerf(perf) : 100;
      return {
        rap: perf?.rap ?? 0.85,
        tr: perf?.tr ?? 0.12,
        ccx: perf?.ccx ?? 0.92,
        dmt: perf?.dmt ?? 600,
        vol: perf?.vol ?? 180,
        h_planifiees: perf?.h_planifiees ?? 40,
        h_absence: perf?.h_absence ?? 0,
        assiduite: assid,
        canal: perf?.canal ?? 'Phone',
      };
    } else {
      const allMonthly = store.getMonthlyResults();
      const monthly = allMonthly.find((m) => m.agent_id === agent.id && m.mois_key === selectedMoisKey);
      return {
        rap: monthly?.rap_phone ?? 0.85,
        tr: monthly?.tr_phone ?? 0.12,
        ccx: monthly?.ccx_phone ?? 0.92,
        dmt: monthly?.dmt_phone ?? 600,
        presence: monthly?.presence ?? 100,
        pv_finale: monthly?.pv_finale ?? 45000,
        statut_prime: monthly?.statut ?? 'Objectif atteint',
      };
    }
  };

  // Generate Coaching for Single Agent
  const generateCoachingForAgent = async (agent: Agent): Promise<boolean> => {
    setLoadingAgentId(agent.id);
    setAgentErrors((prev) => ({ ...prev, [agent.id]: '' }));

    try {
      const contextData = getAgentContextData(agent);

      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.nom_complet,
          periodType,
          semaine: selectedSemaine,
          moisKey: selectedMoisKey,
          perfData: contextData,
          anciennete: agent.anciennete,
          managerName: auth?.manager_name || 'SABI Prospere',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur (${response.status})`);
      }

      const data = await response.json();
      const textResult = data.coaching || data.coachingPlan;

      if (!textResult) {
        throw new Error('Réponse IA vide.');
      }

      const recId = `coach-${agent.id}-${periodType}-${currentPeriodVal}`;
      const record: CoachingRecord = {
        id: recId,
        agent_id: agent.id,
        agent_name: agent.nom_complet,
        period_type: periodType,
        period_value: currentPeriodVal,
        content: textResult,
        updated_at: new Date().toISOString(),
        created_by: auth?.manager_name || 'Manager',
        status: 'generated',
      };

      store.saveCoachingRecord(record);
      setCoachingMap((prev) => ({ ...prev, [agent.id]: record }));
      return true;
    } catch (err: any) {
      console.error(`Error generating coaching for ${agent.nom_complet}:`, err);
      const msg = err?.message || 'L\'appel au moteur IA a échoué. Veuillez réessayer.';
      setAgentErrors((prev) => ({ ...prev, [agent.id]: msg }));
      return false;
    } finally {
      setLoadingAgentId(null);
    }
  };

  // Generate Coaching for All Agents (Sequential with Progress)
  const handleGenerateAll = async () => {
    if (agents.length === 0) return;

    setIsGeneratingAll(true);
    setTeamSummary(null);
    setTeamProgress({ current: 0, total: agents.length, success: 0, failed: 0 });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      setTeamProgress({ current: i + 1, total: agents.length, success: successCount, failed: failedCount });

      const ok = await generateCoachingForAgent(agent);
      if (ok) successCount++;
      else failedCount++;
    }

    setTeamProgress({ current: agents.length, total: agents.length, success: successCount, failed: failedCount });

    if (failedCount === 0) {
      setTeamSummary(`🎉 ${successCount} coaching(s) généré(s) avec succès pour l'ensemble de l'équipe !`);
    } else {
      setTeamSummary(`⚠️ ${successCount} coaching(s) généré(s) avec succès. ${failedCount} agent(s) en erreur.`);
    }

    setIsGeneratingAll(false);
  };

  // Save Manual Edits
  const handleSaveEdit = (agentId: string) => {
    const existing = coachingMap[agentId];
    if (!existing) return;

    const updated: CoachingRecord = {
      ...existing,
      content: editedContent,
      updated_at: new Date().toISOString(),
      status: 'edited',
    };

    store.saveCoachingRecord(updated);
    setCoachingMap((prev) => ({ ...prev, [agentId]: updated }));
    setEditingAgentId(null);
  };

  // Transmit & Notify Agent
  const handleSendToAgent = (agent: Agent) => {
    const record = coachingMap[agent.id];
    if (!record) return;

    const periodLabel = periodType === 'week' ? `S${selectedSemaine}` : selectedMoisKey;

    store.addNotification({
      id: `notif-coach-${Date.now()}`,
      agent_id: agent.id,
      type: 'success',
      titre: `Plan de Coaching ${periodLabel}`,
      message: `Votre manager ${auth?.manager_name || ''} vous a transmis un plan de coaching personnalisé pour ${periodLabel}.`,
      lu: false,
      semaine: periodType === 'week' ? selectedSemaine : undefined,
      created_date: new Date().toISOString(),
    });

    const updatedRecord: CoachingRecord = {
      ...record,
      status: 'sent',
      updated_at: new Date().toISOString(),
    };
    store.saveCoachingRecord(updatedRecord);

    alert(`Plan de coaching transmis à ${agent.nom_complet} ! Notification envoyée.`);
  };

  // Import Coachings / Feedbacks from Excel / CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportFeedbackMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          setImportFeedbackMsg({ type: 'error', message: 'Fichier vide.' });
          return;
        }

        let importedCount = 0;
        data.forEach((row) => {
          const rawAgent = row.agent || row.Agent || row.nom || row.Nom || row.log_activite || row.matricule || '';
          const rawContent = row.coaching || row.Coaching || row.feedback || row.Feedback || row.remarques || '';

          if (rawAgent && rawContent) {
            const cleanAgent = String(rawAgent).trim().toLowerCase();
            const matchedAgent = agents.find(
              (a) =>
                a.nom_complet.toLowerCase().includes(cleanAgent) ||
                a.log_activite.toLowerCase() === cleanAgent ||
                a.matricule_rh.toLowerCase() === cleanAgent
            );

            if (matchedAgent) {
              const recId = `coach-${matchedAgent.id}-${periodType}-${currentPeriodVal}`;
              const record: CoachingRecord = {
                id: recId,
                agent_id: matchedAgent.id,
                agent_name: matchedAgent.nom_complet,
                period_type: periodType,
                period_value: currentPeriodVal,
                content: String(rawContent),
                updated_at: new Date().toISOString(),
                created_by: auth?.manager_name || 'Import File',
                status: 'edited',
              };
              store.saveCoachingRecord(record);
              importedCount++;
            }
          }
        });

        if (importedCount > 0) {
          setImportFeedbackMsg({
            type: 'success',
            message: `${importedCount} coaching(s) / feedback(s) importé(s) avec succès pour l'ensemble de l'équipe !`,
          });
          loadData();
        } else {
          setImportFeedbackMsg({
            type: 'error',
            message: 'Aucun agent correspondant n\'a été trouvé dans le fichier. Vérifiez les noms ou matricules.',
          });
        }
      } catch (err) {
        setImportFeedbackMsg({ type: 'error', message: 'Erreur de lecture du fichier Excel/CSV.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-[#814BE7]" /> Plan de Coaching Individuel IA
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Génération automatique de coachings personnalisés et humanisés pour booster la montée en compétences
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setShowImportModal(true)}>
            Importer Fichier / Capture
          </Button>

          <Button
            variant="primary"
            icon={isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            onClick={handleGenerateAll}
            disabled={isGeneratingAll || agents.length === 0}
          >
            {isGeneratingAll ? 'Génération en cours...' : 'Tout Générer l\'Équipe'}
          </Button>
        </div>
      </div>

      {/* Period Selector Card */}
      <Card className="p-4 bg-slate-50/80 dark:bg-slate-900/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="px-3 py-1 text-xs">
              Période d'Analyse
            </Badge>

            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setPeriodType('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodType === 'week'
                    ? 'bg-[#814BE7] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Hebdomadaire (Semaines)
              </button>
              <button
                onClick={() => setPeriodType('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodType === 'month'
                    ? 'bg-[#814BE7] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                Mensuel (Mois)
              </button>
            </div>
          </div>

          <div>
            {periodType === 'week' ? (
              <Select
                value={selectedSemaine}
                onChange={(e) => setSelectedSemaine(Number(e.target.value))}
                options={[
                  { value: 31, label: 'Semaine 31 (S31)' },
                  { value: 30, label: 'Semaine 30 (S30)' },
                  { value: 29, label: 'Semaine 29 (S29)' },
                  { value: 28, label: 'Semaine 28 (S28)' },
                  { value: 27, label: 'Semaine 27 (S27)' },
                ]}
              />
            ) : (
              <Select
                value={selectedMoisKey}
                onChange={(e) => setSelectedMoisKey(e.target.value)}
                options={[
                  { value: '2026-07', label: 'Juillet 2026' },
                  { value: '2026-06', label: 'Juin 2026' },
                  { value: '2026-05', label: 'Mai 2026' },
                ]}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Progress & Summary Bar for Team Generation */}
      {isGeneratingAll && teamProgress && (
        <Card className="p-4 bg-purple-50/80 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-900 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#814BE7]" />
              Génération d'équipe en cours : {teamProgress.current} / {teamProgress.total} agents traités
            </span>
            <span>{Math.round((teamProgress.current / teamProgress.total) * 100)}%</span>
          </div>

          <div className="w-full bg-purple-200 dark:bg-purple-900 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#814BE7] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(teamProgress.current / teamProgress.total) * 100}%` }}
            />
          </div>

          <div className="flex gap-4 text-2xs text-purple-700 dark:text-purple-300">
            <span>✅ Succès : {teamProgress.success}</span>
            <span>⚠️ Erreurs : {teamProgress.failed}</span>
          </div>
        </Card>
      )}

      {teamSummary && !isGeneratingAll && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between">
          <span>{teamSummary}</span>
          <button onClick={() => setTeamSummary(null)} className="text-emerald-600 hover:underline">
            Fermer
          </button>
        </div>
      )}

      {/* Agents Coaching Cards List */}
      <div className="space-y-6">
        {agents.map((agent) => {
          const record = coachingMap[agent.id];
          const isLoading = loadingAgentId === agent.id;
          const error = agentErrors[agent.id];
          const isEditing = editingAgentId === agent.id;

          return (
            <Card key={agent.id} className="p-6 space-y-4">
              {/* Agent Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{agent.nom_complet}</h3>
                    <Badge variant="purple">{agent.anciennete || '+ 3 mois'}</Badge>
                    {record?.status === 'sent' && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Transmis
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xs text-slate-400 mt-0.5">
                    Matricule : {agent.matricule_rh} · LOG : {agent.log_activite} · Manager : {agent.manager_name}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {record && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => {
                        setEditingAgentId(agent.id);
                        setEditedContent(record.content);
                      }}
                    >
                      Éditer
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    icon={isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    onClick={() => generateCoachingForAgent(agent)}
                    disabled={isLoading || isGeneratingAll}
                  >
                    {isLoading ? 'IA en cours...' : record ? 'Régénérer' : 'Générer le coaching'}
                  </Button>

                  {record && !isEditing && (
                    <Button
                      variant="emerald"
                      size="sm"
                      icon={<Send className="w-3.5 h-3.5" />}
                      onClick={() => handleSendToAgent(agent)}
                    >
                      Transmettre
                    </Button>
                  )}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Impossible de générer le coaching : {error}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<RotateCcw className="w-3 h-3" />}
                    onClick={() => generateCoachingForAgent(agent)}
                  >
                    Réessayer
                  </Button>
                </div>
              )}

              {/* Editing Mode */}
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    rows={12}
                    className="w-full rounded-2xl border border-[#814BE7] p-4 text-xs font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#814BE7]/30"
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingAgentId(null)}>
                      Annuler
                    </Button>
                    <Button variant="emerald" size="sm" icon={<Save className="w-3.5 h-3.5" />} onClick={() => handleSaveEdit(agent.id)}>
                      Enregistrer les modifications
                    </Button>
                  </div>
                </div>
              ) : record ? (
                /* Display Mode: Rendered Markdown */
                <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-xs text-slate-800 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-200 leading-relaxed shadow-xs">
                  <div className="markdown-body space-y-2">
                    <ReactMarkdown>{record.content}</ReactMarkdown>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-3xs text-slate-400 flex items-center justify-between">
                    <span>Dernière mise à jour : {new Date(record.updated_at).toLocaleString('fr-FR')}</span>
                    <span>Auteur : {record.created_by || 'Manager'}</span>
                  </div>
                </div>
              ) : isLoading ? (
                /* Loading Placeholder */
                <div className="p-8 bg-purple-50/40 rounded-2xl border border-purple-100/60 text-center space-y-2 dark:bg-purple-950/20 dark:border-purple-900/30">
                  <Loader2 className="w-6 h-6 animate-spin text-[#814BE7] mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Génération du coaching personnalisé en cours avec Gemini...
                  </p>
                  <p className="text-2xs text-slate-400">Analyse des KPIs, écarts et objectifs de la période</p>
                </div>
              ) : (
                /* Initial Empty State */
                <div className="p-6 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:bg-slate-900/40 dark:border-slate-800">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    Aucun coaching généré pour la période ({periodType === 'week' ? `S${selectedSemaine}` : selectedMoisKey}).
                  </p>
                  <p className="text-2xs text-slate-400 mt-1">
                    Cliquez sur "Générer le coaching" pour générer un plan personnalisé basé sur les données réelles de l'agent.
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* File / Capture Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#814BE7]" /> Importer Feedbacks / Coachings
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Téléversez un fichier Excel/CSV contenant vos remarques ou coachings préexistants. Les colonnes reconnues : <code className="bg-slate-100 px-1 py-0.5 rounded text-2xs font-bold text-[#814BE7]">Agent / Matricule</code> et <code className="bg-slate-100 px-1 py-0.5 rounded text-2xs font-bold text-[#814BE7]">Coaching / Feedback</code>.
            </p>

            {importFeedbackMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  importFeedbackMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {importFeedbackMsg.message}
              </div>
            )}

            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer hover:border-[#814BE7] transition-all bg-slate-50/50 dark:bg-slate-900/50">
                <Upload className="w-8 h-8 text-[#814BE7] mb-2" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {importFile ? importFile.name : 'Sélectionner un fichier .xlsx, .xls ou .csv'}
                </span>
                <span className="text-3xs text-slate-400 mt-1">Glissez-déposez ou cliquez ici</span>
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFile} className="hidden" />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" onClick={() => setShowImportModal(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
