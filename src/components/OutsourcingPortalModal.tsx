import React, { useState, useId } from 'react';
import { 
  X, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  Mail, 
  Camera, 
  Building2, 
  DollarSign, 
  FileText, 
  Info,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { AgenciaInfo, ApprovalRecord, BebidaTipo, CategoriaReparacion } from '../types/budget';
import { AGENCIAS_DISPONIBLES, JROS_DISPONIBLES } from '../data/mockData';
import { buildOutlookSupportEmail } from '../utils/budgetUtils';

const bayTruckImg = '/assets/images/bay_delivery_truck_1790190627617.jpg';
const engineRepairImg = '/assets/images/truck_engine_repair_1790190643049.jpg';

interface OutsourcingPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRepair: Partial<ApprovalRecord>, sendOutlookEmail: boolean) => void;
  agencias?: AgenciaInfo[];
}

export const OutsourcingPortalModal: React.FC<OutsourcingPortalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  agencias = AGENCIAS_DISPONIBLES
}) => {
  if (!isOpen) return null;

  const titleId = useId();

  // Form State
  const [fechaSolicitud, setFechaSolicitud] = useState(
    new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm for datetime-local
  );
  const [monto, setMonto] = useState<number | ''>(12500);
  const [camionId, setCamionId] = useState('CAM-B10-048');
  const [placaCamion, setPlacaCamion] = useState('C-624BKD');
  const [cantidadBahias, setCantidadBahias] = useState<number>(10);
  const [tipoBebida, setTipoBebida] = useState<BebidaTipo>('Carbonatadas');
  const [agencia, setAgencia] = useState(agencias[0].nombre);
  const [categoria, setCategoria] = useState<CategoriaReparacion>('Frenos & Neumática');
  const [motivo, setMotivo] = useState(
    'Falla en válvula reguladora de frenos de aire de doble eje y reparación de trabas de seguridad de las bahías 3 y 4.'
  );
  const [cotizacionNumero, setCotizacionNumero] = useState('COT-DIESEL-2026-944');
  const [tallerNombre, setTallerNombre] = useState('Talleres Diésel de Guatemala S.A. (Outsourcing)');
  const [contactoTaller, setContactoTaller] = useState('Ing. Manuel Rivas');
  const [emailTaller, setEmailTaller] = useState('servicios@dieselguate.com');
  const [telefonoTaller, setTelefonoTaller] = useState('+502 2334-9900');
  
  // Image handling
  const [imagenUrl, setImagenUrl] = useState<string>(engineRepairImg);
  const [imageName, setImageName] = useState<string>('inspeccion_frenos_bahia.jpg');

  // Find agency and JRO
  const selectedAgency = agencias.find(a => a.nombre === agencia) || agencias[0];
  const numMonto = Number(monto) || 0;
  const requiereJRO = numMonto >= 10000;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImagenUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (sendOutlook: boolean) => {
    if (!camionId.trim() || !motivo.trim() || numMonto <= 0) {
      alert('Por favor completa el ID del camión, el monto en Quetzales y el motivo de la reparación.');
      return;
    }

    const newRecord: Partial<ApprovalRecord> = {
      codigoAutorizacion: `AUT-FLOTA-GT-${Math.floor(100 + Math.random() * 900)}`,
      fechaSolicitud: new Date(fechaSolicitud).toISOString(),
      monto: numMonto,
      moneda: 'GTQ',
      camionId: camionId.trim().toUpperCase(),
      placaCamion: placaCamion.trim().toUpperCase(),
      cantidadBahias,
      tipoBebida,
      agencia: selectedAgency.nombre,
      jroId: selectedAgency.jroId,
      jroNombre: selectedAgency.jroNombre,
      jroEmail: selectedAgency.jroEmail,
      motivoReparacion: motivo.trim(),
      categoriaReparacion: categoria,
      cotizacionNumero: cotizacionNumero.trim(),
      tallerNombre: tallerNombre.trim(),
      contactoTaller: contactoTaller.trim(),
      emailTaller: emailTaller.trim(),
      telefonoTaller: telefonoTaller.trim(),
      imagenEvidenciaUrl: imagenUrl,
      requiereVoBoJRO: requiereJRO,
      estado: requiereJRO ? 'Requiere Vo.Bo. JRO' : 'Pendiente Coordinación',
      metodoIngreso: 'portal_outsourcing',
      asuntoCorreo: `[SOLICITUD REPARACIÓN Q ${numMonto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}] Camión ${camionId} - ${selectedAgency.nombre} ${requiereJRO ? '(REQUIERE VO.BO. JRO)' : ''}`
    };

    onSubmit(newRecord, sendOutlook);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col my-auto border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 id={titleId} className="text-base font-bold text-white flex items-center gap-2">
                <span>Nueva Solicitud de Reparación (Outsourcing)</span>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-blue-500/30 text-blue-200 rounded border border-blue-400/20">
                  Camiones de Bahías
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Registro de diagnóstico técnico, cotización en Quetzales y soporte para Outlook
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* Dynamic Rule Alert: JRO vs Coordinadora */}
          {requiereJRO ? (
            <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-900 text-xs sm:text-sm">
                  <span>⚠️ Monto ≥ Q 10,000.00 — Requiere Vo.Bo. Obligatorio del JRO</span>
                </div>
                <p className="text-amber-800 leading-relaxed text-[11px]">
                  Al ser una reparación mayor a diez mil Quetzales, el sistema enviará la solicitud al 
                  <strong> {selectedAgency.jroNombre}</strong> ({selectedAgency.jroEmail}), Jefe Regional de Operaciones asignado a la <strong>{selectedAgency.nombre}</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-[11px] text-emerald-800">
                <strong>Aprobación Directa de Coordinación:</strong> Monto menor a Q10,000.00. 
                Será autorizado directamente por la Coordinadora de Flota <strong>Odalys Velasco</strong>.
              </div>
            </div>
          )}

          {/* Section 1: Fechas y Costos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Fecha de Solicitud *
              </label>
              <input
                type="datetime-local"
                value={fechaSolicitud}
                onChange={e => setFechaSolicitud(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Monto Reparación (Quetzales - Q) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold text-xs">
                  Q
                </span>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={monto}
                  onChange={e => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Regla: ≥ Q 10,000 activa Vo.Bo. JRO
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                No. Cotización Taller
              </label>
              <input
                type="text"
                value={cotizacionNumero}
                onChange={e => setCotizacionNumero(e.target.value)}
                placeholder="Ej. COT-2026-900"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Datos del Camión de Bahías y Bebidas */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Identificación del Camión de Bahías</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  ID del Camión *
                </label>
                <input
                  type="text"
                  value={camionId}
                  onChange={e => setCamionId(e.target.value)}
                  placeholder="CAM-B10-042"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Placa de Circulación
                </label>
                <input
                  type="text"
                  value={placaCamion}
                  onChange={e => setPlacaCamion(e.target.value)}
                  placeholder="C-482BKX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Capacidad de Bahías
                </label>
                <select
                  value={cantidadBahias}
                  onChange={e => setCantidadBahias(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={6}>6 Bahías (Urbano)</option>
                  <option value={8}>8 Bahías (Reparto)</option>
                  <option value={10}>10 Bahías (Ruta Regular)</option>
                  <option value={12}>12 Bahías (Pesado / Troncal)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tipo de Bebidas Repartidas
                </label>
                <select
                  value={tipoBebida}
                  onChange={e => setTipoBebida(e.target.value as BebidaTipo)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Carbonatadas">Bebidas Carbonatadas (Refrescos)</option>
                  <option value="No Carbonatadas">No Carbonatadas (Agua / Jugos)</option>
                  <option value="Mixto">Mixto (Ruta Combinada)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Agencia (13 Agencias) y JRO Asignado (3 JROs) */}
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Agencia Asignada al Camión (13 Agencias disponibles) *</span>
              </label>
              <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded">
                Supervisión Regional
              </span>
            </div>

            <select
              value={agencia}
              onChange={e => setAgencia(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-semibold bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <optgroup label="📍 Región Central & Metropolitana (JRO: Ing. Fernando Morales)">
                {agencias.filter(a => a.region.includes('Central')).map(a => (
                  <option key={a.id} value={a.nombre}>{a.nombre}</option>
                ))}
              </optgroup>
              <optgroup label="📍 Región Occidente & Altiplano (JRO: Lic. Roberto Estrada)">
                {agencias.filter(a => a.region.includes('Occidente')).map(a => (
                  <option key={a.id} value={a.nombre}>{a.nombre}</option>
                ))}
              </optgroup>
              <optgroup label="📍 Región Oriente & Costa Sur (JRO: Ing. Carlos Samayoa)">
                {agencias.filter(a => a.region.includes('Oriente')).map(a => (
                  <option key={a.id} value={a.nombre}>{a.nombre}</option>
                ))}
              </optgroup>
            </select>

            {/* JRO Details pill */}
            <div className="p-2.5 bg-white border border-blue-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">JRO Asignado:</span>{' '}
                <strong className="text-slate-900">{selectedAgency.jroNombre}</strong>
                <span className="text-slate-400 mx-1.5">|</span>
                <span className="text-slate-600">{selectedAgency.region}</span>
              </div>
              <div className="text-blue-700 font-mono text-[10px]">
                Outlook: {selectedAgency.jroEmail}
              </div>
            </div>
          </div>

          {/* Section 4: Motivo y Categoría de Reparación */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Categoría del Daño *
                </label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value as CategoriaReparacion)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Frenos & Neumática">Frenos & Neumática</option>
                  <option value="Bahías & Cortinas Corredizas">Bahías & Cortinas Corredizas</option>
                  <option value="Motor & Inyección Diésel">Motor & Inyección Diésel</option>
                  <option value="Suspensión & Chasis">Suspensión & Chasis</option>
                  <option value="Transmisión & Embrague">Transmisión & Embrague</option>
                  <option value="Sistema Eléctrico & Baterías">Sistema Eléctrico & Baterías</option>
                  <option value="Mantenimiento Preventivo">Mantenimiento Preventivo</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Diagnóstico Técnico & Motivo de Reparación *
                </label>
                <textarea
                  rows={2}
                  value={motivo}
                  onChange={e => setMotivo(e.target.value)}
                  placeholder="Detalla la avería encontrada en el camión botellero..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Imagen / Evidencia Fotográfica */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Camera className="w-4 h-4 text-slate-700" />
                <span>Fotografía / Evidencia de la Avería o Cotización *</span>
              </label>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span>Muestra rápida:</span>
                <button
                  type="button"
                  onClick={() => { setImagenUrl(engineRepairImg); setImageName('inspeccion_mecanica.jpg'); }}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:border-blue-400 rounded text-slate-700 cursor-pointer"
                >
                  Mecánica
                </button>
                <button
                  type="button"
                  onClick={() => { setImagenUrl(bayTruckImg); setImageName('camion_bahias.jpg'); }}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:border-blue-400 rounded text-slate-700 cursor-pointer"
                >
                  Bahías
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {imagenUrl ? (
                <div className="relative w-full sm:w-44 h-28 rounded-lg overflow-hidden border-2 border-slate-300 shadow-2xs shrink-0 group">
                  <img 
                    src={imagenUrl} 
                    alt="Evidencia técnica" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="px-2.5 py-1 text-[10px] font-bold text-white bg-slate-900/80 rounded cursor-pointer">
                      Cambiar
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageFileChange} 
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="w-full sm:w-44 h-28 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 cursor-pointer bg-white transition-colors">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium">Subir Imagen</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageFileChange} 
                  />
                </label>
              )}

              <div className="flex-1 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">
                  {imageName ? `Archivo: ${imageName}` : 'No se ha seleccionado archivo'}
                </p>
                <p className="text-slate-500">
                  Se incluirá la referencia fotográfica en el expediente y en el correo de soporte enviado a <strong>{selectedAgency.jroNombre}</strong> y a Coordinación.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-md font-medium text-slate-700 cursor-pointer text-[11px]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Explorar archivo desde dispositivo</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageFileChange} 
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Section 6: Datos del Taller Outsourcing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Nombre Taller Outsourcing</label>
              <input
                type="text"
                value={tallerNombre}
                onChange={e => setTallerNombre(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Contacto / Encargado</label>
              <input
                type="text"
                value={contactoTaller}
                onChange={e => setContactoTaller(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Correo de Contacto</label>
              <input
                type="email"
                value={emailTaller}
                onChange={e => setEmailTaller(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 text-center sm:text-left">
            <span>Al guardar se asignará automáticamente el folio</span>{' '}
            <strong className="text-slate-800 font-mono">AUT-FLOTA-GT-XXX</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Solo Registrar en App
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Registrar y Enviar Soporte a Outlook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
