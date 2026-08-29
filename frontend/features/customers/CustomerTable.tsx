'use client';
import React from 'react';
import { Customer, Business } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface CustomerTableProps {
  customers: Customer[];
  business: Business;
  onSelect: (customer: Customer) => void;
  onQuickStamp: (customer: Customer) => void;
  onQuickRedeem: (customer: Customer) => void;
  busyId?: string | null;
}

export function CustomerTable({
  customers,
  business,
  onSelect,
  onQuickStamp,
  onQuickRedeem,
  busyId,
}: CustomerTableProps) {
  if (!customers.length) {
    return (
      <div className="py-12 text-center text-[#8F9098] bg-[#121316]/50 rounded-xl border border-[#27282D]">
        <span className="text-3xl block mb-2">👤</span>
        <p className="text-sm font-medium">No se encontraron clientes</p>
        <p className="text-xs text-[#64656A] mt-1">Probá con otro término de búsqueda o creá uno nuevo.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#27282D] bg-[#121316]">
      <table className="w-full text-left text-sm text-[#E5E6EA] border-collapse">
        <thead className="text-xs uppercase bg-[#1A1B1F] text-[#8F9098] border-b border-[#27282D]">
          <tr>
            <th className="px-4 py-3 font-semibold">Cliente</th>
            <th className="px-4 py-3 font-semibold">Teléfono</th>
            <th className="px-4 py-3 font-semibold">Código</th>
            <th className="px-4 py-3 font-semibold">
              {business.program_type === 'points' ? 'Puntos' : 'Sellos'}
            </th>
            <th className="px-4 py-3 font-semibold">Canjes</th>
            <th className="px-4 py-3 font-semibold">Última visita</th>
            <th className="px-4 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1B1F]">
          {customers.map((c) => {
            const isReady =
              business.program_type !== 'points' && c.stamp_balance >= business.stamps_required;
            const isBusy = busyId === c.id;

            return (
              <tr key={c.id} className="hover:bg-[#1A1B1F]/50 transition-colors group">
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelect(c)}
                    className="text-left font-semibold text-white group-hover:text-[#0EA5FF] transition-colors cursor-pointer"
                  >
                    {c.name}
                  </button>
                  {c.email && <div className="text-xs text-[#8F9098]">{c.email}</div>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#CFCFD4]">{c.phone}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#1A1B1F] text-[#38bdf8] border border-[#27282D]">
                    {c.card_code}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {business.program_type === 'points' ? (
                    <Badge variant="primary">{c.point_balance.toLocaleString('es-CR')} pts</Badge>
                  ) : (
                    <Badge variant={isReady ? 'success' : 'neutral'}>
                      {c.stamp_balance}/{business.stamps_required}
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-white">{c.rewards_redeemed}</td>
                <td className="px-4 py-3 text-xs text-[#8F9098]">{formatDate(c.last_visit_at || c.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="primary"
                      loading={isBusy}
                      onClick={() => onQuickStamp(c)}
                    >
                      + Sello
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={isBusy || (business.program_type !== 'points' && !isReady)}
                      onClick={() => onQuickRedeem(c)}
                    >
                      Canjear
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onSelect(c)}>
                      Ver ↗
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
