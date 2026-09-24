import React, { useState, useId } from 'react';
import { 
  X, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  ShieldAlert, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  User, 
  FileText, 
  ExternalLink,
  Copy,
  Check,
  Send,
  AlertTriangle,
  Lock,
  ThumbsUp
} from 'lucide-react';
import { ApprovalRecord, UserProfile } from '../types/budget';
import { formatCurrency, formatDateSpanish, buildOutlookSupportEmail } from '../utils/budgetUtils';
import { USUARIOS_DISPONIBLES } from '../data/mockData';

interface RepairDetailModalProps {
  repair: ApprovalRecord | null;
  currentUser?: UserProfile;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: 'Autorizado' | 'Rechazado' | 'Requiere Vo.Bo. JRO' | 'Pendiente Coordinación', authorizerNote?: string) => void;
  onSendSupportEmail: (repairId: string) => void;
}

export const RepairDetailModal: React.FC<RepairDetailModalProps> = ({
  repair,
  currentUser = USUARIOS_DISPONIBLES[0],
  onClose,
  onUpdateStatus,
  onSendSupportEmail
}) => {
  if (!repair) return null;

  const activeUser = currentUser || USUARIOS_DISPONIBLES[0];
  const titleId = useId();

  const [copied, setCopied] = useState(false);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [notasDecision, setNotasDecision] = useState('');

  const emailData = buildOutlookSupportEmail(repair);
  const requiereJRO = repair.monto >= 10000;
  const isOdalys = activeUser.rol === 'ADMIN' && Boolean(activeUser.puedeAutorizar);
  const isJRO = activeUser.rol === 'JRO';
  const isSolicitante = activeUser.rol === 'SOLICITANTE';

  const handleCopySupport = () => {
    navigator.clipboard.writeText(emailData.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenOutlookClient = () => {
    window.location.href = emailData.mailtoUrl;
    onSendSupportEmail(repair.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col my-auto border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id={titleId} className="text-base font-bold text-white">
                  Expediente de Reparación · {repair.camionId}
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {repair.codigoAutorizacion}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {repair.agencia} · {repair.tipoBebida || 'Distribución'} ({repair.cantidadBahias} Bahías)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Status & JRO Badge Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-500">Estado actual:</span>
              {repair.estado === 'Autorizado' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Autorizado y Liberado</span>
                </span>
              )}
              {repair.estado === 'Requiere Vo.Bo. JRO' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 rounded-full animate-pulse">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Pendiente Visto Bueno JRO (≥ Q10k)</span>
                </span>
              )}
              {repair.estado === 'Pendiente Coordinación' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-100 border border-blue-300 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span>Pendiente Coordinación Flota</span>
                </span>
              )}
              {repair.estado === 'Rechazado' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-800 bg-rose-100 border border-rose-300 rounded-full">
                  <XCircle className="w-4 h-4" />
                  <span>Rechazado</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 font-mono text-base font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <span>{formatCurrency(repair.monto, 'GTQ')}</span>
            </div>
          </div>

          {/* JRO Warning if >= Q10k */}
          {requiereJRO && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Regla de Autorización Obligatoria:</strong> Al ser un monto de{' '}
                <strong>{formatCurrency(repair.monto, 'GTQ')} (≥ Q10,000)</strong>, esta reparación debe
                contar con la aprobación expresa del Jefe Regional de Operaciones:{' '}
                <strong>{repair.jroNombre}</strong> ({repair.jroEmail}).
              </div>
            </div>
          )}

          {/* Grid Layout: Left Photo & Truck Specs / Right Financial & JRO details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left Column: Photo Evidence */}
            <div className="space-y-3">
              <div className="font-bold text-slate-900 flex items-center justify-between text-xs">
                <span>Fotografía / Evidencia de la Avería</span>
                {repair.imagenEvidenciaUrl && (
                  <button
                    onClick={() => setShowImageZoom(!showImageZoom)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {showImageZoom ? 'Reducir' : 'Ampliar Imagen'}
                  </button>
                )}
              </div>

              {repair.imagenEvidenciaUrl ? (
                <div className={`relative rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shadow-2xs transition-all ${
                  showImageZoom ? 'h-64' : 'h-48'
                }`}>
                  <img
                    src={repair.imagenEvidenciaUrl}
                    alt={`Evidencia ${repair.camionId}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-102 transition-transform"
                    onClick={() => setShowImageZoom(!showImageZoom)}
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] rounded font-mono">
                    {repair.camionId} · {repair.categoriaReparacion}
                  </div>
                </div>
              ) : (
                <div className="h-44 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                  <Truck className="w-8 h-8 mb-1" />
                  <span>Sin fotografía adjunta</span>
                </div>
              )}

              {/* Ficha del camión */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-[11px]">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Especificaciones de la Unidad</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-400">ID Unidad:</span>{' '}
                    <strong className="text-slate-800">{repair.camionId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Placa:</span>{' '}
                    <strong className="text-slate-800">{repair.placaCamion || 'C-482BKX'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Configuración:</span>{' '}
                    <strong className="text-slate-800">{repair.cantidadBahias} Bahías</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Tipo de Ruta:</span>{' '}
                    <strong className="text-slate-800">{repair.tipoBebida || 'Carbonatadas'}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Details & Approvals */}
            <div className="space-y-4">
              
              {/* Motivo de Reparación */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Diagnóstico Técnico & Motivo
                </span>
                <p className="text-slate-800 font-medium leading-relaxed text-xs">
                  {repair.motivoReparacion}
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-semibold">
                    {repair.categoriaReparacion}
                  </span>
                  {repair.cotizacionNumero && (
                    <span className="font-mono text-[10px] text-slate-600">
                      Cotización: {repair.cotizacionNumero}
                    </span>
                  )}
                </div>
              </div>

              {/* Agencia y JRO */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Agencia: {repair.agencia}</span>
                  </span>
                </div>
                <div className="text-slate-600 space-y-0.5 pt-0.5">
                  <div>
                    <span className="text-slate-500">JRO Responsable:</span>{' '}
                    <strong className="text-slate-900">{repair.jroNombre}</strong>
                  </div>
                  <div className="text-blue-700 font-mono text-[10px]">
                    {repair.jroEmail}
                  </div>
                </div>
              </div>

              {/* Taller Outsourcing */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] text-slate-600">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Taller Outsourcing Solicitante
                </span>
                <div className="font-semibold text-slate-900">{repair.tallerNombre}</div>
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>Contacto: {repair.contactoTaller}</span>
                  <span>{repair.emailTaller}</span>
                </div>
              </div>

              {/* Fechas de Registro */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>Solicitado: {formatDateSpanish(repair.fechaSolicitud)}</span>
                {repair.fechaAutorizacion && (
                  <span className="text-emerald-700 font-medium">
                    Autorizado: {formatDateSpanish(repair.fechaAutorizacion)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section: Outlook Support Email Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-xs text-white">
                  Soporte por Correo de Microsoft Outlook
                </span>
                {repair.correoSoporteEnviado ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Correo Registrado
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-full">
                    Pendiente Envío a Outlook
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySupport}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Ficha'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenOutlookClient}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Abrir en Outlook y Enviar</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
              <div><strong className="text-slate-400">Para:</strong> {emailData.recipient}</div>
              <div><strong className="text-slate-400">CC:</strong> {emailData.cc}</div>
              <div><strong className="text-slate-400">Asunto:</strong> {emailData.subject}</div>
            </div>
          </div>

          {/* Section: Decision Actions (Authorize / Reject) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Resolución de Autorización Presupuestaria</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                Usuario activo: <strong className="text-slate-800">{activeUser.nombre}</strong> ({activeUser.rol})
              </span>
            </div>

            {/* Admin Odalys: Full Exclusive Authorization Mode */}
            {isOdalys && (
              <div className="space-y-3">
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Control Total Activo: Solo tú puedes autorizar gastos y liberar el presupuesto en la APP.</span>
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-950 font-bold rounded text-[10px]">
                    Autorizaciones Exclusivas
                  </span>
                </div>

                <input
                  type="text"
                  value={notasDecision}
                  onChange={e => setNotasDecision(e.target.value)}
                  placeholder="Notas u observaciones de la aprobación (ej. Autorizado según cotización y presupuesto disponible)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(repair.id, 'Rechazado', notasDecision || 'Rechazado por Odalys Velasco')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rechazar Solicitud</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateStatus(repair.id, 'Autorizado', `${notasDecision || 'Autorizado y liberado formalmente por Odalys Velasco (Coordinación de Flota)'}`)}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Autorizar y Liberar Presupuesto (Q {formatCurrency(repair.monto, 'Q')})</span>
                  </button>
                </div>
              </div>
            )}

            {/* JRO Mode: Can give technical Vo.Bo., but cannot give final authorization */}
            {isJRO && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Autorizaciones Reservadas para Odalys Velasco</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    De acuerdo con las políticas corporativas definidas en la aplicación, <strong>únicamente la Administradora Odalys Velasco</strong> puede autorizar y liberar fondos. Como <strong>Jefe Regional de Operaciones</strong>, tu rol consiste en evaluar el diagnóstico mecánico y emitir tu <strong>Visto Bueno Técnico (Vo.Bo.)</strong>.
                  </p>
                </div>

                {repair.estado === 'Requiere Vo.Bo. JRO' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <input
                      type="text"
                      value={notasDecision}
                      onChange={e => setNotasDecision(e.target.value)}
                      placeholder="Comentarios técnicos del JRO para Odalys Velasco..."
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() => onUpdateStatus(repair.id, 'Pendiente Coordinación', `Vo.Bo. Técnico otorgado por JRO ${activeUser.nombre}: ${notasDecision || 'Aprobación técnica favorable'}`)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Emitir Vo.Bo. Técnico JRO</span>
                    </button>
                  </div>
                )}

                {repair.estado === 'Autorizado' && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Esta reparación ya ha sido autorizada formalmente por Odalys Velasco.</span>
                  </div>
                )}
              </div>
            )}

            {/* Solicitante Mode: Read-Only Info */}
            {isSolicitante && (
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-slate-900">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Seguimiento de Ticket de Reparación</span>
                </p>
                <p className="text-[11px] text-slate-600">
                  Tu solicitud se encuentra registrada en el sistema. Los diagnósticos con montos superiores a Q10,000 reciben Vo.Bo. del JRO asignado, y la autorización final y liberación presupuestaria es efectuada por la Coordinadora <strong>Odalys Velasco</strong>.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
