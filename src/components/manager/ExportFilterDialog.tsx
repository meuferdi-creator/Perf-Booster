import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Agent } from '../../types';

interface ExportFilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agents: Agent[];
  exportType: 'pdf' | 'excel' | 'pptx';
  onStartExport: (filters: {
    agentId: string;
    kpi: string;
    period: string;
    reportType: string;
  }) => void;
}

export const ExportFilterDialog: React.FC<ExportFilterDialogProps> = ({
  isOpen,
  onClose,
  agents,
  exportType,
  onStartExport,
}) => {
  const [agentId, setAgentId] = useState('all');
  const [kpi, setKpi] = useState('all');
  const [period, setPeriod] = useState('2026-07');
  const [reportType, setReportType] = useState('monthly_summary');

  const handleRun = () => {
    onStartExport({ agentId, kpi, period, reportType });
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Configuration du Rapport (${exportType.toUpperCase()})`}
      description="Sélectionnez les paramètres et filtres pour personnaliser l'exportation."
    >
      <div className="space-y-4">
        <Select
          label="Type de Rapport"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          options={[
            { value: 'monthly_summary', label: 'Synthèse Mensuelle des Primes' },
            { value: 'weekly_detail', label: 'Détail Hebdomadaire des Performances' },
            { value: 'rca_actions', label: 'Rapport des RCA & Plans d\'actions' },
          ]}
        />

        <Select
          label="Période"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          options={[
            { value: '2026-07', label: 'Juillet 2026' },
            { value: '2026-06', label: 'Juin 2026' },
            { value: '2026-S31', label: 'Semaine 31 - 2026' },
            { value: '2026-S30', label: 'Semaine 30 - 2026' },
          ]}
        />

        <Select
          label="Filtrer par Agent"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les agents de l\'équipe' },
            ...agents.map((a) => ({ value: a.id, label: a.nom_complet })),
          ]}
        />

        <Select
          label="Filtrer par Indicator / KPI"
          value={kpi}
          onChange={(e) => setKpi(e.target.value)}
          options={[
            { value: 'all', label: 'Tous les KPIs (RAP, TR, CCX, DMT)' },
            { value: 'rap', label: 'RAP (Résolution au 1er contact)' },
            { value: 'tr', label: 'TR (Taux de transfert)' },
            { value: 'ccx', label: 'CCX (Customer Contact Experience)' },
            { value: 'dmt', label: 'DMT (Durée moyenne de traitement)' },
          ]}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleRun}>
            Générer le document {exportType.toUpperCase()}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
