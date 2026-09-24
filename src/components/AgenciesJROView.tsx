import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Truck, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle,
  Trash2,
  Plus,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { AgenciaInfo, JROInfo, ApprovalRecord, UserProfile } from '../types/budget';
import { formatCurrency } from '../utils/budgetUtils';
import { AGENCIAS_DISPONIBLES, JROS_DISPONIBLES, USUARIOS_DISPONIBLES } from '../data/mockData';

interface AgenciesJROViewProps {
  agencias?: AgenciaInfo[];
  jros?: JROInfo[];
  aprobaciones: ApprovalRecord[];
  currentUser?: UserProfile;
  onOpenNewRepairForAgency: (agencyName: string) => void;
  onOpenBudgetManager?: () => void;
  onDeleteAgency?: (agencyId: string, agencyName: string) => Promise<void> | void;
  onOpenExportExcel?: () => void;
}

export const AgenciesJROView: React.FC<AgenciesJROViewProps> = ({
  agencias = AGENCIAS_DISPONIBLES,
  jros = JROS_DISPONIBLES,
  aprobaciones,
  currentUser = USUARIOS_DISPONIBLES[0],
  onOpenNewRepairForAgency,
  onOpenBudgetManager,
  onDeleteAgency,
  onOpenExportExcel
}) => {
  const activeUser = currentUser || USUARIOS_DISPONIBLES[0];
  const isOdalys = activeUser.rol === 'ADMIN';
  const isJRO = activeUser.rol === 'JRO';

  // Agency to delete confirmation modal state
  const [agencyToDelete, setAgencyToDelete] = useState<AgenciaInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDeleteAgency = async () => {
    if (!agencyToDelete || !onDeleteAgency) return;
    setIsDeleting(true);
    try {
      await onDeleteAgency(agencyToDelete.id, agencyToDelete.nombre);
      setAgencyToDelete(null);
    } catch (err: any) {
      alert('Error al eliminar la agencia: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsDeleting(false);
    }
  };

  const agencyRepairsCount = agencyToDelete 
    ? aprobaciones.filter(r => r.agencia === agencyToDelete.nombre).length
    : 0;
  return (
    <div className="space-y-6 pb-12">
      
      {/* Overview Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Estructura Operativa: {agencias.length} Agencias distribuidas en {jros.length} JROs</span>
            </h2>
            <p className="text-xs text-slate-500">
              Distribución de bebidas carbonatadas y no carbonatadas en la República de Guatemala
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-blue-50 text-blue-800 font-bold border border-blue-200 rounded-lg">
              {agencias.length} Agencias
            </span>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-800 font-bold border border-purple-200 rounded-lg">
              {jros.length} JROs
            </span>
            {onOpenExportExcel && (
              <button
                type="button"
                onClick={onOpenExportExcel}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                title="Exportar presupuesto de agencias y reparaciones a Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Exportar a Excel</span>
              </button>
            )}
            {isOdalys && onOpenBudgetManager && (
              <button
                onClick={onOpenBudgetManager}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Editar Presupuestos & Agencias</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
          <strong className="text-slate-800">Regla de Autorización Regional:</strong> Cuando un taller outsourcing ingresa una reparación para un camión de cualquier agencia con un monto <strong>igual o mayor a Q10,000.00</strong>, la aplicación asigna automáticamente al JRO de la región correspondiente para su aprobación obligatoria vía Outlook o en plataforma.
        </div>
      </div>

      {/* 3 JRO Regional Cards with their respective Agencies */}
      <div className="space-y-6">
        {jros.map(jro => {
          const regionalAgencies = agencias.filter(a => a.jroId === jro.id);
          
          // Calculate regional totals
          const regionalRepairs = aprobaciones.filter(r => {
            const ag = agencias.find(a => a.nombre === r.agencia);
            return ag?.jroId === jro.id;
          });

          const totalAutorizadoQ = regionalRepairs
            .filter(r => r.estado === 'Autorizado')
            .reduce((sum, r) => sum + (r.monto || 0), 0);

          const totalPresupuestoQ = regionalAgencies.reduce((sum, a) => sum + (a.presupuestoMensualQ || 0), 0);
          const pendingJROCount = regionalRepairs.filter(r => r.estado === 'Requiere Vo.Bo. JRO').length;

          return (
            <div 
              key={jro.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* JRO Header Card */}
              <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{jro.nombre}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/30 text-blue-200 rounded border border-blue-400/20">
                        Jefe Regional de Operaciones
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{jro.region}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Mail className="w-3 h-3 text-blue-400" />
                        {jro.correo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {jro.telefono}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto bg-slate-950/60 p-3 rounded-xl border border-slate-700/60 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-400">Presupuesto Regional:</div>
                    <div className="font-mono font-bold text-white text-sm">
                      {formatCurrency(totalPresupuestoQ, 'GTQ')}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-700 mx-1" />
                  <div>
                    <div className="text-[10px] text-slate-400">Autorizado en Mes:</div>
                    <div className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(totalAutorizadoQ, 'GTQ')}
                    </div>
                  </div>
                  {pendingJROCount > 0 && (
                    <>
                      <div className="w-px h-8 bg-slate-700 mx-1" />
                      <div>
                        <div className="text-[10px] text-amber-400 font-bold">Por Aprobar:</div>
                        <div className="font-mono font-bold text-amber-300 text-sm">
                          {pendingJROCount} unidad(es)
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Agencies Grid for this JRO */}
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50">
                {regionalAgencies.map(agency => {
                  const agencyRepairs = aprobaciones.filter(r => r.agencia === agency.nombre);
                  const agencyAutorizadoQ = agencyRepairs
                    .filter(r => r.estado === 'Autorizado')
                    .reduce((sum, r) => sum + (r.monto || 0), 0);
                  const porc = agency.presupuestoMensualQ > 0 ? (agencyAutorizadoQ / agency.presupuestoMensualQ) * 100 : 0;

                  return (
                    <div 
                      key={agency.id}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {agency.id.toUpperCase()}
                          </span>
                        </div>

                        {isOdalys && onDeleteAgency && (
                          <button
                            type="button"
                            onClick={() => setAgencyToDelete(agency)}
                            title={`Eliminar ${agency.nombre}`}
                            className="text-slate-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{agency.nombre}</h4>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Flota de Reparto de Bebidas
                        </div>
                      </div>

                      <div className="space-y-1 pt-1 border-t border-slate-100 text-xs">
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Presupuesto Q:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {formatCurrency(agency.presupuestoMensualQ, 'GTQ')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-[11px]">
                          <span>Ejercido:</span>
                          <span className="font-mono text-slate-700">
                            {formatCurrency(agencyAutorizadoQ, 'GTQ')}
                          </span>
                        </div>

                        {/* Mini progress bar */}
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${porc > 85 ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${Math.min(porc, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          {agencyRepairs.length} solicitudes
                        </span>
                        <button
                          onClick={() => onOpenNewRepairForAgency(agency.nombre)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          + Solicitar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Agency Confirmation Modal */}
      {agencyToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">
                    ¿Eliminar esta Agencia?
                  </h3>
                  <p className="text-xs text-rose-800 font-medium mt-0.5">
                    {agencyToDelete.nombre} ({agencyToDelete.region})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAgencyToDelete(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-white/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Impacto de la eliminación:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800">
                  <li>La agencia será retirada de la supervisión de <strong>{agencyToDelete.jroNombre}</strong>.</li>
                  <li>Se eliminarán sus asignaciones presupuestarias en los 12 meses de 2026.</li>
                  {agencyRepairsCount > 0 && (
                    <li className="font-bold text-rose-700">
                      Esta agencia tiene {agencyRepairsCount} solicitud(es) de reparación registrada(s) en el historial.
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-slate-500">
                Esta acción se sincronizará de inmediato con el servidor y actualizará la matriz presupuestaria general.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAgencyToDelete(null)}
                className="px-3.5 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteAgency}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar Agencia'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
