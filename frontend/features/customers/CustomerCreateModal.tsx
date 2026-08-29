'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CustomerCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; phone: string; email?: string }) => Promise<void>;
}

export function CustomerCreateModal({ open, onClose, onCreate }: CustomerCreateModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onCreate({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined });
      setName('');
      setPhone('');
      setEmail('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear cliente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Alta de Nuevo Cliente" maxWidth="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-xs text-rose-400 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">{error}</div>}
        <Input label="Nombre del Cliente" placeholder="Ej. Carlos Mora" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Teléfono / WhatsApp" placeholder="Ej. 8888-8888" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Input label="Correo (Opcional)" placeholder="correo@ejemplo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={loading}>Crear Tarjeta</Button>
        </div>
      </form>
    </Modal>
  );
}
