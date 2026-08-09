import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, Loader2, AlertTriangle, RotateCcw, Upload, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { filterByManager } from '../../lib/perimeter';
import { Agent } from '../../types';

export const ManagerFeedbacksPage: React.FC = () => {
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [semaine, setSemaine] = useState<number>(31);

  const [feedbackText, setFeedbackText] = useState('');
  const [axesText, setAxesText] = useState('');
  const [planActionText, setPlanActionText] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importStatusMsg, setImportStatusMsg] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const update = () => {
      const all = store.getAgents();
      const myAgents = filterByManager(all);
      setAgents(myAgents);
      if (!selectedAgentId && myAgents.length > 0) {
        setSelectedAgentId(myAgents[0].id);
      }
    };

    update();
    return store.subscribe(update);
  }, []);

  // When agent or semaine changes, load existing saved feedback if any
  useEffect(() => {
    if (!selectedAgentId) return;

    const allPerfs = store.getWeeklyPerformances();
    const existing = allPerfs.find((p) => p.agent_id === selectedAgentId && p.semaine === Number(semaine));

    if (existing) {
      setFeedbackText(existing.feedback || '');
      setAxesText(existing.axes_amelioration || '');
      setPlanActionText(existing.plan_action || '');
    } else {
      setFeedbackText('');
      setAxesText('');
      setPlanActionText('');
    }
    setErrorMessage(null);
  }, [selectedAgentId, semaine]);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleGenerateAiFeedback = async () => {
    if (!selectedAgent) return;
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const allPerfs = store.getWeeklyPerformances();
      const myPerf = allPerfs.find((p) => p.agent_id === selectedAgent.id && p.semaine === Number(semaine));

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: selectedAgent.nom_complet,
          semaine: Number(semaine),
          perfData: myPerf || { rap: 0.83, tr: 0.15, ccx: 0.91, dmt: 610, vol: 250 },
          managerName: auth?.manager_name || 'SABI Prospere',
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.feedback) setFeedbackText(data.feedback);
      if (data.axes_amelioration) setAxesText(data.axes_amelioration);
      if (data.plan_action) setPlanActionText(data.plan_action);

      if (!data.feedback && !data.axes_amelioration) {
        throw new Error('Format de réponse reçu invalide.');
      }
    } catch (err: any) {
      console.error('Error generating feedback:', err);
      setErrorMessage(err?.message || 'L\'appel à l\'API IA de feedback a échoué.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!selectedAgent) return;

    const allPerfs = store.getWeeklyPerformances();
    let targetPerf = allPerfs.find((p) => p.agent_id === selectedAgent.id && p.semaine === Number(semaine));

    if (!targetPerf) {
      targetPerf = {
        id: `perf-fb-${Date.now()}`,
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.nom_complet,
        log_activite: selectedAgent.log_activite,
        manager_name: auth?.manager_name || 'SABI Prospere',
        canal: 'Phone',
        semaine: Number(semaine),
        annee: 2026,
        rap: 0.83,
        tr: 0.15,
        ccx: 0.91,
        dmt: 600,
        vol: 250,
      };
    }

    store.saveWeeklyPerformance({
      ...targetPerf,
      feedback: feedbackText,
      axes_amelioration: axesText,
      plan_action: planActionText,
    });

    // Notify agent
    store.addNotification({
      id: `notif-fb-${Date.now()}`,
      agent_id: selectedAgent.id,
      type: 'info',
      titre: `Nouveau feedback S${semaine}`,
      message: `${auth?.manager_name || 'Votre manager'} a publié votre feedback pour la semaine ${semaine}.`,
      lu: false,
      semaine: Number(semaine),
      created_date: new Date().toISOString(),
    });

    alert(`Feedback enregistré et notifié à ${selectedAgent.nom_complet} !`);
  };

  // Import Feedbacks Excel/CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        let count = 0;
        data.forEach((row) => {
          const agentRef = String(row.agent || row.Agent || row.nom || row.matricule || '').trim().toLowerCase();
          const fb = row.feedback || row.Feedback || row.remarques || '';
          const axes = row.axes || row.axes_amelioration || '';
          const plan = row.plan || row.plan_action || '';

          if (agentRef && (fb || axes || plan)) {
            const targetAg = agents.find(
              (a) =>
                a.nom_complet.toLowerCase().includes(agentRef) ||
                a.log_activite.toLowerCase() === agentRef ||
                a.matricule_rh.toLowerCase() === agentRef
            );

            if (targetAg) {
              const allPerfs = store.getWeeklyPerformances();
              let perf = allPerfs.find((p) => p.agent_id === targetAg.id && p.semaine === Number(semaine));

              if (!perf) {
                perf = {
                  id: `perf-fb-${Date.now()}-${targetAg.id}`,
                  agent_id: targetAg.id,
                  agent_name: targetAg.nom_complet,
                  log_activite: targetAg.log_activite,
                  manager_name: auth?.manager_name || 'SABI Prospere',
                  canal: 'Phone',
                  semaine: Number(semaine),
                  annee: 2026,
                  rap: 0.85,
                  tr: 0.12,
                  ccx: 0.9,
                  dmt: 600,
                  vol: 200,
                };
              }

              store.saveWeeklyPerformance({
                ...perf,
                feedback: String(fb),
                axes_amelioration: String(axes),
                plan_action: String(plan),
              });
              count++;
            }
          }
        });

        if (count > 0) {
          setImportStatusMsg({ type: 'success', message: `${count} feedback(s) importé(s) avec succès pour la semaine ${semaine}.` });
        } else {
          setImportStatusMsg({ type: 'error', message: 'Aucun agent correspondant trouvé dans le fichier.' });
        }
      } catch (err) {
        setImportStatusMsg({ type: 'error', message: 'Erreur lors de la lecture du fichier.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#814BE7]" /> Feedback Manager & IA
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rédigez, générez avec l'IA ou éditez les feedbacks hebdomadaires transmis aux conseillers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />} onClick={() => setShowImportModal(true)}>
            Importer Fichier
          </Button>

          <Button
            variant="secondary"
            icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-[#814BE7]" />}
            onClick={handleGenerateAiFeedback}
            disabled={isGenerating || !selectedAgent}
          >
            {isGenerating ? 'Génération IA...' : 'Générer avec l\'IA'}
          </Button>
        </div>
      </div>

      <Card className="space-y-5 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Sélectionner l'agent"
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            options={agents.map((a) => ({ value: a.id, label: `${a.nom_complet} (${a.matricule_rh})` }))}
          />

          <Select
            label="Semaine"
            value={semaine}
            onChange={(e) => setSemaine(Number(e.target.value))}
            options={[
              { value: 31, label: 'Semaine 31 (2026)' },
              { value: 30, label: 'Semaine 30 (2026)' },
              { value: 29, label: 'Semaine 29 (2026)' },
              { value: 28, label: 'Semaine 28 (2026)' },
            ]}
          />
        </div>

        {/* Error Banner if API Fails */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-100 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <Button size="sm" variant="danger" icon={<RotateCcw className="w-3 h-3" />} onClick={handleGenerateAiFeedback}>
              Réessayer
            </Button>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
            Remarques & Feedback Général
          </label>
          <textarea
            rows={4}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#814BE7] focus:outline-none focus:ring-2 focus:ring-[#814BE7]/30 transition-all font-medium leading-relaxed"
            placeholder="Écrire un feedback constructif sur les résultats de la semaine..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-amber-800 dark:text-amber-300">Axes d'Amélioration</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-amber-300 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-800/60 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all font-medium leading-relaxed"
            placeholder="Points spécifiques nécessitant une vigilance..."
            value={axesText}
            onChange={(e) => setAxesText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">Plan d'Action Recommandé</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/30 dark:border-emerald-800/60 p-3.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-medium leading-relaxed"
            placeholder="Étapes concrètes pour la semaine à venir..."
            value={planActionText}
            onChange={(e) => setPlanActionText(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button variant="primary" icon={<Send className="w-4 h-4" />} onClick={handleSave}>
            Enregistrer et notifier l'agent
          </Button>
        </div>
      </Card>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#814BE7]" /> Importer Feedbacks Excel / CSV
            </h3>

            {importStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium ${
                  importStatusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100' : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-100'
                }`}
              >
                {importStatusMsg.message}
              </div>
            )}

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-[#814BE7] bg-slate-50/80 dark:bg-slate-800/50">
              <Upload className="w-6 h-6 text-[#814BE7] mb-2" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {importFile ? importFile.name : 'Sélectionner un fichier Excel'}
              </span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportFile} className="hidden" />
            </label>

            <div className="flex justify-end pt-2">
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
