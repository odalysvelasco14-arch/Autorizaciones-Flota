import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calendar, 
  Plus, 
  Save, 
  X, 
  Trash2, 
  CheckCircle2, 
  FileSpreadsheet, 
  AlertCircle,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  Layers
} from 'lucide-react';
import { AgenciaInfo, JROInfo, MonthlyBudgetConfig, ApprovalRecord } from '../types/budget';
import { formatCurrency } from '../utils/budgetUtils';

interface MonthlyBudgetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencias: AgenciaInfo[];
  jros: JROInfo[];
  configuracionMensual: Record<string, MonthlyBudgetConfig>;
  selectedMonth: string;
  onSaveConfig: (monthKey: string, updatedConfig: MonthlyBudgetConfig, updatedAgencias: AgenciaInfo[]) => Promise<void>;
  onSaveAnnualMatrix?: (matrix: Record<string, MonthlyBudgetConfig>, agencias: AgenciaInfo[], jros: JROInfo[]) => Promise<void>;
  onDeleteAgency?: (agencyId: string, agencyName: string) => Promise<void> | void;
  aprobaciones: ApprovalRecord[];
}

const MONTH_KEYS = [
  { key: '2026-01', short: 'Ene', label: 'Enero 2026' },
  { key: '2026-02', short: 'Feb', label: 'Febrero 2026' },
  { key: '2026-03', short: 'Mar', label: 'Marzo 2026' },
  { key: '2026-04', short: 'Abr', label: 'Abril 2026' },
  { key: '2026-05', short: 'May', label: 'Mayo 2026' },
  { key: '2026-06', short: 'Jun', label: 'Junio 2026' },
  { key: '2026-07', short: 'Jul', label: 'Julio 2026' },
  { key: '2026-08', short: 'Ago', label: 'Agosto 2026' },
  { key: '2026-09', short: 'Sep', label: 'Septiembre 2026' },
  { key: '2026-10', short: 'Oct', label: 'Octubre 2026' },
  { key: '2026-11', short: 'Nov', label: 'Noviembre 2026' },
  { key: '2026-12', short: 'Dic', label: 'Diciembre 2026' }
];

export const MonthlyBudgetManagerModal: React.FC<MonthlyBudgetManagerModalProps> = ({
  isOpen,
  onClose,
  agencias,
  jros,
  configuracionMensual,
  selectedMonth,
  onSaveConfig,
  onSaveAnnualMatrix,
  onDeleteAgency,
  aprobaciones
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'editor' | 'paste' | 'new_agency'>('matrix');
  const [activeMonth, setActiveMonth] = useState<string>(selectedMonth || '2026-09');
  const [agenciesList, setAgenciesList] = useState<AgenciaInfo[]>(agencias);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Full 12-month matrix state: Record<agencyName, Record<monthKey, number>>
  const [matrixData, setMatrixData] = useState<Record<string, Record<string, number>>>({});

  // Single month editor budgets
  const [agencyBudgets, setAgencyBudgets] = useState<Record<string, number>>({});
  const [alertThreshold, setAlertThreshold] = useState<number>(85);

  // New Agency Form State
  const [newAgencyName, setNewAgencyName] = useState('');
  const [newAgencyRegion, setNewAgencyRegion] = useState('Región Litoral');
  const [newAgencyJROId, setNewAgencyJROId] = useState(jros[0]?.id || 'jro-litoral');
  const [newAgencyBudget, setNewAgencyBudget] = useState(25000);

  // Paste Data State
  const [pastedData, setPastedData] = useState('');
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Filter for matrix view
  const [regionFilter, setRegionFilter] = useState<string>('all');

  // Initialize matrix and monthly data
  useEffect(() => {
    setAgenciesList(agencias);
    const newMatrix: Record<string, Record<string, number>> = {};

    agencias.forEach(ag => {
      newMatrix[ag.nombre] = {};
      MONTH_KEYS.forEach(m => {
        const monthCfg = configuracionMensual[m.key];
        const val = monthCfg?.presupuestosPorAgencia?.[ag.nombre] ?? ag.presupuestoMensualQ ?? 25000;
        newMatrix[ag.nombre][m.key] = val;
      });
    });

    setMatrixData(newMatrix);

    // Also populate single month state
    const currentMonthConfig = configuracionMensual[activeMonth];
    const initialBudgets: Record<string, number> = {};
    agencias.forEach(ag => {
      initialBudgets[ag.nombre] = currentMonthConfig?.presupuestosPorAgencia?.[ag.nombre] ?? ag.presupuestoMensualQ ?? 25000;
    });
    setAgencyBudgets(initialBudgets);
    setAlertThreshold(currentMonthConfig?.umbralAlerta || 85);
  }, [agencias, configuracionMensual, activeMonth]);

  if (!isOpen) return null;

  // Change a cell in the 12-month matrix
  const handleMatrixCellChange = (agencyName: string, monthKey: string, value: number) => {
    setMatrixData(prev => ({
      ...prev,
      [agencyName]: {
        ...(prev[agencyName] || {}),
        [monthKey]: Math.max(0, value)
      }
    }));

    if (monthKey === activeMonth) {
      setAgencyBudgets(prev => ({
        ...prev,
        [agencyName]: Math.max(0, value)
      }));
    }
  };

  // Change JRO for an agency
  const handleJROChange = (agencyId: string, newJROId: string) => {
    const selectedJRO = jros.find(j => j.id === newJROId);
    if (!selectedJRO) return;

    setAgenciesList(prev => prev.map(ag => {
      if (ag.id === agencyId) {
        return {
          ...ag,
          jroId: selectedJRO.id,
          jroNombre: selectedJRO.nombre,
          jroEmail: selectedJRO.correo,
          region: selectedJRO.region
        };
      }
      return ag;
    }));
  };

  // Quick action: Copy a specific month to all 12 months for all agencies
  const handleCopyMonthToAll = (sourceMonthKey: string) => {
    if (!confirm(`¿Deseas replicar los montos de ${sourceMonthKey} para todos los meses de 2026?`)) return;
    setMatrixData(prev => {
      const updated: Record<string, Record<string, number>> = {};
      Object.keys(prev).forEach(agName => {
        const sourceVal = prev[agName]?.[sourceMonthKey] ?? 25000;
        updated[agName] = {};
        MONTH_KEYS.forEach(m => {
          updated[agName][m.key] = sourceVal;
        });
      });
      return updated;
    });
  };

  // Quick action: Apply standard beverage season rules (Jan-Apr high / May-Dec standard)
  const handleApplySeasonalPreset = () => {
    if (!confirm('¿Aplicar el esquema de temporadas de bebidas? (Ene-Abr: Alta demanda/verano +30%, May-Dic: Operación estándar)')) return;

    setMatrixData(prev => {
      const updated: Record<string, Record<string, number>> = {};
      agenciesList.forEach(ag => {
        const base = ag.presupuestoMensualQ || 25000;
        const highVal = Math.round(base * 1.3 / 1000) * 1000;
        updated[ag.nombre] = {};
        MONTH_KEYS.forEach((m, idx) => {
          updated[ag.nombre][m.key] = idx < 4 ? highVal : base;
        });
      });
      return updated;
    });
  };

  // Add new agency
  const handleAddNewAgency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgencyName.trim()) return;

    const selectedJRO = jros.find(j => j.id === newAgencyJROId) || jros[0];
    const newAg: AgenciaInfo = {
      id: `ag-${Date.now().toString().slice(-5)}`,
      nombre: newAgencyName.trim().startsWith('Agencia ') ? newAgencyName.trim() : `Agencia ${newAgencyName.trim()}`,
      region: selectedJRO.region || newAgencyRegion,
      jroId: selectedJRO.id,
      jroNombre: selectedJRO.nombre,
      jroEmail: selectedJRO.correo,
      presupuestoMensualQ: Number(newAgencyBudget) || 25000
    };

    const updatedAgList = [...agenciesList, newAg];
    setAgenciesList(updatedAgList);

    // Update matrix for new agency
    setMatrixData(prev => ({
      ...prev,
      [newAg.nombre]: MONTH_KEYS.reduce((acc, m) => {
        acc[m.key] = Number(newAgencyBudget) || 25000;
        return acc;
      }, {} as Record<string, number>)
    }));

    setAgencyBudgets(prev => ({
      ...prev,
      [newAg.nombre]: Number(newAgencyBudget) || 25000
    }));

    setNewAgencyName('');
    setActiveTab('matrix');
  };

  // Delete an agency from the current matrix and list
  const handleDeleteAgencyFromList = async (agency: AgenciaInfo) => {
    const repairsCount = aprobaciones.filter(r => r.agencia === agency.nombre).length;
    const warningExtra = repairsCount > 0 ? `\n\nATENCIÓN: Esta agencia cuenta con ${repairsCount} solicitud(es) de reparación registrada(s).` : '';
    
    if (!confirm(`¿Estás seguro de eliminar la "${agency.nombre}"?${warningExtra}\n\nSe eliminará de la lista y de los presupuestos de los 12 meses.`)) {
      return;
    }

    const updatedList = agenciesList.filter(a => a.id !== agency.id && a.nombre !== agency.nombre);
    setAgenciesList(updatedList);

    setMatrixData(prev => {
      const copy = { ...prev };
      delete copy[agency.nombre];
      return copy;
    });

    setAgencyBudgets(prev => {
      const copy = { ...prev };
      delete copy[agency.nombre];
      return copy;
    });

    // If parent provided onDeleteAgency callback, also trigger backend deletion
    if (onDeleteAgency) {
      try {
        await onDeleteAgency(agency.id, agency.nombre);
      } catch (err) {
        console.warn('Backend agency deletion error:', err);
      }
    }
  };

  // Save the entire annual matrix (all 12 months)
  const handleSaveMatrix = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const fullMatrixConfig: Record<string, MonthlyBudgetConfig> = {};

      MONTH_KEYS.forEach(m => {
        const monthBudgets: Record<string, number> = {};
        agenciesList.forEach(ag => {
          monthBudgets[ag.nombre] = matrixData[ag.nombre]?.[m.key] ?? ag.presupuestoMensualQ ?? 25000;
        });
        const totalAssigned = Object.values(monthBudgets).reduce((sum, v) => sum + v, 0);

        fullMatrixConfig[m.key] = {
          mesAno: m.key,
          presupuestoTotal: totalAssigned,
          moneda: 'GTQ',
          umbralAlerta: alertThreshold,
          presupuestosPorAgencia: monthBudgets,
          presupuestosPorDepartamento: monthBudgets
        };
      });

      if (onSaveAnnualMatrix) {
        await onSaveAnnualMatrix(fullMatrixConfig, agenciesList, jros);
      } else {
        // Fallback: save selected month
        await onSaveConfig(activeMonth, fullMatrixConfig[activeMonth], agenciesList);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving annual budget matrix:', err);
      alert('Error al guardar la matriz de presupuestos: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Parse pasted table
  const handleParsePastedData = () => {
    setPasteError(null);
    if (!pastedData.trim()) {
      setPasteError('Por favor pega el texto o tabla de agencias y presupuestos.');
      return;
    }

    try {
      const lines = pastedData.trim().split('\n');
      let countUpdated = 0;
      const updatedMatrix = { ...matrixData };
      const updatedList = [...agenciesList];

      lines.forEach(line => {
        const parts = line.split(/[\t,;|]+/).map(p => p.trim());
        if (parts.length < 2) return;

        // Try to match agency name
        let matchedIndex = -1;
        for (let p of parts) {
          const idx = updatedList.findIndex(a => 
            a.nombre.toLowerCase() === p.toLowerCase() ||
            a.nombre.toLowerCase().includes(p.toLowerCase()) ||
            p.toLowerCase().includes(a.nombre.toLowerCase().replace('agencia ', ''))
          );
          if (idx !== -1) {
            matchedIndex = idx;
            break;
          }
        }

        if (matchedIndex === -1) return;

        const ag = updatedList[matchedIndex];
        // Extract all numbers found in row
        const numericValues: number[] = [];
        parts.forEach(p => {
          const clean = p.replace(/[^\d.]/g, '');
          const val = parseFloat(clean);
          if (!isNaN(val) && val >= 500) {
            numericValues.push(val);
          }
        });

        if (numericValues.length > 0) {
          if (!updatedMatrix[ag.nombre]) {
            updatedMatrix[ag.nombre] = {};
          }

          if (numericValues.length >= 12) {
            // Full 12-month row provided!
            MONTH_KEYS.forEach((m, idx) => {
              updatedMatrix[ag.nombre][m.key] = numericValues[idx];
            });
          } else {
            // Single amount provided -> apply to all months or active month
            const singleVal = numericValues[0];
            MONTH_KEYS.forEach(m => {
              updatedMatrix[ag.nombre][m.key] = singleVal;
            });
          }
          countUpdated++;
        }
      });

      if (countUpdated === 0) {
        setPasteError('No se identificaron coincidencias con las agencias existentes. Asegúrate de incluir el nombre de la agencia y los montos en Quetzales.');
        return;
      }

      setMatrixData(updatedMatrix);
      setAgenciesList(updatedList);
      setPastedData('');
      setActiveTab('matrix');
      alert(`¡Se actualizaron con éxito los presupuestos de ${countUpdated} agencias en la Matriz!`);
    } catch (err: any) {
      setPasteError('Error al interpretar los datos: ' + err.message);
    }
  };

  // Filtered agencies for matrix view
  const visibleAgencies = agenciesList.filter(ag => {
    if (regionFilter === 'all') return true;
    return ag.region.toLowerCase().includes(regionFilter.toLowerCase()) || ag.jroId === regionFilter;
  });

  // Calculate row total (Annual per agency)
  const calculateAgencyAnnualTotal = (agencyName: string) => {
    return MONTH_KEYS.reduce((sum, m) => sum + (matrixData[agencyName]?.[m.key] || 0), 0);
  };

  // Calculate column total (Total per month across all agencies)
  const calculateMonthTotal = (monthKey: string) => {
    return agenciesList.reduce((sum, ag) => sum + (matrixData[ag.nombre]?.[monthKey] || 0), 0);
  };

  // Grand annual total across all 12 months & all agencies
  const grandAnnualTotal = agenciesList.reduce((sum, ag) => sum + calculateAgencyAnnualTotal(ag.nombre), 0);

  // Single month calculations for Editor tab
  const totalAssignedInActiveMonth = agenciesList.reduce((sum, ag) => sum + (matrixData[ag.nombre]?.[activeMonth] || 0), 0);
  const monthlyApprovedRepairs = aprobaciones.filter(r => {
    const m = (r.fechaSolicitud || r.fechaAutorizacion || r.creadoEn || '').slice(0, 7);
    return m === activeMonth && r.estado === 'Autorizado';
  });
  const totalSpentInActiveMonth = monthlyApprovedRepairs.reduce((sum, r) => sum + (r.monto || 0), 0);
  const totalRemainingInActiveMonth = totalAssignedInActiveMonth - totalSpentInActiveMonth;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-7xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Presupuestos de Flota & Asignación de JROs por Agencia
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded border border-amber-300">
                  Panel Odalys Velasco (Admin)
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Matriz Anual 2026 (Enero - Diciembre) en Quetzales guatemaltecos (GTQ / Q)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-[10px] block font-medium">Gran Total Anual Flota (2026):</span>
              <span className="font-bold text-blue-700 font-mono text-sm">{formatCurrency(grandAnnualTotal, 'GTQ')}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-[10px] block font-medium">Presupuesto Mes Actual ({activeMonth}):</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{formatCurrency(totalAssignedInActiveMonth, 'GTQ')}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-[10px] block font-medium">Gasto Autorizado Real ({activeMonth}):</span>
              <span className="font-bold text-emerald-700 font-mono text-sm">{formatCurrency(totalSpentInActiveMonth, 'GTQ')}</span>
            </div>

            <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-[10px] block font-medium">Saldo Disponible ({activeMonth}):</span>
              <span className={`font-bold font-mono text-sm ${totalRemainingInActiveMonth >= 0 ? 'text-blue-700' : 'text-rose-600'}`}>
                {formatCurrency(totalRemainingInActiveMonth, 'GTQ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveMatrix}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Toda la Matriz Anual'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-200 text-xs font-semibold shrink-0 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'matrix'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Matriz Anual 2026 (12 Meses)</span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'editor'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Editor por Mes ({activeMonth})</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'paste'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Pegar Tabla desde Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('new_agency')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'new_agency'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Añadir Nueva Agencia</span>
          </button>
        </div>

        {/* TAB 1: FULL 12-MONTH MATRIX VIEW */}
        {activeTab === 'matrix' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar for Matrix */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Filtrar Región:</span>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-medium cursor-pointer"
                >
                  <option value="all">Todas las Regiones ({agenciesList.length} Agencias)</option>
                  <option value="jro-litoral">Región Litoral (Ing. Luis Secaida)</option>
                  <option value="jro-centro-occidente">Región Centro Occidente (Lic. Kenneth Muñoz)</option>
                  <option value="jro-central">Región Central & Metro (Ing. Fernando Morales)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleApplySeasonalPreset}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Aplica +30% a Enero-Abril (Temporada Alta de Bebidas) y estándar a Mayo-Diciembre"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  <span>Temporada Alta (Ene-Abr Mayor)</span>
                </button>

                <button
                  onClick={() => handleCopyMonthToAll(activeMonth)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>Replicar {activeMonth} a Todo 2026</span>
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="flex-1 overflow-auto p-3">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase sticky top-0 z-10 text-[10px] font-bold shadow-xs">
                  <tr>
                    <th className="p-2 border border-slate-300 bg-slate-100 min-w-[150px]">Agencia</th>
                    <th className="p-2 border border-slate-300 bg-slate-100 min-w-[130px]">Región / JRO</th>
                    {MONTH_KEYS.map(m => (
                      <th key={m.key} className="p-2 border border-slate-300 bg-slate-100 text-center min-w-[85px]">
                        <span className="block">{m.short}</span>
                        <span className="text-[8px] text-slate-400 font-normal">Q</span>
                      </th>
                    ))}
                    <th className="p-2 border border-slate-300 bg-blue-50 text-blue-900 text-right min-w-[100px]">
                      Total Anual
                    </th>
                    <th className="p-2 border border-slate-300 bg-slate-100 text-center w-10">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {visibleAgencies.map(ag => {
                    const agencyAnnualTotal = calculateAgencyAnnualTotal(ag.nombre);
                    return (
                      <tr key={ag.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">
                          {ag.nombre}
                        </td>
                        <td className="p-2 border border-slate-200">
                          <select
                            value={ag.jroId}
                            onChange={e => handleJROChange(ag.id, e.target.value)}
                            className="w-full px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700 cursor-pointer"
                          >
                            {jros.map(j => (
                              <option key={j.id} value={j.id}>
                                {j.nombre.split(' ')[1] || j.nombre} ({j.region.replace('Región ', '')})
                              </option>
                            ))}
                          </select>
                        </td>
                        {MONTH_KEYS.map(m => {
                          const val = matrixData[ag.nombre]?.[m.key] ?? ag.presupuestoMensualQ ?? 25000;
                          return (
                            <td key={m.key} className="p-1 border border-slate-200 text-center">
                              <input
                                type="number"
                                step="1000"
                                value={val}
                                onChange={e => handleMatrixCellChange(ag.nombre, m.key, Number(e.target.value))}
                                className="w-full text-right font-mono px-1.5 py-1 bg-white border border-slate-200 rounded focus:border-blue-500 focus:bg-blue-50/30 text-xs font-medium text-slate-900"
                              />
                            </td>
                          );
                        })}
                        <td className="p-2 border border-slate-200 text-right font-mono font-bold text-blue-800 bg-blue-50/20">
                          {formatCurrency(agencyAnnualTotal, 'GTQ')}
                        </td>
                        <td className="p-1 border border-slate-200 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteAgencyFromList(ag)}
                            title={`Eliminar ${ag.nombre}`}
                            className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-900 text-xs sticky bottom-0 z-10 shadow-md">
                  <tr>
                    <td colSpan={2} className="p-2 border border-slate-300 text-right uppercase tracking-wider text-[11px]">
                      Totales Mensuales (Q):
                    </td>
                    {MONTH_KEYS.map(m => {
                      const monthSum = calculateMonthTotal(m.key);
                      return (
                        <td key={m.key} className="p-2 border border-slate-300 text-right font-mono text-[11px] text-blue-900">
                          {formatCurrency(monthSum, 'GTQ')}
                        </td>
                      );
                    })}
                    <td className="p-2 border border-slate-300 text-right font-mono text-sm text-emerald-800 bg-emerald-50">
                      {formatCurrency(grandAnnualTotal, 'GTQ')}
                    </td>
                    <td className="p-2 border border-slate-300"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SINGLE MONTH EDITOR */}
        {activeTab === 'editor' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Mes en edición:</span>
                <select
                  value={activeMonth}
                  onChange={e => setActiveMonth(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  {MONTH_KEYS.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-600">Alerta de sobregiro:</span>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={alertThreshold}
                  onChange={e => setAlertThreshold(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 border border-slate-300 rounded text-xs font-mono text-center font-bold"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {agenciesList.map(ag => {
                const currentVal = matrixData[ag.nombre]?.[activeMonth] ?? ag.presupuestoMensualQ ?? 25000;
                return (
                  <div key={ag.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{ag.nombre}</h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded">
                          {ag.region.replace('Región ', '')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAgencyFromList(ag)}
                          title={`Eliminar ${ag.nombre}`}
                          className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>JRO: <strong>{ag.jroNombre}</strong></span>
                      <select
                        value={ag.jroId}
                        onChange={e => handleJROChange(ag.id, e.target.value)}
                        className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5"
                      >
                        {jros.map(j => (
                          <option key={j.id} value={j.id}>{j.nombre.split(' ')[1] || j.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-1">
                      <label className="text-[10px] text-slate-500 font-medium block">
                        Presupuesto para {activeMonth} (Q):
                      </label>
                      <input
                        type="number"
                        step="1000"
                        value={currentVal}
                        onChange={e => handleMatrixCellChange(ag.nombre, activeMonth, Number(e.target.value))}
                        className="w-full text-right font-mono px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PASTE DATA TAB */}
        {activeTab === 'paste' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <strong className="block font-bold">Instrucciones de Importación Rápida:</strong>
              <p>
                Copia las celdas desde tu hoja de cálculo (Excel o Google Sheets) o pega el texto con las agencias y montos. El importador detecta automáticamente el nombre de la agencia y las columnas numéricas para todos los meses o para un monto consolidado.
              </p>
              <div className="font-mono text-[11px] bg-white p-2 rounded border border-blue-200 text-slate-700 mt-2">
                Ejemplo 1 (Fila de 12 meses):<br />
                Agencia Cuyotenango [Tab] 35000 [Tab] 35000 [Tab] 35000 [Tab] 35000 [Tab] 25000 [Tab] 25000...<br /><br />
                Ejemplo 2 (Agencia y monto mensual):<br />
                Agencia Quetzaltenango (Xela), 36000<br />
                Agencia Cunen, 20000
              </div>
            </div>

            {pasteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{pasteError}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Pega aquí el contenido de la tabla:
              </label>
              <textarea
                value={pastedData}
                onChange={e => setPastedData(e.target.value)}
                rows={10}
                placeholder="Pega aquí los datos copiados de Excel..."
                className="w-full font-mono text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPastedData('')}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleParsePastedData}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Interpretar y Aplicar a la Matriz</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: NEW AGENCY FORM */}
        {activeTab === 'new_agency' && (
          <form onSubmit={handleAddNewAgency} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-w-xl mx-auto w-full">
            <h4 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Registrar Nueva Agencia Distribuidora</span>
            </h4>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Nombre de la Agencia *</label>
              <input
                type="text"
                required
                value={newAgencyName}
                onChange={e => setNewAgencyName(e.target.value)}
                placeholder="ej. Agencia Coatepeque"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Jefe Regional de Operaciones (JRO) Asignado *</label>
              <select
                value={newAgencyJROId}
                onChange={e => {
                  setNewAgencyJROId(e.target.value);
                  const found = jros.find(j => j.id === e.target.value);
                  if (found) setNewAgencyRegion(found.region);
                }}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {jros.map(j => (
                  <option key={j.id} value={j.id}>
                    {j.nombre} — {j.region}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Presupuesto Mensual Inicial (Quetzales GTQ) *</label>
              <input
                type="number"
                required
                min="1000"
                step="500"
                value={newAgencyBudget}
                onChange={e => setNewAgencyBudget(Number(e.target.value))}
                className="w-full font-mono text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Crear e Incorporar a la Matriz</span>
              </button>
            </div>
          </form>
        )}

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>¡Presupuestos y agencias guardados con éxito en la base de datos!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleSaveMatrix}
              disabled={isSaving}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Todo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
