import React from 'react';
import { Trophy, Flame, Star, Zap, Shield, CheckCircle, Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Progress } from '../../components/ui/Progress';
import { Badge } from '../../components/ui/Badge';
import { getStoredAuth } from '../../lib/auth-helpers';

export const AgentGamificationPage: React.FC = () => {
  const auth = getStoredAuth();

  const badges = [
    { id: 'perfect_week', title: 'Semaine Parfaite', desc: '4 KPIs conformes sur la même semaine', icon: '🏆', unlocked: true },
    { id: 'speed_demon', title: 'Champion du DMT', desc: 'DMT sous la cible 110% pendant 2 semaines', icon: '⚡', unlocked: true },
    { id: 'top_csat', title: 'Maître CCX', desc: 'CCX supérieur à 94% sur Phone & Email', icon: '⭐', unlocked: true },
    { id: 'streak_3', title: 'Série de 3', desc: '3 semaines consécutives avec prime >= 20 000 FCFA', icon: '🔥', unlocked: false },
    { id: 'qa_master', title: 'Expert QA', desc: 'Score QA de 100% sur un audit hebdomadaire', icon: '🛡️', unlocked: false },
    { id: 'volume_king', title: 'Grand Volumateur', desc: 'Plus de 400 contacts traités en une semaine', icon: '👑', unlocked: false },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Gamification & Récompenses</h1>
        <p className="text-xs text-slate-500">Gagnez des niveaux, de l'expérience (XP) et débloquez des badges d'excellence.</p>
      </div>

      {/* Level Banner */}
      <Card className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#814BE7] to-indigo-500 flex items-center justify-center text-3xl shadow-xl shadow-[#814BE7]/40">
              ⚡
            </div>
            <div>
              <span className="text-2xs font-bold text-indigo-300 uppercase tracking-wider">Progression de Niveau</span>
              <h2 className="text-2xl font-black text-white">Niveau 2 · Conseiller Expert</h2>
              <p className="text-xs text-slate-300 mt-0.5">440 XP / 500 XP pour atteindre le Niveau 3</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <Progress value={88} color="purple" size="lg" showLabel />
          </div>
        </div>
      </Card>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b) => (
          <Card
            key={b.id}
            className={`p-5 relative overflow-hidden transition-all ${
              b.unlocked
                ? 'border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20'
                : 'opacity-60 bg-slate-50 border-slate-200 dark:bg-slate-900'
            }`}
          >
            <div className="flex items-start justify-between">
              <span className="text-3xl">{b.icon}</span>
              <Badge variant={b.unlocked ? 'success' : 'neutral'}>
                {b.unlocked ? 'Débloqué' : 'Verrouillé'}
              </Badge>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-3">{b.title}</h3>
            <p className="text-xs text-slate-500 mt-1">{b.desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};
