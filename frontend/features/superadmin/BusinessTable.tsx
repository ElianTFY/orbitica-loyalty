'use client';
import React from 'react';
import { Business } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface BusinessTableProps {
  businesses: Business[];
  onToggle: (b: Business) => Promise<void>;
  onOpenCreate: () => void;
}

export function BusinessTable({ businesses, onToggle, onOpenCreate }: BusinessTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#27282D] bg-[#121316]">
      <table className="w-full text-left text-sm text-[#E5E6EA] border-collapse">
        <thead className="text-xs uppercase bg-[#1A1B1F] text-[#8F9098] border-b border-[#27282D]">
          <tr>
            <th className="px-4 py-3 font-semibold">Negocio</th>
            <th className="px-4 py-3 font-semibold">Slug (URL)</th>
            <th className="px-4 py-3 font-semibold">Programa</th>
            <th className="px-4 py-3 font-semibold">Premio Base</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold">Fecha Registro</th>
            <th className="px-4 py-3 font-semibold text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1B1F]">
          {businesses.map((b) => (
            <tr key={b.id} className="hover:bg-[#1A1B1F]/40 transition-colors">
              <td className="px-4 py-3 font-semibold text-white">{b.name}</td>
              <td className="px-4 py-3 font-mono text-xs text-[#38bdf8]">/{b.slug}</td>
              <td className="px-4 py-3">
                <Badge variant="primary" size="sm">
                  {b.program_type === 'points' ? 'Puntos' : 'Sellos'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-[#CFCFD4]">{b.reward_name}</td>
              <td className="px-4 py-3">
                <Badge variant={b.active ? 'success' : 'danger'} size="sm">
                  {b.active ? 'Activo' : 'Suspendido'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-[#8F9098]">{formatDate(b.created_at)}</td>
              <td className="px-4 py-3 text-right">
                <Button size="sm" variant="ghost" onClick={() => onToggle(b)}>
                  {b.active ? 'Suspender' : 'Reactivar'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
