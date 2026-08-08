import React, { useState, useEffect } from 'react';
import { MessageSquare, Sparkles, Send, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { Agent, WeeklyPerformance } from '../../types';

export const ManagerFeedbacksPage: React.FC = () => {
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [semaine, setSemaine] = useState(31);

  const [feedbackText, setFeedbackText] = useState('');
  const [axesText, setAxesText] = useState('');
  const [planActionText, setPlanActionText] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getAgents();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';
      const myAgents = all.filter((a) => a.manager_name === managerName);
      setAgents(myAgents);
      setSelectedAgentId((prev) => prev || (myAgents[0]?.id || ''));
    };

    update();
    return store.subscribe(update);
  }, []);

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  const handleGenerateAiFeedback = async () => {
    if (!selectedAgent) return;
    setIsGenerating(true);

    try {
      const allPerfs = store.getWeeklyPerformances();
      const myPerf = allPerfs.find((p) => p.agent_id === selectedAgent.id && p.semaine === Number(semaine));

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: selectedAgent.nom_complet,
          semaine: Number(semaine),
          perfData: myPerf || { rap: 0.83, tr: 0.15, ccx: 0.91, dmt: 610 },
        }),
      });

      const data = await response.json();
      if (data.feedback) setFeedbackText(data.feedback);
      if (data.axes_amelioration) setAxesText(data.axes_amelioration);
      if (data.plan_action) setPlanActionText(data.plan_action);
    } catch (err) {
      console.error('Error generating feedback:', err);
      alert('Erreur lors de la génération avec l\'IA.');
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
      id: `notif-${Date.now()}`,
      agent_id: selectedAgent.id,
      type: 'info',
      titre: `Nouveau feedback S${semaine}`,
      message: `${auth?.manager_name || 'Votre manager'} a publié votre feedback pour la semaine ${semaine}.`,
      lu: false,
      semaine: Number(semaine),
      created_date: new Date().toISOString(),
    });

    alert(`Feedback enregistré et notifié à ${selectedAgent.nom_complet} !`);
    setFeedbackText('');
    setAxesText('');
    setPlanActionText('');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Rédiger un Feedback Manager</h1>
          <p className="text-xs text-slate-500">Transmettez vos remarques et plans d'action hebdomadaires directement aux conseillers.</p>
        </div>

        <Button
          variant="secondary"
          icon={isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          onClick={handleGenerateAiFeedback}
          disabled={isGenerating}
        >
          {isGenerating ? 'Génération IA...' : 'Générer avec l\'IA'}
        </Button>
      </div>

      <Card className="space-y-4 p-6">
        <div className="grid grid-cols-2 gap-4">
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
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Remarques & Feedback Général</label>
          <textarea
            rows={3}
            className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#814BE7] focus:outline-none focus:ring-2 focus:ring-[#814BE7]/20"
            placeholder="Feedback constructif sur les résultats de la semaine..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-amber-700">Axes d'Amélioration</label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-amber-200 bg-amber-50/30 p-3 text-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            placeholder="Points spécifiques nécessitant une vigilance..."
            value={axesText}
            onChange={(e) => setAxesText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-emerald-700">Plan d'Action Recommandé</label>
          <textarea
            rows={2}
            className="w-full rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 text-xs focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Étapes concrètes pour la semaine à venir..."
            value={planActionText}
            onChange={(e) => setPlanActionText(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <Button variant="primary" icon={<Send className="w-4 h-4" />} onClick={handleSave}>
            Enregistrer et notifier l'agent
          </Button>
        </div>
      </Card>
    </div>
  );
};
