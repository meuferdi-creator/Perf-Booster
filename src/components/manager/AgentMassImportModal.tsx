import React, { useState } from 'react';
import { Upload, Camera, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Trash2, Edit3, ShieldAlert } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Agent, AncienneteType, ContratType } from '../../types';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';

interface ParsedRow {
  id: string;
  matricule_rh: string;
  nom: string;
  prenom: string;
  log_activite: string;
  contrat: ContratType;
  anciennete: AncienneteType;
  selected: boolean;
}

interface AgentMassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const AgentMassImportModal: React.FC<AgentMassImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const auth = getStoredAuth();
  const [activeTab, setActiveTab] = useState<'excel' | 'ocr'>('excel');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const existingAgents = store.getAgents();

  const handleReset = () => {
    setParsedRows([]);
    setImagePreview(null);
    setFeedback(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // 1. Process Excel / CSV File
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        const rows: ParsedRow[] = rawJson.map((item: any, idx: number) => {
          // Normalize key lookups
          const keys = Object.keys(item);
          const getKey = (...names: string[]) => {
            const found = keys.find((k) => names.some((n) => k.toLowerCase().trim().includes(n)));
            return found ? String(item[found]).trim() : '';
          };

          const mat = getKey('matricule', 'rh', 'mat') || `AUT-${1000 + idx}`;
          const nomVal = getKey('nom', 'nom_complet', 'lastname') || '';
          const prenomVal = getKey('prenom', 'prénom', 'firstname') || '';
          const logVal = getKey('log', 'activite', 'log_activite') || (prenomVal ? `lom_${prenomVal.toLowerCase().replace(/\s+/g, '')}` : '');
          
          let contratVal: ContratType = 'CDI';
          const rawContrat = getKey('contrat', 'type').toUpperCase();
          if (rawContrat.includes('CDD') || rawContrat.includes('ANP')) contratVal = 'CDD';
          else if (rawContrat.includes('STG') || rawContrat.includes('STAGE')) contratVal = 'STG';

          let ancVal: AncienneteType = '+ 3 mois';
          const rawAnc = getKey('ancienneté', 'anciennete', 'anc');
          if (rawAnc.includes('- 3') || rawAnc.includes('moins') || rawAnc.includes('3M-')) {
            ancVal = '- 3 mois';
          }

          return {
            id: `import-${Date.now()}-${idx}`,
            matricule_rh: mat,
            nom: nomVal.toUpperCase(),
            prenom: prenomVal,
            log_activite: logVal,
            contrat: contratVal,
            anciennete: ancVal,
            selected: true,
          };
        });

        if (rows.length === 0) {
          setFeedback({ type: 'error', message: 'Aucune donnée d\'agent n\'a été détectée dans le fichier.' });
        } else {
          setParsedRows(rows);
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: `Erreur de lecture du fichier : ${err.message || 'Format non supporté'}` });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  // 2. Process Screenshot / OCR Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFeedback(null);

    const imageUrl = URL.createObjectURL(file);
    setImagePreview(imageUrl);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const base64Data = evt.target?.result as string;

        const response = await fetch('/api/extract-agents-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/png',
          }),
        });

        if (!response.ok) {
          throw new Error('Échec du traitement de l\'image par l\'IA.');
        }

        const data = await response.json();
        const extracted: any[] = data.agents || [];

        if (extracted.length === 0) {
          setFeedback({
            type: 'error',
            message: 'L\'IA n\'a pas pu détecter de tableau d\'agents lisible sur cette capture. Vous pouvez ajouter les données manuellement ou réessayer.',
          });
        } else {
          const rows: ParsedRow[] = extracted.map((item, idx) => ({
            id: `import-ocr-${Date.now()}-${idx}`,
            matricule_rh: item.matricule_rh || `${2000 + idx}`,
            nom: (item.nom || item.nom_complet || 'AGENT').toUpperCase(),
            prenom: item.prenom || '',
            log_activite: item.log_activite || `lom_${idx}`,
            contrat: item.contrat === 'CDD' || item.contrat === 'STG' ? item.contrat : 'CDI',
            anciennete: item.anciennete === '- 3 mois' ? '- 3 mois' : '+ 3 mois',
            selected: true,
          }));

          setParsedRows(rows);
        }
      } catch (err: any) {
        setFeedback({ type: 'error', message: `Erreur d'analyse OCR : ${err.message}` });
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Validation Logic per Row
  const getRowError = (row: ParsedRow, index: number): string | null => {
    if (!row.matricule_rh.trim()) return 'Matricule RH obligatoire';
    if (!row.nom.trim()) return 'Nom obligatoire';

    // Duplicate check in existing store
    const existsInStore = existingAgents.some(
      (a) => a.matricule_rh.toLowerCase().trim() === row.matricule_rh.toLowerCase().trim()
    );
    if (existsInStore) return 'Matricule déjà existant dans l\'équipe';

    // Duplicate check inside current import batch
    const duplicateInBatch = parsedRows.some(
      (r, i) => i !== index && r.matricule_rh.toLowerCase().trim() === row.matricule_rh.toLowerCase().trim()
    );
    if (duplicateInBatch) return 'Matricule en double dans le fichier';

    return null;
  };

  const updateRowField = (id: string, field: keyof ParsedRow, value: any) => {
    setParsedRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleSelectAll = (check: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: check })));
  };

  const validRowsToImport = parsedRows.filter(
    (row, idx) => row.selected && getRowError(row, idx) === null
  );

  const totalErrors = parsedRows.filter(
    (row, idx) => row.selected && getRowError(row, idx) !== null
  ).length;

  const handleConfirmImport = () => {
    if (validRowsToImport.length === 0) {
      setFeedback({ type: 'error', message: 'Aucun agent valide n\'est sélectionné pour l\'importation.' });
      return;
    }

    const currentManagerName = auth?.manager_name || 'SABI Prospere';

    validRowsToImport.forEach((r) => {
      const nomComplet = `${r.nom.toUpperCase()} ${r.prenom}`.trim();
      const newAgent: Agent = {
        id: `agent-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        matricule_rh: r.matricule_rh.trim(),
        nom_complet: nomComplet,
        nom: r.nom.toUpperCase().trim(),
        prenom: r.prenom.trim(),
        manager_name: currentManagerName,
        contrat: r.contrat,
        anciennete: r.anciennete,
        log_activite: r.log_activite.trim() || `lom_${r.prenom.toLowerCase().replace(/\s+/g, '')}`,
        statut: 'actif',
        role: 'agent',
        premier_login: true,
      };

      store.saveAgent(newAgent);
    });

    setFeedback({
      type: 'success',
      message: `${validRowsToImport.length} agent(s) ont été importé(s) avec succès dans l'équipe de ${currentManagerName} !`,
    });

    setTimeout(() => {
      onImportComplete();
      handleClose();
    }, 1500);
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Importation Massive d'Agents" maxWidth="3xl">
      <div className="space-y-5">
        {/* Source Selector Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'excel'
                ? 'bg-[#814BE7] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Fichier Excel / CSV
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ocr'
                ? 'bg-[#814BE7] text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Capture d'écran / Photo
          </button>
        </div>

        {/* Upload Dropzones */}
        {parsedRows.length === 0 && (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
            {activeTab === 'excel' ? (
              <label className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#814BE7] flex items-center justify-center mb-3 dark:bg-purple-950/50">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Téléverser un fichier Excel (.xlsx, .xls) ou CSV
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Les colonnes seront automatiquement mappées (Matricule RH, Nom, Prénom, Log activité, Contrat)
                </span>
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            ) : (
              <label className="cursor-pointer flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#814BE7] flex items-center justify-center mb-3 dark:bg-purple-950/50">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Téléverser ou coller une capture d'écran d'agents
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  L'IA analysera le tableau et extraira automatiquement les informations des conseillers
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </label>
            )}

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-[#814BE7]">
                <div className="w-4 h-4 border-2 border-[#814BE7] border-t-transparent rounded-full animate-spin" />
                Analyse des données en cours...
              </div>
            )}
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Image Preview for OCR */}
        {imagePreview && parsedRows.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-xl dark:bg-slate-900">
            <img src={imagePreview} alt="Source Capture" className="h-16 rounded-lg object-cover border border-slate-200" />
            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-700 dark:text-slate-200">Capture analysée par l'IA</span>
              <p className="text-3xs">Vérifiez et rectifiez les champs ci-dessous avant confirmation.</p>
            </div>
          </div>
        )}

        {/* Preview Table & Inline Editor */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl dark:bg-slate-900">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>Aperçu des données ({parsedRows.length} lignes)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-3xs dark:bg-emerald-950 dark:text-emerald-300">
                  {validRowsToImport.length} valides
                </span>
                {totalErrors > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-3xs dark:bg-rose-950 dark:text-rose-300">
                    {totalErrors} erreurs/doublons
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelectAll(true)}
                  className="text-3xs font-bold text-[#814BE7] hover:underline"
                >
                  Tout sélectionner
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-3xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Changer de fichier
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={parsedRows.every((r) => r.selected)}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th className="p-2.5">Matricule RH</th>
                    <th className="p-2.5">Nom</th>
                    <th className="p-2.5">Prénom</th>
                    <th className="p-2.5">LOG Activité</th>
                    <th className="p-2.5">Contrat</th>
                    <th className="p-2.5">Ancienneté</th>
                    <th className="p-2.5">Statut / Erreurs</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedRows.map((row, idx) => {
                    const err = getRowError(row, idx);
                    return (
                      <tr
                        key={row.id}
                        className={`${
                          err ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(e) => updateRowField(row.id, 'selected', e.target.checked)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.matricule_rh}
                            onChange={(e) => updateRowField(row.id, 'matricule_rh', e.target.value)}
                            className="w-24 bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-[#814BE7] dark:bg-slate-800 dark:border-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.nom}
                            onChange={(e) => updateRowField(row.id, 'nom', e.target.value)}
                            className="w-28 bg-white border border-slate-200 rounded px-2 py-1 text-xs uppercase focus:outline-none focus:border-[#814BE7] dark:bg-slate-800 dark:border-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.prenom}
                            onChange={(e) => updateRowField(row.id, 'prenom', e.target.value)}
                            className="w-28 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-[#814BE7] dark:bg-slate-800 dark:border-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.log_activite}
                            onChange={(e) => updateRowField(row.id, 'log_activite', e.target.value)}
                            className="w-28 bg-white border border-slate-200 rounded px-2 py-1 font-mono text-xs focus:outline-none focus:border-[#814BE7] dark:bg-slate-800 dark:border-slate-700"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.contrat}
                            onChange={(e) => updateRowField(row.id, 'contrat', e.target.value as ContratType)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#814BE7] dark:bg-slate-800 dark:border-slate-700"
                          >
                            <option value="CDI">CDI</option>
                            <option value="CDD">CDD</option>
                            <option value="STG">STG</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <select
                            value={row.anciennete}
                            onChange={(e) => updateRowField(row.id, 'anciennete', e.target.value as AncienneteType)}
                            className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-[#814BE7] dark:bg-slate-800 dark:border-slate-700"
                          >
                            <option value="+ 3 mois">+ 3 mois</option>
                            <option value="- 3 mois">- 3 mois</option>
                          </select>
                        </td>
                        <td className="p-2">
                          {err ? (
                            <span className="text-3xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full dark:bg-rose-950 dark:text-rose-300">
                              {err}
                            </span>
                          ) : (
                            <span className="text-3xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                              Valide
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            className="text-slate-400 hover:text-rose-500 p-1"
                            title="Supprimer la ligne"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Annuler
          </Button>

          {parsedRows.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={handleConfirmImport}
              disabled={validRowsToImport.length === 0}
            >
              Importer {validRowsToImport.length} agent(s)
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
};
