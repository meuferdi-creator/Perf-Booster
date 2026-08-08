import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getStoredAuth, setStoredAuth } from '../lib/auth-helpers';
import { store } from '../lib/store';

export const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = getStoredAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

      if (auth.role === 'agent') {
        const agent = store.getAgents().find((a) => a.id === auth.id);
        if (agent) {
          agent.premier_login = false;
          store.saveAgent(agent);
        }
        navigate('/agent');
      } else {
        navigate('/manager');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900/90 border-slate-800 p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/20 text-[#814BE7] mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Changement de mot de passe obligatoire</h2>
          <p className="text-xs text-slate-400 mt-1">
            Première connexion détectée pour <strong>{auth?.name || 'l\'utilisateur'}</strong>. Veuillez définir un nouveau mot de passe sécurisé.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#814BE7]"
                placeholder="Au moins 6 caractères"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#814BE7]"
                placeholder="Répétez le mot de passe"
                required
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <Button type="submit" variant="primary" className="w-full mt-2" icon={<ShieldCheck className="w-4 h-4" />}>
            Enregistrer et continuer
          </Button>
        </form>
      </Card>
    </div>
  );
};
