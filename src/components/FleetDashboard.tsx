import React from 'react';
import { 
  Truck, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Users, 
  ArrowUpRight, 
  PlusCircle, 
  Mail, 
  Zap,
  TrendingUp,
  Percent,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import { ApprovalRecord, MonthlyBudgetConfig, AgenciaInfo, JROInfo, UserProfile } from '../types/budget';
import { formatCurrency, formatCompactCurrency, calculateFleetStats, formatMonthName } from '../utils/budgetUtils';
import { BudgetVsExpenseBarChart } from './BudgetVsExpenseBarChart';
import { USUARIOS_DISPONIBLES } from '../data/mockData';

const bayTruckImg = '/assets/images/bay_delivery_truck_1790190627617.jpg';

interface FleetDashboardProps {
  aprobaciones: ApprovalRecord[];
  config: MonthlyBudgetConfig;
  selectedMonth: string;
  agencias: AgenciaInfo[];
  jros: JROInfo[];
  currentUser?: UserProfile;
  onOpenNewRepair: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectRepair: (repair: ApprovalRecord) => void;
  onSyncOutlook: () => void;
  isSyncingOutlook: boolean;
  onOpenBudgetManager?: () => void;
  onOpenExportExcel?: () => void;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({
  aprobaciones,
  config,
  selectedMonth,
  agencias,
  jros,
  currentUser = USUARIOS_DISPONIBLES[0],
  onOpenNewRepair,
  onNavigateToTab,
  onSelectRepair,
  onSyncOutlook,
  isSyncingOutlook,
  onOpenBudgetManager,
  onOpenExportExcel
}) => {
  const activeUser = currentUser || USUARIOS_DISPONIBLES[0];
  const isJRO = activeUser.rol === 'JRO';
  const isOdalys = activeUser.rol === 'ADMIN';
  const isSolicitante = activeUser.rol === 'SOLICITANTE';

  const filterJroId = isJRO ? activeUser.jroId : undefined;
  const stats = calculateFleetStats(aprobaciones, config, selectedMonth, agencias, filterJroId);

  // Filter requests that require JRO approval and are still pending
  const pendingJRORequests = aprobaciones.filter(r => {
    if (r.estado !== 'Requiere Vo.Bo. JRO') return false;
    if (isJRO && activeUser.jroId) {
      const ag = agencias.find(a => a.nombre === r.agencia);
      return ag?.jroId === activeUser.jroId || r.jroId === activeUser.jroId;
    }
    return true;
  });

  // Breakdown by JRO
  const jroBreakdown = jros.map(jro => {
    const repairsInRegion = aprobaciones.filter(r => {
      const ag = agencias.find(a => a.nombre === r.agencia);
      return ag?.jroId === jro.id && r.estado === 'Autorizado';
    });
    const totalQ = repairsInRegion.reduce((sum, r) => sum + (r.monto || 0), 0);
    const pendingJROInRegion = aprobaciones.filter(r => {
      const ag = agencias.find(a => a.nombre === r.agencia);
      return ag?.jroId === jro.id && r.estado === 'Requiere Vo.Bo. JRO';
    });

    return {
      jro,
      totalAutorizadoQ: totalQ,
      conteoAutorizadas: repairsInRegion.length,
      pendientesJRO: pendingJROInRegion.length
    };
  });

  // Beverage distribution stats
  const carbonatadasCount = aprobaciones.filter(r => r.tipoBebida === 'Carbonatadas').length;
  const noCarbonatadasCount = aprobaciones.filter(r => r.tipoBebida === 'No Carbonatadas').length;
  const mixtoCount = aprobaciones.filter(r => r.tipoBebida === 'Mixto').length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner: Coordinator Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full opacity-15 pointer-events-none hidden lg:block">
          <img src={bayTruckImg} alt="Flota" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full">
            <Truck className="w-3.5 h-3.5" />
            <span>Distribución de Bebidas Carbonatadas & No Carbonatadas</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Control de Reparaciones de Flota · {formatMonthName(selectedMonth)}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isOdalys && (
              <span>
                Panel de Coordinación de Flota. Tienes control de las agencias, asignación de JROs, edición de presupuestos y <strong>autorización exclusiva de gastos en la app</strong>.
              </span>
            )}
            {isJRO && (
              <span>
                Vista regional de {activeUser.nombre} ({activeUser.region}). Supervisión técnica y emisión de Vo.Bo. para reparaciones ≥ Q10,000 en tus agencias asignadas.
              </span>
            )}
            {isSolicitante && (
              <span>
                Portal para talleres de outsourcing. Emisión de solicitudes y seguimiento de autorizaciones presupuestarias.
              </span>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={onOpenNewRepair}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Reparación (Outsourcing)</span>
            </button>

            {isOdalys && onOpenBudgetManager && (
              <button
                onClick={onOpenBudgetManager}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer"
              >
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Configurar Presupuestos ({formatMonthName(selectedMonth)})</span>
              </button>
            )}

            {onOpenExportExcel && (
              <button
                onClick={onOpenExportExcel}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-emerald-200 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 rounded-lg transition-colors cursor-pointer shadow-2xs"
                title="Exportar todos los registros y hojas de control a Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Exportar a Excel (.xlsx)</span>
              </button>
            )}

            <button
              onClick={onSyncOutlook}
              disabled={isSyncingOutlook}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isSyncingOutlook ? 'animate-spin' : ''}`} />
              <span>{isSyncingOutlook ? 'Escanenado Outlook...' : 'Escanear Correos Outlook'}</span>
            </button>

            <button
              onClick={() => onNavigateToTab('agencies')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ver las 13 Agencias & 3 JROs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical JRO Pending Alert Banner */}
      {pendingJRORequests.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>{pendingJRORequests.length} Solicitud(es) en Espera de Visto Bueno JRO (≥ Q10,000)</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-200 text-amber-900 rounded-full">
                    {formatCurrency(stats.totalPendienteJROQ, 'GTQ')} en revisión
                  </span>
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Estas unidades no pueden ser reparadas por el outsourcing hasta contar con la autorización formal del Jefe Regional de Operaciones.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('repairs')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-xs"
            >
              <span>Revisar y Dar Vo.Bo.</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick list preview of pending JRO trucks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-3 border-t border-amber-200/80">
            {pendingJRORequests.slice(0, 3).map(req => (
              <div
                key={req.id}
                onClick={() => onSelectRepair(req)}
                className="p-3 bg-white rounded-xl border border-amber-200 hover:border-amber-400 cursor-pointer transition-all shadow-2xs flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs">{req.camionId}</span>
                    <span className="text-[10px] text-slate-500">({req.cantidadBahias} Bahías)</span>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate max-w-[180px]">{req.agencia}</div>
                  <div className="text-[10px] text-amber-800 font-medium">JRO: {req.jroNombre}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-amber-700 text-xs">{formatCurrency(req.monto, 'GTQ')}</div>
                  <span className="text-[10px] text-blue-600 underline">Ver Ficha</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards in Quetzales (Q) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Presupuesto Mensual de Flota */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Presupuesto Mensual Flota</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(stats.presupuestoAsignadoQ, 'GTQ')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>13 Agencias distribuidoras</span>
            <span className="text-blue-600 font-medium font-mono">Septiembre 2026</span>
          </div>
        </div>

        {/* Card 2: Total Autorizado en Reparaciones */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Autorizado en Reparaciones</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(stats.totalAutorizadoQ, 'GTQ')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>{stats.conteoAutorizadas} reparaciones liberadas</span>
            <span className="font-bold text-slate-700 font-mono">
              {stats.porcentajeConsumido.toFixed(1)}% consumido
            </span>
          </div>
        </div>

        {/* Card 3: Saldo Disponible */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Presupuesto Disponible</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${
            stats.disponibleQ < 0 ? 'text-rose-600' : 'text-emerald-700'
          }`}>
            {formatCurrency(stats.disponibleQ, 'GTQ')}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Para mantenimiento de mes</span>
            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
              stats.status === 'normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {stats.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Card 4: Camiones de Bahías Atendidos */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Camiones de Bahías</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {stats.totalCamionesAtendidos} Unidades
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>{carbonatadasCount} Carbonatadas</span>
            <span>{noCarbonatadasCount} No Carb.</span>
          </div>
        </div>
      </div>

      {/* Progress Bar of Monthly Budget */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800">
            Consumo Presupuestario de Flota: {stats.porcentajeConsumido.toFixed(1)}%
          </span>
          <span className="text-slate-500 font-mono">
            {formatCurrency(stats.totalAutorizadoQ, 'GTQ')} de {formatCurrency(stats.presupuestoAsignadoQ, 'GTQ')}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className={`h-full transition-all ${
              stats.porcentajeConsumido > 90 ? 'bg-rose-500' : stats.porcentajeConsumido > 75 ? 'bg-amber-500' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(stats.porcentajeConsumido, 100)}%` }}
          />
        </div>
      </div>

      {/* Bar Chart: Presupuesto Asignado vs Gasto Realizado Acumulado */}
      <BudgetVsExpenseBarChart
        selectedMonth={selectedMonth}
        presupuestoAsignadoTotal={stats.presupuestoAsignadoQ}
        gastoRealizadoAcumuladoTotal={stats.totalAutorizadoQ}
        agenciasResumen={stats.agenciasResumen}
        jros={jros}
        agencias={agencias}
      />

      {/* Two Column Layout: JRO Regional Performance & 13 Agencies Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 1/3: 3 JRO Regions Overview */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Supervisión por los 3 JROs</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Regiones</span>
          </div>

          <div className="space-y-3">
            {jroBreakdown.map(({ jro, totalAutorizadoQ, conteoAutorizadas, pendientesJRO }) => (
              <div 
                key={jro.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{jro.nombre}</div>
                    <div className="text-[10px] text-slate-500">{jro.region}</div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 rounded">
                    {jro.agenciasAsignadas.length} Agencias
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500 text-[11px]">Total Autorizado:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(totalAutorizadoQ, 'GTQ')}</span>
                </div>

                {pendientesJRO > 0 && (
                  <div className="px-2 py-1 bg-amber-100 border border-amber-200 rounded text-[10px] font-bold text-amber-900 flex items-center justify-between">
                    <span>Requiere su Vo.Bo. (≥ Q10k):</span>
                    <span>{pendientesJRO} unidad(es)</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
            <strong>📧 Notificaciones Automáticas:</strong>
            <p className="text-blue-800 text-[10px]">
              Al ingresar una reparación de Q10,000 o más, el sistema genera de inmediato el correo con copia al JRO de la región y a la Coordinación.
            </p>
          </div>
        </div>

        {/* Right 2/3: 13 Agencies Breakdown Table */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Desglose por las 13 Agencias Distribuidoras</span>
              </h3>
              <p className="text-xs text-slate-500">
                Presupuesto asignado y consumo en Quetzales para camiones de bahías
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('repairs')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-start sm:self-auto cursor-pointer"
            >
              Ver todas las reparaciones →
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Agencia</th>
                  <th className="py-2.5 px-2">JRO Asignado</th>
                  <th className="py-2.5 px-2 text-right">Presupuesto Q</th>
                  <th className="py-2.5 px-2 text-right">Autorizado Q</th>
                  <th className="py-2.5 px-3 text-right">% Uso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.agenciasResumen.map(ag => (
                  <tr key={ag.agencia} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{ag.agencia}</div>
                      <div className="text-[10px] text-slate-400">{ag.region}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-600 text-[11px]">
                      {ag.jroNombre}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                      {formatCurrency(ag.asignadoQ, 'GTQ')}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(ag.autorizadoQ, 'GTQ')}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        ag.porcentaje > 90 
                          ? 'bg-rose-100 text-rose-800' 
                          : ag.porcentaje > 60 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {ag.porcentaje.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
