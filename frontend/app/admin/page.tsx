'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { apiClient } from '@/lib/api-client';
import { DashboardData, Customer, CustomerDetail, User, Reward, PaginatedResponse } from '@/types';

import { MetricsGrid } from '@/features/dashboard/MetricsGrid';
import { ActivityFeed } from '@/features/dashboard/ActivityFeed';
import { CustomerTable } from '@/features/customers/CustomerTable';
import { CustomerDetailModal } from '@/features/customers/CustomerDetailModal';
import { CustomerCreateModal } from '@/features/customers/CustomerCreateModal';
import { ProgramConfig } from '@/features/loyalty/ProgramConfig';
import { RewardCatalog } from '@/features/loyalty/RewardCatalog';
import { StaffTable } from '@/features/staff/StaffTable';
import { StaffCreateModal } from '@/features/staff/StaffCreateModal';
import { ChangePasswordForm } from '@/features/auth/ChangePasswordForm';

type Tab = 'overview' | 'customers' | 'program' | 'rewards' | 'staff' | 'security';

export default function AdminPage() {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [customersData, setCustomersData] = useState<PaginatedResponse<Customer> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [customersLoading, setCustomersLoading] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 350);

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [staff, setStaff] = useState<User[]>([]);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [createStaffOpen, setCreateStaffOpen] = useState(false);
  const [busyCustomerId, setBusyCustomerId] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      const [u, d] = await Promise.all([
        apiClient<User>('/api/auth/me'),
        apiClient<DashboardData>('/api/admin/dashboard'),
      ]);
      setUser(u);
      setDashboard(d);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/login');
      } else {
        toast.error(err.message || 'Error al cargar información.');
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '15',
      });
      if (debouncedSearch.trim()) {
        params.set('q', debouncedSearch.trim());
      }
      const data = await apiClient<PaginatedResponse<Customer>>(`/api/admin/customers/paginated?${params.toString()}`);
      setCustomersData(data);
    } catch (err: any) {
      toast.error('Error al consultar clientes.');
    } finally {
      setCustomersLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'customers' || activeTab === 'overview') {
      loadCustomers();
    }
  }, [activeTab, loadCustomers]);

  const loadRewards = useCallback(async () => {
    try {
      const data = await apiClient<Reward[]>('/api/admin/rewards');
      setRewards(data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const loadStaff = useCallback(async () => {
    try {
      const data = await apiClient<User[]>('/api/admin/staff');
      setStaff(data);
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rewards') loadRewards();
    if (activeTab === 'staff') loadStaff();
  }, [activeTab, loadRewards, loadStaff]);

  async function handleSelectCustomer(c: Customer) {
    try {
      const detail = await apiClient<CustomerDetail>(`/api/admin/customers/${c.id}`);
      setSelectedCustomer(detail);
    } catch (err: any) {
      toast.error('No se pudo abrir el detalle.');
    }
  }

  async function handleQuickStamp(c: Customer) {
    setBusyCustomerId(c.id);
    try {
      await apiClient<Customer>(`/api/admin/customers/${c.id}/stamp`, {
        method: 'POST',
        body: JSON.stringify({ amount: 1 }),
      });
      toast.success(`+1 Sello para ${c.name}`);
      loadCustomers();
      const d = await apiClient<DashboardData>('/api/admin/dashboard');
      setDashboard(d);
    } catch (err: any) {
      toast.error(err.message || 'Error al otorgar sello.');
    } finally {
      setBusyCustomerId(null);
    }
  }

  async function handleQuickRedeem(c: Customer) {
    setBusyCustomerId(c.id);
    try {
      await apiClient<Customer>(`/api/admin/customers/${c.id}/redeem`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success(`Premio canjeado para ${c.name}`);
      loadCustomers();
      const d = await apiClient<DashboardData>('/api/admin/dashboard');
      setDashboard(d);
    } catch (err: any) {
      toast.error(err.message || 'Error al canjear.');
    } finally {
      setBusyCustomerId(null);
    }
  }

  async function handleDetailAddStamp(amount: number) {
    if (!selectedCustomer) return;
    try {
      await apiClient<Customer>(`/api/admin/customers/${selectedCustomer.id}/stamp`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      toast.success(`+${amount} sellos acreditados.`);
      const updated = await apiClient<CustomerDetail>(`/api/admin/customers/${selectedCustomer.id}`);
      setSelectedCustomer(updated);
      loadCustomers();
      const d = await apiClient<DashboardData>('/api/admin/dashboard');
      setDashboard(d);
    } catch (err: any) {
      toast.error(err.message || 'Error al otorgar sellos.');
    }
  }

  async function handleDetailAddPoints(amount: number, spendAmount?: number) {
    if (!selectedCustomer) return;
    try {
      await apiClient<Customer>(`/api/admin/customers/${selectedCustomer.id}/points`, {
        method: 'POST',
        body: JSON.stringify({ amount, spend_amount: spendAmount }),
      });
      toast.success(`+${amount} puntos acreditados.`);
      const updated = await apiClient<CustomerDetail>(`/api/admin/customers/${selectedCustomer.id}`);
      setSelectedCustomer(updated);
      loadCustomers();
      const d = await apiClient<DashboardData>('/api/admin/dashboard');
      setDashboard(d);
    } catch (err: any) {
      toast.error(err.message || 'Error al otorgar puntos.');
    }
  }

  async function handleDetailRedeem(rewardId?: string) {
    if (!selectedCustomer) return;
    try {
      await apiClient<Customer>(`/api/admin/customers/${selectedCustomer.id}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ reward_id: rewardId }),
      });
      toast.success('Recompensa canjeada con éxito.');
      const updated = await apiClient<CustomerDetail>(`/api/admin/customers/${selectedCustomer.id}`);
      setSelectedCustomer(updated);
      loadCustomers();
      const d = await apiClient<DashboardData>('/api/admin/dashboard');
      setDashboard(d);
    } catch (err: any) {
      toast.error(err.message || 'Error al canjear.');
    }
  }

  async function handleRotateToken() {
    if (!selectedCustomer) return;
    try {
      await apiClient<Customer>(`/api/admin/customers/${selectedCustomer.id}/rotate-token`, {
        method: 'POST',
      });
      toast.success('Enlace de tarjeta renovado.');
      const updated = await apiClient<CustomerDetail>(`/api/admin/customers/${selectedCustomer.id}`);
      setSelectedCustomer(updated);
    } catch (err: any) {
      toast.error('Error al renovar enlace.');
    }
  }

  async function handleCreateCustomer(data: { name: string; phone: string; email?: string }) {
    await apiClient<Customer>('/api/admin/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Cliente registrado correctamente.');
    loadCustomers();
    const d = await apiClient<DashboardData>('/api/admin/dashboard');
    setDashboard(d);
  }

  async function handleSaveProgram(data: any) {
    const updated = await apiClient<any>('/api/admin/business', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (dashboard) {
      setDashboard({ ...dashboard, business: updated });
    }
    toast.success('Configuración guardada.');
  }

  async function handleCreateReward(data: any) {
    await apiClient<Reward>('/api/admin/rewards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Recompensa creada.');
    loadRewards();
  }

  async function handleToggleReward(reward: Reward) {
    await apiClient<Reward>(`/api/admin/rewards/${reward.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !reward.active }),
    });
    toast.info(reward.active ? 'Recompensa pausada.' : 'Recompensa activada.');
    loadRewards();
  }

  async function handleCreateStaff(data: any) {
    await apiClient<User>('/api/admin/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Colaborador registrado.');
    loadStaff();
  }

  async function handleToggleStaff(u: User) {
    await apiClient<User>(`/api/admin/staff/${u.id}/toggle`, {
      method: 'PATCH',
    });
    toast.info(u.active ? 'Colaborador desactivado.' : 'Colaborador reactivado.');
    loadStaff();
  }

  async function handlePasswordChanged(currentPassword: string, newPassword: string) {
    await apiClient('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    toast.success('Contraseña actualizada. Volvé a ingresar.');
    router.push('/login');
  }

  async function handleLogout() {
    await fetch('/api/session/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8 flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-24 h-8" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!dashboard || !user) return null;
  const { business } = dashboard;

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#E5E6EA]">
      <header className="border-b border-[#1A1B1F] bg-[#121316]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <BrandLogo product="LOYALTY" size="sm" />
            <span className="hidden sm:inline-block w-px h-5 bg-[#27282D]" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="font-semibold text-white text-sm">{business.name}</span>
              <Badge variant="primary" size="sm">
                {business.program_type === 'points' ? 'Puntos' : 'Sellos'}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/join/${business.slug}`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#38bdf8] bg-[#1A1B1F] hover:bg-[#27282D] px-3 py-1.5 rounded-lg border border-[#27282D] transition-colors"
            >
              <span>Abrir QR de Registro</span> ↗
            </a>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user.full_name}</div>
              <div className="text-[10px] text-[#8F9098] uppercase tracking-wider">{user.role}</div>
            </div>
            <Button size="sm" variant="ghost" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-[#1A1B1F] py-1 text-xs">
          {[
            { id: 'overview', label: '📊 Dashboard' },
            { id: 'customers', label: '👥 Clientes & Mostrador' },
            { id: 'program', label: '⚙️ Programa' },
            { id: 'rewards', label: '🎁 Recompensas' },
            { id: 'staff', label: '👔 Equipo' },
            { id: 'security', label: '🔒 Seguridad' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as Tab)}
              className={`px-3 py-2 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-[#0EA5FF]/15 text-[#0EA5FF] font-semibold border border-[#0EA5FF]/30'
                  : 'text-[#8F9098] hover:text-white hover:bg-[#1A1B1F]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight font-display">
                  Hola, {user.full_name.split(' ')[0]} 👋
                </h1>
                <p className="text-xs text-[#8F9098] mt-0.5">
                  Resumen operativo del programa de fidelidad en vivo.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={() => setCreateCustomerOpen(true)}>
                  + Registrar Cliente
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('customers')}>
                  Ver Mostrador Completo →
                </Button>
              </div>
            </div>

            <MetricsGrid data={dashboard} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    Clientes Recientes en el Mostrador
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('customers')}>
                    Ver todos ({dashboard.customers}) ↗
                  </Button>
                </div>
                {customersData && (
                  <CustomerTable
                    customers={customersData.items.slice(0, 5)}
                    business={business}
                    onSelect={handleSelectCustomer}
                    onQuickStamp={handleQuickStamp}
                    onQuickRedeem={handleQuickRedeem}
                    busyId={busyCustomerId}
                  />
                )}
              </div>

              <div className="lg:col-span-1">
                <ActivityFeed activities={dashboard.recent_activity} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight font-display">
                  Directorio de Clientes & Mostrador
                </h1>
                <p className="text-xs text-[#8F9098] mt-0.5">
                  Buscá clientes por nombre, teléfono o código para sumar sellos o canjear premios.
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setCreateCustomerOpen(true)}>
                + Nuevo Cliente
              </Button>
            </div>

            <div className="flex items-center gap-3 bg-[#121316] p-3 rounded-xl border border-[#27282D]">
              <span className="text-[#8F9098] text-base ml-1">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o código..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm text-[#E5E6EA] placeholder-[#64656A] focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-[#8F9098] hover:text-white px-2 py-1 rounded bg-[#1A1B1F]"
                >
                  Limpiar
                </button>
              )}
            </div>

            {customersLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : customersData ? (
              <div className="flex flex-col gap-4">
                <CustomerTable
                  customers={customersData.items}
                  business={business}
                  onSelect={handleSelectCustomer}
                  onQuickStamp={handleQuickStamp}
                  onQuickRedeem={handleQuickRedeem}
                  busyId={busyCustomerId}
                />
                <Pagination
                  page={customersData.page}
                  totalPages={customersData.total_pages}
                  total={customersData.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            ) : null}
          </div>
        )}

        {activeTab === 'program' && (
          <div className="animate-fade-in">
            <ProgramConfig business={business} onSave={handleSaveProgram} />
          </div>
        )}

        {activeTab === 'rewards' && (
          <div className="animate-fade-in">
            <RewardCatalog
              rewards={rewards}
              business={business}
              onCreate={handleCreateReward}
              onToggleActive={handleToggleReward}
            />
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="animate-fade-in">
            <StaffTable
              staff={staff}
              onToggle={handleToggleStaff}
              onOpenCreate={() => setCreateStaffOpen(true)}
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="animate-fade-in flex flex-col gap-6">
            <ChangePasswordForm onPasswordChanged={handlePasswordChanged} />
          </div>
        )}
      </main>

      <CustomerDetailModal
        customer={selectedCustomer}
        business={business}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onAddStamp={handleDetailAddStamp}
        onAddPoints={handleDetailAddPoints}
        onRedeem={handleDetailRedeem}
        onRotateToken={handleRotateToken}
      />

      <CustomerCreateModal
        open={createCustomerOpen}
        onClose={() => setCreateCustomerOpen(false)}
        onCreate={handleCreateCustomer}
      />

      <StaffCreateModal
        open={createStaffOpen}
        onClose={() => setCreateStaffOpen(false)}
        onCreate={handleCreateStaff}
      />
    </div>
  );
}
