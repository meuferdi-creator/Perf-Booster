import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, ArrowLeft, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { getStoredAuth, setStoredAuth } from '../lib/auth-helpers';
import { store } from '../lib/store';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isFirstLogin = auth?.premier_login ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (auth) {
      auth.premier_login = false;
      setStoredAuth(auth);

      // Call API
      try {
        await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: auth.role, id: auth.id, matricule: auth.matricule, newPassword }),
        });
      } catch {
        // ignore network failure for local state fallback
      }

      if (auth.role === 'agent') {
        const agent = store.getAgents().find((a) => a.id === auth.id);
        if (agent) {
          agent.premier_login = false;
          (agent as any).password = newPassword;
          store.saveAgent(agent);
        }
      } else {
        const manager = store.getManagers().find((m) => m.id === auth.id || m.matricule === auth.matricule);
        if (manager) {
          manager.premier_login = false;
          manager.password = newPassword;
          store.saveManager(manager);
        }
      }

      setSuccess('Votre mot de passe a été mis à jour avec succès.');

      setTimeout(() => {
        if (auth.role === 'agent') {
          navigate('/agent');
        } else {
          navigate('/manager');
        }
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-8 shadow-xl relative">
        {!isFirstLogin && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-6 left-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        <div className="text-center mb-6 pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-[#814BE7] dark:text-purple-300 mb-3 border border-purple-200 dark:border-purple-800/60">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {isFirstLogin ? 'Changement de mot de passe obligatoire' : 'Modification du mot de passe'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Compte : <strong>{auth?.name || 'l\'utilisateur'}</strong>. Choisissez un nouveau mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#814BE7] focus:ring-2 focus:ring-[#814BE7]/20"
                placeholder="Au moins 6 caractères"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#814BE7] focus:ring-2 focus:ring-[#814BE7]/20"
                placeholder="Répétez le nouveau mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
          {success && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700/50 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full mt-2" icon={<ShieldCheck className="w-4 h-4" />}>
            Enregistrer le mot de passe
          </Button>
        </form>
      </Card>
    </div>
  );
};
