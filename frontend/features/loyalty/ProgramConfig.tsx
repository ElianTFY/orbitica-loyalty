'use client';
import React, { useState } from 'react';
import { Business } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface ProgramConfigProps {
  business: Business;
  onSave: (data: Partial<Business>) => Promise<void>;
}

export function ProgramConfig({ business, onSave }: ProgramConfigProps) {
  const [programType, setProgramType] = useState(business.program_type || 'stamps');
  const [rewardName, setRewardName] = useState(business.reward_name || 'Premio');
  const [stampsRequired, setStampsRequired] = useState(business.stamps_required || 10);
  const [pointsRatio, setPointsRatio] = useState(business.points_ratio || 10);
  const [primaryColor, setPrimaryColor] = useState(business.primary_color || '#0EA5FF');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await onSave({
        program_type: programType as any,
        reward_name: rewardName.trim(),
        stamps_required: stampsRequired,
        points_ratio: pointsRatio,
        primary_color: primaryColor,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Configuración del Programa de Fidelidad</CardTitle>
          <span className="text-xs text-[#8F9098]">Personalizá la mecánica de recompensas de tu negocio</span>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-xl">
        {/* Program Type Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider">
            Tipo de Programa
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProgramType('stamps')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                programType === 'stamps'
                  ? 'border-[#0EA5FF] bg-[#0EA5FF]/10 text-white shadow-[0_0_15px_rgba(14,165,255,0.15)]'
                  : 'border-[#27282D] bg-[#1A1B1F]/50 text-[#8F9098] hover:border-[#3F4046]'
              }`}
            >
              <div className="font-bold text-sm text-white mb-1">🎫 Tarjeta de Sellos</div>
              <div className="text-xs text-[#8F9098]">
                Ideal para barberías, cafés, lavados y servicios recurrentes.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setProgramType('points')}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                programType === 'points'
                  ? 'border-[#0EA5FF] bg-[#0EA5FF]/10 text-white shadow-[0_0_15px_rgba(14,165,255,0.15)]'
                  : 'border-[#27282D] bg-[#1A1B1F]/50 text-[#8F9098] hover:border-[#3F4046]'
              }`}
            >
              <div className="font-bold text-sm text-white mb-1">🪙 Sistema de Puntos</div>
              <div className="text-xs text-[#8F9098]">
                Ideal para restaurantes y retail con montos de compra variables.
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Fields */}
        {programType === 'stamps' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Sellos Requeridos para Canjear"
              type="number"
              min={2}
              max={50}
              value={stampsRequired}
              onChange={(e) => setStampsRequired(parseInt(e.target.value, 10) || 10)}
              required
            />
            <Input
              label="Nombre del Premio Principal"
              placeholder="Ej. Corte gratis, Bebida de cortesía"
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Conversión (Puntos por cada ₡1,000)"
              type="number"
              step="0.1"
              value={pointsRatio}
              onChange={(e) => setPointsRatio(parseFloat(e.target.value) || 10)}
              required
            />
            <Input
              label="Nombre del Premio Principal"
              placeholder="Ej. Descuento ₡5,000"
              value={rewardName}
              onChange={(e) => setRewardName(e.target.value)}
              required
            />
          </div>
        )}

        {/* Branding Accent */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider">
            Color de Acento de la Tarjeta
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
            />
            <Input
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-32 font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-3">
          <Button type="submit" variant="primary" loading={loading}>
            Guardar Configuración
          </Button>
          {saved && <span className="text-xs text-emerald-400 font-medium">✓ Cambios guardados con éxito</span>}
        </div>
      </form>
    </Card>
  );
}
