import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, ArrowRight, ShieldAlert } from 'lucide-react';
import { store } from '../lib/store';
import { setStoredAuth } from '../lib/auth-helpers';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'agent' | 'manager'>('agent');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError('Veuillez saisir votre identifiant.');
      return;
    }

    if (role === 'agent') {
      const agents = store.getAgents();
      const agent = agents.find(
        (a) => a.matricule_rh === cleanId || a.log_activite === cleanId || a.nom_complet.toLowerCase().includes(cleanId.toLowerCase())
      );

      if (!agent) {
        setError('Matricule ou identifiant agent introuvable.');
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
      const mgr = managers.find(
        (m) => m.name.toLowerCase().includes(cleanId.toLowerCase()) || cleanId === 'SABI Prospere' || cleanId === 'manager'
      ) || managers[0];

      const authData = {
        role: 'manager' as const,
        id: mgr.id,
        name: mgr.name,
        manager_name: mgr.name,
        premier_login: mgr.premier_login ?? false,
        locked_password: mgr.locked_password ?? false,
      };

      setStoredAuth(authData);

      if (mgr.premier_login) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#F3F4F8] via-[#F8F9FD] to-[#EDEFFE] flex flex-col items-center justify-center p-4">
      {/* Brand & Logo Header outside card */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#EEECFE] border border-[#E0DCFE] text-[#6366F1] flex items-center justify-center mx-auto mb-3 shadow-sm">
          <Shield className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-black text-[#7C3AED] tracking-tight">Performance Booster</h1>
        <p className="text-xs text-slate-500 font-medium mt-1">Plateforme de gestion de la performance</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-xl shadow-indigo-900/5 border border-slate-100/80">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">Connexion</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {role === 'agent'
              ? 'Entrez votre matricule RH ou identifiant agent'
              : 'Entrez votre identifiant Manager'}
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="flex p-1 bg-[#F3F4F6] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => handleRoleSwitch('agent')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'agent' ? 'bg-[#6366F1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Espace Agent
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('manager')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              role === 'manager' ? 'bg-[#6366F1] text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Espace Manager
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Identifiant</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#F3F4F6] border-0 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 transition-all font-medium"
                placeholder={role === 'agent' ? 'Entrez votre matricule RH' : 'Entrez votre identifiant Manager'}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#F3F4F6] border-0 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 transition-all font-medium"
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-[#5B50E5] hover:bg-[#4F46E5] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-[#5B50E5]/25 cursor-pointer text-sm"
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

