import * as XLSX from 'xlsx';
import { ApprovalRecord, AgenciaInfo, JROInfo, MonthlyBudgetConfig } from '../types/budget';
import { formatSimpleDate } from './budgetUtils';

export interface ExportOptions {
  filename?: string;
  includeBudgetSummary?: boolean;
  includeJROSummary?: boolean;
  selectedMonth?: string;
  filterLabel?: string;
}

/**
 * Generates and downloads a complete, professional Excel workbook (.xlsx)
 * with the fleet repair records and executive summaries.
 */
export function exportRepairsToExcel(
  records: ApprovalRecord[],
  agencias: AgenciaInfo[] = [],
  jros: JROInfo[] = [],
  budgetConfig?: MonthlyBudgetConfig,
  options: ExportOptions = {}
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];
  const defaultFilename = `Flota_Reparaciones_Bahias_${options.selectedMonth || dateStr}.xlsx`;
  const filename = options.filename?.endsWith('.xlsx') ? options.filename : `${options.filename || defaultFilename}`;

  // -------------------------------------------------------------
  // Sheet 1: Registros Detallados de Reparaciones
  // -------------------------------------------------------------
  const repairsData = records.map((r, index) => {
    // Find agency info
    const ag = agencias.find(a => a.nombre === r.agencia);
    const jro = jros.find(j => j.id === r.jroId || j.id === ag?.jroId);
    const requiereVoBo = r.monto >= 10000 || r.requiereVoBoJRO;

    return {
      'No.': index + 1,
      'Código de Folio': r.codigoAutorizacion || `REP-${r.id}`,
      'Fecha Solicitud': r.fechaSolicitud ? formatSimpleDate(r.fechaSolicitud) : '',
      'Fecha Autorización': r.fechaAutorizacion ? formatSimpleDate(r.fechaAutorizacion) : 'Pendiente',
      'Camión ID': r.camionId,
      'Placa': r.placaCamion || 'N/A',
      'Bahías': r.cantidadBahias ? `${r.cantidadBahias} Bahías` : 'N/A',
      'Tipo de Bebida': r.tipoBebida || 'Mixto',
      'Agencia': r.agencia,
      'Región Operativa': ag?.region || jro?.region || 'N/A',
      'JRO Responsable': r.jroNombre || jro?.nombre || ag?.jroNombre || 'N/A',
      'Correo JRO': r.jroEmail || jro?.correo || ag?.jroEmail || 'N/A',
      'Categoría Reparación': r.categoriaReparacion || 'General',
      'Diagnóstico / Motivo': r.motivoReparacion || '',
      'Monto (Q)': Number(r.monto || 0),
      'Moneda': 'GTQ (Q)',
      'Regla ≥ Q10,000': requiereVoBo ? 'SÍ (Requiere Vo.Bo. JRO)' : 'NO (< Q10,000)',
      'Estado': r.estado,
      'Autorizado Por': r.autorizadoPor || (r.estado === 'Autorizado' ? 'Odalys Velasco (Coordinación)' : 'Pendiente'),
      'Taller Outsourcing': r.tallerNombre || 'Outsourcing Flota',
      'Contacto Taller': r.contactoTaller || '',
      'Teléfono Taller': r.telefonoTaller || '',
      'Email Taller': r.emailTaller || '',
      'No. Cotización': r.cotizacionNumero || 'N/A',
      'Soporte Outlook Enviado': r.correoSoporteEnviado ? 'SÍ' : 'NO',
      'Método de Registro': r.metodoIngreso === 'portal_outsourcing' ? 'Portal Outsourcing' : 
                            r.metodoIngreso === 'outlook_ia' ? 'Correo Outlook (IA)' : 
                            r.metodoIngreso === 'webhook' ? 'Integración API' : 'Manual',
      'Notas / Observaciones': r.notas || ''
    };
  });

  const wsRepairs = XLSX.utils.json_to_sheet(repairsData);

  // Set column widths for readability
  const repairsColWidths = [
    { wch: 6 },   // No.
    { wch: 22 },  // Código de Folio
    { wch: 16 },  // Fecha Solicitud
    { wch: 18 },  // Fecha Autorización
    { wch: 15 },  // Camión ID
    { wch: 13 },  // Placa
    { wch: 12 },  // Bahías
    { wch: 18 },  // Tipo de Bebida
    { wch: 20 },  // Agencia
    { wch: 26 },  // Región Operativa
    { wch: 22 },  // JRO Responsable
    { wch: 28 },  // Correo JRO
    { wch: 26 },  // Categoría Reparación
    { wch: 45 },  // Diagnóstico
    { wch: 15 },  // Monto (Q)
    { wch: 10 },  // Moneda
    { wch: 25 },  // Regla >= Q10k
    { wch: 24 },  // Estado
    { wch: 28 },  // Autorizado Por
    { wch: 26 },  // Taller Outsourcing
    { wch: 22 },  // Contacto Taller
    { wch: 18 },  // Teléfono Taller
    { wch: 26 },  // Email Taller
    { wch: 18 },  // No. Cotización
    { wch: 22 },  // Soporte Outlook
    { wch: 20 },  // Método Registro
    { wch: 30 }   // Notas
  ];
  wsRepairs['!cols'] = repairsColWidths;

  XLSX.utils.book_append_sheet(wb, wsRepairs, 'Reparaciones de Flota');

  // -------------------------------------------------------------
  // Sheet 2: Resumen Presupuestos por Agencia
  // -------------------------------------------------------------
  if (options.includeBudgetSummary !== false && agencias.length > 0) {
    const budgetMap = budgetConfig?.presupuestosPorAgencia || {};
    
    const agencyData = agencias.map((ag, index) => {
      const assigned = budgetMap[ag.nombre] ?? ag.presupuestoMensualQ ?? 0;
      
      const agencyRepairs = records.filter(r => r.agencia === ag.nombre);
      const authorizedRepairs = agencyRepairs.filter(r => r.estado === 'Autorizado');
      const authorizedQ = authorizedRepairs.reduce((sum, r) => sum + (r.monto || 0), 0);
      const pendingQ = agencyRepairs
        .filter(r => r.estado !== 'Autorizado' && r.estado !== 'Rechazado')
        .reduce((sum, r) => sum + (r.monto || 0), 0);
      
      const remainingQ = assigned - authorizedQ;
      const pct = assigned > 0 ? ((authorizedQ / assigned) * 100).toFixed(1) + '%' : '0.0%';

      let budgetStatus = 'Dentro de Presupuesto';
      if (assigned > 0 && authorizedQ > assigned) {
        budgetStatus = 'EXCEDIDO';
      } else if (assigned > 0 && (authorizedQ / assigned) >= 0.85) {
        budgetStatus = 'ALERTA (≥ 85%)';
      }

      return {
        'No.': index + 1,
        'Agencia': ag.nombre,
        'Región': ag.region,
        'JRO Asignado': ag.jroNombre,
        'Presupuesto Asignado (Q)': Number(assigned),
        'Monto Autorizado (Q)': Number(authorizedQ),
        'Monto Pendiente Vo.Bo. (Q)': Number(pendingQ),
        'Saldo Disponible (Q)': Number(remainingQ),
        '% Ejecutado': pct,
        'Estado Presupuesto': budgetStatus,
        'Total Reparaciones': agencyRepairs.length,
        'Reparaciones Autorizadas': authorizedRepairs.length
      };
    });

    // Add totals row
    const totalAssigned = agencyData.reduce((s, a) => s + a['Presupuesto Asignado (Q)'], 0);
    const totalAuth = agencyData.reduce((s, a) => s + a['Monto Autorizado (Q)'], 0);
    const totalPending = agencyData.reduce((s, a) => s + a['Monto Pendiente Vo.Bo. (Q)'], 0);
    const totalRem = totalAssigned - totalAuth;
    const totalPct = totalAssigned > 0 ? ((totalAuth / totalAssigned) * 100).toFixed(1) + '%' : '0.0%';

    agencyData.push({
      'No.': 99,
      'Agencia': 'TOTAL CONSOLIDADO',
      'Región': '13 Agencias',
      'JRO Asignado': 'Consolidado Nacional',
      'Presupuesto Asignado (Q)': Number(totalAssigned),
      'Monto Autorizado (Q)': Number(totalAuth),
      'Monto Pendiente Vo.Bo. (Q)': Number(totalPending),
      'Saldo Disponible (Q)': Number(totalRem),
      '% Ejecutado': totalPct,
      'Estado Presupuesto': totalAuth > totalAssigned ? 'EXCEDIDO' : 'OPERATIVO',
      'Total Reparaciones': records.length,
      'Reparaciones Autorizadas': records.filter(r => r.estado === 'Autorizado').length
    });

    const wsAgency = XLSX.utils.json_to_sheet(agencyData);
    wsAgency['!cols'] = [
      { wch: 6 },   // No
      { wch: 24 },  // Agencia
      { wch: 24 },  // Región
      { wch: 24 },  // JRO
      { wch: 22 },  // Presupuesto Asignado
      { wch: 20 },  // Monto Autorizado
      { wch: 22 },  // Pendiente
      { wch: 20 },  // Saldo
      { wch: 14 },  // %
      { wch: 22 },  // Estado
      { wch: 18 },  // Total Rep
      { wch: 22 }   // Rep Autorizadas
    ];

    XLSX.utils.book_append_sheet(wb, wsAgency, 'Resumen Presupuestos');
  }

  // -------------------------------------------------------------
  // Sheet 3: Resumen por JRO (Jefatura Regional de Operaciones)
  // -------------------------------------------------------------
  if (options.includeJROSummary !== false && jros.length > 0) {
    const jroSummaryData = jros.map((j, idx) => {
      // Find all repairs under this JRO
      const jroRepairs = records.filter(r => {
        const ag = agencias.find(a => a.nombre === r.agencia);
        return r.jroId === j.id || ag?.jroId === j.id;
      });

      const totalMonto = jroRepairs.reduce((s, r) => s + (r.monto || 0), 0);
      const authMonto = jroRepairs.filter(r => r.estado === 'Autorizado').reduce((s, r) => s + (r.monto || 0), 0);
      const pendingVoBo = jroRepairs.filter(r => r.estado === 'Requiere Vo.Bo. JRO');
      const pendingVoBoMonto = pendingVoBo.reduce((s, r) => s + (r.monto || 0), 0);
      const over10kCount = jroRepairs.filter(r => r.monto >= 10000).length;

      return {
        'No.': idx + 1,
        'Jefe Regional (JRO)': j.nombre,
        'Región Asignada': j.region,
        'Correo': j.correo,
        'Teléfono': j.telefono,
        'Agencias a Cargo': j.agenciasAsignadas.join(', '),
        'Reparaciones Totales': jroRepairs.length,
        'Reparaciones ≥ Q10k': over10kCount,
        'Pendientes de Vo.Bo. JRO': pendingVoBo.length,
        'Monto Pendiente Vo.Bo. (Q)': Number(pendingVoBoMonto),
        'Monto Total Autorizado (Q)': Number(authMonto),
        'Monto Total Solicitado (Q)': Number(totalMonto)
      };
    });

    const wsJRO = XLSX.utils.json_to_sheet(jroSummaryData);
    wsJRO['!cols'] = [
      { wch: 6 },   // No
      { wch: 25 },  // JRO
      { wch: 25 },  // Region
      { wch: 28 },  // Email
      { wch: 16 },  // Telefono
      { wch: 38 },  // Agencias
      { wch: 18 },  // Rep Totales
      { wch: 18 },  // Rep >= 10k
      { wch: 22 },  // Pendientes VoBo
      { wch: 24 },  // Monto Pendiente
      { wch: 24 },  // Monto Autorizado
      { wch: 24 }   // Monto Total
    ];

    XLSX.utils.book_append_sheet(wb, wsJRO, 'Resumen JROs');
  }

  // -------------------------------------------------------------
  // Write file and trigger browser download
  // -------------------------------------------------------------
  XLSX.writeFile(wb, filename);
}
