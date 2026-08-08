import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, User } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance } from '../../types';

export const AgentFeedbacksPage: React.FC = () => {
  const auth = getStoredAuth();
  const [perfs, setPerfs] = useState<WeeklyPerformance[]>([]);
  const [comments, setComments] = useState<Record<string, string>>({});

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getWeeklyPerformances();
      const agentId = currentAuth?.id || 'agent-1163';
      const myPerfs = all.filter(
        (p) => (p.agent_id === agentId || p.log_activite === currentAuth?.log_activite) && (p.feedback || p.axes_amelioration)
      );
      setPerfs(myPerfs);
    };

    update();
    return store.subscribe(update);
  }, []);

  const handleSaveComment = (perf: WeeklyPerformance) => {
    const text = comments[perf.id];
    if (!text) return;

    store.saveWeeklyPerformance({
      ...perf,
      agent_comment: text,
      comment_date: new Date().toISOString().split('T')[0],
    });

    setComments((prev) => ({ ...prev, [perf.id]: '' }));
    alert('Votre avis a été transmis au manager.');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Feedbacks & Commentaires Manager</h1>
        <p className="text-xs text-slate-500">
          Consultez les feedbacks transmis par votre manager et répondez avec vos remarques ou engagements.
        </p>
      </div>

      <div className="space-y-4">
        {perfs.length === 0 ? (
          <Card className="text-center py-10 text-slate-400 text-xs">Aucun feedback enregistré pour le moment.</Card>
        ) : (
          perfs.map((perf) => (
            <Card key={perf.id} className="p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-[#814BE7] rounded-xl dark:bg-indigo-950/50">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">
                      Feedback Semaine {perf.semaine} ({perf.canal})
                    </h3>
                    <p className="text-3xs text-slate-400">Manager : {perf.manager_name}</p>
                  </div>
                </div>
                <Badge variant="purple">S{perf.semaine} - 2026</Badge>
              </div>

              {/* Feedback Content */}
              {perf.feedback && (
                <div className="mb-4">
                  <h4 className="text-2xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Remarques générales
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    {perf.feedback}
                  </p>
                </div>
              )}

              {perf.axes_amelioration && (
                <div className="mb-4">
                  <h4 className="text-2xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    Axes d'amélioration
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/50 p-3 rounded-xl border border-amber-100/60 dark:bg-amber-950/20 dark:border-amber-900/30">
                    {perf.axes_amelioration}
                  </p>
                </div>
              )}

              {perf.plan_action && (
                <div className="mb-4">
                  <h4 className="text-2xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                    Plan d'action recommandé
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                    {perf.plan_action}
                  </p>
                </div>
              )}

              {/* Agent Response Area */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                {perf.agent_comment ? (
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-2xs font-bold text-[#814BE7] flex items-center gap-1">
                        <User className="w-3 h-3" /> Votre réponse ({perf.comment_date || 'Aujourd\'hui'})
                      </span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200">{perf.agent_comment}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                      Répondre au manager (Avis ou engagement agent)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-[#814BE7] focus:outline-none focus:ring-2 focus:ring-[#814BE7]/20"
                      placeholder="Saisissez votre commentaire ou confirmation de prise en compte..."
                      value={comments[perf.id] || ''}
                      onChange={(e) => setComments({ ...comments, [perf.id]: e.target.value })}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Send className="w-3.5 h-3.5" />}
                        onClick={() => handleSaveComment(perf)}
                      >
                        Envoyer mon avis
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
