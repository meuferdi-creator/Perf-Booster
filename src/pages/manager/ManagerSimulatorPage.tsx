import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  RefreshCw,
  Award,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  BookmarkPlus,
  Trash2,
  Sliders,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, TableHeader, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { AncienneteType, CanalType, SavedSimulation } from '../../types';
import { primeForCanal, formatFCFA, KPI_TARGETS, calculateMulticanalPrime } from '../../lib/kpi-utils';
import { store } from '../../lib/store';
import {
  getAvailableMonths,
  getAgentImportedData,
  ChannelMetrics,
  AgentSimulationData,
} from '../../lib/simulator-data';

export const ManagerSimulatorPage: React.FC = () => {
  // Available selectors
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMois, setSelectedMois] = useState<string>('Juillet 2026');
  const [agentsList, setAgentsList] = useState<{ id: string; matricule: string; name: string }[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('agent-1163');

  // Imported Real Data state
  const [importedData, setImportedData] = useState<AgentSimulationData | null>(null);

  // Simulation editable states
  const [anciennete, setAnciennete] = useState<AncienneteType>('+ 3 mois');
  const [presence, setPresence] = useState(100);

  // Channels simulation metrics
  const [phoneMetrics, setPhoneMetrics] = useState<ChannelMetrics>({ vol: 0, rap: 84.8, tr: 14.5, ccx: 93.0, dmt: 590 });
  const [emailMetrics, setEmailMetrics] = useState<ChannelMetrics>({ vol: 0, rap: 85.5, tr: 20.0, ccx: 94.89, dmt: 542 });
  const [muMetrics, setMuMetrics] = useState<ChannelMetrics>({ vol: 0, rap: 86.2, tr: 14.5, ccx: 95.0, dmt: 660 });

  // Scenario management
  const [activeScenario, setActiveScenario] = useState<'real' | 'target100' | 'target110' | 'custom'>('real');
  const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // 1. Initial Load of Months and Agents
  useEffect(() => {
    const availableM = getAvailableMonths();
    setMonths(availableM);
    if (availableM.length > 0 && !availableM.includes(selectedMois)) {
      setSelectedMois(availableM[0]);
    }

    const allAgents = store.getAgents();
    const formattedAgents = allAgents.map((a) => ({
      id: a.id,
      matricule: a.matricule_rh,
      name: a.nom_complet,
    }));

    // Add any agents from monthly results that might not be in agents array
    const monthlyRes = store.getMonthlyResults();
    monthlyRes.forEach((m) => {
      if (!formattedAgents.some((a) => a.id === m.agent_id || a.matricule === m.matricule_rh)) {
        formattedAgents.push({
          id: m.agent_id || `agent-${m.matricule_rh}`,
          matricule: m.matricule_rh,
          name: m.agent_name,
        });
      }
    });

    setAgentsList(formattedAgents);
    if (formattedAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(formattedAgents[0].id);
    }

    setSavedSimulations(store.getSavedSimulations());
  }, []);

  // Subscribe to store updates
  useEffect(() => {
    return store.subscribe(() => {
      setSavedSimulations(store.getSavedSimulations());
    });
  }, []);

  // 2. Load Agent Imported Data when Agent or Month changes
  useEffect(() => {
    if (!selectedAgentId || !selectedMois) return;

    const data = getAgentImportedData(selectedAgentId, selectedMois);
    setImportedData(data);

    if (data) {
      // Sync simulation state with real data
      setAnciennete(data.anciennete);
      setPresence(data.presence);
      setPhoneMetrics({ ...data.channels.Phone });
      setEmailMetrics({ ...data.channels.Email });
      setMuMetrics({ ...data.channels.MU });
      setActiveScenario('real');
    }
  }, [selectedAgentId, selectedMois]);

  // 3. Real Calculations
  const realMulticanal = useMemo(() => {
    if (!importedData || !importedData.hasData) return null;
    return importedData.realResult;
  }, [importedData]);

  // 4. Simulated Calculations
  const simMulticanal = useMemo(() => {
    return calculateMulticanalPrime(
      {
        Phone: {
          vol: phoneMetrics.vol,
          rap: phoneMetrics.rap / 100,
          tr: phoneMetrics.tr / 100,
          ccx: phoneMetrics.ccx / 100,
          dmt: phoneMetrics.dmt,
        },
        Email: {
          vol: emailMetrics.vol,
          rap: emailMetrics.rap / 100,
          tr: emailMetrics.tr / 100,
          ccx: emailMetrics.ccx / 100,
          dmt: emailMetrics.dmt,
        },
        MU: {
          vol: muMetrics.vol,
          rap: muMetrics.rap / 100,
          tr: muMetrics.tr / 100,
          ccx: muMetrics.ccx / 100,
          dmt: muMetrics.dmt,
        },
      },
      anciennete,
      presence
    );
  }, [phoneMetrics, emailMetrics, muMetrics, anciennete, presence]);

  // Delta calculations
  const primeReelleVal = realMulticanal ? realMulticanal.pvFinale : 0;
  const primeSimuleeVal = simMulticanal.pvFinale;
  const gainPotentiel = primeSimuleeVal - primeReelleVal;

  // Handler for Scenarios Preset
  const handleApplyScenario = (scenario: 'real' | 'target100' | 'target110') => {
    if (scenario === 'real') {
      if (importedData) {
        setAnciennete(importedData.anciennete);
        setPresence(importedData.presence);
        setPhoneMetrics({ ...importedData.channels.Phone });
        setEmailMetrics({ ...importedData.channels.Email });
        setMuMetrics({ ...importedData.channels.MU });
      }
      setActiveScenario('real');
      return;
    }

    const anc = anciennete;
    const phoneT = KPI_TARGETS.Phone[anc];
    const emailT = KPI_TARGETS.Email[anc];
    const muT = KPI_TARGETS.MU[anc];

    if (scenario === 'target100') {
      setPhoneMetrics((prev) => ({
        ...prev,
        rap: phoneT.rap.s100 * 100,
        tr: phoneT.tr.s100 * 100,
        ccx: phoneT.ccx.s100 * 100,
        dmt: phoneT.dmt.s100,
      }));
      setEmailMetrics((prev) => ({
        ...prev,
        rap: emailT.rap.s100 * 100,
        tr: emailT.tr.s100 * 100,
        ccx: emailT.ccx.s100 * 100,
        dmt: emailT.dmt.s100,
      }));
      setMuMetrics((prev) => ({
        ...prev,
        rap: muT.rap.s100 * 100,
        tr: muT.tr.s100 * 100,
        ccx: muT.ccx.s100 * 100,
        dmt: muT.dmt.s100,
      }));
      setActiveScenario('target100');
    } else if (scenario === 'target110') {
      setPhoneMetrics((prev) => ({
        ...prev,
        rap: phoneT.rap.s110 * 100,
        tr: phoneT.tr.s110 * 100,
        ccx: phoneT.ccx.s110 * 100,
        dmt: phoneT.dmt.s110,
      }));
      setEmailMetrics((prev) => ({
        ...prev,
        rap: emailT.rap.s110 * 100,
        tr: emailT.tr.s110 * 100,
        ccx: emailT.ccx.s110 * 100,
        dmt: emailT.dmt.s110,
      }));
      setMuMetrics((prev) => ({
        ...prev,
        rap: muT.rap.s110 * 100,
        tr: muT.tr.s110 * 100,
        ccx: muT.ccx.s110 * 100,
        dmt: muT.dmt.s110,
      }));
      setActiveScenario('target110');
    }
  };

  const handleCustomChange = () => {
    setActiveScenario('custom');
  };

  const handleSaveSimulation = () => {
    const currentAgent = agentsList.find((a) => a.id === selectedAgentId);
    const simRecord: SavedSimulation = {
      id: `sim-${Date.now()}`,
      date_saved: new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      agent_id: selectedAgentId,
      agent_name: currentAgent ? currentAgent.name : 'Agent Support',
      matricule_rh: currentAgent ? currentAgent.matricule : '0000',
      mois_label: selectedMois,
      prime_reelle: primeReelleVal,
      prime_simulee: primeSimuleeVal,
      gain_potentiel: gainPotentiel,
      scenario_name:
        activeScenario === 'real'
          ? 'Données Réelles'
          : activeScenario === 'target100'
          ? 'Objectif 100%'
          : activeScenario === 'target110'
          ? 'Objectif 110%'
          : 'Scénario Personnalisé',
    };

    store.saveSimulation(simRecord);
    alert(`Scénario enregistré avec succès ! (${formatFCFA(gainPotentiel >= 0 ? gainPotentiel : 0)} de gain potentiel)`);
  };

  const handleDeleteSavedSim = (id: string) => {
    if (confirm('Voulez-vous supprimer ce scénario sauvegardé ?')) {
      store.deleteSimulation(id);
    }
  };

  // Helper to format KPI values for comparison table
  const renderKpiComparisonRow = (
    canal: CanalType,
    kpiKey: 'rap' | 'tr' | 'ccx' | 'dmt',
    kpiLabel: string,
    realVal: number | undefined,
    simVal: number,
    isPercentage: boolean,
    lowerIsBetter: boolean
  ) => {
    if (realVal == null) return null;

    const diff = simVal - realVal;
    let diffFormatted = '';
    if (isPercentage) {
      diffFormatted = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)} pt`;
    } else {
      diffFormatted = `${diff >= 0 ? '+' : ''}${Math.round(diff)} s`;
    }

    const isFavorable = lowerIsBetter ? diff < 0 : diff > 0;
    const isNeutral = Math.abs(diff) < 0.01;

    // Threshold tier calculation for simulated KPI
    const t = KPI_TARGETS[canal][anciennete][kpiKey];
    let tier = '< 90%';
    const valRatio = isPercentage ? simVal / 100 : simVal;
    if (!lowerIsBetter) {
      if (valRatio >= t.s110) tier = '110% (Bonus Max)';
      else if (valRatio >= t.s100) tier = '100% (Standard)';
      else if (valRatio >= t.s90) tier = '90% (Seuil Min)';
    } else {
      if (valRatio <= t.s110) tier = '110% (Bonus Max)';
      else if (valRatio <= t.s100) tier = '100% (Standard)';
      else if (valRatio <= t.s90) tier = '90% (Seuil Min)';
    }

    return (
      <TableRow key={`${canal}-${kpiKey}`}>
        <TableCell className="font-semibold text-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#814BE7]" />
          {canal} — {kpiLabel}
        </TableCell>
        <TableCell className="font-mono text-slate-600">
          {isPercentage ? `${realVal.toFixed(1)}%` : `${Math.round(realVal)} s`}
        </TableCell>
        <TableCell className="font-mono font-bold text-slate-900">
          {isPercentage ? `${simVal.toFixed(1)}%` : `${Math.round(simVal)} s`}
        </TableCell>
        <TableCell>
          {isNeutral ? (
            <span className="text-slate-400 font-mono text-xs">—</span>
          ) : (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-md ${
                isFavorable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isFavorable ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {diffFormatted}
            </span>
          )}
        </TableCell>
        <TableCell>
          <Badge
            variant={
              tier.includes('110%')
                ? 'success'
                : tier.includes('100%')
                ? 'purple'
                : tier.includes('90%')
                ? 'info'
                : 'warning'
            }
          >
            {tier}
          </Badge>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-[#814BE7]" /> Simulateur de Primes Multicanal
          </h1>
          <p className="text-xs text-slate-500">
            Connecté automatiquement aux résultats réels importés. Calculez les primes et modélisez les gains potentiels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistoryModal(!showHistoryModal)}>
            <History className="w-4 h-4 mr-1.5" />
            Historique ({savedSimulations.length})
          </Button>
          <Button variant="emerald" size="sm" onClick={handleSaveSimulation}>
            <BookmarkPlus className="w-4 h-4 mr-1.5" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Selector Header Card: Mois & Agent selection */}
      <Card className="p-5 bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <Select
              label="Mois d'arrêté"
              value={selectedMois}
              onChange={(e) => setSelectedMois(e.target.value)}
              options={months.map((m) => ({ value: m, label: m }))}
            />

            <Select
              label="Agent (Matricule & Nom)"
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              options={agentsList.map((a) => ({
                value: a.id,
                label: `[${a.matricule}] ${a.name}`,
              }))}
            />
          </div>

          <div className="flex sm:flex-col justify-between items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div className="text-right">
              <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider block">Ancienneté Détectée</span>
              <Badge variant="purple" size="md" className="mt-0.5">
                {anciennete}
              </Badge>
            </div>

            <div>
              {importedData?.hasData ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Données Réelles Importées
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Données non importées
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Warning banner if no data available */}
      {importedData && !importedData.hasData && (
        <Card className="p-4 bg-amber-50/80 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold">Aucune donnée importée disponible pour cet agent sur la période {selectedMois}.</p>
            <p className="text-2xs text-amber-800">
              Vous êtes actuellement en mode saisie manuelle. Vous pouvez ajuster librement les volumes et KPI ci-dessous pour simuler une prime théorique.
            </p>
          </div>
        </Card>
      )}

      {/* Quick Scenarios Preset Toolbar */}
      <Card className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#814BE7]" />
          <div>
            <span className="text-xs font-bold block">Scénarios de Simulation Rapides</span>
            <span className="text-2xs text-slate-400">
              Modélisez automatiquement les paliers de prime en 1 clic sans altérer les données réelles.
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleApplyScenario('real')}
            disabled={!importedData?.hasData}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeScenario === 'real'
                ? 'bg-[#814BE7] text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
            }`}
          >
            Données Réelles
          </button>

          <button
            onClick={() => handleApplyScenario('target100')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeScenario === 'target100'
                ? 'bg-[#814BE7] text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Objectif 100%
          </button>

          <button
            onClick={() => handleApplyScenario('target110')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeScenario === 'target110'
                ? 'bg-[#814BE7] text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Objectif 110% (Max)
          </button>

          {activeScenario === 'custom' && (
            <Badge variant="warning" size="sm" className="bg-amber-500/20 text-amber-300 border-amber-500/30">
              Simulation Personnalisée
            </Badge>
          )}
        </div>
      </Card>

      {/* Global Config Card */}
      <Card className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Ancienneté"
          value={anciennete}
          onChange={(e) => {
            setAnciennete(e.target.value as AncienneteType);
            handleCustomChange();
          }}
          options={[
            { value: '+ 3 mois', label: '+ 3 mois (Conseiller Expérimenté)' },
            { value: '- 3 mois', label: '- 3 mois (Nouveau Conseiller)' },
          ]}
        />

        <Input
          label="Taux de Présence (%)"
          type="number"
          step="0.01"
          value={presence}
          onChange={(e) => {
            setPresence(Number(e.target.value));
            handleCustomChange();
          }}
        />
      </Card>

      {/* Channels Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Phone */}
        <Card className="p-5 space-y-3 border-indigo-100">
          <h3 className="font-bold text-sm text-[#814BE7] flex justify-between items-center">
            <span>Canal Phone</span>
            <span className="text-2xs text-slate-400">Poids: {(simMulticanal.poids.Phone * 100).toFixed(1)}%</span>
          </h3>
          <Input
            label="Volume Contacts"
            type="number"
            value={phoneMetrics.vol}
            onChange={(e) => {
              setPhoneMetrics({ ...phoneMetrics, vol: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="RAP (%)"
            type="number"
            step="0.1"
            value={phoneMetrics.rap}
            onChange={(e) => {
              setPhoneMetrics({ ...phoneMetrics, rap: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="TR (%)"
            type="number"
            step="0.1"
            value={phoneMetrics.tr}
            onChange={(e) => {
              setPhoneMetrics({ ...phoneMetrics, tr: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="CCX (%)"
            type="number"
            step="0.1"
            value={phoneMetrics.ccx}
            onChange={(e) => {
              setPhoneMetrics({ ...phoneMetrics, ccx: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="DMT (sec)"
            type="number"
            value={phoneMetrics.dmt}
            onChange={(e) => {
              setPhoneMetrics({ ...phoneMetrics, dmt: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <div className="pt-2 border-t text-xs font-semibold text-slate-700 flex justify-between">
            <span>Contrib Phone:</span>
            <span className="text-[#814BE7] font-bold">{formatFCFA(simMulticanal.contributions.Phone)}</span>
          </div>
        </Card>

        {/* Email */}
        <Card className="p-5 space-y-3 border-indigo-100">
          <h3 className="font-bold text-sm text-indigo-600 flex justify-between items-center">
            <span>Canal Email</span>
            <span className="text-2xs text-slate-400">Poids: {(simMulticanal.poids.Email * 100).toFixed(1)}%</span>
          </h3>
          <Input
            label="Volume Contacts"
            type="number"
            value={emailMetrics.vol}
            onChange={(e) => {
              setEmailMetrics({ ...emailMetrics, vol: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="RAP (%)"
            type="number"
            step="0.1"
            value={emailMetrics.rap}
            onChange={(e) => {
              setEmailMetrics({ ...emailMetrics, rap: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="TR (%)"
            type="number"
            step="0.1"
            value={emailMetrics.tr}
            onChange={(e) => {
              setEmailMetrics({ ...emailMetrics, tr: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="CCX (%)"
            type="number"
            step="0.1"
            value={emailMetrics.ccx}
            onChange={(e) => {
              setEmailMetrics({ ...emailMetrics, ccx: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="DMT (sec)"
            type="number"
            value={emailMetrics.dmt}
            onChange={(e) => {
              setEmailMetrics({ ...emailMetrics, dmt: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <div className="pt-2 border-t text-xs font-semibold text-slate-700 flex justify-between">
            <span>Contrib Email:</span>
            <span className="text-indigo-600 font-bold">{formatFCFA(simMulticanal.contributions.Email)}</span>
          </div>
        </Card>

        {/* MU */}
        <Card className="p-5 space-y-3 border-indigo-100">
          <h3 className="font-bold text-sm text-purple-600 flex justify-between items-center">
            <span>Canal MU</span>
            <span className="text-2xs text-slate-400">Poids: {(simMulticanal.poids.MU * 100).toFixed(1)}%</span>
          </h3>
          <Input
            label="Volume Contacts"
            type="number"
            value={muMetrics.vol}
            onChange={(e) => {
              setMuMetrics({ ...muMetrics, vol: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="RAP (%)"
            type="number"
            step="0.1"
            value={muMetrics.rap}
            onChange={(e) => {
              setMuMetrics({ ...muMetrics, rap: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="TR (%)"
            type="number"
            step="0.1"
            value={muMetrics.tr}
            onChange={(e) => {
              setMuMetrics({ ...muMetrics, tr: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="CCX (%)"
            type="number"
            step="0.1"
            value={muMetrics.ccx}
            onChange={(e) => {
              setMuMetrics({ ...muMetrics, ccx: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <Input
            label="DMT (sec)"
            type="number"
            value={muMetrics.dmt}
            onChange={(e) => {
              setMuMetrics({ ...muMetrics, dmt: Number(e.target.value) });
              handleCustomChange();
            }}
          />
          <div className="pt-2 border-t text-xs font-semibold text-slate-700 flex justify-between">
            <span>Contrib MU:</span>
            <span className="text-purple-600 font-bold">{formatFCFA(simMulticanal.contributions.MU)}</span>
          </div>
        </Card>
      </div>

      {/* Main Results & Comparison Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
          {/* Simulated Prime Primary Display */}
          <div>
            <span className="text-2xs font-bold text-indigo-300 uppercase tracking-wider block">
              Prime Finale Simulée (Vol Total : {simMulticanal.volTotal})
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-white">{formatFCFA(simMulticanal.pvFinale)}</span>
              <span className="text-xs text-slate-300">(dont PV Brute: {formatFCFA(simMulticanal.pvSansPresence)})</span>
            </div>
          </div>

          {/* Comparison Real vs Simulated & Gain */}
          <div className="flex flex-wrap items-center gap-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80">
            <div>
              <span className="text-2xs text-slate-400 font-bold uppercase block">Prime Actuelle Réelle</span>
              <span className="text-lg font-black text-slate-200">{formatFCFA(primeReelleVal)}</span>
            </div>

            <div className="h-8 w-px bg-slate-700 hidden sm:block" />

            <div>
              <span className="text-2xs text-indigo-300 font-bold uppercase block">Gain Potentiel</span>
              <span
                className={`text-lg font-black flex items-center gap-1 ${
                  gainPotentiel > 0 ? 'text-emerald-400' : gainPotentiel < 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {gainPotentiel > 0 ? `+${formatFCFA(gainPotentiel)}` : formatFCFA(gainPotentiel)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="purple" size="md" className="bg-[#814BE7] text-white border-none py-2 px-4 text-sm">
            Statut : {simMulticanal.statut}
          </Badge>

          <span className="text-2xs text-slate-400">Pondération dynamique recalculée instantanément.</span>
        </div>
      </Card>

      {/* Detailed KPI Comparison Table (Réel vs Simulation) */}
      {importedData?.hasData && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#814BE7]" /> Comparatif Réel vs Simulation par KPI
              </h3>
              <p className="text-2xs text-slate-500">
                Visualisez l'impact de chaque modification de KPI sur les seuils d'attribution des primes.
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Canal & KPI</TableHead>
                <TableHead>Réel Importé</TableHead>
                <TableHead>Simulé</TableHead>
                <TableHead>Écart</TableHead>
                <TableHead>Palier Atteint</TableHead>
              </TableRow>
            </TableHeader>
            <tbody>
              {/* Phone Rows */}
              {phoneMetrics.vol > 0 && (
                <>
                  {renderKpiComparisonRow('Phone', 'rap', 'RAP', importedData.channels.Phone.rap, phoneMetrics.rap, true, false)}
                  {renderKpiComparisonRow('Phone', 'tr', 'TR', importedData.channels.Phone.tr, phoneMetrics.tr, true, true)}
                  {renderKpiComparisonRow('Phone', 'ccx', 'CCX', importedData.channels.Phone.ccx, phoneMetrics.ccx, true, false)}
                  {renderKpiComparisonRow('Phone', 'dmt', 'DMT', importedData.channels.Phone.dmt, phoneMetrics.dmt, false, true)}
                </>
              )}

              {/* Email Rows */}
              {emailMetrics.vol > 0 && (
                <>
                  {renderKpiComparisonRow('Email', 'rap', 'RAP', importedData.channels.Email.rap, emailMetrics.rap, true, false)}
                  {renderKpiComparisonRow('Email', 'tr', 'TR', importedData.channels.Email.tr, emailMetrics.tr, true, true)}
                  {renderKpiComparisonRow('Email', 'ccx', 'CCX', importedData.channels.Email.ccx, emailMetrics.ccx, true, false)}
                  {renderKpiComparisonRow('Email', 'dmt', 'DMT', importedData.channels.Email.dmt, emailMetrics.dmt, false, true)}
                </>
              )}

              {/* MU Rows */}
              {muMetrics.vol > 0 && (
                <>
                  {renderKpiComparisonRow('MU', 'rap', 'RAP', importedData.channels.MU.rap, muMetrics.rap, true, false)}
                  {renderKpiComparisonRow('MU', 'tr', 'TR', importedData.channels.MU.tr, muMetrics.tr, true, true)}
                  {renderKpiComparisonRow('MU', 'ccx', 'CCX', importedData.channels.MU.ccx, muMetrics.ccx, true, false)}
                  {renderKpiComparisonRow('MU', 'dmt', 'DMT', importedData.channels.MU.dmt, muMetrics.dmt, false, true)}
                </>
              )}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Saved Simulations History Section */}
      {showHistoryModal && (
        <Card className="p-6 space-y-4 border-2 border-[#814BE7]/30">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-[#814BE7]" /> Historique des Simulations Enregistrées
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowHistoryModal(false)}>
              Fermer
            </Button>
          </div>

          {savedSimulations.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">Aucune simulation enregistrée pour le moment.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Scénario</TableHead>
                  <TableHead>Prime Réelle</TableHead>
                  <TableHead>Prime Simulée</TableHead>
                  <TableHead>Gain Potentiel</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {savedSimulations.map((sim) => (
                  <TableRow key={sim.id}>
                    <TableCell className="text-2xs text-slate-500">{sim.date_saved}</TableCell>
                    <TableCell className="font-bold text-slate-900">{sim.agent_name}</TableCell>
                    <TableCell>{sim.mois_label}</TableCell>
                    <TableCell>
                      <Badge variant="purple">{sim.scenario_name}</Badge>
                    </TableCell>
                    <TableCell>{formatFCFA(sim.prime_reelle)}</TableCell>
                    <TableCell className="font-bold text-[#814BE7]">{formatFCFA(sim.prime_simulee)}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${sim.gain_potentiel >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sim.gain_potentiel >= 0 ? `+${formatFCFA(sim.gain_potentiel)}` : formatFCFA(sim.gain_potentiel)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteSavedSim(sim.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}
    </div>
  );
};
