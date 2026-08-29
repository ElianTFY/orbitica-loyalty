'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Business, User } from '@/types';
import { BusinessTable } from '@/features/superadmin/BusinessTable';
import { BusinessCreateModal } from '@/features/superadmin/BusinessCreateModal';

export default function SuperadminPage() {
  const router = useRouter();
  const toast = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [u, b] = await Promise.all([
        apiClient<User>('/api/auth/me'),
        apiClient<Business[]>('/api/superadmin/businesses'),
      ]);
      if (u.role !== 'superadmin') {
        router.push('/admin');
        return;
      }
      setUser(u);
      setBusinesses(b);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/login');
      } else {
        toast.error('No tenés permisos para ver esta sección.');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleToggle(b: Business) {
    try {
      await apiClient(`/api/superadmin/businesses/${b.id}/toggle`, { method: 'PATCH' });
      toast.info(b.active ? 'Negocio suspendido.' : 'Negocio reactivado.');
      loadData();
    } catch (err: any) {
      toast.error('Error al cambiar estado.');
    }
  }

  async function handleCreate(data: any) {
    await apiClient('/api/superadmin/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    toast.success('Negocio y cuenta de dueño creados con éxito.');
    loadData();
  }

  async function handleLogout() {
    await fetch('/api/session/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] p-8 max-w-6xl mx-auto flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E6EA] flex flex-col">
      <header className="border-b border-[#1A1B1F] bg-[#121316]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BrandLogo product="SUPERADMIN" size="sm" />
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold tracking-wider uppercase border border-rose-500/30">
              Control Room
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#8F9098]">{user?.email}</span>
            <Button size="sm" variant="ghost" onClick={handleLogout}>Salir</Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight font-display">
              Negocios Multi-Tenant Aprovisionados ({businesses.length})
            </h1>
            <p className="text-xs text-[#8F9098] mt-0.5">
              Gestión centralizada de instancias y cuentas de negocios en la plataforma SaaS.
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            + Aprovisionar Negocio
          </Button>
        </div>

        <BusinessTable businesses={businesses} onToggle={handleToggle} onOpenCreate={() => setCreateOpen(true)} />
      </main>

      <BusinessCreateModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
