import React, { useState, useEffect } from 'react';
import { MessageSquare, BrainCircuit, Sparkles, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { CommentThread } from '../../components/ui/CommentThread';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance, CoachingRecord } from '../../types';

export const AgentFeedbacksPage: React.FC = () => {
  const auth = getStoredAuth();
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);
  const [coachings, setCoachings] = useState<CoachingRecord[]>([]);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const allPerfs = store.getWeeklyPerformances();
      const agentId = currentAuth?.id;

      const myPerfs = allPerfs.filter(
        (p) =>
          ((agentId && p.agent_id === agentId) ||
            (currentAuth?.log_activite && p.log_activite === currentAuth.log_activite)) &&
          (p.feedback || p.axes_amelioration || p.plan_action)
      );
      setPerfs(myPerfs);

      const allCoachings = store.getCoachingRecords();
      const myCoachings = allCoachings.filter(
        (c) => agentId && c.agent_id === agentId
      );
      setCoachings(myCoachings);
    };

    update();
    return store.subscribe(update);
  }, []);

  const handleSaveComment = (perfId: string, text: string) => {
    const targetPerf = perfs.find((p) => p.id === perfId);
    if (!targetPerf) return;

    store.saveWeeklyPerformance({
      ...targetPerf,
      agent_comment: text,
      comment_date: new Date().toISOString().split('T')[0],
    });

    alert('Votre avis a été transmis à votre manager avec succès !');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#814BE7]" /> Feedbacks & Plans de Coaching
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Consultez vos feedbacks hebdomadaires et vos plans de coaching IA transmis par votre manager.
        </p>
      </div>

      {/* Coaching Plans Section */}
      {coachings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-[#814BE7]" /> Plans de Coaching Personnalisés
          </h2>

          {coachings.map((coach) => (
            <Card key={coach.id} className="p-6 bg-purple-50/30 border border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/40">
              <div className="flex items-center justify-between pb-3 border-b border-purple-200/60 dark:border-purple-900/40 mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="purple" className="px-2.5 py-1">
                    {coach.period_type === 'week' ? `Semaine ${coach.period_value}` : coach.period_value}
                  </Badge>
                  <span className="text-2xs text-slate-400">
                    Mise à jour : {new Date(coach.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <Badge variant="success">Attribué par le Manager</Badge>
              </div>

              <div className="markdown-body text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                <ReactMarkdown>{coach.content}</ReactMarkdown>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Feedbacks Section */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#814BE7]" /> Feedbacks Hebdomadaires Manager
        </h2>

        {perfs.length === 0 ? (
          <Card className="text-center py-10 text-slate-400 text-xs">
            Aucun feedback individuel enregistré pour le moment.
          </Card>
        ) : (
          perfs.map((perf) => (
            <CommentThread
              key={perf.id}
              id={perf.id}
              semaine={perf.semaine}
              canal={perf.canal}
              managerName={perf.manager_name || 'Votre Manager'}
              managerComment={perf.feedback}
              axesAmelioration={perf.axes_amelioration}
              planAction={perf.plan_action}
              agentName={auth?.name || perf.agent_name}
              agentComment={perf.agent_comment}
              commentDate={perf.comment_date}
              allowAgentReply={true}
              onSaveAgentComment={(id, text) => handleSaveComment(id, text)}
            />
          ))
        )}
      </div>
    </div>
  );
};
