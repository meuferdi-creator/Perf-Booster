import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { WeeklyPerformance } from '../../types';
import { store } from '../../lib/store';

interface ResultsEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  perf: WeeklyPerformance | null;
}

export const ResultsEditDialog: React.FC<ResultsEditDialogProps> = ({ isOpen, onClose, perf }) => {
  const [formData, setFormData] = useState<Partial<WeeklyPerformance>>({});

  useEffect(() => {
    if (perf) {
      setFormData({ ...perf });
    }
  }, [perf]);

  if (!perf) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.saveWeeklyPerformance(formData as WeeklyPerformance);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Édition Performance S${perf.semaine} - ${perf.agent_name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Canal"
            value={formData.canal || ''}
            disabled
          />
          <Input
            label="Volume"
            type="number"
            value={formData.vol ?? ''}
            onChange={(e) => setFormData({ ...formData, vol: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="RAP (%)"
            type="number"
            step="0.1"
            value={formData.rap != null ? (formData.rap * 100).toFixed(1) : ''}
            onChange={(e) => setFormData({ ...formData, rap: Number(e.target.value) / 100 })}
          />
          <Input
            label="TR (%)"
            type="number"
            step="0.1"
            value={formData.tr != null ? (formData.tr * 100).toFixed(1) : ''}
            onChange={(e) => setFormData({ ...formData, tr: Number(e.target.value) / 100 })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="CCX (%)"
            type="number"
            step="0.1"
            value={formData.ccx != null ? (formData.ccx * 100).toFixed(1) : ''}
            onChange={(e) => setFormData({ ...formData, ccx: Number(e.target.value) / 100 })}
          />
          <Input
            label="DMT (secondes)"
            type="number"
            value={formData.dmt ?? ''}
            onChange={(e) => setFormData({ ...formData, dmt: Number(e.target.value) })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Heures Planifiées"
            type="number"
            value={formData.h_planifiees ?? ''}
            onChange={(e) => setFormData({ ...formData, h_planifiees: Number(e.target.value) })}
          />
          <Input
            label="Heures Absence"
            type="number"
            value={formData.h_absence ?? ''}
            onChange={(e) => setFormData({ ...formData, h_absence: Number(e.target.value) })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
