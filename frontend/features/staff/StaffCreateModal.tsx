'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface StaffCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { full_name: string; email: string; password: string; role: string }) => Promise<void>;
}

export function StaffCreateModal({ open, onClose, onCreate }: StaffCreateModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setLoading(true);
    setError('');
    try {
      await onCreate({ full_name: fullName.trim(), email: email.trim(), password, role });
      setFullName('');
      setEmail('');
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar colaborador.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo Colaborador" maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-xs text-rose-400 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">{error}</div>}
        <Input label="Nombre Completo" placeholder="Ej. Andrés Varela" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="Correo Electrónico" type="email" placeholder="andres@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Contraseña (mínimo 12 caracteres)" type="password" placeholder="••••••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider">Rol de Acceso</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-[#1A1B1F] text-[#E5E6EA] text-sm px-3 py-2 rounded-lg border border-[#27282D] focus:border-[#0EA5FF]"
          >
            <option value="staff">Empleado (Sellos y Canjes)</option>
            <option value="manager">Gerente (Gestión y Métricas)</option>
          </select>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={loading}>Crear Acceso</Button>
        </div>
      </form>
    </Modal>
  );
}
