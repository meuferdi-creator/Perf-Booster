import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { store } from '../lib/store';
import { setStoredAuth } from '../lib/auth-helpers';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'agent' | 'manager'>('agent');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setError('Veuillez saisir votre identifiant.');
      return;
    }
    if (!cleanPass) {
      setError('Veuillez saisir votre mot de passe.');
      return;
    }

    try {
      // 1. Attempt Server API Login
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, identifier: cleanId, password: cleanPass }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          setStoredAuth(data.user);
          if (data.user.premier_login) {
            navigate('/change-password');
          } else if (role === 'agent') {
            navigate('/agent');
          } else {
            navigate('/manager');
          }
          return;
        }
      } else if (res.status === 401 || res.status === 400) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || 'Identifiant ou mot de passe incorrect.');
        return;
      }
    } catch {
      // API unreachable -> execute strict local fallback
    }

    // 2. Strict Deterministic Local Fallback (NO loose includes, NO !savedPass, NO 123456)
    const idLower = cleanId.toLowerCase();

    if (role === 'agent') {
      const agents = store.getAgents();
      // Exact matching only for matricule_rh, log_activite, or email
      const agent = agents.find((a) => {
        const aMat = (a.matricule_rh || '').toLowerCase();
        const aLog = (a.log_activite || '').toLowerCase();
        const aEmail = (a.email || '').toLowerCase();
        return aMat === idLower || aLog === idLower || aEmail === idLower;
      });

      if (!agent) {
        setError('Identifiant ou mot de passe incorrect.');
        return;
      }

      const savedPass = (agent as any).password;
      const expectedPass = savedPass || ('TP' + agent.matricule_rh);

      if (cleanPass !== expectedPass) {
        setError('Identifiant ou mot de passe incorrect.');
        return;
      }

      const authData = {
        role: 'agent' as const,
        id: agent.id,
        matricule: agent.matricule_rh,
        name: agent.nom_complet,
        prenom: agent.prenom,
        manager_name: agent.manager_name,
        premier_login: agent.premier_login ?? false,
        anciennete: agent.anciennete,
        log_activite: agent.log_activite,
      };

      setStoredAuth(authData);

      if (agent.premier_login) {
        navigate('/change-password');
      } else {
        navigate('/agent');
      }
    } else {
      const managers = store.getManagers();
      let matchedManager: typeof managers[0] | undefined = undefined;

      if (idLower === 'manager') {
        // "Manager" generic username -> match uniquely by exact password
        matchedManager = managers.find((m) => {
          const mPass = m.password || ('TP' + m.matricule);
          return mPass === cleanPass;
        });
      } else {
        // Specific identifier typed -> exact match on matricule, name, nom, or id
        matchedManager = managers.find((m) => {
          const mMat = (m.matricule || '').toLowerCase();
          const mName = m.name.toLowerCase();
          const mNom = (m.nom || '').toLowerCase();
          const mId = (m.id || '').toLowerCase();

          const isIdMatch =
            mMat === idLower ||
            mName === idLower ||
            mNom === idLower ||
            mId === idLower ||
            ('tp' + mMat) === idLower;

          if (!isIdMatch) return false;

          const mPass = m.password || ('TP' + m.matricule);
          return mPass === cleanPass;
        });
      }

      if (!matchedManager) {
        setError('Identifiant ou mot de passe incorrect.');
        return;
      }

      const authData = {
        role: 'manager' as const,
        id: matchedManager.id,
        matricule: matchedManager.matricule,
        name: matchedManager.name,
        nom: matchedManager.nom,
        prenom: matchedManager.prenom,
        manager_name: matchedManager.name,
        isGlobalAdmin:
          matchedManager.isGlobalAdmin ??
          (matchedManager.matricule === '495' || matchedManager.name.includes('SABI')),
        premier_login: matchedManager.premier_login ?? false,
        locked_password: matchedManager.locked_password ?? false,
      };

      setStoredAuth(authData);

      if (matchedManager.premier_login) {
        navigate('/change-password');
      } else {
        navigate('/manager');
      }
    }
  };

  const handleRoleSwitch = (newRole: 'agent' | 'manager') => {
    setRole(newRole);
    setIdentifier('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 transition-colors duration-200 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Brand & Logo Header outside card */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 text-[#814BE7] dark:text-purple-300 flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Shield className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-black text-[#814BE7] dark:text-purple-400 tracking-tight">Performance Booster</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Plateforme de gestion de la performance</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl shadow-purple-900/5 dark:shadow-none border border-slate-200/90 dark:border-slate-800">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Connexion</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {role === 'agent'
              ? 'Entrez votre matricule RH ou identifiant agent'
              : 'Entrez votre identifiant Manager'}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6 border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => handleRoleSwitch('agent')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'agent'
                ? 'bg-[#814BE7] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Espace Agent
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('manager')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'manager'
                ? 'bg-[#814BE7] text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Espace Manager
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Identifiant</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#814BE7]/30 transition-all font-medium"
                placeholder={role === 'agent' ? 'Entrez votre matricule RH' : 'Entrez votre identifiant Manager'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#814BE7]/30 transition-all font-medium"
                placeholder="Entrez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-[#814BE7] hover:bg-[#6f3cd1] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#814BE7]/25 cursor-pointer text-sm"
          >
            <span>Se connecter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-2xs text-center text-slate-500 mt-6 leading-relaxed font-normal">
          Mot de passe initial : TP495 · Changement obligatoire à la première connexion
        </p>
      </div>
    </div>
  );
};

