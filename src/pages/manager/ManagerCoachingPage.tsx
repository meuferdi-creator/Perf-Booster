import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sparkles, Send, Loader2, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { Agent, WeeklyPerformance } from '../../types';

export const ManagerCoachingPage: React.FC = () => {
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [semaine, setSemaine] = useState(31);
  const [coachingPlans, setCoachingPlans] = useState<Record<string, string>>({});
  const [loadingAgentId, setLoadingAgentId] = useState<string | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const allAgents = store.getAgents();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';
      setAgents(allAgents.filter((a) => a.manager_name === managerName));
    };

    update();
    return store.subscribe(update);
  }, []);

  const generateCoachingForAgent = async (agent: Agent) => {
    setLoadingAgentId(agent.id);
    try {
      const allPerfs = store.getWeeklyPerformances();
      const agentPerfs = allPerfs.filter((p) => p.agent_id === agent.id && p.semaine === Number(semaine));

      const response = await fetch('/api/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: agent.nom_complet,
          semaine: Number(semaine),
          perfData: agentPerfs.length > 0 ? agentPerfs[0] : { rap: 0.82, tr: 0.16, ccx: 0.9, dmt: 620 },
        }),
      });

      const data = await response.json();
      if (data.coachingPlan) {
        setCoachingPlans((prev) => ({ ...prev, [agent.id]: data.coachingPlan }));
      }
    } catch (err) {
      console.error('Coaching generation error:', err);
    } finally {
      setLoadingAgentId(null);
    }
  };

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    for (const agent of agents) {
      await generateCoachingForAgent(agent);
    }
    setIsGeneratingAll(false);
  };

  const handleSaveAndNotify = (agent: Agent) => {
    const plan = coachingPlans[agent.id];
    if (!plan) return;

    store.addNotification({
      id: `notif-coach-${Date.now()}`,
      agent_id: agent.id,
      type: 'success',
      titre: `Plan de Coaching Personnalisé S${semaine}`,
      message: `Votre manager ${auth?.manager_name || ''} vous a attribué un nouveau plan de coaching IA pour la S${semaine}.`,
      lu: false,
      semaine: Number(semaine),
      created_date: new Date().toISOString(),
    });

    alert(`Plan de coaching transmis à ${agent.nom_complet} !`);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-[#814BE7]" /> Plan de Coaching Individuel IA
          </h1>
          <p className="text-xs text-slate-500">
            Génération automatique de plans de coaching ciblés par conseiller basés sur l'IA Gemini
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={semaine}
            onChange={(e) => setSemaine(Number(e.target.value))}
            options={[
              { value: 31, label: 'Semaine 31' },
              { value: 30, label: 'Semaine 30' },
            ]}
          />

          <Button
            variant="primary"
            icon={isGeneratingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            onClick={handleGenerateAll}
            disabled={isGeneratingAll}
          >
            {isGeneratingAll ? 'Génération en cours...' : 'Tout Générer L\'Équipe'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {agents.map((agent) => {
          const plan = coachingPlans[agent.id];
          const isLoading = loadingAgentId === agent.id;

          return (
            <Card key={agent.id} className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{agent.nom_complet}</h3>
                  <p className="text-xs text-slate-400">Matricule: {agent.matricule_rh} · LOG: {agent.log_activite}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    onClick={() => generateCoachingForAgent(agent)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'IA en cours...' : 'Générer le coaching'}
                  </Button>
                  {plan && (
                    <Button
                      variant="emerald"
                      size="sm"
                      icon={<Send className="w-3.5 h-3.5" />}
                      onClick={() => handleSaveAndNotify(agent)}
                    >
                      Transmettre à l'agent
                    </Button>
                  )}
                </div>
              </div>

              {plan ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 leading-relaxed">
                  <div className="markdown-body">
                    <ReactMarkdown>{plan}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-xl text-center text-xs text-slate-400 border border-dashed border-slate-200">
                  Cliquez sur "Générer le coaching" pour créer un plan individuel IA basé sur les résultats de la S{semaine}.
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
