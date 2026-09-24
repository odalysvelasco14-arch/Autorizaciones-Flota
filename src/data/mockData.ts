import type { AppStateData, JROInfo, AgenciaInfo, ApprovalRecord, UserProfile, MonthlyBudgetConfig } from '../types/budget.ts';

const bayTruckImg = '/assets/images/bay_delivery_truck_1790190627617.jpg';
const engineRepairImg = '/assets/images/truck_engine_repair_1790190643049.jpg';

// Perfiles de Usuarios del Sistema (Control de Acceso Basado en Roles)
export const USUARIOS_DISPONIBLES: UserProfile[] = [
  {
    id: 'user-odalys',
    nombre: 'Odalys Velasco',
    correo: 'OdalysVelasco14@gmail.com',
    rol: 'ADMIN',
    cargo: 'Coordinadora General de Flota & Presupuestos',
    descripcion: 'Control total de agencias, presupuestos mensuales y AUTORIZACIONES EXCLUSIVAS de gastos en la app.',
    puedeAutorizar: true,
    pinAcceso: '2026'
  },
  {
    id: 'user-jro-litoral',
    nombre: 'Ing. Luis Secaida',
    correo: 'luis.secaida@embotelladora.com.gt',
    rol: 'JRO',
    cargo: 'Jefe Regional de Operaciones (JRO Litoral)',
    jroId: 'jro-litoral',
    region: 'Región Litoral',
    descripcion: 'Visualización y Vo.Bo. de agencias de Región Litoral (Cuyotenango, Mazatenango, Retalhuleu, Escuintla). Emite Vo.Bo. técnico para solicitudes ≥ Q10k.',
    puedeAutorizar: false,
    pinAcceso: '1001'
  },
  {
    id: 'user-jro-centro-occidente',
    nombre: 'Lic. Kenneth Muñoz',
    correo: 'kenneth.munoz@embotelladora.com.gt',
    rol: 'JRO',
    cargo: 'Jefe Regional de Operaciones (JRO Centro Occidente)',
    jroId: 'jro-centro-occidente',
    region: 'Región Centro Occidente',
    descripcion: 'Visualización y Vo.Bo. de agencias de Centro Occidente (Cunen, Encuentros, Quetzaltenango, San Marcos, Huehuetenango). Emite Vo.Bo. técnico para solicitudes ≥ Q10k.',
    puedeAutorizar: false,
    pinAcceso: '1002'
  },
  {
    id: 'user-jro-central',
    nombre: 'Ing. Fernando Morales',
    correo: 'fernando.morales@embotelladora.com.gt',
    rol: 'JRO',
    cargo: 'Jefe Regional de Operaciones (JRO Central)',
    jroId: 'jro-central',
    region: 'Región Central & Metropolitana',
    descripcion: 'Visualización y Vo.Bo. de agencias de Región Central (Central / Planta, Mixco, Villa Nueva, Chimaltenango, Sacatepéquez). Emite Vo.Bo. técnico para solicitudes ≥ Q10k.',
    puedeAutorizar: false,
    pinAcceso: '1003'
  },
  {
    id: 'user-solicitante-central',
    nombre: 'Ing. Manuel Rivas (Taller Outsourcing)',
    correo: 'servicios@dieselguate.com',
    rol: 'SOLICITANTE',
    cargo: 'Encargado de Taller Outsourcing & Solicitante',
    tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
    descripcion: 'Envío de solicitudes de reparación para camiones de bahías y seguimiento de estatus.',
    puedeAutorizar: false,
    pinAcceso: '1004'
  }
];

// Los 3 Jefes Regionales de Operaciones (JRO)
export const JROS_DISPONIBLES: JROInfo[] = [
  {
    id: 'jro-litoral',
    nombre: 'Ing. Luis Secaida',
    correo: 'luis.secaida@embotelladora.com.gt',
    region: 'Región Litoral',
    telefono: '+502 7767-1120',
    agenciasAsignadas: [
      'Agencia Cuyotenango',
      'Agencia Mazatenango',
      'Agencia Retalhuleu',
      'Agencia Escuintla'
    ]
  },
  {
    id: 'jro-centro-occidente',
    nombre: 'Lic. Kenneth Muñoz',
    correo: 'kenneth.munoz@embotelladora.com.gt',
    region: 'Región Centro Occidente',
    telefono: '+502 7765-8830',
    agenciasAsignadas: [
      'Agencia Cunen',
      'Agencia Encuentros',
      'Agencia Quetzaltenango (Xela)',
      'Agencia San Marcos',
      'Agencia Huehuetenango'
    ]
  },
  {
    id: 'jro-central',
    nombre: 'Ing. Fernando Morales',
    correo: 'fernando.morales@embotelladora.com.gt',
    region: 'Región Central & Metropolitana',
    telefono: '+502 2450-8801',
    agenciasAsignadas: [
      'Agencia Central / Planta',
      'Agencia Mixco',
      'Agencia Villa Nueva',
      'Agencia Chimaltenango',
      'Agencia Sacatepéquez'
    ]
  }
];

// Las Agencias distribuidoras con sus JROs correspondientes
export const AGENCIAS_DISPONIBLES: AgenciaInfo[] = [
  // 1. Región Litoral (JRO: Ing. Luis Secaida)
  {
    id: 'ag-litoral-01',
    nombre: 'Agencia Cuyotenango',
    region: 'Región Litoral',
    jroId: 'jro-litoral',
    jroNombre: 'Ing. Luis Secaida',
    jroEmail: 'luis.secaida@embotelladora.com.gt',
    presupuestoMensualQ: 25000
  },
  {
    id: 'ag-litoral-02',
    nombre: 'Agencia Mazatenango',
    region: 'Región Litoral',
    jroId: 'jro-litoral',
    jroNombre: 'Ing. Luis Secaida',
    jroEmail: 'luis.secaida@embotelladora.com.gt',
    presupuestoMensualQ: 26000
  },
  {
    id: 'ag-litoral-03',
    nombre: 'Agencia Retalhuleu',
    region: 'Región Litoral',
    jroId: 'jro-litoral',
    jroNombre: 'Ing. Luis Secaida',
    jroEmail: 'luis.secaida@embotelladora.com.gt',
    presupuestoMensualQ: 20000
  },
  {
    id: 'ag-litoral-04',
    nombre: 'Agencia Escuintla',
    region: 'Región Litoral',
    jroId: 'jro-litoral',
    jroNombre: 'Ing. Luis Secaida',
    jroEmail: 'luis.secaida@embotelladora.com.gt',
    presupuestoMensualQ: 32000
  },

  // 2. Región Centro Occidente (JRO: Lic. Kenneth Muñoz)
  {
    id: 'ag-occ-01',
    nombre: 'Agencia Cunen',
    region: 'Región Centro Occidente',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    presupuestoMensualQ: 20000
  },
  {
    id: 'ag-occ-02',
    nombre: 'Agencia Encuentros',
    region: 'Región Centro Occidente',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    presupuestoMensualQ: 22000
  },
  {
    id: 'ag-occ-03',
    nombre: 'Agencia Quetzaltenango (Xela)',
    region: 'Región Centro Occidente',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    presupuestoMensualQ: 36000
  },
  {
    id: 'ag-occ-04',
    nombre: 'Agencia San Marcos',
    region: 'Región Centro Occidente',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    presupuestoMensualQ: 20000
  },
  {
    id: 'ag-occ-05',
    nombre: 'Agencia Huehuetenango',
    region: 'Región Centro Occidente',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    presupuestoMensualQ: 22000
  },

  // 3. Región Central & Metropolitana (JRO: Ing. Fernando Morales)
  {
    id: 'ag-cen-01',
    nombre: 'Agencia Central / Planta',
    region: 'Región Central & Metropolitana',
    jroId: 'jro-central',
    jroNombre: 'Ing. Fernando Morales',
    jroEmail: 'fernando.morales@embotelladora.com.gt',
    presupuestoMensualQ: 42000
  },
  {
    id: 'ag-cen-02',
    nombre: 'Agencia Mixco',
    region: 'Región Central & Metropolitana',
    jroId: 'jro-central',
    jroNombre: 'Ing. Fernando Morales',
    jroEmail: 'fernando.morales@embotelladora.com.gt',
    presupuestoMensualQ: 30000
  },
  {
    id: 'ag-cen-03',
    nombre: 'Agencia Villa Nueva',
    region: 'Región Central & Metropolitana',
    jroId: 'jro-central',
    jroNombre: 'Ing. Fernando Morales',
    jroEmail: 'fernando.morales@embotelladora.com.gt',
    presupuestoMensualQ: 28000
  },
  {
    id: 'ag-cen-04',
    nombre: 'Agencia Chimaltenango',
    region: 'Región Central & Metropolitana',
    jroId: 'jro-central',
    jroNombre: 'Ing. Fernando Morales',
    jroEmail: 'fernando.morales@embotelladora.com.gt',
    presupuestoMensualQ: 20000
  },
  {
    id: 'ag-cen-05',
    nombre: 'Agencia Sacatepéquez',
    region: 'Región Central & Metropolitana',
    jroId: 'jro-central',
    jroNombre: 'Ing. Fernando Morales',
    jroEmail: 'fernando.morales@embotelladora.com.gt',
    presupuestoMensualQ: 18000
  }
];

// Presupuestos mensuales detallados para todos los 12 meses de 2026
// Con asignaciones iniciales más altas en Ene-Abr (temporada alta de bebidas) y asignación estándar en May-Dic
export const GENERAR_CONFIGURACION_ANUAL_2026 = (): Record<string, MonthlyBudgetConfig> => {
  const configs: Record<string, MonthlyBudgetConfig> = {};
  
  const baseBudgetsMayDec: Record<string, number> = {
    'Agencia Cuyotenango': 25000,
    'Agencia Mazatenango': 26000,
    'Agencia Retalhuleu': 20000,
    'Agencia Escuintla': 32000,
    'Agencia Cunen': 20000,
    'Agencia Encuentros': 22000,
    'Agencia Quetzaltenango (Xela)': 36000,
    'Agencia San Marcos': 20000,
    'Agencia Huehuetenango': 22000,
    'Agencia Central / Planta': 42000,
    'Agencia Mixco': 30000,
    'Agencia Villa Nueva': 28000,
    'Agencia Chimaltenango': 20000,
    'Agencia Sacatepéquez': 18000
  };

  const highBudgetsJanApr: Record<string, number> = {
    'Agencia Cuyotenango': 35000,
    'Agencia Mazatenango': 36000,
    'Agencia Retalhuleu': 28000,
    'Agencia Escuintla': 42000,
    'Agencia Cunen': 28000,
    'Agencia Encuentros': 32000,
    'Agencia Quetzaltenango (Xela)': 48000,
    'Agencia San Marcos': 28000,
    'Agencia Huehuetenango': 30000,
    'Agencia Central / Planta': 55000,
    'Agencia Mixco': 40000,
    'Agencia Villa Nueva': 38000,
    'Agencia Chimaltenango': 28000,
    'Agencia Sacatepéquez': 26000
  };

  for (let m = 1; m <= 12; m++) {
    const monthKey = `2026-${m.toString().padStart(2, '0')}`;
    const isHighSeason = m <= 4;
    const currentAgencyBudgets = isHighSeason ? { ...highBudgetsJanApr } : { ...baseBudgetsMayDec };
    const total = Object.values(currentAgencyBudgets).reduce((sum, val) => sum + val, 0);

    configs[monthKey] = {
      mesAno: monthKey,
      presupuestoTotal: total,
      moneda: 'GTQ',
      umbralAlerta: 85,
      presupuestosPorAgencia: currentAgencyBudgets,
      presupuestosPorDepartamento: currentAgencyBudgets
    };
  }

  return configs;
};

export const INITIAL_REPAIR_RECORDS: ApprovalRecord[] = [
  {
    id: 'rep-001',
    codigoAutorizacion: 'AUT-FLOTA-GT-104',
    fechaSolicitud: '2026-09-22T08:30:00.000Z',
    fechaAutorizacion: '2026-09-22T10:15:00.000Z',
    monto: 16800, // >= Q10,000 -> requirió JRO Central
    moneda: 'GTQ',
    camionId: 'CAM-B10-042',
    placaCamion: 'C-482BKX',
    cantidadBahias: 10,
    tipoBebida: 'Carbonatadas',
    agencia: 'Agencia Central / Planta',
    jroId: 'jro-central',
    jroNombre: 'Ing. Fernando Morales',
    jroEmail: 'fernando.morales@embotelladora.com.gt',
    motivoReparacion: 'Reparación mayor de compresor de aire de frenos, reemplazo de 2 diafragmas y ajuste de rieles de 4 bahías laterales',
    categoriaReparacion: 'Frenos & Neumática',
    imagenEvidenciaUrl: engineRepairImg,
    cotizacionNumero: 'COT-DIESEL-2026-881',
    tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
    contactoTaller: 'Ing. Manuel Rivas',
    emailTaller: 'servicios@dieselguate.com',
    telefonoTaller: '+502 2334-9900',
    requiereVoBoJRO: true,
    estado: 'Autorizado',
    autorizadoPor: 'Ing. Fernando Morales (JRO Central) & Odalys Velasco (Coordinación)',
    notas: 'Autorizado formalmente por JRO Central mediante correo de Outlook. Trabajo con garantía de 6 meses.',
    correoSoporteEnviado: true,
    ultimoCorreoEnviadoEn: '2026-09-22T08:35:00.000Z',
    asuntoCorreo: '[SOLICITUD REPARACIÓN Q 16,800.00] Camión CAM-B10-042 - Agencia Central / Planta (REQUIERE VO.BO. JRO)',
    cuerpoCorreoOriginal: `De: Manuel Rivas <servicios@dieselguate.com>
Para: Odalys Velasco <odalys.velasco@embotelladora.com.gt>
CC: Fernando Morales <fernando.morales@embotelladora.com.gt>
Asunto: [SOLICITUD REPARACIÓN Q 16,800.00] Camión CAM-B10-042 - Agencia Central

Estimada Odalys e Ing. Morales,
Se remite cotización para camión botellero de 10 bahías con fuga en compresor y cortinas trabadas.
Monto: Q16,800.00. Adjuntamos fotos de la inspección mecánica.`,
    metodoIngreso: 'portal_outsourcing',
    creadoEn: '2026-09-22T08:30:00.000Z'
  },
  {
    id: 'rep-002',
    codigoAutorizacion: 'AUT-FLOTA-GT-105',
    fechaSolicitud: '2026-09-22T11:20:00.000Z',
    fechaAutorizacion: '2026-09-22T11:45:00.000Z',
    monto: 6500, // < Q10,000 -> Coordinación directa
    moneda: 'GTQ',
    camionId: 'CAM-B08-019',
    placaCamion: 'C-311BQL',
    cantidadBahias: 8,
    tipoBebida: 'No Carbonatadas',
    agencia: 'Agencia Cuyotenango',
    jroId: 'jro-litoral',
    jroNombre: 'Ing. Luis Secaida',
    jroEmail: 'luis.secaida@embotelladora.com.gt',
    motivoReparacion: 'Cambio de 8 rodillos de cortinas de bahías botelleras y servicio preventivo de lubricación y retenedores',
    categoriaReparacion: 'Bahías & Cortinas Corredizas',
    imagenEvidenciaUrl: bayTruckImg,
    cotizacionNumero: 'COT-DIESEL-2026-892',
    tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
    contactoTaller: 'Ing. Manuel Rivas',
    emailTaller: 'servicios@dieselguate.com',
    telefonoTaller: '+502 2334-9900',
    requiereVoBoJRO: false,
    estado: 'Autorizado',
    autorizadoPor: 'Odalys Velasco (Coordinadora de Flota)',
    notas: 'Aprobación directa por monto menor a Q10,000. Unidad de ruta de agua purificada lista para salir en Cuyotenango.',
    correoSoporteEnviado: true,
    ultimoCorreoEnviadoEn: '2026-09-22T11:25:00.000Z',
    asuntoCorreo: '[SOLICITUD REPARACIÓN Q 6,500.00] Camión CAM-B08-019 - Agencia Cuyotenango',
    metodoIngreso: 'portal_outsourcing',
    creadoEn: '2026-09-22T11:20:00.000Z'
  },
  {
    id: 'rep-003',
    codigoAutorizacion: 'AUT-FLOTA-GT-106',
    fechaSolicitud: '2026-09-23T09:10:00.000Z',
    monto: 24500, // >= Q10,000 -> PENDIENTE JRO CENTRO OCCIDENTE (Kenneth Muñoz)
    moneda: 'GTQ',
    camionId: 'CAM-B12-077',
    placaCamion: 'C-780BLZ',
    cantidadBahias: 12,
    tipoBebida: 'Carbonatadas',
    agencia: 'Agencia Quetzaltenango (Xela)',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    motivoReparacion: 'Reparación integral de caja de velocidades Eaton Fuller y cambio de plato opresor de embrague cerámico para carga pesada',
    categoriaReparacion: 'Transmisión & Embrague',
    imagenEvidenciaUrl: engineRepairImg,
    cotizacionNumero: 'COT-TALLER-XELA-411',
    tallerNombre: 'Mecánica Pesada de Occidente (Outsourcing)',
    contactoTaller: 'Téc. Byron Gómez',
    emailTaller: 'repuestos.xela@mecanica.gt',
    telefonoTaller: '+502 7765-1200',
    requiereVoBoJRO: true,
    estado: 'Requiere Vo.Bo. JRO',
    notas: 'En espera del Visto Bueno formal del Lic. Kenneth Muñoz (JRO Centro Occidente). Soporte enviado por correo a su buzón de Outlook.',
    correoSoporteEnviado: true,
    ultimoCorreoEnviadoEn: '2026-09-23T09:15:00.000Z',
    asuntoCorreo: '[SOLICITUD REPARACIÓN Q 24,500.00] Camión CAM-B12-077 - Agencia Quetzaltenango (Xela) (REQUIERE VO.BO. JRO)',
    metodoIngreso: 'portal_outsourcing',
    creadoEn: '2026-09-23T09:10:00.000Z'
  },
  {
    id: 'rep-004',
    codigoAutorizacion: 'AUT-FLOTA-GT-107',
    fechaSolicitud: '2026-09-23T10:05:00.000Z',
    fechaAutorizacion: '2026-09-23T10:30:00.000Z',
    monto: 13200, // >= Q10,000 -> Autorizado JRO Litoral (Luis Secaida)
    moneda: 'GTQ',
    camionId: 'CAM-B10-063',
    placaCamion: 'C-554BKM',
    cantidadBahias: 10,
    tipoBebida: 'Mixto',
    agencia: 'Agencia Escuintla',
    jroId: 'jro-litoral',
    jroNombre: 'Ing. Luis Secaida',
    jroEmail: 'luis.secaida@embotelladora.com.gt',
    motivoReparacion: 'Reconstrucción de paquete de muelles traseros y cambio de 4 amortiguadores reforzados para ruta de Costa Sur',
    categoriaReparacion: 'Suspensión & Chasis',
    imagenEvidenciaUrl: bayTruckImg,
    cotizacionNumero: 'COT-COSTA-SUR-190',
    tallerNombre: 'Mantenimiento del Sur S.A. (Outsourcing)',
    contactoTaller: 'Ing. Danilo Cifuentes',
    emailTaller: 'danilo@talleresdelsur.com',
    telefonoTaller: '+502 7888-4321',
    requiereVoBoJRO: true,
    estado: 'Autorizado',
    autorizadoPor: 'Ing. Luis Secaida (JRO Litoral) & Odalys Velasco',
    notas: 'Aprobado por el Ing. Luis Secaida vía correo electrónico de Outlook corporativo.',
    correoSoporteEnviado: true,
    ultimoCorreoEnviadoEn: '2026-09-23T10:10:00.000Z',
    asuntoCorreo: '[SOLICITUD REPARACIÓN Q 13,200.00] Camión CAM-B10-063 - Agencia Escuintla (REQUIERE VO.BO. JRO)',
    metodoIngreso: 'webhook',
    creadoEn: '2026-09-23T10:05:00.000Z'
  },
  {
    id: 'rep-005',
    codigoAutorizacion: 'AUT-FLOTA-GT-108',
    fechaSolicitud: '2026-09-23T11:40:00.000Z',
    monto: 8900, // < Q10,000 -> Pendiente Coordinación
    moneda: 'GTQ',
    camionId: 'CAM-B06-012',
    placaCamion: 'C-198BPR',
    cantidadBahias: 6,
    tipoBebida: 'No Carbonatadas',
    agencia: 'Agencia Cunen',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    motivoReparacion: 'Mantenimiento preventivo bimensual tipo B: filtros de aire, diésel, aceite sintético 15W40 y calibración de inyectores',
    categoriaReparacion: 'Mantenimiento Preventivo',
    imagenEvidenciaUrl: engineRepairImg,
    cotizacionNumero: 'COT-DIESEL-2026-905',
    tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
    contactoTaller: 'Ing. Manuel Rivas',
    emailTaller: 'servicios@dieselguate.com',
    telefonoTaller: '+502 2334-9900',
    requiereVoBoJRO: false,
    estado: 'Pendiente Coordinación',
    notas: 'Ingresado recientemente por el taller outsourcing para la Agencia Cunen. Requiere autorización de Odalys Velasco.',
    correoSoporteEnviado: false,
    asuntoCorreo: '[SOLICITUD REPARACIÓN Q 8,900.00] Camión CAM-B06-012 - Agencia Cunen',
    metodoIngreso: 'portal_outsourcing',
    creadoEn: '2026-09-23T11:40:00.000Z'
  },
  {
    id: 'rep-006',
    codigoAutorizacion: 'AUT-FLOTA-GT-109',
    fechaSolicitud: '2026-09-23T12:05:00.000Z',
    monto: 11400, // >= Q10,000 -> Requiere JRO Centro Occidente (Kenneth Muñoz)
    moneda: 'GTQ',
    camionId: 'CAM-B10-091',
    placaCamion: 'C-602BMT',
    cantidadBahias: 10,
    tipoBebida: 'Carbonatadas',
    agencia: 'Agencia Encuentros',
    jroId: 'jro-centro-occidente',
    jroNombre: 'Lic. Kenneth Muñoz',
    jroEmail: 'kenneth.munoz@embotelladora.com.gt',
    motivoReparacion: 'Reemplazo de motor de arranque y alternador de 24V de alta capacidad, más cambio de 2 baterías de ciclo pesado para camión de bahías',
    categoriaReparacion: 'Sistema Eléctrico & Baterías',
    imagenEvidenciaUrl: engineRepairImg,
    cotizacionNumero: 'COT-SOLOLA-331',
    tallerNombre: 'Electro-Diésel del Altiplano (Outsourcing)',
    contactoTaller: 'Ing. Sergio Pineda',
    emailTaller: 'sergio@electrodiesel.gt',
    telefonoTaller: '+502 7762-5544',
    requiereVoBoJRO: true,
    estado: 'Requiere Vo.Bo. JRO',
    notas: 'Esperando visto bueno de Lic. Kenneth Muñoz (JRO Centro Occidente). Se envió correo de soporte.',
    correoSoporteEnviado: true,
    ultimoCorreoEnviadoEn: '2026-09-23T12:08:00.000Z',
    asuntoCorreo: '[SOLICITUD REPARACIÓN Q 11,400.00] Camión CAM-B10-091 - Agencia Encuentros (REQUIERE VO.BO. JRO)',
    metodoIngreso: 'portal_outsourcing',
    creadoEn: '2026-09-23T12:05:00.000Z'
  }
];

export const INITIAL_DATA: AppStateData = {
  jrosDisponibles: JROS_DISPONIBLES,
  agenciasDisponibles: AGENCIAS_DISPONIBLES,
  departamentosDisponibles: AGENCIAS_DISPONIBLES.map(a => a.nombre),
  configuracionMensual: GENERAR_CONFIGURACION_ANUAL_2026(),
  outlookConnection: {
    connected: true,
    email: 'odalys.velasco@embotelladora.com.gt',
    name: 'Odalys Velasco',
    cargo: 'Coordinadora de Flota de Distribución',
    tenantName: 'Microsoft 365 Corporativo (Embotelladora GT)',
    autoSyncEnabled: true,
    lastSyncAt: '2026-09-23T11:45:00.000Z',
    syncIntervalMinutes: 5,
    totalSyncedCount: 14,
    inboxFilterKeywords: [
      'Reparación',
      'Camión Bahías',
      'Autorización JRO',
      'Quetzales',
      'AUT-FLOTA',
      'Visto Bueno'
    ]
  },
  aprobaciones: INITIAL_REPAIR_RECORDS,
  usuariosDisponibles: USUARIOS_DISPONIBLES
};

export const SAMPLE_OUTLOOK_EMAILS = [
  {
    title: 'Aprobación JRO Centro Occidente - Reparación Caja CAM-B12-077',
    subject: 'AUTORIZADO: Reparación mayor transmisión Camión CAM-B12-077 - Agencia Quetzaltenango',
    from: 'kenneth.munoz@embotelladora.com.gt',
    body: `De: Lic. Kenneth Muñoz <kenneth.munoz@embotelladora.com.gt>
Enviado el: miércoles, 23 de septiembre de 2026 10:15
Para: Odalys Velasco <odalys.velasco@embotelladora.com.gt>
CC: Mecánica Pesada de Occidente <repuestos.xela@mecanica.gt>
Asunto: AUTORIZADO: Reparación mayor transmisión Camión CAM-B12-077 - Agencia Quetzaltenango

Estimada Odalys,

Revisé el diagnóstico del taller y la cotización por Q 24,500.00 GTQ para el camión de 12 bahías de reparto de bebidas carbonatadas CAM-B12-077 de la Agencia Quetzaltenango.

Por medio de este correo doy mi VISTO BUENO y AUTORIZACIÓN como Jefe Regional de Operaciones (JRO Centro Occidente) bajo el código AUT-FLOTA-GT-106.

Favor de indicar al outsourcing que procedan con la reparación inmediatamente para no atrasar las rutas de entrega.

Saludos cordiales,
Lic. Kenneth Muñoz
Jefe Regional de Operaciones - Centro Occidente`
  },
  {
    title: 'Solicitud Taller Outsourcing - Sistema de Frenos CAM-B10-055',
    subject: 'SOLICITUD PRESUPUESTO: Cambio de tambores y zapatas Camión CAM-B10-055 Agencia Chimaltenango',
    from: 'servicios@dieselguate.com',
    body: `De: Manuel Rivas <servicios@dieselguate.com>
Enviado el: miércoles, 23 de septiembre de 2026 09:30
Para: Odalys Velasco <odalys.velasco@embotelladora.com.gt>
Asunto: SOLICITUD PRESUPUESTO: Cambio de tambores y zapatas Camión CAM-B10-055 Agencia Chimaltenango

Estimada Coordinadora Odalys Velasco,

Le saludamos de Talleres Diésel de Guatemala S.A. Le presentamos la cotización para el camión botellero de 10 bahías CAM-B10-055 asignado a la Agencia Chimaltenango:

- Trabajo: Rectificación de tambores traseros, cambio de 4 zapatas de frenos y reemplazo de mangueras neumáticas.
- Monto total: Q 7,800.00 Quetzales
- Código propuesto: AUT-FLOTA-GT-110
- Tiempo de entrega estimado: 24 horas.

Quedamos a la espera de su autorización para iniciar el desmontaje.

Atentamente,
Ing. Manuel Rivas
Jefe de Mantenimiento de Flota - Outsourcing`
  },
  {
    title: 'Vo.Bo. JRO Litoral - Reparación Paquete Muelles CAM-B10-063',
    subject: 'VISTO BUENO JRO LITORAL: Reparación suspensión Camión CAM-B10-063 Agencia Escuintla',
    from: 'luis.secaida@embotelladora.com.gt',
    body: `De: Ing. Luis Secaida <luis.secaida@embotelladora.com.gt>
Enviado el: miércoles, 23 de septiembre de 2026 11:30
Para: Odalys Velasco <odalys.velasco@embotelladora.com.gt>
Asunto: VISTO BUENO JRO LITORAL: Reparación suspensión Camión CAM-B10-063 Agencia Escuintla

Odalys,

Como JRO Litoral autorizo el gasto de Q 13,200.00 GTQ para el camión botellero CAM-B10-063 de la Agencia Escuintla.
Código de autorización: AUT-FLOTA-GT-107.

Favor de registrarlo en la plataforma de flota y coordinar la entrega de la unidad reparada.

Ing. Luis Secaida
Jefe Regional de Operaciones - Región Litoral`
  }
];
