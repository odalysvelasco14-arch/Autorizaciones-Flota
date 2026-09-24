import { ApprovalRecord, MonthlyBudgetConfig, AgencyBudgetSummary, AgenciaInfo, JROInfo } from '../types/budget';

export function formatCurrency(amount: number, currency: string = 'GTQ'): string {
  const num = Math.abs(amount || 0);
  const formatted = new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  const sign = amount < 0 ? '-' : '';
  // En Guatemala el símbolo de Quetzales es Q
  if (currency === 'GTQ' || currency === 'Q') {
    return `${sign}Q ${formatted}`;
  }
  return `${sign}${currency} ${formatted}`;
}

export function formatCompactCurrency(amount: number, currency: string = 'GTQ'): string {
  const num = Math.abs(amount || 0);
  const prefix = currency === 'GTQ' || currency === 'Q' ? 'Q ' : `${currency} `;
  const sign = amount < 0 ? '-' : '';

  if (num >= 1_000_000) {
    return `${sign}${prefix}${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${sign}${prefix}${(num / 1_000).toFixed(1)}k`;
  }
  return formatCurrency(amount, currency);
}

export function formatDateSpanish(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatSimpleDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function getMonthKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function formatMonthName(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  const d = new Date(y, m, 1);
  const name = new Intl.DateTimeFormat('es-GT', { month: 'long', year: 'numeric' }).format(d);
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Calculates fleet repair statistics in Quetzales for the current month.
 */
export function calculateFleetStats(
  aprobaciones: ApprovalRecord[],
  config: MonthlyBudgetConfig,
  selectedMonth: string,
  agenciasDisponibles: AgenciaInfo[] = [],
  filterJroId?: string
) {
  // If filterJroId is provided, filter down to the JRO's assigned agencies
  const targetAgencias = filterJroId
    ? agenciasDisponibles.filter(a => a.jroId === filterJroId)
    : agenciasDisponibles;
  const targetAgencyNames = new Set(targetAgencias.map(a => a.nombre));

  const monthlyRecords = aprobaciones.filter(rec => {
    const recMonth = (rec.fechaSolicitud || rec.fechaAutorizacion || rec.creadoEn || '').slice(0, 7);
    if (recMonth !== selectedMonth) return false;
    if (filterJroId) {
      return targetAgencyNames.has(rec.agencia) || rec.jroId === filterJroId;
    }
    return true;
  });

  const autorizadas = monthlyRecords.filter(r => r.estado === 'Autorizado');
  const pendientesCoord = monthlyRecords.filter(r => r.estado === 'Pendiente Coordinación');
  const pendientesJRO = monthlyRecords.filter(r => r.estado === 'Requiere Vo.Bo. JRO');
  const rechazadas = monthlyRecords.filter(r => r.estado === 'Rechazado');

  const totalAutorizadoQ = autorizadas.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const totalPendienteQ = [...pendientesCoord, ...pendientesJRO].reduce((acc, curr) => acc + (curr.monto || 0), 0);
  const totalPendienteJROQ = pendientesJRO.reduce((acc, curr) => acc + (curr.monto || 0), 0);
  
  // Calculate assigned budget for these agencies
  const presupuestoAsignadoQ = filterJroId
    ? targetAgencias.reduce((sum, ag) => sum + (config?.presupuestosPorAgencia?.[ag.nombre] ?? ag.presupuestoMensualQ ?? 25000), 0)
    : (config?.presupuestoTotal || 350000);

  const disponibleQ = presupuestoAsignadoQ - totalAutorizadoQ;
  const porcentajeConsumido = presupuestoAsignadoQ > 0 ? (totalAutorizadoQ / presupuestoAsignadoQ) * 100 : 0;

  // Umbral status
  let status: 'normal' | 'advertencia' | 'alerta' | 'excedido' = 'normal';
  if (porcentajeConsumido > 100) {
    status = 'excedido';
  } else if (porcentajeConsumido >= (config?.umbralAlerta || 85)) {
    status = 'alerta';
  } else if (porcentajeConsumido >= 70) {
    status = 'advertencia';
  }

  // Desglose por agencia
  const agencyMap: Record<string, { asignadoQ: number; autorizadoQ: number; conteo: number; region: string; jroNombre: string }> = {};

  // Inicializar agencias relevantes
  targetAgencias.forEach(ag => {
    agencyMap[ag.nombre] = {
      asignadoQ: config?.presupuestosPorAgencia?.[ag.nombre] ?? ag.presupuestoMensualQ ?? 25000,
      autorizadoQ: 0,
      conteo: 0,
      region: ag.region,
      jroNombre: ag.jroNombre
    };
  });

  // Sumar autorizadas a agencias
  autorizadas.forEach(rec => {
    const agName = rec.agencia || targetAgencias[0]?.nombre || 'Agencia';
    if (!agencyMap[agName]) {
      if (filterJroId && !targetAgencyNames.has(agName)) return;
      agencyMap[agName] = {
        asignadoQ: config?.presupuestosPorAgencia?.[agName] ?? 25000,
        autorizadoQ: 0,
        conteo: 0,
        region: 'Región',
        jroNombre: rec.jroNombre || ''
      };
    }
    agencyMap[agName].autorizadoQ += rec.monto || 0;
    agencyMap[agName].conteo += 1;
  });

  const agenciasResumen: AgencyBudgetSummary[] = Object.entries(agencyMap).map(([nombre, data]) => {
    const porc = data.asignadoQ > 0 ? (data.autorizadoQ / data.asignadoQ) * 100 : 0;
    return {
      agencia: nombre,
      region: data.region,
      jroNombre: data.jroNombre,
      asignadoQ: data.asignadoQ,
      autorizadoQ: data.autorizadoQ,
      disponibleQ: data.asignadoQ - data.autorizadoQ,
      porcentaje: porc,
      conteoReparaciones: data.conteo
    };
  }).sort((a, b) => b.autorizadoQ - a.autorizadoQ);

  // Conteo de camiones únicos atendidos
  const camionesAtendidosSet = new Set(monthlyRecords.map(r => r.camionId).filter(Boolean));

  return {
    presupuestoAsignadoQ,
    totalAutorizadoQ,
    totalPendienteQ,
    totalPendienteJROQ,
    disponibleQ,
    porcentajeConsumido,
    status,
    conteoAutorizadas: autorizadas.length,
    conteoPendientesCoord: pendientesCoord.length,
    conteoPendientesJRO: pendientesJRO.length,
    conteoRechazadas: rechazadas.length,
    totalSolicitudes: monthlyRecords.length,
    totalCamionesAtendidos: camionesAtendidosSet.size,
    agenciasResumen,
    moneda: 'GTQ'
  };
}

/**
 * Genera el cuerpo de correo formateado para enviar por Outlook como soporte oficial.
 */
export function buildOutlookSupportEmail(repair: ApprovalRecord, coordinatorEmail = 'odalys.velasco@embotelladora.com.gt') {
  const requiereJRO = repair.monto >= 10000;
  
  const recipient = requiereJRO ? repair.jroEmail : coordinatorEmail;
  const cc = requiereJRO 
    ? `${coordinatorEmail}; ${repair.emailTaller || 'taller.flota@outsourcing.com'}`
    : `${repair.emailTaller || 'taller.flota@outsourcing.com'}; ${repair.jroEmail}`;

  const subject = `[SOLICITUD REPARACIÓN Q ${repair.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}] Camión ${repair.camionId} - ${repair.agencia} ${requiereJRO ? '(REQUIERE VO.BO. JRO)' : ''}`;

  const body = `Estimado(a) ${requiereJRO ? repair.jroNombre + ' (Jefe Regional de Operaciones)' : 'Coordinadora de Flota'},

Por medio del presente correo se remite el soporte y expediente técnico de solicitud de autorización de reparación para la unidad de distribución:

=========================================
FICHA TÉCNICA DE LA REPARACIÓN
=========================================
• Código / Folio: ${repair.codigoAutorizacion}
• Fecha de Solicitud: ${formatDateSpanish(repair.fechaSolicitud)}
• ID de Camión: ${repair.camionId} (Placa: ${repair.placaCamion || 'En trámite'})
• Configuración: Camión de ${repair.cantidadBahias} Bahías (${repair.tipoBebida || 'Distribución'})
• Agencia Asignada: ${repair.agencia}
• JRO Asignado: ${repair.jroNombre} (${repair.jroEmail})
• Taller / Outsourcing: ${repair.tallerNombre} (Contacto: ${repair.contactoTaller})

=========================================
DETALLE ECONÓMICO Y MOTIVO
=========================================
• Monto de Reparación: Q ${repair.monto.toLocaleString('es-GT', { minimumFractionDigits: 2 })} GTQ
• Categoría: ${repair.categoriaReparacion}
• Motivo / Diagnóstico: ${repair.motivoReparacion}
${repair.cotizacionNumero ? `• No. de Cotización: ${repair.cotizacionNumero}` : ''}
${repair.imagenEvidenciaUrl ? `• Evidencia Fotográfica: [IMAGEN ADJUNTA EN EL EXPEDIENTE]` : '• Evidencia Fotográfica: [En revisión de taller]'}

${requiereJRO ? `⚠️ REGLA DE APROBACIÓN APLICABLE:
El monto de esta reparación supera los Q10,000.00, por lo que requiere obligatoriamente el Visto Bueno del Jefe Regional de Operaciones (${repair.jroNombre}) antes de que el taller inicie los trabajos.` : `• Aprobación por monto menor a Q10,000.00 gestionada directamente por Coordinación de Flota.`}

Favor de responder a este correo indicando "AUTORIZADO" o ingresar a la plataforma de Flota para validar el registro.

Atentamente,
${repair.contactoTaller || 'Taller de Mantenimiento de Flota'} / Coordinación de Flota
Embotelladora de Bebidas Carbonatadas y No Carbonatadas`;

  return {
    recipient,
    cc,
    subject,
    body,
    mailtoUrl: `mailto:${encodeURIComponent(recipient)}?cc=${encodeURIComponent(cc)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  };
}

/**
 * Heuristic parser for incoming Outlook emails for bay truck repairs.
 */
export function heuristicParseOutlookEmail(text: string): Partial<ApprovalRecord> {
  // Amount in Quetzales (Q)
  let monto = 0;
  const qMatch = text.match(/(?:Q\.?|quetzales|GTQ|\$)\s*([\d,]+(?:\.\d{1,2})?)/i) 
              || text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:Q\.?|quetzales|GTQ)/i)
              || text.match(/monto(?: autorizado)?(?:\s*:\s*)?([\d,]+(?:\.\d{1,2})?)/i);
  if (qMatch) {
    const rawVal = qMatch[1].replace(/,/g, '');
    monto = parseFloat(rawVal) || 0;
  }

  // Truck ID (ej: CAM-B10-042, C-104, etc.)
  let camionId = 'CAM-B10-042';
  const truckMatch = text.match(/(?:camión|camion|unidad|id)\s*[:#-]?\s*([A-Z0-9\-_]{4,15})/i)
                  || text.match(/\b(CAM-[A-Z0-9\-]+|C-[0-9]{3,5})\b/i);
  if (truckMatch) {
    camionId = truckMatch[1].toUpperCase();
  }

  // Bays
  let cantidadBahias = 10;
  const bayMatch = text.match(/(\d{1,2})\s*(?:bah[ií]as|bahias|puertas)/i);
  if (bayMatch) {
    cantidadBahias = parseInt(bayMatch[1], 10);
  }

  // Beverage type
  let tipoBebida: 'Carbonatadas' | 'No Carbonatadas' | 'Mixto' = 'Carbonatadas';
  if (/no carbonatad|agua|jugo|nectar|té/i.test(text)) {
    tipoBebida = 'No Carbonatadas';
  } else if (/mixt|combinad/i.test(text)) {
    tipoBebida = 'Mixto';
  }

  // Agency
  let agencia = 'Agencia Central / Planta';
  const agencies = [
    'Agencia Central / Planta', 'Agencia Mixco', 'Agencia Villa Nueva', 'Agencia Chimaltenango', 'Agencia Sacatepéquez',
    'Agencia Quetzaltenango (Xela)', 'Agencia San Marcos', 'Agencia Huehuetenango', 'Agencia Retalhuleu',
    'Agencia Escuintla', 'Agencia Mazatenango', 'Agencia Zacapa', 'Agencia Puerto Barrios'
  ];
  for (const ag of agencies) {
    const simple = ag.replace('Agencia ', '').split('/')[0].trim().toLowerCase();
    if (text.toLowerCase().includes(simple)) {
      agencia = ag;
      break;
    }
  }

  // Code
  let codigo = '';
  const codeMatch = text.match(/(?:código|codigo|folio|autorización|aut|rep)(?:\s*(?:interno)?\s*:\s*|\s+)([A-Z0-9\-_]{5,25})/i);
  if (codeMatch) {
    codigo = codeMatch[1].toUpperCase();
  } else {
    codigo = `AUT-FLOTA-GT-${Math.floor(100 + Math.random() * 900)}`;
  }

  const requiereVoBoJRO = monto >= 10000;

  return {
    codigoAutorizacion: codigo,
    monto: monto || 8500,
    moneda: 'GTQ',
    camionId,
    placaCamion: 'C-482BKX',
    cantidadBahias,
    tipoBebida,
    agencia,
    motivoReparacion: 'Reparación de sistema neumático de frenos y ajuste de cortinas corredizas de bahías',
    categoriaReparacion: 'Frenos & Neumática',
    tallerNombre: 'Talleres Diésel de Guatemala S.A.',
    contactoTaller: 'Ing. Manuel Rivas',
    emailTaller: 'servicios@dieselguate.com',
    requiereVoBoJRO,
    estado: requiereVoBoJRO ? 'Requiere Vo.Bo. JRO' : 'Autorizado',
    asuntoCorreo: `Solicitud de Reparación Camión ${camionId} - ${agencia}`,
    cuerpoCorreoOriginal: text,
    fechaSolicitud: new Date().toISOString(),
    metodoIngreso: 'outlook_ia'
  };
}
