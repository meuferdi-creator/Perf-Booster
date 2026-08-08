import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { ScreenshotImport } from '../../components/manager/ScreenshotImport';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance } from '../../types';

export const ManagerImportPage: React.FC = () => {
  const auth = getStoredAuth();
  const [activeTab, setActiveTab] = useState<'excel' | 'screenshot'>('excel');
  const [importedRows, setImportedRows] = useState<any[]>([]);
  const [semaine, setSemaine] = useState(31);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportedRows(data);
      } catch (err) {
        console.error('Error parsing excel:', err);
        alert('Erreur lors de la lecture du fichier Excel/CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (importedRows.length === 0) return;

    const batch: WeeklyPerformance[] = importedRows.map((row: any, idx: number) => ({
      id: `perf-imp-${Date.now()}-${idx}`,
      agent_id: row['agent_id'] || `agent-${idx}`,
      agent_name: row['Agent'] || row['Nom'] || 'Agent Support',
      log_activite: row['LOG Activité'] || row['log_activite'] || 'lom_agent',
      manager_name: auth?.manager_name || 'SABI Prospere',
      canal: row['Canal'] || 'Phone',
      semaine: Number(row['Semaine'] || semaine),
      annee: 2026,
      rap: row['RAP'] != null ? Number(row['RAP']) : 0.8,
      tr: row['TR'] != null ? Number(row['TR']) : 0.15,
      ccx: row['CCX'] != null ? Number(row['CCX']) : 0.9,
      dmt: row['DMT'] != null ? Number(row['DMT']) : 600,
      vol: row['Volume'] != null ? Number(row['Volume']) : 200,
      h_planifiees: row['H planifiées'] != null ? Number(row['H planifiées']) : 40,
      h_absence: row['H absence'] != null ? Number(row['H absence']) : 0,
    }));

    store.saveWeeklyPerformanceBatch(batch);
    alert(`${batch.length} lignes de performances enregistrées avec succès pour la S${semaine} !`);
    setImportedRows([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Importation Hebdomadaire</h1>
        <p className="text-xs text-slate-500">
          Importez les données de performance de la semaine via un fichier Excel/CSV ou par capture d'écran.
        </p>
      </div>

      <Tabs
        tabs={[
          { id: 'excel', label: 'Fichier Excel / CSV', icon: <FileSpreadsheet className="w-4 h-4" /> },
          { id: 'screenshot', label: 'Capture d\'écran OCR', icon: <Camera className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {activeTab === 'excel' ? (
        <div className="space-y-6">
          <Card className="p-8 text-center border-2 border-dashed border-slate-200">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">Glissez votre fichier Excel ou CSV ici</h3>
            <p className="text-xs text-slate-400 mt-1">Colonnes requises: LOG Activité, Canal, Semaine, RAP, TR, CCX, DMT, Volume</p>

            <label className="inline-block mt-4">
              <span className="px-4 py-2 bg-[#814BE7] text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer hover:bg-[#6f3cd1]">
                Parcourir un fichier
              </span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </Card>

          {importedRows.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-slate-900">Aperçu des données ({importedRows.length} lignes)</h3>
                <Button variant="emerald" onClick={handleConfirmImport}>
                  Valider et Importer
                </Button>
              </div>

              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-50 font-bold border-b">
                    <tr>
                      {Object.keys(importedRows[0]).slice(0, 8).map((k) => (
                        <th key={k} className="p-2">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importedRows.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b">
                        {Object.values(r).slice(0, 8).map((v: any, j) => (
                          <td key={j} className="p-2">{v?.toString()}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      ) : (
        <ScreenshotImport />
      )}
    </div>
  );
};
