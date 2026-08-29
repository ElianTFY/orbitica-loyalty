'use client';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ChangePasswordFormProps {
  onPasswordChanged: (currentPassword: string, newPassword: string) => Promise<void>;
}

export function ChangePasswordForm({ onPasswordChanged }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', msg: 'Las contraseñas no coinciden.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await onPasswordChanged(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setStatus({ type: 'success', msg: 'Contraseña actualizada con éxito.' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Error al cambiar contraseña.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <div>
          <CardTitle>Seguridad de la Cuenta</CardTitle>
          <span className="text-xs text-[#8F9098]">Actualizá tu contraseña de acceso</span>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {status && (
          <div
            className={`text-xs p-3 rounded-lg border ${
              status.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {status.msg}
          </div>
        )}
        <Input
          label="Contraseña Actual"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
        <Input
          label="Nueva Contraseña"
          type="password"
          help="Mínimo 12 caracteres con mayúscula, minúscula, número y símbolo."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          label="Confirmar Nueva Contraseña"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" variant="primary" loading={loading}>
          Guardar Nueva Contraseña
        </Button>
      </form>
    </Card>
  );
}
