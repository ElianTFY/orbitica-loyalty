'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import BrandSymbol from '@/components/brand/BrandSymbol';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PublicBusiness } from '@/types';

export default function JoinPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params?.slug;

  const [business, setBusiness] = useState<PublicBusiness | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!slug) return;
      try {
        const res = await fetch(`/api/backend/api/public/business/${slug}`);
        if (!res.ok) throw new Error('Negocio no disponible.');
        const data = await res.json();
        setBusiness(data);
      } catch (err: any) {
        setError(err.message || 'No se encontró el negocio.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/backend/api/public/business/${slug}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al obtener tarjeta.');
      }
      router.push(`/card/${data.public_token}`);
    } catch (err: any) {
      setError(err.message || 'Error al procesar el registro.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <Skeleton className="h-80 w-full max-w-sm" />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center">
        <BrandLogo product="LOYALTY" size="md" />
        <Card className="mt-6 p-6 max-w-sm">
          <p className="text-sm text-rose-400 font-medium">{error || 'Negocio no encontrado.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-[#E5E6EA]">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <BrandLogo product="LOYALTY" size="sm" />

        <Card className="w-full p-6">
          <div className="text-center mb-6">
            <BrandSymbol size={44} className="mx-auto mb-3" />
            <h1 className="text-xl font-bold text-white tracking-tight font-display">{business.name}</h1>
            <p className="text-xs text-[#8F9098] mt-1">
              {business.welcome_message || 'Obtené tu tarjeta digital y acumulá para premios exclusivos.'}
            </p>
          </div>

          <div className="bg-[#1A1B1F] p-3.5 rounded-xl border border-[#27282D] mb-5 text-center">
            <span className="text-[10px] uppercase font-semibold text-[#8F9098] tracking-widest block">
              Premio Disponible
            </span>
            <strong className="text-sm text-[#0EA5FF] block mt-0.5">{business.reward_name}</strong>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="text-xs p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                {error}
              </div>
            )}

            <Input
              label="Tu Nombre Completo"
              placeholder="Ej. Juan Solís"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Número de Teléfono / WhatsApp"
              placeholder="Ej. 8888-8888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <Input
              label="Correo Electrónico (Opcional)"
              placeholder="juan@ejemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" variant="primary" size="lg" loading={submitting} fullWidth className="mt-2">
              Obtener Mi Tarjeta Digital →
            </Button>
          </form>
        </Card>

        <div className="text-center text-[11px] text-[#64656A]">
          Sin descargar apps pesadas. Compatible con Apple Wallet y Google Wallet.
        </div>
      </div>
    </div>
  );
}
