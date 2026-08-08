import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Edit2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Dialog } from '../../components/ui/Dialog';
import { Select } from '../../components/ui/Select';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { Agent, AncienneteType, ContratType } from '../../types';

export const ManagerAgentsPage: React.FC = () => {
  const auth = getStoredAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Form State
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [matricule, setMatricule] = useState('');
  const [logActivite, setLogActivite] = useState('');
  const [contrat, setContrat] = useState<ContratType>('CDI');
  const [anciennete, setAnciennete] = useState<AncienneteType>('+ 3 mois');

  useEffect(() => {
    const update = () => {
      const currentAuth = getStoredAuth();
      const all = store.getAgents();
      const managerName = currentAuth?.manager_name || 'SABI Prospere';
      setAgents(all.filter((a) => a.manager_name === managerName));
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
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
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
      statut: editingAgent ? editingAgent.statut : 'actif',
      role: 'agent',
      premier_login: editingAgent ? editingAgent.premier_login : true,
    };

    store.saveAgent(newAgent);
    setIsDialogOpen(false);
  };

  const handleDelete = (agentId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet agent ?')) {
      store.deleteAgent(agentId);
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

        <Button variant="primary" icon={<UserPlus className="w-4 h-4" />} onClick={openNewAgentModal}>
          Nouveau Conseiller
        </Button>
      </div>

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
              <TableRow key={a.id}>
                <TableCell className="font-bold text-slate-900 dark:text-slate-100">{a.nom_complet}</TableCell>
                <TableCell>{a.matricule_rh}</TableCell>
                <TableCell className="font-mono text-xs text-[#814BE7]">{a.log_activite}</TableCell>
                <TableCell>{a.contrat}</TableCell>
                <TableCell>{a.anciennete}</TableCell>
                <TableCell>
                  <Badge variant={a.statut === 'actif' ? 'success' : 'neutral'}>
                    {a.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditAgentModal(a)}
                      className="p-1.5 text-slate-400 hover:text-[#814BE7] hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type de Contrat"
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
    </div>
  );
};
