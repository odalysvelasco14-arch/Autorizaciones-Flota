import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserCheck, 
  Users, 
  X, 
  Lock, 
  Check, 
  Building2, 
  Wrench, 
  Eye,
  CheckCircle2,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { UserProfile } from '../types/budget';

interface UserSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onOpenUserManager?: () => void;
}

export const UserSwitcherModal: React.FC<UserSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableUsers,
  onSelectUser,
  onOpenUserManager
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Selección de Usuario & Control de Roles</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/30 text-blue-200 rounded border border-blue-400/20">
                  Seguridad RBAC
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cambia de perfil para verificar los permisos y vistas diferenciadas
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

        {/* Security Rule Card */}
        <div className="p-4 bg-amber-50/80 border-b border-amber-200/70 text-xs text-amber-900 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-950">
              Regla de Autorizaciones Exclusivas:
            </p>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              En la aplicación, <strong>únicamente Odalys Velasco (Administradora / Coordinadora de Flota)</strong> tiene 
              el permiso de emitir la <strong>autorización final</strong> y liberar el presupuesto para reparaciones. 
              Los <strong>JROs</strong> visualizan exclusivamente su región asignada y emiten <em>Visto Bueno técnico (Vo.Bo.)</em> para solicitudes ≥ Q10,000, 
              mientras que los <strong>Solicitantes</strong> ingresan y dan seguimiento a sus pedidos sin permisos de aprobación.
            </p>
          </div>
        </div>

        {/* Users List */}
        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Perfiles Disponibles en el Sistema:
          </p>

          <div className="grid grid-cols-1 gap-3">
            {availableUsers.map(user => {
              const isSelected = currentUser.id === user.id;

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Role Icon */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      user.rol === 'ADMIN'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : user.rol === 'JRO'
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      {user.rol === 'ADMIN' && <ShieldCheck className="w-5 h-5" />}
                      {user.rol === 'JRO' && <Eye className="w-5 h-5" />}
                      {user.rol === 'SOLICITANTE' && <Wrench className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{user.nombre}</span>
                        
                        {user.rol === 'ADMIN' && (
                          <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                            ADMIN · AUTORIZACIONES EXCLUSIVAS
                          </span>
                        )}
                        {user.rol === 'JRO' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 rounded-md">
                            JRO · VISTA REGIONAL
                          </span>
                        )}
                        {user.rol === 'SOLICITANTE' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 rounded-md">
                            SOLICITANTE · TALLER OUTSOURCING
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-slate-600">
                        {user.cargo} {user.region ? `· ${user.region}` : ''}
                      </p>

                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {user.descripcion}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-0.5 font-mono">
                        <span>{user.correo}</span>
                        {user.puedeAutorizar ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            ✓ Puede Autorizar en APP
                          </span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            ✕ Sin permiso de Autorización
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center self-end sm:self-center shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                        <Check className="w-4 h-4" />
                        <span>Activo</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        Cambiar a este usuario
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>La sesión seleccionada se mantendrá en tu navegador.</span>
            {onOpenUserManager && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUserManager();
                }}
                className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Crear o Gestionar Usuarios</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
