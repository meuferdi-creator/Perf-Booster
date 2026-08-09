import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle2, Clock, Filter, Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import { CommentThread } from '../../components/ui/CommentThread';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { filterByManager } from '../../lib/perimeter';
import { WeeklyPerformance } from '../../types';

export const ManagerCommentsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [perfsWithComments, setPerfsWithComments] = useState<WeeklyPerformance[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'replied' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const update = () => {
      const all = store.getWeeklyPerformances();
      const myPerfs = filterByManager(all).filter(
        (p) => p.agent_comment || p.feedback || p.axes_amelioration
      );
      setPerfsWithComments(myPerfs);
    };

    update();
    return store.subscribe(update);
  }, []);

  const repliedCount = perfsWithComments.filter((p) => p.agent_comment).length;
  const totalFeedbacks = perfsWithComments.filter((p) => p.feedback || p.axes_amelioration).length;
  const pendingCount = totalFeedbacks - repliedCount;
  const engagementRate = totalFeedbacks > 0 ? Math.round((repliedCount / totalFeedbacks) * 100) : 0;

  const filteredPerfs = perfsWithComments.filter((p) => {
    if (filterStatus === 'replied' && !p.agent_comment) return false;
    if (filterStatus === 'pending' && p.agent_comment) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchAgent = p.agent_name.toLowerCase().includes(query);
      const matchComment = (p.agent_comment || '').toLowerCase().includes(query);
      const matchFeedback = (p.feedback || '').toLowerCase().includes(query);
      return matchAgent || matchComment || matchFeedback;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#814BE7]" /> Avis & Engagements Agents
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Suivi structuré des échanges, retours et confirmations d'engagement transmis par vos conseillers.
        </p>
      </div>

      {/* Engagement Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-l-4 border-l-[#814BE7]">
          <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Feedbacks Transmis
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalFeedbacks}</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Réponses Reçues
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{repliedCount}</span>
            <span className="text-3xs font-semibold text-slate-400">({pendingCount} en attente)</span>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <span className="text-2xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Taux d'Engagement Agent
          </span>
          <span className="text-2xl font-black text-[#814BE7]">{engagementRate}%</span>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Rechercher agent, commentaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-full sm:w-60">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            options={[
              { value: 'all', label: 'Tous les échanges' },
              { value: 'replied', label: 'Réponses reçues uniquement' },
              { value: 'pending', label: 'En attente de réponse' },
            ]}
          />
        </div>
      </Card>

      {/* Structured Threads List */}
      <div className="space-y-6">
        {filteredPerfs.length === 0 ? (
          <Card className="p-10 text-center text-slate-500 dark:text-slate-400 text-xs">
            Aucun commentaire correspondant aux critères sélectionnés.
          </Card>
        ) : (
          filteredPerfs.map((p) => (
            <CommentThread
              key={p.id}
              id={p.id}
              semaine={p.semaine}
              canal={p.canal}
              managerName={p.manager_name || auth?.manager_name || 'SABI Prospere'}
              managerComment={p.feedback}
              axesAmelioration={p.axes_amelioration}
              planAction={p.plan_action}
              agentName={p.agent_name}
              agentComment={p.agent_comment}
              commentDate={p.comment_date}
            />
          ))
        )}
      </div>
    </div>
  );
};
