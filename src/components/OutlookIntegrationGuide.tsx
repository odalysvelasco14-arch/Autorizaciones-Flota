import React, { useState } from 'react';
import { 
  Mail, 
  Send, 
  Workflow, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  Zap, 
  Info, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  ArrowRight,
  Truck,
  AlertTriangle
} from 'lucide-react';
import { OutlookConnectionConfig } from '../types/budget';
import { formatCurrency } from '../utils/budgetUtils';
import { SAMPLE_OUTLOOK_EMAILS } from '../data/mockData';

interface OutlookIntegrationGuideProps {
  outlookConnection?: OutlookConnectionConfig;
  onUpdateConnection: (config: Partial<OutlookConnectionConfig>) => void;
  onSyncInbox: () => void;
  onSimulateWebhook: (payload: any) => void;
  onNavigateToTab: (tab: string) => void;
}

export const OutlookIntegrationGuide: React.FC<OutlookIntegrationGuideProps> = ({
  outlookConnection,
  onUpdateConnection,
  onSyncInbox,
  onSimulateWebhook,
  onNavigateToTab
}) => {
  const [activeTab, setActiveTab] = useState<'sending' | 'receiving' | 'simulator'>('sending');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [selectedSampleIndex, setSelectedSampleIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Webhook URL
  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook/outlook-email`
    : 'https://tu-app.run.app/api/webhook/outlook-email';

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      const sample = SAMPLE_OUTLOOK_EMAILS[selectedSampleIndex];
      await onSimulateWebhook({
        subject: sample.subject,
        body: sample.body,
        from: sample.from,
        senderName: sample.title
      });
      setSimulationResult(`¡Correo de Outlook procesado! Solicitud de reparación registrada y evaluada con las reglas de JRO.`);
    } catch (err: any) {
      setSimulationResult('Error al enviar webhook simulado: ' + (err?.message || 'Error'));
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Banner: Outlook Connection Status */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">
                  Conexión con Microsoft Outlook & Soporte de Solicitudes
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Activo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Buzón corporativo:{' '}
                <strong className="text-white font-mono">{outlookConnection?.email || 'odalys.velasco@embotelladora.com.gt'}</strong>
                {' '}({outlookConnection?.cargo || 'Coordinadora de Flota'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={onSyncInbox}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Sincronizar Bandeja de Entrada</span>
            </button>
          </div>
        </div>

        {/* Quick Question Answer Callout */}
        <div className="mt-4 p-3 bg-blue-950/60 border border-blue-800/80 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <strong>Respuesta a tu consulta:</strong> Sí, la aplicación está conectada bidireccionalmente con Microsoft Outlook:
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-blue-300">
              <li><strong>Envío de soporte:</strong> Cada vez que el taller ingresa una reparación, la app genera el correo oficial de Outlook dirigido al JRO de la agencia si el monto es ≥ Q10,000 o a Coordinación con toda la ficha técnica y fotos.</li>
              <li><strong>Recepción automática:</strong> Si el taller o el JRO te envían o responden por correo, la app procesa el correo en segundo plano y actualiza el estado sin que tengas que transcribir nada.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sending')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'sending'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>1. Envío de Soporte por Correo a Outlook</span>
        </button>

        <button
          onClick={() => setActiveTab('receiving')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'receiving'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>2. Recepción Automática con Power Automate</span>
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>3. Simulador de Pruebas de Correo</span>
        </button>
      </div>

      {/* Tab 1: Sending Support Emails */}
      {activeTab === 'sending' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Cómo se Envían las Solicitudes a Outlook como Soporte Oficial</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada solicitud registrada genera un expediente formal listo para enviar a la bandeja de entrada del JRO o Coordinación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">1</div>
              <h4 className="font-bold text-slate-900">Taller Outsourcing Registra</h4>
              <p className="text-slate-600 text-[11px]">
                El taller ingresa fecha, monto en Quetzales, ID del camión, cantidad de bahías, agencia, motivo y foto de la avería.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">2</div>
              <h4 className="font-bold text-slate-900">Detección Automática de Destinatario</h4>
              <p className="text-slate-600 text-[11px]">
                Si el monto es <strong>≥ Q 10,000</strong>, el correo se dirige automáticamente al <strong>JRO de la región</strong> (con copia a Coordinación). Si es menor, se dirige a la Coordinadora de Flota.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">3</div>
              <h4 className="font-bold text-slate-900">Envío Inmediato a Outlook</h4>
              <p className="text-slate-600 text-[11px]">
                El botón <strong>"Abrir en Outlook y Enviar"</strong> abre el cliente de correo con el asunto codificado, destinatarios, cotización y ficha técnica lista para dar Visto Bueno.
              </p>
            </div>
          </div>

          {/* Plantilla de Ejemplo */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 font-mono text-[11px]">
            <div className="text-slate-400 font-sans font-bold text-xs uppercase">
              Ejemplo de Formato de Correo de Soporte Generado:
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-slate-300 space-y-1">
              <div><strong className="text-blue-400">Para:</strong> fernando.morales@embotelladora.com.gt (JRO Central)</div>
              <div><strong className="text-blue-400">CC:</strong> odalys.velasco@embotelladora.com.gt; servicios@dieselguate.com</div>
              <div><strong className="text-blue-400">Asunto:</strong> [SOLICITUD REPARACIÓN Q 16,800.00] Camión CAM-B10-042 - Agencia Central (REQUIERE VO.BO. JRO)</div>
              <div className="text-slate-400 pt-2">--- Ficha Técnica Adjunta ---</div>
              <div>• Camión: CAM-B10-042 (10 Bahías · Bebidas Carbonatadas)</div>
              <div>• Diagnóstico: Fuga en compresor de aire de frenos y cambio de diafragmas</div>
              <div>• Monto: Q 16,800.00 Quetzales</div>
              <div>• Evidencia: Fotografía de inspección técnica adjunta</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Receiving via Power Automate */}
      {activeTab === 'receiving' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Workflow className="w-4 h-4 text-purple-600" />
              <span>Recepción Automática de Correos con Microsoft Power Automate</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Conecta tu Outlook para que los correos que te envíen el taller o los JROs se ingresen en tiempo real sin escribir nada
            </p>
          </div>

          {/* Webhook URL Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              URL del Webhook de tu Aplicación (Copia esta URL en Power Automate):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 select-all"
              />
              <button
                onClick={handleCopyWebhookUrl}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedUrl ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
            </div>
          </div>

          {/* Step by step guide */}
          <div className="space-y-3 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900 text-sm">Configuración en 3 minutos en Power Automate:</h4>
            
            <ol className="list-decimal list-inside space-y-2.5 pl-2 leading-relaxed">
              <li>
                Entra a <strong>make.powerautomate.com</strong> con tu cuenta de Microsoft 365.
              </li>
              <li>
                Crea un nuevo <strong>Flujo de nube automatizado</strong>.
              </li>
              <li>
                Disparador (Trigger): Selecciona <strong>"Cuando llega un nuevo correo electrónico (V3) en Office 365 Outlook"</strong>.
              </li>
              <li className="text-amber-900 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                ⚠️ <strong>Acción a elegir:</strong> Agrega un nuevo paso y busca la acción llamada simplemente <strong>"HTTP"</strong> (NO elijas "Webhook de HTTP").
              </li>
              <li>
                En la tarjeta <strong>HTTP</strong> coloca:
                <ul className="list-disc list-inside pl-4 text-slate-600 mt-1 space-y-1">
                  <li><strong>Método:</strong> POST</li>
                  <li><strong>URI:</strong> Pega la URL del webhook de arriba</li>
                  <li><strong>Encabezados:</strong> <code>Content-Type</code>: <code>application/json</code></li>
                  <li>
                    <strong>Cuerpo (Body):</strong>
                    <pre className="mt-1 p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px]">
{`{
  "subject": "@{triggerOutputs()?['body/subject']}",
  "body": "@{triggerOutputs()?['body/body']}",
  "from": "@{triggerOutputs()?['body/from']}",
  "senderName": "@{triggerOutputs()?['body/senderName']}"
}`}
                    </pre>
                  </li>
                </ul>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab 3: Simulation */}
      {activeTab === 'simulator' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Simulador de Correo de Outlook para Camiones de Bahías</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Prueba cómo la aplicación recibe un correo de un JRO o del taller y extrae automáticamente los datos en Quetzales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SAMPLE_OUTLOOK_EMAILS.map((sample, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedSampleIndex(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedSampleIndex === idx
                    ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">{sample.title}</div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">De: {sample.from}</div>
                <div className="text-[11px] text-blue-700 mt-2 font-medium">Haga clic para seleccionar</div>
              </div>
            ))}
          </div>

          {/* Selected Sample Preview */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 text-xs font-mono">
            <div className="text-slate-400 font-sans text-xs font-bold uppercase">
              Contenido del Correo Simulado:
            </div>
            <div className="text-amber-400 font-bold">
              Asunto: {SAMPLE_OUTLOOK_EMAILS[selectedSampleIndex].subject}
            </div>
            <pre className="text-slate-300 text-[11px] whitespace-pre-wrap font-mono mt-2 bg-slate-950 p-3 rounded border border-slate-800 max-h-48 overflow-y-auto">
              {SAMPLE_OUTLOOK_EMAILS[selectedSampleIndex].body}
            </pre>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleTriggerSimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 text-amber-300 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Procesando Correo de Outlook...' : 'Disparar Correo a la App'}</span>
            </button>

            {simulationResult && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{simulationResult}</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
