import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Camera, CheckCircle2, AlertTriangle, Info, RefreshCw, FileText, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScreenshotImport } from '../../components/manager/ScreenshotImport';
import { store } from '../../lib/store';
import { getStoredAuth } from '../../lib/auth-helpers';
import { WeeklyPerformance, CanalType } from '../../types';
import { formatKpiValue, calculateAssiduiteFromPerf } from '../../lib/kpi-utils';

function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function findRawValue(row: any, ...aliasLists: string[]): { val: any; matchedKey?: string } {
  const keys = Object.keys(row);
  for (const alias of aliasLists) {
    const normAlias = normalizeKey(alias);
    for (const k of keys) {
      const normK = normalizeKey(k);
      if (normK === normAlias || normK.includes(normAlias) || normAlias.includes(normK)) {
        return { val: row[k], matchedKey: k };
      }
    }
  }
  return { val: undefined };
}

function parsePct(val: any): number | null {
  if (val == null || val === '' || isNaN(Number(val))) {
    if (typeof val === 'string' && val.includes('%')) {
      const num = parseFloat(val.replace('%', '').replace(',', '.'));
      if (!isNaN(num)) return num > 1 ? num / 100 : num;
    }
    return null;
  }
  const num = Number(val);
  if (isNaN(num)) return null;
  return num > 1 ? num / 100 : num;
}

function parseDmt(val: any): number | null {
  if (val == null || val === '') return null;
  if (typeof val === 'string' && val.includes(':')) {
    const parts = val.split(':').map((p) => parseInt(p, 10));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  const num = Number(val);
  return !isNaN(num) ? Math.round(num) : null;
}

function parseNum(val: any): number | null {
  if (val == null || val === '' || isNaN(Number(val))) return null;
  const num = Number(val);
  return !isNaN(num) ? num : null;
}

export const ManagerImportPage: React.FC = () => {
  const auth = getStoredAuth();
  const [activeTab, setActiveTab] = useState<'excel' | 'screenshot'>('excel');
  const [rawFileRows, setRawFileRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [selectedSemaine, setSelectedSemaine] = useState<number>(31);
  const [isParsing, setIsParsing] = useState(false);
  
  // Feedback & Summary
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [missingOptionalCols, setMissingOptionalCols] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [duplicateCount, setDuplicateCount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const existingPerfs = store.getWeeklyPerformances();
  const existingAgents = store.getAgents();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File validation: Size limit (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({ type: 'error', message: 'Fichier trop volumineux. La taille maximale autorisée est de 10 Mo.' });
      return;
    }

    // File validation: Extension check
    const validExtensions = ['.xlsx', '.xls', '.csv', '.ods'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      setFeedback({ type: 'error', message: 'Format de fichier non pris en charge. Veuillez utiliser un fichier Excel (.xlsx, .xls, .ods) ou CSV (.csv).' });
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    setFeedback(null);
    setWarnings([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          setFeedback({ type: 'error', message: 'Le fichier téléchargé est vide.' });
          setIsParsing(false);
          return;
        }

        setRawFileRows(data);

        // Column Analysis
        const sampleRow = data[0] || {};
        const allKeys = Object.keys(sampleRow);
        
        const foundCols: string[] = [];
        const missingOptional: string[] = [];
        const localWarnings: string[] = [];

        // Check required / optional field presence
        const checkField = (label: string, isOptional: boolean, ...aliases: string[]) => {
          const { matchedKey } = findRawValue(sampleRow, ...aliases);
          if (matchedKey) {
            foundCols.push(`${label} (${matchedKey})`);
          } else if (isOptional) {
            missingOptional.push(label);
          } else {
            localWarnings.push(`Colonne '${label}' introuvable dans l'en-tête du fichier.`);
          }
        };

        checkField('LOG Activité / Agent', false, 'logactivite', 'log', 'agent', 'nom', 'matricule', 'conseiller');
        checkField('Canal', false, 'canal', 'channel', 'media');
        checkField('RAP', false, 'rap', 'resolution', '1ercontact');
        checkField('DMT', false, 'dmt', 'duree', 'dureedetraitement');
        checkField('Volume', false, 'volume', 'vol', 'quantite');

        // Optional columns
        checkField('CCX', true, 'ccx', 'customercontact', 'experienceclient');
        checkField('TR', true, 'tr', 'tauxdetransfert', 'transfert');
        checkField('H planifiées', true, 'hplanifiees', 'heuresplanifiees', 'hplan', 'planifiees');
        checkField('H absence', true, 'habsence', 'heuresabsence', 'absence', 'habs');

        setDetectedColumns(foundCols);
        setMissingOptionalCols(missingOptional);

        if (missingOptional.length > 0) {
          localWarnings.push(
            `Colonnes facultatives absentes : ${missingOptional.join(', ')}. Les données existantes ou valeurs par défaut seront conservées.`
          );
        }

        // Duplicate Check
        let duplicates = 0;
        data.forEach((row) => {
          const agentVal = findRawValue(row, 'logactivite', 'log', 'agent', 'nom', 'matricule').val;
          const canalVal = findRawValue(row, 'canal', 'channel').val || 'Phone';
          const semVal = findRawValue(row, 'semaine', 'sem').val || selectedSemaine;

          if (agentVal) {
            const cleanAgent = String(agentVal).trim().toLowerCase();
            const exists = existingPerfs.some(
              (p) =>
                p.semaine === Number(semVal) &&
                p.canal.toLowerCase() === String(canalVal).trim().toLowerCase() &&
                (p.log_activite.toLowerCase() === cleanAgent ||
                  p.agent_name.toLowerCase().includes(cleanAgent) ||
                  p.agent_id.toLowerCase() === cleanAgent)
            );
            if (exists) duplicates++;
          }
        });

        setDuplicateCount(duplicates);
        if (duplicates > 0) {
          localWarnings.push(
            `${duplicates} ligne(s) correspondent à des enregistrements hebdomadaires existants (mise à jour lors de l'import).`
          );
        }

        setWarnings(localWarnings);
        setIsParsing(false);
      } catch (err) {
        console.error('Error parsing excel file:', err);
        setFeedback({ type: 'error', message: 'Erreur lors de la lecture du fichier Excel/CSV.' });
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (rawFileRows.length === 0) return;

    const batch: WeeklyPerformance[] = rawFileRows.map((row: any, idx: number) => {
      const rawAgent = findRawValue(row, 'logactivite', 'log', 'agent', 'nom', 'matricule', 'conseiller').val || '';
      const cleanAgentStr = String(rawAgent).trim();

      // Find matching agent object if exists
      const matchedAgent = existingAgents.find(
        (a) =>
          a.log_activite.toLowerCase() === cleanAgentStr.toLowerCase() ||
          a.matricule_rh.toLowerCase() === cleanAgentStr.toLowerCase() ||
          a.nom_complet.toLowerCase().includes(cleanAgentStr.toLowerCase())
      );

      const agentId = matchedAgent ? matchedAgent.id : `agent-imp-${idx}`;
      const agentName = matchedAgent ? matchedAgent.nom_complet : cleanAgentStr || 'Agent Support';
      const logActivite = matchedAgent ? matchedAgent.log_activite : cleanAgentStr || `lom_agent${idx}`;

      const rawCanal = findRawValue(row, 'canal', 'channel', 'media').val;
      let canal: CanalType = 'Phone';
      if (rawCanal) {
        const cStr = String(rawCanal).toLowerCase();
        if (cStr.includes('email') || cStr.includes('mail')) canal = 'Email';
        else if (cStr.includes('mu') || cStr.includes('chat') || cStr.includes('multicanal')) canal = 'MU';
      }

      const semVal = findRawValue(row, 'semaine', 'sem').val;
      const semaine = semVal ? Number(semVal) : selectedSemaine;

      // Find existing perf record to preserve optional values if omitted
      const existingRecord = existingPerfs.find(
        (p) => p.semaine === semaine && p.canal === canal && (p.agent_id === agentId || p.log_activite === logActivite)
      );

      // Parse Metrics
      const rawRap = findRawValue(row, 'rap', 'resolution', '1ercontact').val;
      const rap = parsePct(rawRap) ?? existingRecord?.rap ?? 0.85;

      const rawTr = findRawValue(row, 'tr', 'tauxdetransfert', 'transfert').val;
      const tr = parsePct(rawTr) ?? existingRecord?.tr ?? 0.15;

      const rawCcx = findRawValue(row, 'ccx', 'customercontact', 'experienceclient').val;
      const ccx = parsePct(rawCcx) ?? existingRecord?.ccx ?? 0.92;

      const rawDmt = findRawValue(row, 'dmt', 'duree', 'dureedetraitement').val;
      const dmt = parseDmt(rawDmt) ?? existingRecord?.dmt ?? 600;

      const rawVol = findRawValue(row, 'volume', 'vol', 'quantite').val;
      const vol = parseNum(rawVol) ?? existingRecord?.vol ?? 150;

      const rawHPlan = findRawValue(row, 'hplanifiees', 'heuresplanifiees', 'hplan', 'planifiees').val;
      const h_planifiees = parseNum(rawHPlan) ?? existingRecord?.h_planifiees ?? 40;

      const rawHAbs = findRawValue(row, 'habsence', 'heuresabsence', 'absence', 'habs').val;
      const h_absence = parseNum(rawHAbs) ?? existingRecord?.h_absence ?? 0;

      return {
        id: existingRecord ? existingRecord.id : `perf-imp-${Date.now()}-${idx}`,
        agent_id: agentId,
        agent_name: agentName,
        log_activite: logActivite,
        manager_name: auth?.manager_name || matchedAgent?.manager_name || 'SABI Prospere',
        canal,
        semaine,
        annee: 2026,
        rap,
        tr,
        ccx,
        dmt,
        vol,
        h_planifiees,
        h_absence,
      };
    });

    store.saveWeeklyPerformanceBatch(batch);

    setFeedback({
      type: 'success',
      message: `${batch.length} enregistrement(s) de performance hebdomadaire pour la Semaine ${selectedSemaine} ont été importé(s) et calculé(s) avec succès !`,
    });

    setRawFileRows([]);
    setFileName('');
    setWarnings([]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Importation Hebdomadaire (Import Hebdo)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Téléversez les fichiers de performance (Excel/CSV) ou captures d'écran OCR. L'assiduité et les primes sont automatiquement recalculées.
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

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          )}
          <div className="text-xs font-medium leading-relaxed">{feedback.message}</div>
        </div>
      )}

      {activeTab === 'excel' ? (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Semaine Cible de l'Import
                </label>
                <select
                  value={selectedSemaine}
                  onChange={(e) => setSelectedSemaine(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#814BE7]/20"
                >
                  {[27, 28, 29, 30, 31, 32, 33, 34, 35].map((s) => (
                    <option key={s} value={s}>
                      Semaine {s} (2026)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fichier de Données (.xlsx, .xls, .csv)
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-[#814BE7] hover:bg-[#6f3cd1] text-white text-xs font-bold rounded-xl shadow-sm transition-all text-center">
                    <Upload className="w-4 h-4" />
                    <span>{fileName ? `Fichier : ${fileName}` : 'Sélectionner ou glisser un fichier'}</span>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                  {rawFileRows.length > 0 && (
                    <Button variant="outline" onClick={() => setRawFileRows([])} className="text-xs">
                      Recommencer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Analysis & Summary Panel */}
          {rawFileRows.length > 0 && (
            <Card className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#814BE7]" />
                    Synthèse de la détection du fichier ({rawFileRows.length} lignes)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Vérification de l'en-tête et correspondance des colonnes obligatoires et facultatives
                  </p>
                </div>

                <Button variant="emerald" onClick={handleConfirmImport} disabled={isParsing}>
                  <Check className="w-4 h-4 mr-1.5" />
                  Valider et Importer la S{selectedSemaine}
                </Button>
              </div>

              {/* Badges / Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                  <span className="text-slate-500 block text-2xs uppercase tracking-wider font-semibold">Lignes Détectées</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">{rawFileRows.length}</span>
                </div>
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                  <span className="text-slate-500 block text-2xs uppercase tracking-wider font-semibold">Colonnes Reconnues</span>
                  <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">{detectedColumns.length}</span>
                </div>
                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900/50">
                  <span className="text-slate-500 block text-2xs uppercase tracking-wider font-semibold">Colonnes Facultatives</span>
                  <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                    {missingOptionalCols.length === 0 ? 'Toutes présentes' : `${4 - missingOptionalCols.length}/4 trouvées`}
                  </span>
                </div>
                <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/50">
                  <span className="text-slate-500 block text-2xs uppercase tracking-wider font-semibold">Mises à Jour / Doublons</span>
                  <span className="text-lg font-black text-purple-700 dark:text-purple-400">{duplicateCount}</span>
                </div>
              </div>

              {/* Warnings List */}
              {warnings.length > 0 && (
                <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs space-y-1 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900/40 dark:text-amber-200">
                  <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    Informations sur l'import :
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-2xs pl-1">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Data Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-xs text-left text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-900 font-bold border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Agent / LOG</th>
                      <th className="p-3">Canal</th>
                      <th className="p-3">Semaine</th>
                      <th className="p-3">RAP</th>
                      <th className="p-3">TR</th>
                      <th className="p-3">CCX</th>
                      <th className="p-3">DMT</th>
                      <th className="p-3">H Plan.</th>
                      <th className="p-3">H Abs.</th>
                      <th className="p-3">Assiduité Calc.</th>
                      <th className="p-3">Vol.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rawFileRows.slice(0, 15).map((row, idx) => {
                      const agent = findRawValue(row, 'logactivite', 'log', 'agent', 'nom', 'matricule').val || 'Agent Support';
                      const canal = findRawValue(row, 'canal', 'channel').val || 'Phone';
                      const sem = findRawValue(row, 'semaine', 'sem').val || selectedSemaine;

                      const rap = parsePct(findRawValue(row, 'rap', 'resolution').val);
                      const tr = parsePct(findRawValue(row, 'tr', 'transfert').val);
                      const ccx = parsePct(findRawValue(row, 'ccx', 'customer').val);
                      const dmt = parseDmt(findRawValue(row, 'dmt', 'duree').val);
                      const hPlan = parseNum(findRawValue(row, 'hplanifiees', 'heuresplanifiees', 'planifiees').val) ?? 40;
                      const hAbs = parseNum(findRawValue(row, 'habsence', 'heuresabsence', 'absence').val) ?? 0;
                      const vol = parseNum(findRawValue(row, 'volume', 'vol').val);

                      const assid = hPlan > 0 ? Math.max(0, Math.min(100, ((hPlan - hAbs) / hPlan) * 100)) : null;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                          <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{String(agent)}</td>
                          <td className="p-3"><Badge variant="purple">{String(canal)}</Badge></td>
                          <td className="p-3 font-bold text-[#814BE7]">S{sem}</td>
                          <td className="p-3">{formatKpiValue('rap', rap)}</td>
                          <td className="p-3">{tr != null ? formatKpiValue('tr', tr) : <span className="text-slate-400 font-normal italic">Conservé</span>}</td>
                          <td className="p-3">{ccx != null ? formatKpiValue('ccx', ccx) : <span className="text-slate-400 font-normal italic">Conservé</span>}</td>
                          <td className="p-3">{dmt != null ? `${dmt}s` : '—'}</td>
                          <td className="p-3">{hPlan}h</td>
                          <td className="p-3">{hAbs}h</td>
                          <td className="p-3 font-bold text-emerald-700 dark:text-emerald-400">
                            {assid != null ? `${assid.toFixed(1)}%` : '100%'}
                          </td>
                          <td className="p-3 font-semibold">{vol ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {rawFileRows.length > 15 && (
                <p className="text-2xs text-center text-slate-400">
                  Affichage des 15 premières lignes sur {rawFileRows.length}. L'intégralité sera importée.
                </p>
              )}
            </Card>
          )}
        </div>
      ) : (
        <ScreenshotImport />
      )}
    </div>
  );
};
