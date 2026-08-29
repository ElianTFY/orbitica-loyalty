'use client';
import React, { useState } from 'react';
import { Reward, Business } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface RewardCatalogProps {
  rewards: Reward[];
  business: Business;
  onCreate: (data: Partial<Reward>) => Promise<void>;
  onToggleActive: (reward: Reward) => Promise<void>;
}

export function RewardCatalog({ rewards, business, onCreate, onToggleActive }: RewardCatalogProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [stampsRequired, setStampsRequired] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
        points_required: pointsRequired ? parseInt(pointsRequired, 10) : undefined,
        stamps_required: stampsRequired ? parseInt(stampsRequired, 10) : undefined,
        stock: stock ? parseInt(stock, 10) : undefined,
      });
      setName('');
      setDescription('');
      setPointsRequired('');
      setStampsRequired('');
      setStock('');
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Catálogo de Recompensas Adicionales</CardTitle>
          <span className="text-xs text-[#8F9098]">Ofrecé múltiples premios por sellos o puntos acumulados</span>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
          + Nueva Recompensa
        </Button>
      </CardHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <div
            key={r.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              r.active ? 'bg-[#1A1B1F] border-[#27282D]' : 'bg-[#121316]/50 border-[#1A1B1F] opacity-60'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-bold text-white text-sm">{r.name}</h4>
                <Badge variant={r.active ? 'success' : 'neutral'} size="sm">
                  {r.active ? 'Activo' : 'Pausado'}
                </Badge>
              </div>
              {r.description && <p className="text-xs text-[#8F9098] mb-3">{r.description}</p>}
            </div>

            <div className="pt-3 border-t border-[#27282D] flex items-center justify-between text-xs">
              <span className="font-semibold text-[#0EA5FF]">
                {r.points_required ? `${r.points_required.toLocaleString('es-CR')} pts` : `${r.stamps_required || business.stamps_required} sellos`}
              </span>
              <Button size="sm" variant="ghost" onClick={() => onToggleActive(r)}>
                {r.active ? 'Pausar' : 'Activar'}
              </Button>
            </div>
          </div>
        ))}

        {!rewards.length && (
          <div className="col-span-full py-8 text-center text-xs text-[#64656A]">
            No tenés recompensas adicionales creadas. Hacé clic en "+ Nueva Recompensa" para empezar.
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Crear Nueva Recompensa">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input label="Nombre del Premio" placeholder="Ej. Camiseta Oficial, Combo Especial" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Descripción (Opcional)" placeholder="Detalles de lo que incluye el beneficio" value={description} onChange={(e) => setDescription(e.target.value)} />
          {business.program_type === 'points' ? (
            <Input label="Puntos Requeridos" type="number" placeholder="Ej. 250" value={pointsRequired} onChange={(e) => setPointsRequired(e.target.value)} required />
          ) : (
            <Input label="Sellos Requeridos" type="number" placeholder="Ej. 15" value={stampsRequired} onChange={(e) => setStampsRequired(e.target.value)} required />
          )}
          <Input label="Stock Disponible (Dejá vacío si es ilimitado)" type="number" placeholder="Ej. 10" value={stock} onChange={(e) => setStock(e.target.value)} />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" loading={loading}>Guardar Recompensa</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
