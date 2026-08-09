import React, { useState } from 'react';
import { Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { WeeklyPerformance } from '../../types';
import { store } from '../../lib/store';

export const ScreenshotImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<WeeklyPerformance> | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const url = URL.createObjectURL(selected);
      setPreview(url);
      setExtractedData(null);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setIsAnalyzing(true);

    // Simulate OCR / AI extraction of performance metrics from image
    setTimeout(() => {
      setIsAnalyzing(false);
      setExtractedData({
        agent_name: 'TATOUNOU Shalom',
        log_activite: 'lom_tatounou',
        canal: 'Phone',
        semaine: 31,
        annee: 2026,
        rap: 0.845,
        tr: 0.138,
        ccx: 0.925,
        dmt: 580,
        vol: 340,
        h_planifiees: 40,
        h_absence: 0,
      });
    }, 1500);
  };

  const handleConfirm = () => {
    if (!extractedData) return;
    const newPerf: WeeklyPerformance = {
      id: `perf-import-${Date.now()}`,
      agent_id: 'agent-1163',
      agent_name: extractedData.agent_name || 'TATOUNOU Shalom',
      log_activite: extractedData.log_activite || 'lom_tatounou',
      manager_name: 'SABI Prospere',
      canal: extractedData.canal || 'Phone',
      semaine: extractedData.semaine || 31,
      annee: 2026,
      rap: extractedData.rap || 0.8,
      tr: extractedData.tr || 0.15,
      ccx: extractedData.ccx || 0.9,
      dmt: extractedData.dmt || 600,
      vol: extractedData.vol || 300,
      h_planifiees: 40,
      h_absence: 0,
    };

    store.saveWeeklyPerformance(newPerf);
    setFile(null);
    setPreview(null);
    setExtractedData(null);
    alert('Importation par capture d\'écran confirmée et enregistrée !');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-indigo-50 text-[#814BE7] rounded-xl dark:bg-indigo-950/50">
          <Camera className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Importation par Capture d'écran</h3>
          <p className="text-xs text-slate-500">
            Téléversez une capture d'écran du portail pour en extraire automatiquement les KPIs.
          </p>
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 dark:bg-slate-900 dark:border-slate-800">
        {!preview ? (
          <label className="cursor-pointer flex flex-col items-center">
            <Upload className="w-10 h-10 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-[#814BE7]">Cliquez pour téléverser une image</span>
            <span className="text-xs text-slate-400 mt-1">Formats acceptés: PNG, JPG, JPEG</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        ) : (
          <div className="flex flex-col items-center">
            <img src={preview} alt="Aperçu" className="max-h-48 rounded-xl border border-slate-200 mb-4 shadow-sm" />
            <div className="flex gap-3">
              <Button variant="outline" size="sm" onClick={() => { setPreview(null); setFile(null); }}>
                Changer d'image
              </Button>
              {!extractedData && (
                <Button variant="primary" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? 'Extraction par IA en cours...' : 'Extraire les données'}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {extractedData && (
        <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900/40">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Données détectées avec succès</h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs mb-4">
            <div className="p-2.5 bg-white rounded-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-2xs">Agent</span>
              <span className="font-bold">{extractedData.agent_name}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-2xs">Canal & Semaine</span>
              <span className="font-bold">{extractedData.canal} - S{extractedData.semaine}</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-2xs">RAP / CCX</span>
              <span className="font-bold">{((extractedData.rap || 0) * 100).toFixed(1)}% / {((extractedData.ccx || 0) * 100).toFixed(1)}%</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-2xs">TR / DMT</span>
              <span className="font-bold">{((extractedData.tr || 0) * 100).toFixed(1)}% / {extractedData.dmt}s</span>
            </div>
            <div className="p-2.5 bg-white rounded-xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-2xs">H Plan / Abs → Assiduité</span>
              <span className="font-bold text-emerald-600">
                {extractedData.h_planifiees || 40}h / {extractedData.h_absence || 0}h (
                {(
                  (((extractedData.h_planifiees || 40) - (extractedData.h_absence || 0)) / (extractedData.h_planifiees || 40)) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setExtractedData(null)}>Recommencer</Button>
            <Button variant="emerald" size="sm" onClick={handleConfirm}>Confirmer et enregistrer</Button>
          </div>
        </div>
      )}
    </Card>
  );
};
