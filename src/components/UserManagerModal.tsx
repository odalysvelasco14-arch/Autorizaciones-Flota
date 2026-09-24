import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Eye, 
  Wrench, 
  FileText, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  Mail, 
  Phone, 
  Building2, 
  AlertCircle, 
  Key, 
  CheckCircle2, 
  HelpCircle,
  LogIn
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/budget';

interface UserManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  onCreateUser: (userData: Partial<UserProfile>) => Promise<void>;
  onUpdateUser: (userId: string, userData: Partial<UserProfile>) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  availableUsers,
  onSelectUser,
  onCreateUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'info'>('list');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for creating a new user
  const [formNombre, setFormNombre] = useState('');
  const [formCorreo, setFormCorreo] = useState('');
  const [formRol, setFormRol] = useState<UserRole>('JRO');
  const [formCargo, setFormCargo] = useState('');
  const [formRegion, setFormRegion] = useState('Región Litoral');
  const [formTaller, setFormTaller] = useState('Talleres Diésel de Guatemala S.A.');
  const [formTelefono, setFormTelefono] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPuedeAutorizar, setFormPuedeAutorizar] = useState(false);

  // Editing state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  if (!isOpen) return null;

  const isCurrentAdmin = currentUser.rol === 'ADMIN';

  const resetForm = () => {
    setFormNombre('');
    setFormCorreo('');
    setFormRol('JRO');
    setFormCargo('');
    setFormRegion('Región Litoral');
    setFormTaller('Talleres Diésel de Guatemala S.A.');
    setFormTelefono('');
    setFormPin('');
    setFormDescripcion('');
    setFormPuedeAutorizar(false);
    setEditingUserId(null);
    setErrorMessage(null);
  };

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormNombre(user.nombre);
    setFormCorreo(user.correo);
    setFormRol(user.rol);
    setFormCargo(user.cargo);
    setFormRegion(user.region || 'Región Litoral');
    setFormTaller(user.tallerNombre || '');
    setFormTelefono(user.telefono || '');
    setFormPin(user.pinAcceso || '');
    setFormDescripcion(user.descripcion);
    setFormPuedeAutorizar(user.puedeAutorizar);
    setActiveTab('create');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formNombre.trim() || !formCorreo.trim()) {
      setErrorMessage('Por favor ingresa nombre y correo electrónico corporativo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<UserProfile> = {
        nombre: formNombre.trim(),
        correo: formCorreo.trim().toLowerCase(),
        rol: formRol,
        cargo: formCargo.trim() || (
          formRol === 'ADMIN' ? 'Coordinador(a) General de Flota' :
          formRol === 'JRO' ? `Jefe Regional de Operaciones (${formRegion})` :
          formRol === 'SOLICITANTE' ? 'Encargado de Taller Outsourcing' :
          'Auditor / Supervisor de Operaciones'
        ),
        region: formRol === 'JRO' ? formRegion : undefined,
        jroId: formRol === 'JRO' 
          ? (formRegion.includes('Litoral') ? 'jro-litoral' : formRegion.includes('Centro Occidente') ? 'jro-centro-occidente' : 'jro-central')
          : undefined,
        tallerNombre: formRol === 'SOLICITANTE' ? formTaller : undefined,
        telefono: formTelefono.trim() || undefined,
        pinAcceso: formPin.trim() || undefined,
        descripcion: formDescripcion.trim() || (
          formRol === 'ADMIN' ? 'Control de flota y autorizaciones de presupuesto.' :
          formRol === 'JRO' ? `Supervisión y Vo.Bo. técnico de ${formRegion}.` :
          formRol === 'SOLICITANTE' ? 'Ingreso de solicitudes y seguimiento de camiones.' :
          'Consulta y reportes de flota.'
        ),
        puedeAutorizar: formRol === 'ADMIN' ? Boolean(formPuedeAutorizar) : false
      };

      if (editingUserId) {
        await onUpdateUser(editingUserId, payload);
        setSuccessMessage(`Usuario "${payload.nombre}" actualizado exitosamente.`);
      } else {
        await onCreateUser(payload);
        setSuccessMessage(`¡Usuario "${payload.nombre}" creado exitosamente! Ya puede ingresar a la aplicación.`);
      }

      resetForm();
      setTimeout(() => {
        setActiveTab('list');
        setSuccessMessage(null);
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al guardar el usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (user: UserProfile) => {
    if (user.id === 'user-odalys') {
      alert('No es posible eliminar a la Coordinadora General y Administradora raíz (Odalys Velasco).');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el usuario "${user.nombre}" (${user.correo})? Esta acción revocará su acceso a la aplicación.`)) {
      return;
    }

    try {
      await onDeleteUser(user.id);
      setSuccessMessage(`Usuario "${user.nombre}" eliminado.`);
      setTimeout(() => setSuccessMessage(null), 2000);
    } catch (err: any) {
      alert('Error al eliminar usuario: ' + (err?.message || 'Error desconocido'));
    }
  };

  const filteredUsers = availableUsers.filter(u => {
    if (roleFilter === 'all') return true;
    return u.rol === roleFilter;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Gestión de Usuarios & Control de Accesos
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/30 text-blue-200 rounded border border-blue-400/30">
                  {availableUsers.length} Usuarios Registrados
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Crea cuentas, asigna roles de aprobación y cambia de sesión para ingresar a la plataforma
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

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 pt-3 border-b border-slate-200 text-xs font-semibold bg-white shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('list'); resetForm(); }}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'list'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuarios del Sistema ({availableUsers.length})</span>
            </button>

            <button
              onClick={() => { resetForm(); setActiveTab('create'); }}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'create'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>{editingUserId ? 'Editar Usuario' : '+ Crear Nuevo Usuario'}</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>¿Cómo Funciona el Ingreso?</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <button
              onClick={() => { resetForm(); setActiveTab('create'); }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Nuevo Usuario</span>
            </button>
          )}
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div className="m-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="m-4 p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: USERS LIST */}
        {activeTab === 'list' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold">Filtrar por rol:</span>
                <div className="flex items-center gap-1">
                  {(['all', 'ADMIN', 'JRO', 'SOLICITANTE', 'AUDITOR'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        roleFilter === role
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {role === 'all' ? 'Todos' : role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Usuario activo actual: <strong className="text-blue-700">{currentUser.nombre}</strong> ({currentUser.rol})
              </div>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 gap-3">
              {filteredUsers.map(user => {
                const isSelected = currentUser.id === user.id;
                const isRoot = user.id === 'user-odalys';

                return (
                  <div
                    key={user.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-500 shadow-2xs ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Avatar / Role Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        user.rol === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : user.rol === 'JRO'
                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                          : user.rol === 'SOLICITANTE'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-slate-100 text-slate-800 border border-slate-300'
                      }`}>
                        {user.rol === 'ADMIN' && <ShieldCheck className="w-5 h-5" />}
                        {user.rol === 'JRO' && <Eye className="w-5 h-5" />}
                        {user.rol === 'SOLICITANTE' && <Wrench className="w-5 h-5" />}
                        {user.rol === 'AUDITOR' && <FileText className="w-5 h-5" />}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{user.nombre}</span>

                          {user.rol === 'ADMIN' && (
                            <span className="px-2 py-0.5 text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                              ADMIN · AUTORIZACIONES EXCLUSIVAS
                            </span>
                          )}
                          {user.rol === 'JRO' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300 rounded-md">
                              JRO · {user.region || 'REGIONAL'}
                            </span>
                          )}
                          {user.rol === 'SOLICITANTE' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 rounded-md">
                              SOLICITANTE · TALLER
                            </span>
                          )}
                          {user.rol === 'AUDITOR' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300 rounded-md">
                              AUDITOR · CONSULTA
                            </span>
                          )}

                          {isRoot && (
                            <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-red-100 text-red-800 border border-red-200 rounded">
                              COORDINADORA PRINCIPAL
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-medium text-slate-600">
                          {user.cargo} {user.tallerNombre ? `· ${user.tallerNombre}` : ''}
                        </p>

                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-2xl">
                          {user.descripcion}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 pt-1 font-mono">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {user.correo}
                          </span>
                          {user.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {user.telefono}
                            </span>
                          )}
                          {user.puedeAutorizar ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ✓ Autorización Final Habilitada
                            </span>
                          ) : (
                            <span className="text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                              {user.rol === 'JRO' ? 'Vo.Bo. Técnico (≥ Q10k)' : 'Sin permiso de autorización'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-2xs">
                          <Check className="w-3.5 h-3.5" />
                          <span>Sesión Activa</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectUser(user);
                            setSuccessMessage(`Sesión cambiada a ${user.nombre}.`);
                            setTimeout(() => setSuccessMessage(null), 2000);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Ingresar como {user.nombre.split(' ')[0]}</span>
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(user)}
                        title="Editar usuario"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button (disabled for Odalys) */}
                      {!isRoot && (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          title="Eliminar usuario"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CREATE / EDIT USER FORM */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl mx-auto w-full">
            <div className="border-b border-slate-200 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>{editingUserId ? 'Modificar Perfil de Usuario' : 'Registrar Nuevo Usuario para Ingreso a la App'}</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Los usuarios registrados podrán ingresar a la aplicación y ver las opciones según su rol.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formNombre}
                  onChange={e => setFormNombre(e.target.value)}
                  placeholder="ej. Ing. Carlos Mendoza"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Correo Electrónico Corporativo *</label>
                <input
                  type="email"
                  required
                  value={formCorreo}
                  onChange={e => setFormCorreo(e.target.value)}
                  placeholder="ej. carlos.mendoza@embotelladora.com.gt"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Role Selector with Explanations */}
            <div className="space-y-2 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Rol en la Plataforma & Privilegios *
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div 
                  onClick={() => {
                    setFormRol('ADMIN');
                    setFormPuedeAutorizar(true);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formRol === 'ADMIN'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-950">ADMIN (Coordinación)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Control total: Configura presupuestos, crea/elimina agencias y emite <strong>autorizaciones finales</strong> de gasto.
                  </p>
                </div>

                <div 
                  onClick={() => {
                    setFormRol('JRO');
                    setFormPuedeAutorizar(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formRol === 'JRO'
                      ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-950">JRO (Jefe Regional)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Supervisa agencias de su región asignada y emite el <strong>Visto Bueno técnico</strong> obligatorio para reparaciones ≥ Q10k.
                  </p>
                </div>

                <div 
                  onClick={() => {
                    setFormRol('SOLICITANTE');
                    setFormPuedeAutorizar(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formRol === 'SOLICITANTE'
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-blue-950">SOLICITANTE (Taller Outsourcing)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Ingresa cotizaciones y solicitudes para camiones de bahías y da seguimiento al estatus de reparación.
                  </p>
                </div>

                <div 
                  onClick={() => {
                    setFormRol('AUDITOR');
                    setFormPuedeAutorizar(false);
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    formRol === 'AUDITOR'
                      ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-950">AUDITOR (Consulta)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Acceso de solo lectura a métricas de flota, reportes ejecutivos e historial presupuestario.
                  </p>
                </div>
              </div>
            </div>

            {/* Conditional Fields based on Role */}
            {formRol === 'JRO' && (
              <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-purple-900 block">
                  Región Operativa Asignada *
                </label>
                <select
                  value={formRegion}
                  onChange={e => setFormRegion(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-purple-300 rounded-lg cursor-pointer"
                >
                  <option value="Región Litoral">Región Litoral & Costa Sur (Cuyotenango, Mazatenango, Retalhuleu, Escuintla)</option>
                  <option value="Región Centro Occidente">Región Centro Occidente (Cunen, Encuentros, Xela, San Marcos, Huehuetenango)</option>
                  <option value="Región Central & Metropolitana">Región Central & Metropolitana (Central, Mixco, Villa Nueva, Chimaltenango, Sacatepéquez)</option>
                  <option value="Región Nororiente">Región Nororiente (Puerto Barrios, Zacapa, Chiquimula)</option>
                </select>
              </div>
            )}

            {formRol === 'SOLICITANTE' && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2">
                <label className="text-xs font-bold text-blue-900 block">
                  Nombre del Taller / Empresa Outsourcing *
                </label>
                <input
                  type="text"
                  value={formTaller}
                  onChange={e => setFormTaller(e.target.value)}
                  placeholder="ej. Talleres Diésel de Guatemala S.A."
                  className="w-full text-xs px-3 py-2 bg-white border border-blue-300 rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Cargo / Puesto</label>
                <input
                  type="text"
                  value={formCargo}
                  onChange={e => setFormCargo(e.target.value)}
                  placeholder="ej. Supervisor de Mantenimiento de Flota"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Teléfono / Celular de Contacto</label>
                <input
                  type="text"
                  value={formTelefono}
                  onChange={e => setFormTelefono(e.target.value)}
                  placeholder="ej. +502 7765-1234"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">PIN / Clave de Acceso Rápido (Opcional)</label>
                <input
                  type="password"
                  value={formPin}
                  onChange={e => setFormPin(e.target.value)}
                  placeholder="ej. 1234"
                  maxLength={8}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <span className="text-[10px] text-slate-400">Permite autenticación rápida en tabletas o terminales de taller.</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Descripción / Notas de Acceso</label>
                <input
                  type="text"
                  value={formDescripcion}
                  onChange={e => setFormDescripcion(e.target.value)}
                  placeholder="ej. Responsable técnico de la zona suroccidental."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Authorization Privilege Checkbox (Admin Only) */}
            {formRol === 'ADMIN' && (
              <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="puedeAutorizarCheckbox"
                  checked={formPuedeAutorizar}
                  onChange={e => setFormPuedeAutorizar(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 rounded border-amber-300 cursor-pointer"
                />
                <label htmlFor="puedeAutorizarCheckbox" className="text-xs text-amber-950 cursor-pointer">
                  <strong>Habilitar permisos de Autorización Presupuestaria Final en la APP</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Permite al usuario presionar el botón de Autorizar/Rechazar y descontar fondos de las agencias.
                  </p>
                </label>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => { resetForm(); setActiveTab('list'); }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmitting ? 'Guardando...' : (editingUserId ? 'Actualizar Usuario' : 'Crear Usuario & Habilitar Ingreso')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: INFO / FAQ ABOUT USER ACCESS */}
        {activeTab === 'info' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
              <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span>¿Se pueden crear usuarios para ingresar a la app?</span>
              </h4>
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>¡Sí, totalmente!</strong> La aplicación cuenta con un módulo de gestión de usuarios y control de acceso basado en roles (<strong>RBAC - Role-Based Access Control</strong>).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center text-xs">1</div>
                  <span>¿Cómo ingresa cada persona?</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Cualquier miembro del equipo registrado (Coordinadora Odalys, JROs Regionales, encargados de talleres outsourcing o auditores) puede seleccionar su cuenta directamente desde el botón de usuario en la barra superior o ingresar sus credenciales para operar la aplicación.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center text-xs">2</div>
                  <span>Permisos y Vistas Diferenciadas</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Cada rol ve exactamente lo que le corresponde:
                  <ul className="list-disc pl-4 mt-1 space-y-1 text-[11px] text-slate-600">
                    <li><strong>Odalys Velasco (ADMIN):</strong> Control total, presupuestos mensuales, creación/eliminación de agencias y autorizaciones exclusivas.</li>
                    <li><strong>JROs (Luis Secaida, Kenneth Muñoz, Fernando Morales):</strong> Ven sus agencias y emiten el Vo.Bo. técnico para pedidos ≥ Q10k.</li>
                    <li><strong>Talleres (Outsourcing):</strong> Registran solicitudes de reparación y suben evidencias.</li>
                  </ul>
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">3</div>
                  <span>Persistencia en el Servidor</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Todos los usuarios que crees se guardan de forma permanente en la base de datos del backend (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono">/api/users</code>), garantizando que no se pierdan al recargar o reiniciar el navegador.
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center text-xs">4</div>
                  <span>Integración Corporativa (Microsoft 365 / Outlook)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Los correos de los usuarios están enlazados con las notificaciones de correo de Outlook y los códigos de folio oficial de autorización (<code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">AUT-FLOTA-GT-XXX</code>).
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => { resetForm(); setActiveTab('create'); }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Crear mi primer usuario adicional ahora</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Sesión guardada en este dispositivo para acceso continuo.
          </span>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
