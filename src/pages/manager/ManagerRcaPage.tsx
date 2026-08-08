import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { RcaCard } from '../../components/manager/RcaCard';
import { RcaForm } from '../../components/manager/RcaForm';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { Agent, ActionItem, RCA } from '../../types';

export const ManagerRcaPage: React.FC = () => {
  const auth = getStoredAuth();
  const [rcas, setRcas] = useState<RCA[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isRcaFormOpen, setIsRcaFormOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const allRcas = store.getRcas();
      const allActions = store.getActionItems();
      const allAgents = store.getAgents();

      setRcas(allRcas);
      setActionItems(allActions);
      setAgents(allAgents);
    };

    update();
    return store.subscribe(update);
  }, []);

  const handleAddAction = (rcaId: string) => {
    const actionText = prompt('Saisissez le libellé de l\'action corrective :');
    if (!actionText) return;

    const rca = rcas.find((r) => r.id === rcaId);
    const newAction: ActionItem = {
      id: `act-${Date.now()}`,
      rca_id: rcaId,
      agent_id: rca?.agent_id || '',
      agent_name: rca?.agent_name,
      action: actionText,
      responsable: auth?.manager_name || 'Manager',
      echeance: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      statut: 'a_faire',
      progres: 0,
    };

    store.saveActionItem(newAction);
  };

  const handleDeleteRca = (rcaId: string) => {
    if (confirm('Supprimer ce RCA et toutes ses actions rattachées ?')) {
      store.deleteRca(rcaId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Root Cause Analysis (RCA) & Plan d'Actions</h1>
          <p className="text-xs text-slate-500">
            Analyse des causes racines sur les sous-performances et suivi de l'avancement des actions correctives
          </p>
        </div>

        <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={() => setIsRcaFormOpen(true)}>
          Nouveau RCA
        </Button>
      </div>

      <div className="space-y-4">
        {rcas.length === 0 ? (
          <Card className="text-center py-12 text-slate-400 text-xs">Aucun Root Cause Analysis ouvert.</Card>
        ) : (
          rcas.map((rca) => (
            <RcaCard
              key={rca.id}
              rca={rca}
              actionItems={actionItems.filter((a) => a.rca_id === rca.id)}
              onAddAction={handleAddAction}
              onDeleteRca={handleDeleteRca}
            />
          ))
        )}
      </div>

      <RcaForm isOpen={isRcaFormOpen} onClose={() => setIsRcaFormOpen(false)} agents={agents} />
    </div>
  );
};
