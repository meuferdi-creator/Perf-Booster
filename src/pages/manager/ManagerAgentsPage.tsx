import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, CheckCircle2, XCircle, Upload, KeyRound, Power } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Select } from '../../components/ui/Select';
import { store } from '../../lib/store';
import { getStoredAuth, getAuthToken } from '../../lib/auth-helpers';
import { filterByManager } from '../../lib/perimeter';
import { Agent, AncienneteType, ContratType, AgentStatutType } from '../../types';
import { AgentMassImportModal } from '../../components/manager/AgentMassImportModal';

export const ManagerAgentsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form State
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState('');
  const [logActivite, setLogActivite] = useState('');
  const [contrat, setContrat] = useState<ContratType>('CDI');
  const [anciennete, setAnciennete] = useState<AncienneteType>('+ 3 mois');
  const [statut, setStatut] = useState<'actif' | 'inactif'>('actif');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const all = store.getAgents();
      setAgents(filterByManager(all));
    };

    update();
    return store.subscribe(update);
  }, []);

  const openNewAgentModal = () => {
    setEditingAgent(null);
    setNom('');
    setPrenom('');
    setMatricule('');
    setLogActivite('');
    setContrat('CDI');
    setAnciennete('+ 3 mois');
    setStatut('actif');
    setIsDialogOpen(true);
  };

  const openEditAgentModal = (a: Agent) => {
    setEditingAgent(a);
    setNom(a.nom);
    setPrenom(a.prenom);
    setMatricule(a.matricule_rh);
    setLogActivite(a.log_activite);
    setContrat(a.contrat);
    setAnciennete(a.anciennete);
    setStatut(a.statut || 'actif');
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomComplet = `${nom.toUpperCase()} ${prenom}`;

    const newAgent: Agent = {
      id: editingAgent ? editingAgent.id : `agent-${Date.now()}`,
      matricule_rh: matricule,
      nom_complet: nomComplet,
      nom: nom.toUpperCase(),
      prenom,
      manager_name: auth?.manager_name || 'SABI Prospere',
      contrat,
      anciennete,
      log_activite: logActivite || `lom_${prenom.toLowerCase()}`,
      statut,
      role: 'agent',
      premier_login: editingAgent ? editingAgent.premier_login : true,
    };

    try {
      await store.saveAgent(newAgent);
      setIsDialogOpen(false);
      setFeedback(`Compte agent ${nomComplet} mis à jour avec succès.`);
    } catch (err: any) {
      alert(err?.message || 'Échec de la sauvegarde de l\'agent sur le serveur.');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleToggleStatut = async (agent: Agent) => {
    const newStatus: AgentStatutType = agent.statut === 'actif' ? 'inactif' : 'actif';
    const updated: Agent = { ...agent, statut: newStatus };
    try {
      await store.saveAgent(updated);
      setFeedback(`Statut du compte ${agent.nom_complet} changé en : ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      alert(err?.message || 'Échec de la mise à jour du statut.');
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleResetPassword = async (agent: Agent) => {
    const defaultPass = 'TP' + agent.matricule_rh;
    if (confirm(`Réinitialiser le mot de passe de ${agent.nom_complet} ?\nLe mot de passe par défaut deviendra : ${defaultPass}`)) {
      const token = getAuthToken();
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ role: 'agent', id: agent.id, matricule: agent.matricule_rh, newPassword: defaultPass }),
        });

        if (res.ok) {
          const updated = { ...agent, premier_login: true };
          await store.saveAgent(updated);
          setFeedback(`Mot de passe réinitialisé pour ${agent.nom_complet} (${defaultPass}).`);
        } else {
          const data = await res.json().catch(() => null);
          alert(data?.error || 'Échec de la réinitialisation du mot de passe sur le serveur.');
        }
      } catch (err) {
        alert('Erreur réseau lors de la réinitialisation du mot de passe.');
      }
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDelete = async (agentId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet agent ?')) {
      try {
        await store.deleteAgent(agentId);
      } catch (err: any) {
        alert(err?.message || 'Échec de la suppression de l\'agent sur le serveur.');
      }
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
      a.matricule_rh.includes(search) ||
      a.log_activite.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Gestion de l'Équipe & Agents</h1>
          <p className="text-xs text-slate-500">Répertoire des conseillers sous la gestion de {auth?.manager_name || 'SABI Prospere'}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={<Upload className="w-4 h-4" />} onClick={() => setIsImportModalOpen(true)}>
            Importer des Agents
          </Button>
          <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={openNewAgentModal}>
            Nouveau Conseiller
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold rounded-xl transition-all">
          {feedback}
        </div>
      )}

      <Card noPadding>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <Input
            placeholder="Rechercher par nom, matricule RH ou log activité..."
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom Complet</TableHead>
              <TableHead>Matricule RH</TableHead>
              <TableHead>LOG Activité</TableHead>
              <TableHead>Contrat</TableHead>
              <TableHead>Ancienneté</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <tbody>
            {filteredAgents.map((a) => (
              <TableRow key={a.id} className={a.statut === 'inactif' ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30' : ''}>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{a.nom_complet}</TableCell>
                <TableCell>{a.matricule_rh}</TableCell>
                <TableCell className="font-mono text-xs text-[#814BE7]">{a.log_activite}</TableCell>
                <TableCell>{a.contrat}</TableCell>
                <TableCell>{a.anciennete}</TableCell>
                <TableCell>
                  <button
                    onClick={() => handleToggleStatut(a)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    title="Cliquer pour basculer le statut"
                  >
                    <Badge variant={a.statut === 'actif' ? 'success' : 'neutral'}>
                      {a.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleResetPassword(a)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatut(a)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        a.statut === 'actif'
                          ? 'text-emerald-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      }`}
                      title={a.statut === 'actif' ? 'Désactiver le compte' : 'Activer le compte'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditAgentModal(a)}
                      className="p-1.5 text-slate-400 hover:text-[#814BE7] hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingAgent ? 'Modifier le Conseiller' : 'Nouveau Conseiller Agent'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
            <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Matricule RH" value={matricule} onChange={(e) => setMatricule(e.target.value)} required />
            <Input label="LOG Activité" value={logActivite} onChange={(e) => setLogActivite(e.target.value)} placeholder="Ex: lom_tatounou" required />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Contrat"
              value={contrat}
              onChange={(e) => setContrat(e.target.value as ContratType)}
              options={[
                { value: 'CDI', label: 'CDI' },
                { value: 'CDD', label: 'CDD' },
                { value: 'STG', label: 'Stage' },
              ]}
            />
            <Select
              label="Ancienneté"
              value={anciennete}
              onChange={(e) => setAnciennete(e.target.value as AncienneteType)}
              options={[
                { value: '+ 3 mois', label: '+ 3 mois (Ancien)' },
                { value: '- 3 mois', label: '- 3 mois (Nouveau)' },
              ]}
            />
            <Select
              label="Statut du Compte"
              value={statut}
              onChange={(e) => setStatut(e.target.value as 'actif' | 'inactif')}
              options={[
                { value: 'actif', label: 'Actif' },
                { value: 'inactif', label: 'Inactif' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Enregistrer
            </Button>
          </div>
        </form>
      </Dialog>

      <AgentMassImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          const all = store.getAgents();
          setAgents(filterByManager(all));
        }}
      />
    </div>
  );
};
