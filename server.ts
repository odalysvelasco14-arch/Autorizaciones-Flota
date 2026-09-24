import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import * as XLSX from 'xlsx';
import { INITIAL_DATA, JROS_DISPONIBLES, AGENCIAS_DISPONIBLES } from './src/data/mockData.ts';
import type { AppStateData, ApprovalRecord, UserProfile } from './src/types/budget.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Persistent Data File
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'budget_data.json');

function loadData(): AppStateData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.agenciasDisponibles && parsed.aprobaciones && parsed.configuracionMensual) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading data file, using default fleet data:', err);
  }
  // Initialize file with default fleet data
  saveData(INITIAL_DATA);
  return INITIAL_DATA;
}

function saveData(data: AppStateData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving data to file:', err);
  }
}

// In-memory reference initialized from file
let appState: AppStateData = loadData();
if (!appState.agenciasDisponibles) {
  appState = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveData(appState);
}
if (!appState.usuariosDisponibles || appState.usuariosDisponibles.length === 0) {
  appState.usuariosDisponibles = JSON.parse(JSON.stringify(INITIAL_DATA.usuariosDisponibles || []));
  saveData(appState);
}

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// Reusable AI / Heuristic Extraction Function for Fleet Bay Truck Repairs
async function extractApprovalWithAI(emailText: string, subject?: string): Promise<Partial<ApprovalRecord>> {
  const agenciasList = AGENCIAS_DISPONIBLES.map(a => `${a.nombre} (JRO: ${a.jroNombre})`).join('\n');

  const prompt = `Analiza el siguiente correo electrónico de Microsoft Outlook sobre la AUTORIZACIÓN O REPARACIÓN DE CAMIONES DE BAHÍAS para entrega de bebidas carbonatadas y no carbonatadas.

Reglas del negocio de flota:
1. Moneda: Siempre Quetzales guatemaltecos ('GTQ' / Q).
2. Agencias disponibles (13 en total):
${agenciasList}
3. Si el monto es igual o mayor a Q10,000 (monto >= 10000), la aprobación REQUIERE OBLIGATORIAMENTE la autorización del JRO (Jefe Regional de Operaciones) asignado a la agencia.
4. Extrae:
- codigoAutorizacion (ej. AUT-FLOTA-GT-115)
- monto (número flotante en Quetzales)
- camionId (ej. CAM-B10-042)
- cantidadBahias (6, 8, 10, o 12)
- tipoBebida ('Carbonatadas', 'No Carbonatadas' o 'Mixto')
- agencia (de las 13 agencias)
- motivoReparacion (descripción técnica clara de la reparación)
- categoriaReparacion ('Frenos & Neumática' | 'Motor & Inyección Diésel' | 'Bahías & Cortinas Corredizas' | 'Suspensión & Chasis' | 'Transmisión & Embrague' | 'Sistema Eléctrico & Baterías' | 'Mantenimiento Preventivo')
- estado: Si autoriza el JRO o la Coordinación -> 'Autorizado'. Si es >= Q10,000 y solo se solicita -> 'Requiere Vo.Bo. JRO'. Si es < Q10,000 y se solicita -> 'Pendiente Coordinación'. Si se rechaza -> 'Rechazado'.

Texto del correo:
${emailText}
`;

  if (ai) {
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                codigoAutorizacion: { type: Type.STRING },
                monto: { type: Type.NUMBER },
                camionId: { type: Type.STRING },
                cantidadBahias: { type: Type.INTEGER },
                tipoBebida: { type: Type.STRING, enum: ['Carbonatadas', 'No Carbonatadas', 'Mixto'] },
                agencia: { type: Type.STRING },
                motivoReparacion: { type: Type.STRING },
                categoriaReparacion: { 
                  type: Type.STRING, 
                  enum: [
                    'Frenos & Neumática',
                    'Motor & Inyección Diésel',
                    'Bahías & Cortinas Corredizas',
                    'Suspensión & Chasis',
                    'Transmisión & Embrague',
                    'Sistema Eléctrico & Baterías',
                    'Mantenimiento Preventivo'
                  ] 
                },
                estado: { 
                  type: Type.STRING, 
                  enum: ['Pendiente Coordinación', 'Requiere Vo.Bo. JRO', 'Autorizado', 'Rechazado'] 
                },
                notas: { type: Type.STRING }
              },
              required: ['codigoAutorizacion', 'monto', 'camionId', 'agencia', 'motivoReparacion', 'estado']
            }
          }
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          const agMatch = AGENCIAS_DISPONIBLES.find(a => a.nombre.toLowerCase() === (parsed.agencia || '').toLowerCase()) || AGENCIAS_DISPONIBLES[0];
          const requiereVoBoJRO = (parsed.monto || 0) >= 10000;

          return {
            ...parsed,
            moneda: 'GTQ',
            placaCamion: 'C-482BKX',
            cantidadBahias: parsed.cantidadBahias || 10,
            tipoBebida: parsed.tipoBebida || 'Carbonatadas',
            agencia: agMatch.nombre,
            jroId: agMatch.jroId,
            jroNombre: agMatch.jroNombre,
            jroEmail: agMatch.jroEmail,
            requiereVoBoJRO,
            tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
            contactoTaller: 'Ing. Manuel Rivas',
            emailTaller: 'servicios@dieselguate.com',
            asuntoCorreo: subject || `Solicitud Reparación Camión ${parsed.camionId} - ${agMatch.nombre}`,
            cuerpoCorreoOriginal: emailText,
            fechaSolicitud: new Date().toISOString()
          };
        }
      } catch (geminiErr: any) {
        console.warn(`Error invoking Gemini model ${modelName}:`, geminiErr?.message || geminiErr);
      }
    }
  }

  // Heuristic extraction fallback
  let monto = 8500;
  const qMatch = emailText.match(/(?:Q\.?|quetzales|GTQ|\$)\s*([\d,]+(?:\.\d{1,2})?)/i) 
              || emailText.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:Q\.?|quetzales|GTQ)/i);
  if (qMatch) {
    monto = parseFloat(qMatch[1].replace(/,/g, '')) || 8500;
  }

  let camionId = 'CAM-B10-042';
  const truckMatch = emailText.match(/\b(CAM-[A-Z0-9\-]+|C-[0-9]{3,5})\b/i);
  if (truckMatch) camionId = truckMatch[1].toUpperCase();

  let agencia = AGENCIAS_DISPONIBLES[0].nombre;
  for (const ag of AGENCIAS_DISPONIBLES) {
    const simple = ag.nombre.replace('Agencia ', '').split('/')[0].trim().toLowerCase();
    if (emailText.toLowerCase().includes(simple)) {
      agencia = ag.nombre;
      break;
    }
  }
  const agObj = AGENCIAS_DISPONIBLES.find(a => a.nombre === agencia) || AGENCIAS_DISPONIBLES[0];
  const requiereVoBoJRO = monto >= 10000;

  let estado: 'Pendiente Coordinación' | 'Requiere Vo.Bo. JRO' | 'Autorizado' | 'Rechazado' = 'Pendiente Coordinación';
  if (emailText.toLowerCase().includes('autorizad') || emailText.toLowerCase().includes('visto bueno') || emailText.toLowerCase().includes('aprobado')) {
    estado = 'Autorizado';
  } else if (requiereVoBoJRO) {
    estado = 'Requiere Vo.Bo. JRO';
  }

  return {
    codigoAutorizacion: `AUT-FLOTA-GT-${Math.floor(100 + Math.random() * 900)}`,
    monto,
    moneda: 'GTQ',
    camionId,
    placaCamion: 'C-482BKX',
    cantidadBahias: 10,
    tipoBebida: 'Carbonatadas',
    agencia: agObj.nombre,
    jroId: agObj.jroId,
    jroNombre: agObj.jroNombre,
    jroEmail: agObj.jroEmail,
    motivoReparacion: 'Reparación de sistema de frenos neumáticos y ajuste de cortinas de bahías botelleras',
    categoriaReparacion: 'Frenos & Neumática',
    tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
    contactoTaller: 'Ing. Manuel Rivas',
    emailTaller: 'servicios@dieselguate.com',
    requiereVoBoJRO,
    estado,
    asuntoCorreo: subject || `Solicitud de Reparación Camión ${camionId} - ${agencia}`,
    cuerpoCorreoOriginal: emailText,
    fechaSolicitud: new Date().toISOString()
  };
}

// --- API Endpoints ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', role: 'Coordinación de Flota', timestamp: new Date().toISOString() });
});

// Get all state data
app.get('/api/data', (req, res) => {
  res.json(appState);
});

// Outlook status
app.get('/api/outlook/status', (req, res) => {
  res.json(appState.outlookConnection || INITIAL_DATA.outlookConnection);
});

// Update Outlook config
app.post('/api/outlook/config', (req, res) => {
  appState.outlookConnection = {
    ...(appState.outlookConnection || INITIAL_DATA.outlookConnection!),
    ...req.body
  };
  saveData(appState);
  res.json(appState.outlookConnection);
});

// Send Outlook Support Email (Records support dispatch and generates formal mailto)
app.post('/api/outlook/send-support-email', (req, res) => {
  const { repairId } = req.body;
  const index = appState.aprobaciones.findIndex(r => r.id === repairId);
  if (index === -1) {
    return res.status(404).json({ error: 'Reparación no encontrada' });
  }

  const repair = appState.aprobaciones[index];
  repair.correoSoporteEnviado = true;
  repair.ultimoCorreoEnviadoEn = new Date().toISOString();

  if (appState.outlookConnection) {
    appState.outlookConnection.lastSyncAt = new Date().toISOString();
    appState.outlookConnection.totalSyncedCount = (appState.outlookConnection.totalSyncedCount || 0) + 1;
  }

  saveData(appState);

  res.json({
    success: true,
    message: `Soporte de correo para el Camión ${repair.camionId} registrado y enviado exitosamente a ${repair.jroNombre} (${repair.jroEmail}).`,
    repair
  });
});

// Real-time Webhook for Microsoft Power Automate / Graph API
app.post('/api/webhook/outlook-email', async (req, res) => {
  try {
    const { emailText, body, subject, from, senderName } = req.body;
    const content = body || emailText;
    
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'El contenido del correo (body o emailText) es requerido.' });
    }

    const emailSubject = subject || 'Autorización de reparación de camión recibida vía Webhook Outlook';
    const extracted = await extractApprovalWithAI(content, emailSubject);

    if (from && senderName) {
      extracted.contactoTaller = senderName;
      extracted.emailTaller = from;
    }

    const newApproval: ApprovalRecord = {
      id: `rep-webhook-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      codigoAutorizacion: extracted.codigoAutorizacion || `AUT-FLOTA-GT-${Math.floor(100 + Math.random() * 900)}`,
      fechaSolicitud: new Date().toISOString(),
      monto: extracted.monto || 8500,
      moneda: 'GTQ',
      camionId: extracted.camionId || 'CAM-B10-042',
      placaCamion: extracted.placaCamion || 'C-482BKX',
      cantidadBahias: extracted.cantidadBahias || 10,
      tipoBebida: extracted.tipoBebida || 'Carbonatadas',
      agencia: extracted.agencia || AGENCIAS_DISPONIBLES[0].nombre,
      jroId: extracted.jroId || AGENCIAS_DISPONIBLES[0].jroId,
      jroNombre: extracted.jroNombre || AGENCIAS_DISPONIBLES[0].jroNombre,
      jroEmail: extracted.jroEmail || AGENCIAS_DISPONIBLES[0].jroEmail,
      motivoReparacion: extracted.motivoReparacion || 'Mantenimiento de bahías de carga',
      categoriaReparacion: extracted.categoriaReparacion || 'Bahías & Cortinas Corredizas',
      tallerNombre: extracted.tallerNombre || 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
      contactoTaller: extracted.contactoTaller || 'Ing. Manuel Rivas',
      emailTaller: extracted.emailTaller || 'servicios@dieselguate.com',
      requiereVoBoJRO: (extracted.monto || 0) >= 10000,
      estado: extracted.estado || ((extracted.monto || 0) >= 10000 ? 'Requiere Vo.Bo. JRO' : 'Pendiente Coordinación'),
      asuntoCorreo: emailSubject,
      cuerpoCorreoOriginal: content,
      metodoIngreso: 'webhook',
      creadoEn: new Date().toISOString()
    };

    appState.aprobaciones.unshift(newApproval);
    if (appState.outlookConnection) {
      appState.outlookConnection.lastSyncAt = new Date().toISOString();
      appState.outlookConnection.totalSyncedCount = (appState.outlookConnection.totalSyncedCount || 0) + 1;
    }

    saveData(appState);

    return res.status(201).json({
      success: true,
      message: 'Correo de Outlook procesado. Solicitud de reparación de flota registrada.',
      approval: newApproval
    });
  } catch (err: any) {
    console.error('Error processing outlook webhook:', err);
    return res.status(500).json({ error: 'Error al procesar webhook de Outlook: ' + err.message });
  }
});

// Trigger automated Inbox Scan for Fleet emails
let nextPendingIndex = 0;
app.post('/api/outlook/sync', async (req, res) => {
  try {
    const PENDING_FLEET_EMAILS = [
      {
        subject: 'AUTORIZADO JRO: Reparación embrague y caja Camión CAM-B10-088 Agencia San Marcos',
        body: `De: Lic. Roberto Estrada <roberto.estrada@embotelladora.com.gt>
Para: Odalys Velasco <odalys.velasco@embotelladora.com.gt>
Asunto: AUTORIZADO JRO: Reparación embrague y caja Camión CAM-B10-088 Agencia San Marcos

Estimada Odalys,
Como JRO de Occidente AUTORIZO formalmente la reparación del camión botellero de 10 bahías CAM-B10-088 por Q 14,300.00 Quetzales.
Folio asignado: AUT-FLOTA-GT-118.
Favor de dar luz verde al taller outsourcing.`,
        monto: 14300,
        camionId: 'CAM-B10-088',
        agencia: 'Agencia San Marcos'
      },
      {
        subject: 'SOLICITUD: Cambio de cortinas laterales Camión CAM-B08-034 Agencia Mazatenango',
        body: `De: Danilo Cifuentes <danilo@talleresdelsur.com>
Para: Odalys Velasco <odalys.velasco@embotelladora.com.gt>
Asunto: SOLICITUD: Cambio de cortinas laterales Camión CAM-B08-034 Agencia Mazatenango

Estimada Odalys,
Enviamos solicitud de presupuesto por Q 7,200.00 para cambio de 6 cortinas corredizas de bahías del camión CAM-B08-034 de Agencia Mazatenango.
Folio sugerido: AUT-FLOTA-GT-119.`,
        monto: 7200,
        camionId: 'CAM-B08-034',
        agencia: 'Agencia Mazatenango'
      }
    ];

    const emailToProcess = PENDING_FLEET_EMAILS[nextPendingIndex % PENDING_FLEET_EMAILS.length];
    nextPendingIndex++;

    const extracted = await extractApprovalWithAI(emailToProcess.body, emailToProcess.subject);
    
    const agObj = AGENCIAS_DISPONIBLES.find(a => a.nombre === (extracted.agencia || emailToProcess.agencia)) || AGENCIAS_DISPONIBLES[0];
    const monto = extracted.monto || emailToProcess.monto;
    const requiereVoBoJRO = monto >= 10000;

    const newApproval: ApprovalRecord = {
      id: `rep-sync-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      codigoAutorizacion: extracted.codigoAutorizacion || `AUT-FLOTA-GT-${Math.floor(100 + Math.random() * 900)}`,
      fechaSolicitud: new Date().toISOString(),
      monto,
      moneda: 'GTQ',
      camionId: extracted.camionId || emailToProcess.camionId,
      placaCamion: 'C-482BKX',
      cantidadBahias: extracted.cantidadBahias || 10,
      tipoBebida: extracted.tipoBebida || 'Carbonatadas',
      agencia: agObj.nombre,
      jroId: agObj.jroId,
      jroNombre: agObj.jroNombre,
      jroEmail: agObj.jroEmail,
      motivoReparacion: extracted.motivoReparacion || 'Mantenimiento preventivo y correctivo de bahías',
      categoriaReparacion: extracted.categoriaReparacion || 'Bahías & Cortinas Corredizas',
      tallerNombre: 'Talleres Diésel de Guatemala S.A. (Outsourcing)',
      contactoTaller: 'Ing. Manuel Rivas',
      emailTaller: 'servicios@dieselguate.com',
      requiereVoBoJRO,
      estado: extracted.estado || (requiereVoBoJRO ? 'Requiere Vo.Bo. JRO' : 'Pendiente Coordinación'),
      asuntoCorreo: emailToProcess.subject,
      cuerpoCorreoOriginal: emailToProcess.body,
      metodoIngreso: 'outlook_ia',
      creadoEn: new Date().toISOString()
    };

    appState.aprobaciones.unshift(newApproval);
    if (appState.outlookConnection) {
      appState.outlookConnection.lastSyncAt = new Date().toISOString();
      appState.outlookConnection.totalSyncedCount = (appState.outlookConnection.totalSyncedCount || 0) + 1;
    }

    saveData(appState);

    return res.json({
      success: true,
      message: `Correo de Outlook sincronizado: "${emailToProcess.subject}"`,
      newApproval,
      outlookConnection: appState.outlookConnection
    });
  } catch (err: any) {
    console.error('Error during outlook sync:', err);
    return res.status(500).json({ error: 'Error durante la sincronización: ' + err.message });
  }
});

// Parse email endpoint with Gemini (Interactive modal / paste)
app.post('/api/parse-email', async (req, res) => {
  const { emailText, subject } = req.body;
  if (!emailText || typeof emailText !== 'string' || !emailText.trim()) {
    return res.status(400).json({ error: 'El contenido del correo es requerido.' });
  }

  try {
    const extracted = await extractApprovalWithAI(emailText, subject);
    return res.json({
      success: true,
      extracted: {
        ...extracted,
        metodoIngreso: 'outlook_ia'
      }
    });
  } catch (error: any) {
    console.error('Error invoking Gemini for email parsing:', error);
    res.status(500).json({
      error: 'Error al procesar el correo con IA: ' + (error?.message || 'Error desconocido')
    });
  }
});

// Create new repair approval (from Outsourcing Portal or Coordinator)
app.post('/api/approvals', (req, res) => {
  const reqData = req.body;
  const monto = Number(reqData.monto) || 0;
  const requiereVoBoJRO = monto >= 10000;

  // Auto-fill JRO based on agency
  const agencyObj = AGENCIAS_DISPONIBLES.find(a => a.nombre === reqData.agencia) || AGENCIAS_DISPONIBLES[0];

  const approval: ApprovalRecord = {
    ...reqData,
    id: reqData.id || `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    monto,
    moneda: 'GTQ',
    agencia: agencyObj.nombre,
    jroId: agencyObj.jroId,
    jroNombre: agencyObj.jroNombre,
    jroEmail: agencyObj.jroEmail,
    requiereVoBoJRO,
    estado: reqData.estado || (requiereVoBoJRO ? 'Requiere Vo.Bo. JRO' : 'Pendiente Coordinación'),
    fechaSolicitud: reqData.fechaSolicitud || new Date().toISOString(),
    creadoEn: new Date().toISOString()
  };

  appState.aprobaciones.unshift(approval);
  saveData(appState);
  res.status(201).json(approval);
});

// Update repair approval (Authorize by Coordinator or JRO, Reject, etc.)
app.put('/api/approvals/:id', (req, res) => {
  const { id } = req.params;
  const index = appState.aprobaciones.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Registro de reparación no encontrado.' });
  }

  const existing = appState.aprobaciones[index];
  const updatedMonto = req.body.monto !== undefined ? Number(req.body.monto) : existing.monto;
  const requiereVoBoJRO = updatedMonto >= 10000;

  appState.aprobaciones[index] = {
    ...existing,
    ...req.body,
    monto: updatedMonto,
    requiereVoBoJRO,
    id // preserve ID
  };

  saveData(appState);
  res.json(appState.aprobaciones[index]);
});

// Delete approval
app.delete('/api/approvals/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = appState.aprobaciones.length;
  appState.aprobaciones = appState.aprobaciones.filter(a => a.id !== id);
  
  if (appState.aprobaciones.length === initialLength) {
    return res.status(404).json({ error: 'Registro no encontrado.' });
  }

  saveData(appState);
  res.json({ success: true, id });
});

// Update or set monthly budget config
app.post('/api/budgets', (req, res) => {
  const { mesAno, presupuestoTotal, moneda, umbralAlerta, presupuestosPorAgencia, agencias } = req.body;
  if (!mesAno) {
    return res.status(400).json({ error: 'El mes y año (mesAno) son requeridos.' });
  }

  appState.configuracionMensual[mesAno] = {
    mesAno,
    presupuestoTotal: Number(presupuestoTotal) || 350000,
    moneda: moneda || 'GTQ',
    umbralAlerta: Number(umbralAlerta) || 85,
    presupuestosPorAgencia: presupuestosPorAgencia || {},
    presupuestosPorDepartamento: presupuestosPorAgencia || {}
  };

  if (agencias && Array.isArray(agencias)) {
    appState.agenciasDisponibles = agencias;
  }

  saveData(appState);
  res.json({
    config: appState.configuracionMensual[mesAno],
    agencias: appState.agenciasDisponibles
  });
});

// Bulk update entire annual budget matrix (all 12 months)
app.post('/api/budgets/matrix', (req, res) => {
  const { configuracionMensual, agencias, jros } = req.body;
  if (configuracionMensual && typeof configuracionMensual === 'object') {
    appState.configuracionMensual = {
      ...appState.configuracionMensual,
      ...configuracionMensual
    };
  }
  if (agencias && Array.isArray(agencias)) {
    appState.agenciasDisponibles = agencias;
  }
  if (jros && Array.isArray(jros)) {
    appState.jrosDisponibles = jros;
  }
  saveData(appState);
  res.json({
    success: true,
    configuracionMensual: appState.configuracionMensual,
    agencias: appState.agenciasDisponibles,
    jros: appState.jrosDisponibles
  });
});

// Update agencies list directly
app.put('/api/agencias', (req, res) => {
  const { agencias } = req.body;
  if (!Array.isArray(agencias)) {
    return res.status(400).json({ error: 'El campo agencias debe ser un arreglo.' });
  }
  appState.agenciasDisponibles = agencias;
  saveData(appState);
  res.json(appState.agenciasDisponibles);
});

// Add single agency
app.post('/api/agencias', (req, res) => {
  const { nombre, region, jroId, jroNombre, jroEmail, presupuestoMensualQ } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la agencia es requerido.' });
  }

  const cleanName = nombre.trim();
  const existing = appState.agenciasDisponibles.find(a => a.nombre.toLowerCase() === cleanName.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: `La agencia "${cleanName}" ya está registrada.` });
  }

  const targetJRO = appState.jrosDisponibles.find(j => j.id === jroId) || appState.jrosDisponibles[0];
  const newAgency = {
    id: `ag-${Date.now().toString().slice(-6)}`,
    nombre: cleanName,
    region: targetJRO ? targetJRO.region : (region || 'Región Central'),
    jroId: targetJRO ? targetJRO.id : 'jro-central',
    jroNombre: targetJRO ? targetJRO.nombre : (jroNombre || 'Por Asignar'),
    jroEmail: targetJRO ? targetJRO.correo : (jroEmail || 'jro@embotelladora.com.gt'),
    presupuestoMensualQ: Number(presupuestoMensualQ) || 25000
  };

  appState.agenciasDisponibles.push(newAgency);

  // Add to JRO assigned list
  if (targetJRO) {
    targetJRO.agenciasAsignadas = Array.from(new Set([...(targetJRO.agenciasAsignadas || []), cleanName]));
  }

  // Add to monthly configs
  if (appState.configuracionMensual) {
    Object.keys(appState.configuracionMensual).forEach(mKey => {
      const cfg = appState.configuracionMensual[mKey];
      if (cfg && cfg.presupuestosPorAgencia) {
        cfg.presupuestosPorAgencia[cleanName] = newAgency.presupuestoMensualQ;
        if (cfg.presupuestosPorDepartamento) {
          cfg.presupuestosPorDepartamento[cleanName] = newAgency.presupuestoMensualQ;
        }
        cfg.presupuestoTotal = Object.values(cfg.presupuestosPorAgencia).reduce((sum, v) => sum + v, 0);
      }
    });
  }

  saveData(appState);
  res.status(201).json({
    success: true,
    agencia: newAgency,
    agencias: appState.agenciasDisponibles
  });
});

// Delete agency by ID or name
app.delete('/api/agencias/:id', (req, res) => {
  const { id } = req.params;
  const decoded = decodeURIComponent(id).trim();
  const agencyIndex = appState.agenciasDisponibles.findIndex(
    a => a.id === decoded || a.nombre.toLowerCase() === decoded.toLowerCase()
  );

  if (agencyIndex === -1) {
    return res.status(404).json({ error: `Agencia "${decoded}" no encontrada.` });
  }

  const removedAgency = appState.agenciasDisponibles[agencyIndex];
  const agencyName = removedAgency.nombre;

  // 1. Remove from agenciasDisponibles
  appState.agenciasDisponibles.splice(agencyIndex, 1);

  // 2. Remove from departamentosDisponibles
  if (appState.departamentosDisponibles) {
    appState.departamentosDisponibles = appState.departamentosDisponibles.filter(d => d !== agencyName);
  }

  // 3. Remove from assigned JROs
  if (appState.jrosDisponibles) {
    appState.jrosDisponibles = appState.jrosDisponibles.map(jro => ({
      ...jro,
      agenciasAsignadas: (jro.agenciasAsignadas || []).filter(a => a !== agencyName)
    }));
  }

  // 4. Remove from monthly configurations
  if (appState.configuracionMensual) {
    Object.keys(appState.configuracionMensual).forEach(mKey => {
      const cfg = appState.configuracionMensual[mKey];
      if (cfg && cfg.presupuestosPorAgencia) {
        delete cfg.presupuestosPorAgencia[agencyName];
        if (cfg.presupuestosPorDepartamento) {
          delete cfg.presupuestosPorDepartamento[agencyName];
        }
        cfg.presupuestoTotal = Object.values(cfg.presupuestosPorAgencia).reduce((sum, v) => sum + v, 0);
      }
    });
  }

  saveData(appState);

  res.json({
    success: true,
    message: `Agencia "${agencyName}" eliminada correctamente del sistema y de la matriz presupuestaria.`,
    deletedAgency: removedAgency,
    agencias: appState.agenciasDisponibles,
    jros: appState.jrosDisponibles,
    configuracionMensual: appState.configuracionMensual
  });
});

// --- USER MANAGEMENT ENDPOINTS ---

// Get all users
app.get('/api/users', (req, res) => {
  res.json(appState.usuariosDisponibles || []);
});

// Create new user profile
app.post('/api/users', (req, res) => {
  const { 
    nombre, 
    correo, 
    rol, 
    cargo, 
    region, 
    jroId, 
    agenciaId, 
    tallerNombre, 
    telefono, 
    pinAcceso, 
    descripcion, 
    puedeAutorizar 
  } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre completo del usuario es obligatorio.' });
  }
  if (!correo || !correo.trim()) {
    return res.status(400).json({ error: 'El correo electrónico es obligatorio.' });
  }
  if (!rol) {
    return res.status(400).json({ error: 'El rol de usuario es obligatorio (ADMIN, JRO, SOLICITANTE, AUDITOR).' });
  }

  const cleanEmail = correo.trim().toLowerCase();
  const existing = (appState.usuariosDisponibles || []).find(u => u.correo.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ error: `Ya existe un usuario con el correo electrónico "${cleanEmail}".` });
  }

  const isRoleAdmin = rol === 'ADMIN';
  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    nombre: nombre.trim(),
    correo: cleanEmail,
    rol,
    cargo: cargo?.trim() || (
      rol === 'ADMIN' ? 'Coordinador(a) de Flota' :
      rol === 'JRO' ? `Jefe Regional de Operaciones (${region || 'Regional'})` :
      rol === 'SOLICITANTE' ? 'Encargado de Taller Outsourcing' :
      'Auditor / Supervisor de Operaciones'
    ),
    region: region?.trim() || undefined,
    jroId: jroId?.trim() || undefined,
    agenciaId: agenciaId?.trim() || undefined,
    tallerNombre: tallerNombre?.trim() || undefined,
    telefono: telefono?.trim() || undefined,
    pinAcceso: pinAcceso?.trim() || undefined,
    descripcion: descripcion?.trim() || (
      rol === 'ADMIN' ? 'Acceso administrativo global, configuración de presupuestos y autorización exclusiva de gastos.' :
      rol === 'JRO' ? `Supervisión de operaciones de reparto y emisión de Visto Bueno técnico para reparaciones ≥ Q10k en ${region || 'su región'}.` :
      rol === 'SOLICITANTE' ? 'Registro de solicitudes de reparación para camiones botelleros y seguimiento de órdenes.' :
      'Consulta y auditoría de métricas de flota y presupuestos.'
    ),
    puedeAutorizar: isRoleAdmin ? Boolean(puedeAutorizar ?? true) : false,
    fechaCreacion: new Date().toISOString()
  };

  if (!appState.usuariosDisponibles) {
    appState.usuariosDisponibles = [];
  }
  appState.usuariosDisponibles.push(newUser);
  saveData(appState);

  res.status(201).json({
    success: true,
    message: `Usuario ${newUser.nombre} creado exitosamente con rol ${newUser.rol}.`,
    user: newUser,
    usuarios: appState.usuariosDisponibles
  });
});

// Update user profile
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  if (!appState.usuariosDisponibles) {
    appState.usuariosDisponibles = [];
  }

  const userIndex = appState.usuariosDisponibles.findIndex(u => u.id === id);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const existing = appState.usuariosDisponibles[userIndex];
  const isOdalysRoot = existing.id === 'user-odalys';
  
  const updatedRol = isOdalysRoot ? 'ADMIN' : (req.body.rol || existing.rol);
  const updatedPuedeAutorizar = isOdalysRoot ? true : (updatedRol === 'ADMIN' ? Boolean(req.body.puedeAutorizar) : false);

  appState.usuariosDisponibles[userIndex] = {
    ...existing,
    ...req.body,
    id: existing.id,
    rol: updatedRol,
    puedeAutorizar: updatedPuedeAutorizar
  };

  saveData(appState);
  res.json({
    success: true,
    user: appState.usuariosDisponibles[userIndex],
    usuarios: appState.usuariosDisponibles
  });
});

// Delete user profile
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  if (id === 'user-odalys') {
    return res.status(403).json({ error: 'Operación no permitida: Odalys Velasco es la Administradora y Coordinadora General raíz del sistema.' });
  }

  if (!appState.usuariosDisponibles) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  const initialCount = appState.usuariosDisponibles.length;
  appState.usuariosDisponibles = appState.usuariosDisponibles.filter(u => u.id !== id);

  if (appState.usuariosDisponibles.length === initialCount) {
    return res.status(404).json({ error: 'Usuario no encontrado.' });
  }

  saveData(appState);
  res.json({
    success: true,
    id,
    message: 'Usuario eliminado del sistema.',
    usuarios: appState.usuariosDisponibles
  });
});

// Update JROs list directly
app.put('/api/jros', (req, res) => {
  const { jros } = req.body;
  if (!Array.isArray(jros)) {
    return res.status(400).json({ error: 'El campo jros debe ser un arreglo.' });
  }
  appState.jrosDisponibles = jros;
  saveData(appState);
  res.json(appState.jrosDisponibles);
});

// Reset to sample data
app.post('/api/reset', (req, res) => {
  appState = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveData(appState);
  res.json({ success: true, message: 'Datos restaurados a valores de flota en Quetzales.' });
});

// Direct Excel Download Endpoint
app.get('/api/export/excel', (req, res) => {
  try {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Reparaciones
    const repairsData = (appState.aprobaciones || []).map((r, i) => {
      const ag = appState.agenciasDisponibles?.find(a => a.nombre === r.agencia);
      const jro = appState.jrosDisponibles?.find(j => j.id === r.jroId || j.id === ag?.jroId);
      return {
        'No.': i + 1,
        'Folio': r.codigoAutorizacion || `REP-${r.id}`,
        'Fecha Solicitud': r.fechaSolicitud || '',
        'Fecha Autorización': r.fechaAutorizacion || 'Pendiente',
        'Camión ID': r.camionId,
        'Placa': r.placaCamion || 'N/A',
        'Bahías': r.cantidadBahias ? `${r.cantidadBahias} Bahías` : '',
        'Tipo de Bebida': r.tipoBebida || 'Mixto',
        'Agencia': r.agencia,
        'Región': ag?.region || jro?.region || '',
        'JRO Responsable': r.jroNombre || jro?.nombre || '',
        'Categoría': r.categoriaReparacion,
        'Motivo': r.motivoReparacion,
        'Monto (Q)': Number(r.monto || 0),
        'Moneda': 'GTQ',
        'Regla JRO (≥ Q10k)': (r.monto >= 10000 || r.requiereVoBoJRO) ? 'SÍ' : 'NO',
        'Estado': r.estado,
        'Autorizado Por': r.autorizadoPor || (r.estado === 'Autorizado' ? 'Odalys Velasco' : ''),
        'Taller Outsourcing': r.tallerNombre,
        'No. Cotización': r.cotizacionNumero || '',
        'Soporte Outlook': r.correoSoporteEnviado ? 'SÍ' : 'NO'
      };
    });
    const wsRepairs = XLSX.utils.json_to_sheet(repairsData);
    XLSX.utils.book_append_sheet(wb, wsRepairs, 'Reparaciones');

    // Sheet 2: Agencias y Presupuestos
    if (appState.agenciasDisponibles && appState.agenciasDisponibles.length > 0) {
      const agenciesData = appState.agenciasDisponibles.map((a, i) => {
        const auth = (appState.aprobaciones || [])
          .filter(r => r.agencia === a.nombre && r.estado === 'Autorizado')
          .reduce((sum, r) => sum + (r.monto || 0), 0);
        const assigned = a.presupuestoMensualQ || 0;
        return {
          'No.': i + 1,
          'Agencia': a.nombre,
          'Región': a.region,
          'JRO Asignado': a.jroNombre,
          'Presupuesto Asignado (Q)': assigned,
          'Monto Autorizado (Q)': auth,
          'Saldo Disponible (Q)': assigned - auth,
          '% Ejecutado': assigned > 0 ? ((auth / assigned) * 100).toFixed(1) + '%' : '0.0%'
        };
      });
      const wsAgencies = XLSX.utils.json_to_sheet(agenciesData);
      XLSX.utils.book_append_sheet(wb, wsAgencies, 'Agencias & Presupuestos');
    }

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Control_Flota_Reparaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err: any) {
    console.error('Error generating Excel file on server:', err);
    res.status(500).json({ error: 'Error generating excel export' });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
