import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Agent, RCA, RcaPriorite, RcaStatut } from '../../types';
import { store } from '../../lib/store';

interface RcaFormProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
}

export const RcaForm: React.FC<RcaFormProps> = ({ isOpen, onClose, agents }) => {
  const [agentId, setAgentId] = useState(agents[0]?.id || '');
  const [semaine, setSemaine] = useState(31);
  const [kpi, setKpi] = useState('TR');
  const [description, setDescription] = useState('');
  const [analyseCause, setAnalyseCause] = useState('');
  const [priorite, setPriorite] = useState<RcaPriorite>('haute');
  const [statut, setStatut] = useState<RcaStatut>('ouvert');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAgent = agents.find((a) => a.id === agentId);

    const newRca: RCA = {
      id: `rca-${Date.now()}`,
      agent_id: agentId,
      agent_name: selectedAgent?.nom_complet || 'Agent',
      semaine: Number(semaine),
      annee: 2026,
      kpi_concerne: kpi,
      description,
      analyse_cause: analyseCause,
      priorite,
      statut,
      created_by_name: 'SABI Prospere',
    };

    store.saveRca(newRca);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Nouveau Root Cause Analysis (RCA)" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Agent concerné"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          options={agents.map((a) => ({ value: a.id, label: `${a.nom_complet} (${a.matricule_rh})` }))}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Semaine"
            type="number"
            value={semaine}
            onChange={(e) => setSemaine(Number(e.target.value))}
          />
          <Select
            label="KPI concerné"
            value={kpi}
            onChange={(e) => setKpi(e.target.value)}
            options={[
              { value: 'RAP', label: 'RAP (Résolution au 1er contact)' },
              { value: 'TR', label: 'TR (Taux de Transfert)' },
              { value: 'CCX', label: 'CCX (Experience client)' },
              { value: 'DMT', label: 'DMT (Durée de traitement)' },
              { value: 'Assiduité', label: 'Assiduité (Taux de Présence)' },
            ]}
          />
        </div>

        <Input
          label="Description du problème"
          placeholder="Ex: Taux de transfert anormal de 25%..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Analyse de la cause racine (Why-Why)</label>
          <textarea
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-[#814BE7] focus:outline-none focus:ring-2 focus:ring-[#814BE7]/20"
            rows={3}
            placeholder="Analyse approfondie de la cause originelle..."
            value={analyseCause}
            onChange={(e) => setAnalyseCause(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priorité"
            value={priorite}
            onChange={(e) => setPriorite(e.target.value as RcaPriorite)}
            options={[
              { value: 'haute', label: 'Haute' },
              { value: 'moyenne', label: 'Moyenne' },
              { value: 'basse', label: 'Basse' },
            ]}
          />
          <Select
            label="Statut initial"
            value={statut}
            onChange={(e) => setStatut(e.target.value as RcaStatut)}
            options={[
              { value: 'ouvert', label: 'Ouvert' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'resolu', label: 'Résolu' },
              { value: 'cloture', label: 'Clôturé' },
            ]}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} type="button">
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Enregistrer le RCA
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
