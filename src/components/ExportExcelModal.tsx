import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  X, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Filter, 
  Layers, 
  Building2, 
  Truck,
  Check
} from 'lucide-react';
import { ApprovalRecord, AgenciaInfo, JROInfo, MonthlyBudgetConfig } from '../types/budget';
import { exportRepairsToExcel } from '../utils/exportToExcel';
import { formatCurrency, formatMonthName } from '../utils/budgetUtils';

interface ExportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRecords: ApprovalRecord[];
  filteredRecords: ApprovalRecord[];
  agencias: AgenciaInfo[];
  jros: JROInfo[];
  budgetConfig?: MonthlyBudgetConfig;
  selectedMonth?: string;
}

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
  isOpen,
  onClose,
  allRecords,
  filteredRecords,
  agencias,
  jros,
  budgetConfig,
  selectedMonth = '2026-09'
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [dataScope, setDataScope] = useState<'all' | 'filtered' | 'authorized' | 'over10k'>('filtered');
  const [includeBudgetSummary, setIncludeBudgetSummary] = useState(true);
  const [includeJROSummary, setIncludeJROSummary] = useState(true);
  const [customFilename, setCustomFilename] = useState(`Control_Flota_Reparaciones_${selectedMonth}_${todayStr}`);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Compute records based on selected scope
  const getExportRecords = (): ApprovalRecord[] => {
    switch (dataScope) {
      case 'filtered':
        return filteredRecords;
      case 'all':
        return allRecords;
      case 'authorized':
        return allRecords.filter(r => r.estado === 'Autorizado');
      case 'over10k':
        return allRecords.filter(r => r.monto >= 10000 || r.requiereVoBoJRO);
      default:
        return filteredRecords;
    }
  };

  const recordsToExport = getExportRecords();
  const totalAmountQ = recordsToExport.reduce((s, r) => s + (r.monto || 0), 0);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const filename = customFilename.trim().endsWith('.xlsx')
        ? customFilename.trim()
        : `${customFilename.trim() || 'Flota_Reparaciones'}.xlsx`;

      exportRepairsToExcel(
        recordsToExport,
        agencias,
        jros,
        budgetConfig,
        {
          filename,
          includeBudgetSummary,
          includeJROSummary,
          selectedMonth
        }
      );

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1400);
    } catch (err) {
      console.error('Error generating Excel file:', err);
      alert('Error al generar la hoja de Excel. Por favor intente de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20 shadow-xs">
              <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Exportar Registros a Excel (.xlsx)
              </h2>
              <p className="text-xs text-emerald-100">
                Genera un libro de Microsoft Excel con formato profesional y resúmenes ejecutivos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-xs text-slate-700">

          {/* Quick Metrics Summary Box */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
            <div className="border-r border-emerald-200/80 pr-2">
              <p className="text-[10px] text-emerald-800 uppercase font-semibold">Registros a Exportar</p>
              <p className="text-lg font-black text-emerald-950 mt-0.5">{recordsToExport.length}</p>
              <p className="text-[10px] text-emerald-700">filas de datos</p>
            </div>
            <div className="border-r border-emerald-200/80 pr-2">
              <p className="text-[10px] text-emerald-800 uppercase font-semibold">Monto Consolidado</p>
              <p className="text-sm font-black text-emerald-950 mt-1 font-mono">
                {formatCurrency(totalAmountQ)}
              </p>
              <p className="text-[10px] text-emerald-700">en Quetzales (GTQ)</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-800 uppercase font-semibold">Hojas en el Libro</p>
              <p className="text-lg font-black text-emerald-950 mt-0.5">
                {1 + (includeBudgetSummary ? 1 : 0) + (includeJROSummary ? 1 : 0)}
              </p>
              <p className="text-[10px] text-emerald-700">pestañas .xlsx</p>
            </div>
          </div>

          {/* Scope Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Selecciona el alcance de los registros:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label 
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  dataScope === 'filtered' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dataScope"
                  value="filtered"
                  checked={dataScope === 'filtered'}
                  onChange={() => setDataScope('filtered')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Filtro Actual de la Tabla</span>
                    <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-mono text-[10px] rounded">
                      {filteredRecords.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Exporta solo los registros que coinciden con tu búsqueda y filtros activos.
                  </p>
                </div>
              </label>

              <label 
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  dataScope === 'all' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dataScope"
                  value="all"
                  checked={dataScope === 'all'}
                  onChange={() => setDataScope('all')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Todos los Registros</span>
                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 font-mono text-[10px] rounded">
                      {allRecords.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Historial completo de reparaciones de todas las 13 agencias sin ningún filtro.
                  </p>
                </div>
              </label>

              <label 
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  dataScope === 'authorized' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dataScope"
                  value="authorized"
                  checked={dataScope === 'authorized'}
                  onChange={() => setDataScope('authorized')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Solo Autorizados</span>
                    <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 font-mono text-[10px] rounded">
                      {allRecords.filter(r => r.estado === 'Autorizado').length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Solo órdenes aprobadas por Odalys Velasco para auditoría y facturación.
                  </p>
                </div>
              </label>

              <label 
                className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all ${
                  dataScope === 'over10k' 
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-2xs' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="dataScope"
                  value="over10k"
                  checked={dataScope === 'over10k'}
                  onChange={() => setDataScope('over10k')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Regla JRO (≥ Q10,000)</span>
                    <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 font-mono text-[10px] rounded">
                      {allRecords.filter(r => r.monto >= 10000 || r.requiereVoBoJRO).length}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Solicitudes de mayor cuantía que requieren o requirieron Visto Bueno del JRO.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Additional Sheets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>2. Pestañas adicionales incluidas en el archivo Excel:</span>
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeBudgetSummary}
                  onChange={e => setIncludeBudgetSummary(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-semibold text-slate-800">
                    Hoja 2: "Resumen Presupuestos" (13 Agencias)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Incluye presupuesto asignado en Quetzales, gasto ejecutado, saldo disponible y % de cumplimiento de cada agencia ({formatMonthName(selectedMonth)}).
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeJROSummary}
                  onChange={e => setIncludeJROSummary(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <div className="flex-1">
                  <span className="font-semibold text-slate-800">
                    Hoja 3: "Resumen JROs" (3 Regiones)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Desglose consolidado por Jefe Regional de Operaciones, agencias bajo su mando, montos autorizados y pendientes de Vo.Bo.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Filename Customization */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>3. Nombre del archivo:</span>
              <span className="text-[11px] text-slate-400 font-mono">Formato .xlsx</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customFilename}
                onChange={e => setCustomFilename(e.target.value)}
                placeholder="Nombre_Del_Archivo"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <span className="px-2 py-2 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-lg">
                .xlsx
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Compatible con Microsoft Excel, Google Sheets y LibreOffice</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting || recordsToExport.length === 0}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                exportSuccess
                  ? 'bg-emerald-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {exportSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>¡Descarga Completada!</span>
                </>
              ) : isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Archivo Excel</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
