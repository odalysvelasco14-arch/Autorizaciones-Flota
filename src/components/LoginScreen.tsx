import React, { useState } from 'react';
import { 
  Truck, 
  Lock, 
  ShieldCheck, 
  Eye, 
  Wrench, 
  ChevronRight, 
  LogIn, 
  Key, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Users
} from 'lucide-react';
import { UserProfile } from '../types/budget';

interface LoginScreenProps {
  availableUsers: UserProfile[];
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  availableUsers,
  onLogin
}) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'email'>('cards');
  
  // Selected user in cards mode
  const [selectedUserId, setSelectedUserId] = useState<string>(availableUsers[0]?.id || 'user-odalys');
  const [pinInput, setPinInput] = useState<string>('');
  const [showPinHelp, setShowPinHelp] = useState<boolean>(true);

  // Email login mode
  const [emailInput, setEmailInput] = useState<string>('');
  const [emailPinInput, setEmailPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedUser = availableUsers.find(u => u.id === selectedUserId) || availableUsers[0];

  const handleCardLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!selectedUser) return;

    // If PIN is configured, check if provided (allow bypassing with blank or matching)
    if (selectedUser.pinAcceso && pinInput.trim()) {
      if (pinInput.trim() !== selectedUser.pinAcceso) {
        setErrorMsg(`El PIN ingresado es incorrecto para ${selectedUser.nombre}. El PIN sugerido es: ${selectedUser.pinAcceso}`);
        return;
      }
    }

    onLogin(selectedUser);
  };

  const handleQuickLogin = (user: UserProfile) => {
    onLogin(user);
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Por favor ingresa tu correo electrónico corporativo.');
      return;
    }

    const matchedUser = availableUsers.find(u => u.correo.toLowerCase() === cleanEmail);
    if (!matchedUser) {
      setErrorMsg(`No se encontró ningún usuario registrado con el correo "${cleanEmail}". Revisa la lista de perfiles o contacta a Odalys Velasco.`);
      return;
    }

    if (matchedUser.pinAcceso && emailPinInput.trim()) {
      if (emailPinInput.trim() !== matchedUser.pinAcceso) {
        setErrorMsg(`PIN incorrecto para ${matchedUser.nombre}. (PIN de acceso: ${matchedUser.pinAcceso})`);
        return;
      }
    }

    onLogin(matchedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-600 rounded-full blur-[150px]" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600 rounded-full blur-[160px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      {/* Top Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              Control de Flota & Reparaciones de Bahías
            </h1>
            <p className="text-[11px] text-slate-400">
              Distribución de Bebidas · 13 Agencias Guatemala
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
            Moneda: GTQ (Q)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sistema en Línea
          </span>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
        {/* Hero Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-semibold mb-4">
          <Shield className="w-3.5 h-3.5" />
          <span>Acceso Seguro Basado en Roles (RBAC)</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-white text-center tracking-tight">
          Iniciar Sesión en la Plataforma
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 text-center max-w-xl mt-2 mb-8">
          Selecciona tu cuenta o ingresa con tu correo corporativo para acceder a tu panel de autorizaciones, vistas regionales y presupuestos de flota.
        </p>

        {/* Login Box */}
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab('cards');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'cards'
                  ? 'text-white border-b-2 border-blue-500 bg-slate-900/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Users className="w-4 h-4 text-blue-400" />
              <span>Selección Rápida de Perfil Corporativo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'text-white border-b-2 border-blue-500 bg-slate-900/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Ingreso con Correo & PIN</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="m-4 p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-xs text-red-200 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p>{errorMsg}</p>
            </div>
          )}

          {/* TAB 1: User Cards Selection */}
          {activeTab === 'cards' && (
            <div className="p-5 sm:p-6 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                  <span>Selecciona tu Usuario:</span>
                  <span className="text-[11px] text-blue-400 font-normal">
                    {availableUsers.length} cuentas registradas
                  </span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
                  {availableUsers.map((user) => {
                    const isSelected = selectedUser?.id === user.id;
                    const isOdalys = user.rol === 'ADMIN' && Boolean(user.puedeAutorizar);
                    const isJRO = user.rol === 'JRO';
                    const isSolicitante = user.rol === 'SOLICITANTE';

                    return (
                      <div
                        key={user.id}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setPinInput(user.pinAcceso || '');
                          setErrorMsg(null);
                        }}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Role Icon */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                            isOdalys 
                              ? 'bg-amber-600 border border-amber-400/40' 
                              : isJRO 
                              ? 'bg-purple-600 border border-purple-400/40' 
                              : 'bg-blue-600 border border-blue-400/40'
                          }`}>
                            {isOdalys && <ShieldCheck className="w-5 h-5" />}
                            {isJRO && <Eye className="w-5 h-5" />}
                            {isSolicitante && <Wrench className="w-5 h-5" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-white truncate">
                                {user.nombre}
                              </span>
                              {isOdalys && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
                                  ADMIN
                                </span>
                              )}
                              {isJRO && (
                                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
                                  JRO
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                              {user.cargo}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate font-mono">
                              {user.correo}
                            </p>
                          </div>
                        </div>

                        {/* Badges / Permission */}
                        <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between text-[10px]">
                          {user.puedeAutorizar ? (
                            <span className="text-amber-400 font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Autorizaciones Exclusivas
                            </span>
                          ) : isJRO ? (
                            <span className="text-purple-400 font-semibold flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Vo.Bo. Técnico Regional
                            </span>
                          ) : (
                            <span className="text-blue-400 flex items-center gap-1">
                              <Wrench className="w-3 h-3" />
                              Solicitudes de Taller
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickLogin(user);
                            }}
                            className="px-2 py-0.5 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Entrar Rápido →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected User Action Box */}
              {selectedUser && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Usuario seleccionado:</span>
                      <strong className="text-xs sm:text-sm text-white font-bold">{selectedUser.nombre}</strong>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        PIN: {selectedUser.pinAcceso || '1234'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {selectedUser.descripcion}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCardLogin()}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Ingresar al Sistema</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Email & PIN */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailLogin} className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Correo Electrónico Corporativo
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="ej. OdalysVelasco14@gmail.com o luis.secaida@embotelladora.com.gt"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    PIN de Seguridad
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Por defecto: 2026 (Admin), 1001-1004 (JROs y Talleres)
                  </span>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    value={emailPinInput}
                    onChange={e => setEmailPinInput(e.target.value)}
                    placeholder="Ingresa tu PIN de 4 dígitos"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="pt-2">
                <p className="text-[11px] text-slate-400 mb-2">Correos sugeridos para pruebas rápidas:</p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {availableUsers.slice(0, 4).map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setEmailInput(u.correo);
                        setEmailPinInput(u.pinAcceso || '1234');
                      }}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors cursor-pointer border border-slate-700"
                    >
                      {u.correo} (PIN: {u.pinAcceso})
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer mt-4"
              >
                <LogIn className="w-4 h-4" />
                <span>Verificar Credenciales & Entrar</span>
              </button>
            </form>
          )}

          {/* Security & Roles Rule Banner */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-start gap-3 text-[11px] text-slate-400">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Políticas de Control de Acceso: </strong>
              Únicamente <strong>Odalys Velasco</strong> posee permisos administrativos para autorizaciones finales y liberación de fondos. 
              Los <strong>JROs</strong> tienen acceso exclusivo a las agencias de su región para revisión y emisión de Vo.Bo. en montos ≥ Q10,000.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>
          Sistema de Presupuesto & Autorizaciones de Flota · Distribución Guatemala
        </p>
        <p className="font-mono text-[11px]">
          13 Agencias · 3 Regiones Operativas · Moneda Quetzales (Q)
        </p>
      </footer>
    </div>
  );
};
