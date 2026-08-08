import React, { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance } from '../../types';

export const ManagerCommentsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [perfsWithComments, setPerfsWithComments] = useState<WeeklyPerformance[]>([]);

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getWeeklyPerformances();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';
      const myPerfs = all.filter(
        (p) => p.manager_name === managerName && (p.agent_comment || p.feedback)
      );
      setPerfsWithComments(myPerfs);
    };

    update();
    return store.subscribe(update);
  }, []);

  const repliedCount = perfsWithComments.filter((p) => p.agent_comment).length;
  const totalFeedbacks = perfsWithComments.filter((p) => p.feedback).length;
  const engagementRate = totalFeedbacks > 0 ? Math.round((repliedCount / totalFeedbacks) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Avis & Réponses des Agents</h1>
        <p className="text-xs text-slate-500">
          Suivi des engagements et confirmations de prise en compte transmis par les conseillers
        </p>
      </div>

      {/* Engagement Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">Feedbacks Transmis</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{totalFeedbacks}</span>
        </Card>

        <Card className="p-4">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">Réponses Recevables</span>
          <span className="text-2xl font-black text-[#814BE7]">{repliedCount}</span>
        </Card>

        <Card className="p-4">
          <span className="text-2xs text-slate-400 font-bold uppercase tracking-wider block">Taux d'Engagement Agent</span>
          <span className="text-2xl font-black text-emerald-600">{engagementRate}%</span>
        </Card>
      </div>

      <Card noPadding>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Semaine</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Feedback Manager</TableHead>
              <TableHead>Réponse / Engagement Agent</TableHead>
              <TableHead>Date Réponse</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {perfsWithComments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{p.agent_name}</TableCell>
                <TableCell>S{p.semaine}</TableCell>
                <TableCell>{p.canal}</TableCell>
                <TableCell className="max-w-xs truncate text-slate-600">{p.feedback || '—'}</TableCell>
                <TableCell>
                  {p.agent_comment ? (
                    <span className="text-xs font-semibold text-[#814BE7] bg-indigo-50 px-2 py-1 rounded-md dark:bg-indigo-950/50">
                      {p.agent_comment}
                    </span>
                  ) : (
                    <Badge variant="warning">En attente de réponse</Badge>
                  )}
                </TableCell>
                <TableCell className="text-3xs text-slate-400">{p.comment_date || '—'}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};
