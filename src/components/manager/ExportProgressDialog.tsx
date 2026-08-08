import React, { useEffect, useState } from 'react';
import { FileText, Download, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';

interface ExportProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: 'pdf' | 'excel' | 'pptx';
  onComplete: () => void;
}

export const ExportProgressDialog: React.FC<ExportProgressDialogProps> = ({
  isOpen,
  onClose,
  exportType,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('Collecte des données...');
  const [isDone, setIsDone] = useState(false);

  const onCompleteRef = React.useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsDone(false);
      setStep('Collecte des données...');
      return;
    }

    const timer1 = setTimeout(() => { setProgress(35); setStep('Mise en page des tableaux...'); }, 600);
    const timer2 = setTimeout(() => { setProgress(75); setStep(`Formatage du document ${exportType.toUpperCase()}...`); }, 1200);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setStep('Rapport prêt !');
      setIsDone(true);
      onCompleteRef.current();
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, exportType]);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Génération du rapport ${exportType.toUpperCase()}`}>
      <div className="py-6 text-center space-y-4">
        {!isDone ? (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-indigo-50 text-[#814BE7] rounded-full mb-3 dark:bg-indigo-950/50">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{step}</p>
            <div className="w-full max-w-xs mt-4">
              <Progress value={progress} color="purple" size="md" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-3 dark:bg-emerald-950/50">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Génération terminée !</h4>
            <p className="text-xs text-slate-500 mt-1">Le fichier a été téléchargé automatiquement.</p>
            <div className="mt-6 flex justify-center">
              <Button variant="emerald" icon={<Download className="w-4 h-4" />} onClick={onClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};
