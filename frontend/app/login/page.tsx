'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/session/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error?.message || 'Credenciales incorrectas');
      }

      if (data.user?.role === 'superadmin') {
        router.push('/superadmin');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0A0A0A]">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <BrandLogo product="LOYALTY" size="lg" />

        <Card className="w-full p-8">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">Acceso a la Plataforma</h1>
            <p className="text-xs text-[#8F9098] mt-1">Ingresá a tu panel de administración o mostrador</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Correo Electrónico"
              type="email"
              placeholder="tu@negocio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth className="mt-2">
              Ingresar al Panel
            </Button>
          </form>
        </Card>

        <div className="text-center text-xs text-[#64656A]">
          Protegido con encriptación Argon2id y tokens revocables. Orbítica Studio © 2026
        </div>
      </div>
    </div>
  );
}
