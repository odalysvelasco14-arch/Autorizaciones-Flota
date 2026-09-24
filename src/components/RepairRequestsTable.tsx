import React, { useState } from 'react';
import { 
  Truck, 
  Search, 
  Filter, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  Eye, 
  ExternalLink, 
  PlusCircle, 
  Check, 
  AlertTriangle,
  Building2,
  Trash2,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { ApprovalRecord, AgenciaInfo, JROInfo, UserProfile, MonthlyBudgetConfig } from '../types/budget';
import { formatCurrency, formatDateSpanish, formatSimpleDate } from '../utils/budgetUtils';
import { AGENCIAS_DISPONIBLES, JROS_DISPONIBLES, USUARIOS_DISPONIBLES } from '../data/mockData';
import { Lock, ThumbsUp } from 'lucide-react';
import { exportRepairsToExcel } from '../utils/exportToExcel';

interface RepairRequestsTableProps {
  aprobaciones: ApprovalRecord[];
  agencias?: AgenciaInfo[];
  jros?: JROInfo[];
  currentUser?: UserProfile;
  budgetConfig?: MonthlyBudgetConfig;
  selectedMonth?: string;
  onSelectRepair: (repair: ApprovalRecord) => void;
  onOpenNewRepair: () => void;
  onQuickApprove: (repairId: string) => void;
  onDeleteRepair?: (repairId: string) => void;
  onSendSupportEmail: (repairId: string) => void;
  onOpenExportExcel?: () => void;
}

export const RepairRequestsTable: React.FC<RepairRequestsTableProps> = ({
  aprobaciones,
  agencias = AGENCIAS_DISPONIBLES,
  jros = JROS_DISPONIBLES,
  currentUser = USUARIOS_DISPONIBLES[0],
  budgetConfig,
  selectedMonth = '2026-09',
  onSelectRepair,
  onOpenNewRepair,
  onQuickApprove,
  onDeleteRepair,
  onSendSupportEmail,
  onOpenExportExcel
}) => {
  const activeUser = currentUser || USUARIOS_DISPONIBLES[0];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJRO, setSelectedJRO] = useState<string>(activeUser.rol === 'JRO' && activeUser.jroId ? activeUser.jroId : 'todos');
  const [selectedAgency, setSelectedAgency] = useState<string>('todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [onlyOver10k, setOnlyOver10k] = useState(false);
  const [selectedBeverage, setSelectedBeverage] = useState<string>('todos');
  const [isQuickExporting, setIsQuickExporting] = useState(false);
  const [quickExportSuccess, setQuickExportSuccess] = useState(false);

  const isOdalys = activeUser.rol === 'ADMIN' && Boolean(activeUser.puedeAutorizar);
  const isJRO = activeUser.rol === 'JRO';
  const isSolicitante = activeUser.rol === 'SOLICITANTE';

  // Filtered records
  const filtered = aprobaciones.filter(r => {
    // If logged in as JRO, only show repairs from their assigned agencies
    if (isJRO && activeUser.jroId) {
      const ag = agencias.find(a => a.nombre === r.agencia);
      if (ag?.jroId !== activeUser.jroId && r.jroId !== activeUser.jroId) {
        return false;
      }
    }

    // Text search
    const matchesSearch = 
      !searchTerm ||
      r.camionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.placaCamion && r.placaCamion.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.codigoAutorizacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.motivoReparacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.agencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.tallerNombre && r.tallerNombre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Over 10k filter
    if (onlyOver10k && (r.monto < 10000)) return false;

    // JRO filter
    if (selectedJRO !== 'todos') {
      const ag = agencias.find(a => a.nombre === r.agencia);
      if (ag?.jroId !== selectedJRO && r.jroId !== selectedJRO) return false;
    }

    // Agency filter
    if (selectedAgency !== 'todas' && r.agencia !== selectedAgency) return false;

    // Status filter
    if (selectedStatus !== 'todos' && r.estado !== selectedStatus) return false;

    // Beverage filter
    if (selectedBeverage !== 'todos' && r.tipoBebida !== selectedBeverage) return false;

    return true;
  });

  const filteredTotalQ = filtered.reduce((sum, r) => sum + (r.monto || 0), 0);

  const handleQuickDownloadExcel = () => {
    setIsQuickExporting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      exportRepairsToExcel(
        filtered,
        agencias,
        jros,
        budgetConfig,
        {
          filename: `Control_Flota_Reparaciones_${selectedMonth}_${todayStr}.xlsx`,
          includeBudgetSummary: true,
          includeJROSummary: true,
          selectedMonth
        }
      );
      setQuickExportSuccess(true);
      setTimeout(() => setQuickExportSuccess(false), 2200);
    } catch (err) {
      console.error('Error in quick export:', err);
      alert('Error al exportar a Excel. Intente nuevamente.');
    } finally {
      setIsQuickExporting(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      
      {/* Top Controls Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Solicitudes de Reparación de Camiones de Bahías</span>
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 rounded-md">
                {filtered.length} de {aprobaciones.length} registros
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Control de diagnósticos de outsourcing, autorizaciones en Quetzales y Visto Bueno de JROs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
            {/* Export to Excel Buttons */}
            <div className="inline-flex rounded-lg shadow-2xs">
              <button
                type="button"
                onClick={handleQuickDownloadExcel}
                disabled={isQuickExporting || filtered.length === 0}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-l-lg border border-emerald-300 transition-all cursor-pointer ${
                  quickExportSuccess
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Descargar de inmediato la lista visible a hoja de Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{quickExportSuccess ? '¡Descargado!' : 'Exportar a Excel'}</span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 text-[10px] bg-emerald-200/80 text-emerald-900 rounded font-mono font-bold">
                  {filtered.length}
                </span>
              </button>
              {onOpenExportExcel && (
                <button
                  type="button"
                  onClick={onOpenExportExcel}
                  className="px-2.5 py-2 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-y border-r border-emerald-300 rounded-r-lg transition-colors cursor-pointer"
                  title="Opciones avanzadas de exportación a Excel (alcance, filtros, hojas adicionales)"
                >
                  ⚙️
                </button>
              )}
            </div>

            <button
              onClick={onOpenNewRepair}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nueva Solicitud (Outsourcing)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar camión, placa, folio..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter by JRO */}
          <select
            value={selectedJRO}
            onChange={e => setSelectedJRO(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los JROs (3 Regiones)</option>
            {jros.map(j => (
              <option key={j.id} value={j.id}>{j.nombre} ({j.region.split('&')[0].trim()})</option>
            ))}
          </select>

          {/* Filter by Agency (13) */}
          <select
            value={selectedAgency}
            onChange={e => setSelectedAgency(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="todas">Todas las Agencias (13)</option>
            {agencias.map(a => (
              <option key={a.id} value={a.nombre}>{a.nombre}</option>
            ))}
          </select>

          {/* Filter by Status */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos los Estados</option>
            <option value="Requiere Vo.Bo. JRO">⚠️ Requiere Vo.Bo. JRO (≥ Q10k)</option>
            <option value="Pendiente Coordinación">Pendiente Coordinación</option>
            <option value="Autorizado">Autorizado</option>
            <option value="Rechazado">Rechazado</option>
          </select>

          {/* Toggle Button for ≥ Q10,000 Rule */}
          <button
            type="button"
            onClick={() => setOnlyOver10k(!onlyOver10k)}
            className={`w-full px-3 py-2 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              onlyOver10k 
                ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs' 
                : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>{onlyOver10k ? 'Filtro: Solo ≥ Q10k (Activo)' : 'Filtrar Montos ≥ Q10,000'}</span>
          </button>
        </div>

        {/* Results Metrics & Quick Excel Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-600">
              Registros filtrados: <strong className="text-slate-900">{filtered.length}</strong> de {aprobaciones.length}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600">
              Monto total filtrado: <strong className="text-slate-900 font-mono">{formatCurrency(filteredTotalQ)}</strong>
            </span>
            {onlyOver10k && (
              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-md border border-amber-300">
                Filtro ≥ Q10k Activo
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickDownloadExcel}
              disabled={isQuickExporting || filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Descargar inmediatamente a hoja de Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descargar {filtered.length} registros en Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-300 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 w-14 text-center">Foto</th>
                <th className="py-3 px-3">Folio / Fecha</th>
                <th className="py-3 px-3">Camión de Bahías</th>
                <th className="py-3 px-3">Agencia & JRO</th>
                <th className="py-3 px-4">Motivo Reparación</th>
                <th className="py-3 px-3 text-right">Monto (Q)</th>
                <th className="py-3 px-3 text-center">Regla JRO</th>
                <th className="py-3 px-3 text-center">Estado</th>
                <th className="py-3 px-3 text-center">Soporte Outlook</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No se encontraron solicitudes con los filtros aplicados</p>
                    <p className="text-xs text-slate-400 mt-1">Prueba cambiando los criterios de búsqueda o registra una nueva solicitud.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(repair => {
                  const requiereJRO = repair.monto >= 10000;

                  return (
                    <tr 
                      key={repair.id}
                      className="hover:bg-blue-50/40 transition-colors"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-2.5 px-3 text-center">
                        {repair.imagenEvidenciaUrl ? (
                          <div 
                            onClick={() => onSelectRepair(repair)}
                            className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 shadow-2xs cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                            title="Haga clic para ver fotografía y expediente"
                          >
                            <img 
                              src={repair.imagenEvidenciaUrl} 
                              alt={repair.camionId} 
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-[10px]">
                            <Truck className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Folio & Date */}
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-slate-900">{repair.codigoAutorizacion}</div>
                        <div className="text-[10px] text-slate-400">{formatSimpleDate(repair.fechaSolicitud)}</div>
                      </td>

                      {/* Camión ID, Bahías & Tipo de Bebida */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-700">{repair.camionId}</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded font-medium">
                            {repair.cantidadBahias} Bahías
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Placa: <strong>{repair.placaCamion || 'C-482BKX'}</strong> · {repair.tipoBebida || 'Carbonatadas'}
                        </div>
                      </td>

                      {/* Agencia & JRO */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800">{repair.agencia}</div>
                        <div className="text-[10px] text-blue-700 font-medium flex items-center gap-1">
                          <span>JRO: {repair.jroNombre}</span>
                        </div>
                      </td>

                      {/* Motivo Reparación */}
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="text-[11px] text-slate-800 font-medium truncate" title={repair.motivoReparacion}>
                          {repair.motivoReparacion}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {repair.categoriaReparacion} · {repair.tallerNombre}
                        </div>
                      </td>

                      {/* Monto en Quetzales */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {formatCurrency(repair.monto, 'GTQ')}
                        </div>
                      </td>

                      {/* Regla JRO Badge */}
                      <td className="py-2.5 px-3 text-center">
                        {requiereJRO ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Vo.Bo. JRO</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 rounded-full">
                            <span>Coordinación</span>
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3 text-center">
                        {repair.estado === 'Autorizado' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Autorizado</span>
                          </span>
                        )}
                        {repair.estado === 'Requiere Vo.Bo. JRO' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full animate-pulse">
                            <Clock className="w-3 h-3" />
                            <span>Pend. JRO</span>
                          </span>
                        )}
                        {repair.estado === 'Pendiente Coordinación' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 rounded-full">
                            <Clock className="w-3 h-3" />
                            <span>Pend. Coord.</span>
                          </span>
                        )}
                        {repair.estado === 'Rechazado' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 rounded-full">
                            <XCircle className="w-3 h-3" />
                            <span>Rechazado</span>
                          </span>
                        )}
                      </td>

                      {/* Soporte Outlook */}
                      <td className="py-2.5 px-3 text-center">
                        {repair.correoSoporteEnviado ? (
                          <span 
                            title="Soporte enviado a Outlook" 
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Enviado</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => onSendSupportEmail(repair.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                            title="Disparar soporte a Outlook"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Enviar</span>
                          </button>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectRepair(repair)}
                            className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Ver expediente completo"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {repair.estado !== 'Autorizado' && (
                            <button
                              onClick={() => onQuickApprove(repair.id)}
                              className="p-1 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 transition-colors cursor-pointer"
                              title={requiereJRO ? 'Aprobar como JRO' : 'Autorizar como Coordinadora'}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {isOdalys && onDeleteRepair && (
                            <button
                              onClick={() => onDeleteRepair(repair.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar registro (Exclusivo Coordinadora)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
                <tr>
                  <td colSpan={5} className="py-3 px-4 text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Total Acumulado ({filtered.length} solicitudes mostradas):</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({filtered.filter(r => r.estado === 'Autorizado').length} autorizadas, {filtered.filter(r => r.monto >= 10000).length} con regla JRO)
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-900 text-sm">
                    {formatCurrency(filteredTotalQ)}
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-center text-slate-500 text-[11px] font-normal">
                    Valores expresados en Quetzales guatemaltecos (GTQ)
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={handleQuickDownloadExcel}
                      disabled={isQuickExporting}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200 px-2.5 py-1 rounded-md border border-emerald-300 transition-colors cursor-pointer"
                      title="Exportar esta vista a Excel"
                    >
                      <Download className="w-3 h-3" />
                      <span>.xlsx</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
