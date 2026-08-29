'use client';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface BusinessCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

export function BusinessCreateModal({ open, onClose, onCreate }: BusinessCreateModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [rewardName, setRewardName] = useState('Corte o Beneficio Gratis');
  const [stampsRequired, setStampsRequired] = useState(10);
  const [programType, setProgramType] = useState('stamps');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleNameChange(val: string) {
    setBusinessName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setSlug(generated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onCreate({
        business_name: businessName.trim(),
        slug: slug.trim(),
        program_type: programType,
        reward_name: rewardName.trim(),
        stamps_required: stampsRequired,
        points_ratio: 10.0,
        owner_name: ownerName.trim(),
        owner_email: ownerEmail.trim(),
        owner_password: ownerPassword,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al aprovisionar negocio.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Aprovisionar Nuevo Negocio SaaS" maxWidth="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <div className="text-xs text-rose-400 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre del Negocio" placeholder="Ej. Barbería Deluxe" value={businessName} onChange={(e) => handleNameChange(e.target.value)} required />
          <Input label="Slug / Identificador URL" placeholder="ej-barberia-deluxe" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider">Tipo</label>
            <select
              value={programType}
              onChange={(e) => setProgramType(e.target.value)}
              className="w-full bg-[#1A1B1F] text-[#E5E6EA] text-sm px-3 py-2 rounded-lg border border-[#27282D]"
            >
              <option value="stamps">Sellos</option>
              <option value="points">Puntos</option>
            </select>
          </div>
          <Input label="Premio Inicial" value={rewardName} onChange={(e) => setRewardName(e.target.value)} required />
          <Input label="Sellos / Meta" type="number" value={stampsRequired} onChange={(e) => setStampsRequired(parseInt(e.target.value, 10) || 10)} required />
        </div>

        <div className="pt-2 border-t border-[#27282D]">
          <span className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider block mb-3">
            Cuenta de Administrador Dueño
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input label="Nombre Dueño" placeholder="Juan Pérez" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
            <Input label="Correo Dueño" type="email" placeholder="juan@deluxe.com" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required />
            <Input label="Contraseña (mín 12)" type="password" placeholder="••••••••••••" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} required />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" loading={loading}>Crear y Aprovisionar</Button>
        </div>
      </form>
    </Modal>
  );
}
