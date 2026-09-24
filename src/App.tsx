import React, { useState, useEffect } from 'react';
import { FleetHeader } from './components/FleetHeader';
import { FleetDashboard } from './components/FleetDashboard';
import { RepairRequestsTable } from './components/RepairRequestsTable';
import { AgenciesJROView } from './components/AgenciesJROView';
import { OutlookIntegrationGuide } from './components/OutlookIntegrationGuide';
import { OutsourcingPortalModal } from './components/OutsourcingPortalModal';
import { RepairDetailModal } from './components/RepairDetailModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { MonthlyBudgetManagerModal } from './components/MonthlyBudgetManagerModal';
import { UserManagerModal } from './components/UserManagerModal';
import { ExportExcelModal } from './components/ExportExcelModal';
import { LoginScreen } from './components/LoginScreen';
import { INITIAL_DATA, AGENCIAS_DISPONIBLES, JROS_DISPONIBLES, USUARIOS_DISPONIBLES } from './data/mockData';
import { AppStateData, ApprovalRecord, MonthlyBudgetConfig, AgenciaInfo, JROInfo, UserProfile } from './types/budget';
import { buildOutlookSupportEmail } from './utils/budgetUtils';

export default function App() {
  const [data, setData] = useState<AppStateData>(INITIAL_DATA);
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncingOutlook, setIsSyncingOutlook] = useState<boolean>(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fleet_is_authenticated') === 'true';
    } catch {
      return false;
    }
  });

  // Active User Profile (Role-Based Access Control)
  const availableUsers: UserProfile[] = data.usuariosDisponibles && data.usuariosDisponibles.length > 0 
    ? data.usuariosDisponibles 
    : USUARIOS_DISPONIBLES;

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('fleet_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = USUARIOS_DISPONIBLES.find(u => u.id === parsed.id);
        if (match) return match;
      }
    } catch (e) {
      // ignore
    }
    return USUARIOS_DISPONIBLES[0];
  });

  // Modals
  const [detailRepair, setDetailRepair] = useState<ApprovalRecord | null>(null);
  const [isNewRepairModalOpen, setIsNewRepairModalOpen] = useState<boolean>(false);
  const [preselectedAgency, setPreselectedAgency] = useState<string | undefined>(undefined);
  const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState<boolean>(false);
  const [isBudgetManagerOpen, setIsBudgetManagerOpen] = useState<boolean>(false);
  const [isUserManagerOpen, setIsUserManagerOpen] = useState<boolean>(false);
  const [isExportExcelOpen, setIsExportExcelOpen] = useState<boolean>(false);

  // Load state from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json && json.aprobaciones && json.agenciasDisponibles) {
            setData(json);
          }
        }
      } catch (err) {
        console.warn('Backend not yet reachable, using local seed state:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentConfig: MonthlyBudgetConfig = data.configuracionMensual?.[selectedMonth] || INITIAL_DATA.configuracionMensual['2026-09'];
  const agencias = data.agenciasDisponibles || AGENCIAS_DISPONIBLES;
  const jros = data.jrosDisponibles || JROS_DISPONIBLES;

  // Count pending JRO approvals
  const pendingJROCount = data.aprobaciones.filter(r => {
    if (r.estado !== 'Requiere Vo.Bo. JRO') return false;
    if (currentUser.rol === 'JRO' && currentUser.jroId) {
      const ag = agencias.find(a => a.nombre === r.agencia);
      return ag?.jroId === currentUser.jroId || r.jroId === currentUser.jroId;
    }
    return true;
  }).length;

  // Save new repair request (from Outsourcing portal or coordinator)
  const handleCreateRepair = async (newRepairData: Partial<ApprovalRecord>, sendOutlook: boolean) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRepairData)
      });

      let createdRecord: ApprovalRecord;
      if (res.ok) {
        createdRecord = await res.json();
      } else {
        createdRecord = {
          ...newRepairData,
          id: `rep-${Date.now()}`,
          creadoEn: new Date().toISOString()
        } as ApprovalRecord;
      }

      setData(prev => ({
        ...prev,
        aprobaciones: [createdRecord, ...prev.aprobaciones]
      }));

      setIsNewRepairModalOpen(false);

      // If user requested to send/prepare support email in Outlook
      if (sendOutlook) {
        const emailData = buildOutlookSupportEmail(createdRecord);
        // Call backend to mark support as dispatched
        fetch('/api/outlook/send-support-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repairId: createdRecord.id })
        }).catch(e => console.warn('Could not mark email dispatched:', e));

        // Open user's default Outlook mail client
        window.location.href = emailData.mailtoUrl;
      }
    } catch (err) {
      console.error('Error saving repair request:', err);
    }
  };

  // Update repair status (e.g. Authorized by Coordinator, Vo.Bo. by JRO, or Rejected)
  const handleUpdateRepairStatus = async (
    repairId: string, 
    newStatus: 'Autorizado' | 'Rechazado' | 'Requiere Vo.Bo. JRO' | 'Pendiente Coordinación',
    authorizerNote?: string
  ) => {
    // Only Odalys (ADMIN) can issue final authorizations or rejections
    if ((newStatus === 'Autorizado' || newStatus === 'Rechazado') && currentUser.rol !== 'ADMIN') {
      alert('Acceso Restringido: Únicamente Odalys Velasco (Coordinadora General) puede autorizar o rechazar solicitudes en la APP.');
      return;
    }

    const existing = data.aprobaciones.find(r => r.id === repairId);
    if (!existing) return;

    const payload = {
      ...existing,
      estado: newStatus,
      fechaAutorizacion: newStatus === 'Autorizado' ? new Date().toISOString() : undefined,
      notas: authorizerNote ? `${existing.notas ? existing.notas + ' | ' : ''}${authorizerNote}` : existing.notas
    };

    try {
      const res = await fetch(`/api/approvals/${repairId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const updated = res.ok ? await res.json() : payload;

      setData(prev => ({
        ...prev,
        aprobaciones: prev.aprobaciones.map(r => r.id === repairId ? updated : r)
      }));

      if (detailRepair && detailRepair.id === repairId) {
        setDetailRepair(updated);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Quick Approve from Table (Restricted to Odalys)
  const handleQuickApprove = (repairId: string) => {
    if (currentUser.rol !== 'ADMIN') {
      alert('Solo Odalys Velasco tiene permisos de autorización en la aplicación.');
      return;
    }

    const target = data.aprobaciones.find(r => r.id === repairId);
    if (!target) return;
    const note = target.monto >= 10000
      ? `Vo.Bo. otorgado por JRO ${target.jroNombre} | Autorización final de gasto por Odalys Velasco`
      : 'Aprobación directa por Coordinación de Flota (Odalys Velasco)';
    handleUpdateRepairStatus(repairId, 'Autorizado', note);
  };

  // Delete repair record (Admin Odalys only)
  const handleDeleteRepair = async (repairId: string) => {
    if (currentUser.rol !== 'ADMIN') {
      alert('Solo la Coordinadora Odalys Velasco puede eliminar registros.');
      return;
    }

    if (!confirm('¿Estás segura de eliminar este registro de reparación?')) return;
    try {
      await fetch(`/api/approvals/${repairId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Error deleting on server:', e);
    }

    setData(prev => ({
      ...prev,
      aprobaciones: prev.aprobaciones.filter(r => r.id !== repairId)
    }));

    if (detailRepair?.id === repairId) {
      setDetailRepair(null);
    }
  };

  // Send support email for an existing repair
  const handleSendSupportEmail = async (repairId: string) => {
    const target = data.aprobaciones.find(r => r.id === repairId);
    if (!target) return;

    try {
      await fetch('/api/outlook/send-support-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repairId })
      });

      setData(prev => ({
        ...prev,
        aprobaciones: prev.aprobaciones.map(r => 
          r.id === repairId ? { ...r, correoSoporteEnviado: true, ultimoCorreoEnviadoEn: new Date().toISOString() } : r
        )
      }));

      const emailData = buildOutlookSupportEmail(target);
      window.location.href = emailData.mailtoUrl;
    } catch (err) {
      console.error('Error sending support email:', err);
    }
  };

  // Sincronizar bandeja de entrada de Outlook
  const handleSyncOutlookInbox = async () => {
    setIsSyncingOutlook(true);
    try {
      const res = await fetch('/api/outlook/sync', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        if (json.newApproval) {
          setData(prev => ({
            ...prev,
            aprobaciones: [json.newApproval, ...prev.aprobaciones],
            outlookConnection: json.outlookConnection || prev.outlookConnection
          }));
          alert(`¡Nuevo correo procesado desde Outlook!\n${json.newApproval.asuntoCorreo}\nCamión: ${json.newApproval.camionId} - Monto: Q ${json.newApproval.monto}`);
        }
      }
    } catch (err) {
      console.error('Error syncing outlook:', err);
    } finally {
      setIsSyncingOutlook(false);
    }
  };

  // Simulate Webhook from Power Automate
  const handleSimulateWebhook = async (payload: any) => {
    const res = await fetch('/api/webhook/outlook-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const json = await res.json();
      if (json.approval) {
        setData(prev => ({
          ...prev,
          aprobaciones: [json.approval, ...prev.aprobaciones]
        }));
      }
      return json;
    }
    throw new Error('Error al procesar en webhook');
  };

  // Handle saving monthly budget and agencies list
  const handleSaveMonthlyBudget = async (
    monthKey: string, 
    updatedConfig: MonthlyBudgetConfig, 
    updatedAgencias: AgenciaInfo[]
  ) => {
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mesAno: monthKey,
          presupuestoTotal: updatedConfig.presupuestoTotal,
          moneda: updatedConfig.moneda,
          umbralAlerta: updatedConfig.umbralAlerta,
          presupuestosPorAgencia: updatedConfig.presupuestosPorAgencia,
          agencias: updatedAgencias
        })
      });

      setData(prev => ({
        ...prev,
        configuracionMensual: {
          ...prev.configuracionMensual,
          [monthKey]: updatedConfig
        },
        agenciasDisponibles: updatedAgencias
      }));
    } catch (err) {
      console.error('Error saving budget config:', err);
      setData(prev => ({
        ...prev,
        configuracionMensual: {
          ...prev.configuracionMensual,
          [monthKey]: updatedConfig
        },
        agenciasDisponibles: updatedAgencias
      }));
    }
  };

  // Handle saving full 12-month annual budget matrix
  const handleSaveAnnualMatrix = async (
    matrix: Record<string, MonthlyBudgetConfig>,
    updatedAgencias: AgenciaInfo[],
    updatedJros: JROInfo[]
  ) => {
    try {
      const res = await fetch('/api/budgets/matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configuracionMensual: matrix,
          agencias: updatedAgencias,
          jros: updatedJros
        })
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({
          ...prev,
          configuracionMensual: json.configuracionMensual || matrix,
          agenciasDisponibles: json.agencias || updatedAgencias,
          jrosDisponibles: json.jros || updatedJros
        }));
      }
    } catch (e) {
      console.warn('Error saving annual matrix:', e);
      setData(prev => ({
        ...prev,
        configuracionMensual: matrix,
        agenciasDisponibles: updatedAgencias,
        jrosDisponibles: updatedJros
      }));
    }
  };

  // Delete agency from system and matrix
  const handleDeleteAgency = async (agencyId: string, agencyName: string) => {
    try {
      const res = await fetch(`/api/agencias/${encodeURIComponent(agencyId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({
          ...prev,
          agenciasDisponibles: json.agencias || prev.agenciasDisponibles.filter(a => a.id !== agencyId && a.nombre !== agencyName),
          jrosDisponibles: json.jros || prev.jrosDisponibles,
          configuracionMensual: json.configuracionMensual || prev.configuracionMensual
        }));
      } else {
        setData(prev => ({
          ...prev,
          agenciasDisponibles: prev.agenciasDisponibles.filter(a => a.id !== agencyId && a.nombre !== agencyName)
        }));
      }
    } catch (err) {
      console.warn('Error deleting agency:', err);
      setData(prev => ({
        ...prev,
        agenciasDisponibles: prev.agenciasDisponibles.filter(a => a.id !== agencyId && a.nombre !== agencyName)
      }));
    }
  };

  // User Management Handlers
  const handleCreateUser = async (userData: Partial<UserProfile>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({
          ...prev,
          usuariosDisponibles: json.usuarios || [...(prev.usuariosDisponibles || []), json.user]
        }));
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al registrar usuario en el servidor.');
      }
    } catch (err: any) {
      console.error('Error creating user:', err);
      throw err;
    }
  };

  const handleUpdateUser = async (userId: string, userData: Partial<UserProfile>) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({
          ...prev,
          usuariosDisponibles: json.usuarios || (prev.usuariosDisponibles || []).map(u => u.id === userId ? json.user : u)
        }));
        if (currentUser.id === userId && json.user) {
          setCurrentUser(json.user);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al actualizar usuario.');
      }
    } catch (err: any) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({
          ...prev,
          usuariosDisponibles: json.usuarios || (prev.usuariosDisponibles || []).filter(u => u.id !== userId)
        }));
        if (currentUser.id === userId) {
          // Switch back to root admin Odalys
          setCurrentUser(USUARIOS_DISPONIBLES[0]);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al eliminar usuario.');
      }
    } catch (err: any) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('fleet_current_user', JSON.stringify(user));
      localStorage.setItem('fleet_is_authenticated', 'true');
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('fleet_is_authenticated');
    } catch (e) {
      // ignore
    }
  };

  const handleSelectUser = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('fleet_current_user', JSON.stringify(user));
      localStorage.setItem('fleet_is_authenticated', 'true');
    } catch (e) {
      // ignore
    }
    setIsUserSwitcherOpen(false);
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <LoginScreen
        availableUsers={availableUsers}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Header */}
      <FleetHeader
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenNewModal={() => {
          setPreselectedAgency(undefined);
          setIsNewRepairModalOpen(true);
        }}
        outlookConnected={true}
        pendingJROCount={pendingJROCount}
        currentUser={currentUser}
        userCount={availableUsers.length}
        onOpenUserSwitcher={() => setIsUserSwitcherOpen(true)}
        onOpenBudgetManager={() => setIsBudgetManagerOpen(true)}
        onOpenUserManager={() => setIsUserManagerOpen(true)}
        onOpenExportExcel={() => setIsExportExcelOpen(true)}
        onLogout={handleLogout}
        selectedMonth={selectedMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <FleetDashboard
            aprobaciones={data.aprobaciones}
            config={currentConfig}
            selectedMonth={selectedMonth}
            agencias={agencias}
            jros={jros}
            currentUser={currentUser}
            onOpenNewRepair={() => {
              setPreselectedAgency(undefined);
              setIsNewRepairModalOpen(true);
            }}
            onNavigateToTab={setCurrentTab}
            onSelectRepair={item => setDetailRepair(item)}
            onSyncOutlook={handleSyncOutlookInbox}
            isSyncingOutlook={isSyncingOutlook}
            onOpenBudgetManager={() => setIsBudgetManagerOpen(true)}
            onOpenExportExcel={() => setIsExportExcelOpen(true)}
          />
        )}

        {currentTab === 'repairs' && (
          <RepairRequestsTable
            aprobaciones={data.aprobaciones}
            agencias={agencias}
            jros={jros}
            currentUser={currentUser}
            budgetConfig={currentConfig}
            selectedMonth={selectedMonth}
            onSelectRepair={item => setDetailRepair(item)}
            onOpenNewRepair={() => {
              setPreselectedAgency(undefined);
              setIsNewRepairModalOpen(true);
            }}
            onQuickApprove={handleQuickApprove}
            onDeleteRepair={handleDeleteRepair}
            onSendSupportEmail={handleSendSupportEmail}
            onOpenExportExcel={() => setIsExportExcelOpen(true)}
          />
        )}

        {currentTab === 'agencies' && (
          <AgenciesJROView
            agencias={agencias}
            jros={jros}
            aprobaciones={data.aprobaciones}
            currentUser={currentUser}
            onOpenNewRepairForAgency={agencyName => {
              setPreselectedAgency(agencyName);
              setIsNewRepairModalOpen(true);
            }}
            onOpenBudgetManager={() => setIsBudgetManagerOpen(true)}
            onDeleteAgency={handleDeleteAgency}
            onOpenExportExcel={() => setIsExportExcelOpen(true)}
          />
        )}

        {currentTab === 'outlook' && (
          <OutlookIntegrationGuide
            outlookConnection={data.outlookConnection}
            onUpdateConnection={config => setData(prev => ({
              ...prev,
              outlookConnection: { ...(prev.outlookConnection || INITIAL_DATA.outlookConnection!), ...config }
            }))}
            onSyncInbox={handleSyncOutlookInbox}
            onSimulateWebhook={handleSimulateWebhook}
            onNavigateToTab={setCurrentTab}
          />
        )}
      </main>

      {/* Modal: Outsourcing Portal & New Repair */}
      <OutsourcingPortalModal
        isOpen={isNewRepairModalOpen}
        onClose={() => setIsNewRepairModalOpen(false)}
        onSubmit={handleCreateRepair}
        agencias={agencias}
      />

      {/* Modal: Repair Details, Inspection & Outlook Support Email */}
      <RepairDetailModal
        repair={detailRepair}
        currentUser={currentUser}
        onClose={() => setDetailRepair(null)}
        onUpdateStatus={handleUpdateRepairStatus}
        onSendSupportEmail={handleSendSupportEmail}
      />

      {/* Modal: User Switcher / Role-Based Access Control */}
      <UserSwitcherModal
        isOpen={isUserSwitcherOpen}
        onClose={() => setIsUserSwitcherOpen(false)}
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSelectUser={handleSelectUser}
        onOpenUserManager={() => setIsUserManagerOpen(true)}
      />

      {/* Modal: Monthly Budget & Agency Manager (For Odalys / Admin) */}
      <MonthlyBudgetManagerModal
        isOpen={isBudgetManagerOpen}
        onClose={() => setIsBudgetManagerOpen(false)}
        agencias={agencias}
        jros={jros}
        configuracionMensual={data.configuracionMensual || {}}
        selectedMonth={selectedMonth}
        onSaveConfig={handleSaveMonthlyBudget}
        onSaveAnnualMatrix={handleSaveAnnualMatrix}
        onDeleteAgency={handleDeleteAgency}
        aprobaciones={data.aprobaciones}
      />

      {/* Modal: User Manager & Access Controls */}
      <UserManagerModal
        isOpen={isUserManagerOpen || currentTab === 'users'}
        onClose={() => {
          setIsUserManagerOpen(false);
          if (currentTab === 'users') {
            setCurrentTab('dashboard');
          }
        }}
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSelectUser={handleSelectUser}
        onCreateUser={handleCreateUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Modal: Export to Microsoft Excel (.xlsx) */}
      <ExportExcelModal
        isOpen={isExportExcelOpen}
        onClose={() => setIsExportExcelOpen(false)}
        allRecords={data.aprobaciones}
        filteredRecords={data.aprobaciones}
        agencias={agencias}
        jros={jros}
        budgetConfig={currentConfig}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
