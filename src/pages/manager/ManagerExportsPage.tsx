import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Presentation, Download } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExportFilterDialog } from '../../components/manager/ExportFilterDialog';
import { ExportProgressDialog } from '../../components/manager/ExportProgressDialog';
import { exportMonthlyResultsToExcel, exportWeeklyPerfsToExcel } from '../../lib/excel-generator';
import { exportMonthlyResultsToPDF } from '../../lib/pdf-generator';
import { exportMonthlyResultsToPPTX } from '../../lib/pptx-generator';
import { store } from '../../lib/store';
import { Agent } from '../../types';

export const ManagerExportsPage: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeExportType, setActiveExportType] = useState<'pdf' | 'excel' | 'pptx' | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      setAgents(store.getAgents());
    };
    update();
    return store.subscribe(update);
  }, []);

  const handleOpenExport = (type: 'pdf' | 'excel' | 'pptx') => {
    setActiveExportType(type);
    setIsFilterOpen(true);
  };

  const handleStartExport = () => {
    setIsProgressOpen(true);
  };

  const handleCompleteExport = () => {
    const monthlyData = store.getMonthlyResults();
    const weeklyData = store.getWeeklyPerformances();

    if (activeExportType === 'excel') {
      exportMonthlyResultsToExcel(monthlyData);
      exportWeeklyPerfsToExcel(weeklyData);
    } else if (activeExportType === 'pdf') {
      exportMonthlyResultsToPDF(monthlyData);
    } else if (activeExportType === 'pptx') {
      exportMonthlyResultsToPPTX(monthlyData);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Rapports & Exports Multi-formats</h1>
        <p className="text-xs text-slate-500">
          Générez et téléchargez des rapports complets aux formats Excel, PDF et PowerPoint.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Excel Export */}
        <Card className="p-6 text-center space-y-4 border-emerald-100 bg-gradient-to-b from-white to-emerald-50/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Rapport Excel (.xlsx)</h3>
            <p className="text-xs text-slate-500 mt-1">Feuilles de calcul complètes, formules et historiques bruts.</p>
          </div>
          <Button variant="emerald" className="w-full" icon={<Download className="w-4 h-4" />} onClick={() => handleOpenExport('excel')}>
            Générer Excel
          </Button>
        </Card>

        {/* PDF Export */}
        <Card className="p-6 text-center space-y-4 border-indigo-100 bg-gradient-to-b from-white to-indigo-50/20">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-[#814BE7] mx-auto flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Synthèse PDF</h3>
            <p className="text-xs text-slate-500 mt-1">Rapport imprimable formatté avec logos et totaux.</p>
          </div>
          <Button variant="primary" className="w-full" icon={<Download className="w-4 h-4" />} onClick={() => handleOpenExport('pdf')}>
            Générer PDF
          </Button>
        </Card>

        {/* PPTX Export */}
        <Card className="p-6 text-center space-y-4 border-amber-100 bg-gradient-to-b from-white to-amber-50/20">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Présentation PPTX</h3>
            <p className="text-xs text-slate-500 mt-1">Diapositives prêtes pour les comités de direction.</p>
          </div>
          <Button variant="outline" className="w-full border-amber-300 text-amber-700 hover:bg-amber-50" icon={<Download className="w-4 h-4" />} onClick={() => handleOpenExport('pptx')}>
            Générer PPTX
          </Button>
        </Card>
      </div>

      {activeExportType && (
        <>
          <ExportFilterDialog
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            agents={agents}
            exportType={activeExportType}
            onStartExport={handleStartExport}
          />

          <ExportProgressDialog
            isOpen={isProgressOpen}
            onClose={() => setIsProgressOpen(false)}
            exportType={activeExportType}
            onComplete={handleCompleteExport}
          />
        </>
      )}
    </div>
  );
};
