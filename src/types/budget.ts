export type BebidaTipo = 'Carbonatadas' | 'No Carbonatadas' | 'Mixto';

export type CategoriaReparacion = 
  | 'Frenos & Neumática'
  | 'Motor & Inyección Diésel'
  | 'Bahías & Cortinas Corredizas'
  | 'Suspensión & Chasis'
  | 'Transmisión & Embrague'
  | 'Sistema Eléctrico & Baterías'
  | 'Mantenimiento Preventivo';

export type EstadoAprobacion = 
  | 'Pendiente Coordinación'
  | 'Requiere Vo.Bo. JRO'
  | 'Autorizado'
  | 'Rechazado';

export interface JROInfo {
  id: string;
  nombre: string;
  correo: string;
  region: string;
  telefono: string;
  agenciasAsignadas: string[];
}

export interface AgenciaInfo {
  id: string;
  nombre: string;
  region: string;
  jroId: string;
  jroNombre: string;
  jroEmail: string;
  presupuestoMensualQ: number;
}

export interface ApprovalRecord {
  id: string;
  codigoAutorizacion: string;
  fechaSolicitud: string; // ISO string
  fechaAutorizacion?: string;
  monto: number; // Monto en Quetzales (Q)
  moneda: string; // 'GTQ' (Q)
  
  // Datos del camión de reparto
  camionId: string; // Ej: CAM-B10-042
  placaCamion: string; // Ej: C-482BKX
  cantidadBahias: number; // 6, 8, 10, 12 bahías
  tipoBebida: BebidaTipo;
  
  // Agencia y JRO
  agencia: string; // Una de las 13 agencias
  jroId: string;
  jroNombre: string;
  jroEmail: string;
  
  // Reparación
  motivoReparacion: string;
  categoriaReparacion: CategoriaReparacion;
  imagenEvidenciaUrl?: string; // Foto de la avería o cotización
  cotizacionNumero?: string;
  
  // Datos del taller Outsourcing
  tallerNombre: string;
  contactoTaller: string;
  emailTaller: string;
  telefonoTaller?: string;
  
  // Regla de aprobación
  requiereVoBoJRO: boolean; // true si monto >= 10000
  estado: EstadoAprobacion;
  autorizadoPor?: string;
  notas?: string;
  
  // Soporte Outlook
  correoSoporteEnviado?: boolean;
  ultimoCorreoEnviadoEn?: string;
  asuntoCorreo: string;
  cuerpoCorreoOriginal?: string;
  
  metodoIngreso: 'portal_outsourcing' | 'outlook_ia' | 'webhook' | 'manual';
  creadoEn: string;
  
  // Compatibilidad legacy
  solicitanteNombre?: string;
  solicitanteEmail?: string;
  autorizadorNombre?: string;
  autorizadorEmail?: string;
  departamento?: string;
  concepto?: string;
  confianzaExtraccion?: number;
}

export interface AgencyBudgetSummary {
  agencia: string;
  region: string;
  jroNombre: string;
  asignadoQ: number;
  autorizadoQ: number;
  disponibleQ: number;
  porcentaje: number;
  conteoReparaciones: number;
}

export interface MonthlyBudgetConfig {
  mesAno: string; // Formato YYYY-MM, ej. "2026-09"
  presupuestoTotal: number; // en Quetzales
  moneda: string; // 'GTQ'
  umbralAlerta: number; // Porcentaje, ej. 85
  presupuestosPorAgencia: Record<string, number>;
  presupuestosPorDepartamento?: Record<string, number>; // compatibilidad
}

export interface OutlookConnectionConfig {
  connected: boolean;
  email: string;
  name: string;
  cargo: string;
  tenantName?: string;
  autoSyncEnabled: boolean;
  lastSyncAt: string | null;
  syncIntervalMinutes: number;
  totalSyncedCount: number;
  inboxFilterKeywords: string[];
}

export type UserRole = 'ADMIN' | 'JRO' | 'SOLICITANTE' | 'AUDITOR';

export interface UserProfile {
  id: string;
  nombre: string;
  correo: string;
  rol: UserRole;
  cargo: string;
  avatarUrl?: string;
  jroId?: string; // Solo aplica si rol === 'JRO' (ej: 'jro-central')
  region?: string;
  agenciaId?: string;
  tallerNombre?: string;
  telefono?: string;
  pinAcceso?: string;
  descripcion: string;
  puedeAutorizar: boolean; // SOLO ODALYS VELASCO / ADMINS TIENEN PERMISO DE AUTORIZACIÓN FINAL
  fechaCreacion?: string;
}

export interface AppStateData {
  configuracionMensual: Record<string, MonthlyBudgetConfig>;
  aprobaciones: ApprovalRecord[];
  agenciasDisponibles: AgenciaInfo[];
  jrosDisponibles: JROInfo[];
  departamentosDisponibles: string[];
  outlookConnection?: OutlookConnectionConfig;
  usuariosDisponibles?: UserProfile[];
}
