import React from 'react';
import { 
  Truck, 
  Mail, 
  Building2, 
  Calendar, 
  PlusCircle, 
  Layers, 
  DollarSign, 
  Eye, 
  Wrench, 
  ChevronDown,
  Users,
  UserPlus,
  FileSpreadsheet,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types/budget';
import { USUARIOS_DISPONIBLES } from '../data/mockData';

interface FleetHeaderProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenNewModal: () => void;
  outlookConnected?: boolean;
  pendingJROCount: number;
  currentUser?: UserProfile;
  userCount?: number;
  onOpenUserSwitcher?: () => void;
  onOpenBudgetManager?: () => void;
  onOpenUserManager?: () => void;
  onOpenExportExcel?: () => void;
  onLogout?: () => void;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
}

export const FleetHeader: React.FC<FleetHeaderProps> = ({
  currentTab,
  onTabChange,
  onOpenNewModal,
  outlookConnected = true,
  pendingJROCount = 0,
  currentUser = USUARIOS_DISPONIBLES[0],
  userCount = 5,
  onOpenUserSwitcher,
  onOpenBudgetManager,
  onOpenUserManager,
  onOpenExportExcel,
  onLogout,
  selectedMonth = '2026-09',
  onSelectMonth
}) => {
  const activeUser = currentUser || USUARIOS_DISPONIBLES[0];
  const isOdalys = activeUser.rol === 'ADMIN' && Boolean(activeUser.puedeAutorizar);
  const isJRO = activeUser.rol === 'JRO';
  const isSolicitante = activeUser.rol === 'SOLICITANTE';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Coordinación de Flota · Distribución de Bebidas (Carbonatadas & No Carbonatadas)
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-400">
            13 Agencias · 3 Jefaturas Regionales de Operaciones (JRO)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Month Selector */}
          {onSelectMonth ? (
            <div className="flex items-center gap-1 text-[11px] text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <select
                value={selectedMonth}
                onChange={e => onSelectMonth(e.target.value)}
                className="bg-slate-800 text-white font-medium text-[11px] px-2 py-0.5 rounded border border-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="2026-07">Julio 2026</option>
                <option value="2026-08">Agosto 2026</option>
                <option value="2026-09">Septiembre 2026</option>
                <option value="2026-10">Octubre 2026</option>
                <option value="2026-11">Noviembre 2026</option>
                <option value="2026-12">Diciembre 2026</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Septiembre 2026</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Moneda: Quetzales (GTQ / Q)</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Outlook 365 Conectado</span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* App Branding & Role Info */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Truck className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  Control de Flota & Reparaciones de Bahías
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-md">
                  Guatemala
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                <span>Coordinadora General: <strong>Odalys Velasco</strong></span>
                <span className="text-slate-300">•</span>
                <span>Autorización Exclusiva Odalys · Visto Bueno JRO (≥ Q10,000)</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-auto">
            {/* User Session Pill & Switcher Button */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenUserSwitcher}
                title="Haz clic para cambiar entre Odalys (Admin), JROs Regionales o Solicitante"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs cursor-pointer ${
                  isOdalys 
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950 hover:bg-amber-100' 
                    : isJRO 
                      ? 'bg-purple-50/90 border-purple-300 text-purple-950 hover:bg-purple-100' 
                      : 'bg-blue-50/90 border-blue-300 text-blue-950 hover:bg-blue-100'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-lg text-white font-bold text-[11px] shadow-2xs ${
                  isOdalys ? 'bg-amber-600' : isJRO ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {isOdalys ? 'OV' : isJRO ? 'JRO' : 'SOL'}
                </div>

                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    <span>{activeUser.nombre}</span>
                    {isOdalys && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-amber-200 text-amber-900 rounded border border-amber-400">
                        ADMIN
                      </span>
                    )}
                    {isJRO && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-purple-200 text-purple-900 rounded border border-purple-400">
                        JRO
                      </span>
                    )}
                    {isSolicitante && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-blue-200 text-blue-900 rounded border border-blue-400">
                        TALLER
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <span>{isOdalys ? 'Control Total & Autorizaciones' : isJRO ? (activeUser.region || 'Regional') : 'Solicitante'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Cerrar sesión (Volver a la pantalla de ingreso)"
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-slate-500 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400 hover:text-red-600" />
                  <span className="hidden xl:inline text-[11px]">Salir</span>
                </button>
              )}
            </div>

            {/* Budget & Agency Manager Button (Available to Admin Odalys) */}
            {onOpenBudgetManager && (
              <button
                onClick={onOpenBudgetManager}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer shadow-2xs ${
                  isOdalys
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
                    : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Presupuestos & Agencias</span>
              </button>
            )}

            {/* User Manager Button */}
            {onOpenUserManager && (
              <button
                onClick={onOpenUserManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
                title="Crear usuarios, configurar roles y permisos de acceso"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Usuarios</span>
                <span className="px-1.5 py-0.2 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  {userCount}
                </span>
              </button>
            )}

            {/* Export to Excel Button */}
            {onOpenExportExcel && (
              <button
                onClick={onOpenExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors cursor-pointer shadow-2xs"
                title="Exportar todos los registros y resúmenes a hoja de Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Exportar Excel</span>
              </button>
            )}

            {/* Register New Repair (Outsourcing) */}
            <button
              onClick={onOpenNewModal}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Reparación</span>
            </button>
          </div>
        </div>

        {/* Role Warning / Context Banner */}
        {isJRO && (
          <div className="mt-2.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span>
                <strong>Modo Jefe Regional (JRO):</strong> Visualizando información de <strong>{activeUser.region}</strong>. Tienes facultad para otorgar el <em>Visto Bueno Técnico</em> (solicitudes ≥ Q10,000). La autorización final presupuestaria la realiza Odalys Velasco.
              </span>
            </span>
            <button
              onClick={onOpenUserSwitcher}
              className="text-purple-700 hover:underline font-bold text-[10px] ml-2 shrink-0 cursor-pointer"
            >
              Cambiar usuario
            </button>
          </div>
        )}

        {isSolicitante && (
          <div className="mt-2.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                <strong>Modo Taller Solicitante (Outsourcing):</strong> Registra las necesidades de reparación para los camiones de bahías y da seguimiento a la aprobación de la Coordinadora.
              </span>
            </span>
            <button
              onClick={onOpenUserSwitcher}
              className="text-blue-700 hover:underline font-bold text-[10px] ml-2 shrink-0 cursor-pointer"
            >
              Cambiar usuario
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 mt-3 -mb-3.5 overflow-x-auto border-t border-slate-100 pt-2 text-xs font-medium text-slate-600">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'dashboard'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tablero de Flota</span>
          </button>

          <button
            onClick={() => onTabChange('repairs')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer relative ${
              currentTab === 'repairs'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Solicitudes & Aprobaciones</span>
            {pendingJROCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-300 rounded-full animate-pulse">
                {pendingJROCount} Vo.Bo. JRO
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('agencies')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'agencies'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Agencias & JROs</span>
          </button>

          <button
            onClick={() => onTabChange('users')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'users'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gestión de Usuarios</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold text-slate-700 bg-slate-100 rounded-full">
              {userCount}
            </span>
          </button>

          <button
            onClick={() => onTabChange('outlook')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              currentTab === 'outlook'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            <span>Conexión Outlook & Soporte</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
