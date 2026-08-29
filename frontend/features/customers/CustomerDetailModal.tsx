'use client';
import React, { useState } from 'react';
import { CustomerDetail, Business } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';

interface CustomerDetailModalProps {
  customer: CustomerDetail | null;
  business: Business;
  open: boolean;
  onClose: () => void;
  onAddStamp: (amount: number, note?: string) => Promise<void>;
  onAddPoints: (amount: number, spendAmount?: number, note?: string) => Promise<void>;
  onRedeem: (rewardId?: string) => Promise<void>;
  onRotateToken: () => Promise<void>;
}

export function CustomerDetailModal({
  customer,
  business,
  open,
  onClose,
  onAddStamp,
  onAddPoints,
  onRedeem,
  onRotateToken,
}: CustomerDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [customPoints, setCustomPoints] = useState('');
  const [customSpend, setCustomSpend] = useState('');
  const [stampAmount, setStampAmount] = useState(1);

  if (!customer) return null;

  const isReady = business.program_type !== 'points' && customer.stamp_balance >= business.stamps_required;

  async function handleStamp() {
    setLoading(true);
    await onAddStamp(stampAmount);
    setLoading(false);
  }

  async function handlePoints() {
    const pts = parseInt(customPoints, 10);
    if (!pts || pts <= 0) return;
    setLoading(true);
    await onAddPoints(pts, customSpend ? parseFloat(customSpend) : undefined);
    setCustomPoints('');
    setCustomSpend('');
    setLoading(false);
  }

  async function handleRedeem() {
    setLoading(true);
    await onRedeem();
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={onClose} title="Ficha del Cliente" maxWidth="lg">
      <div className="flex flex-col gap-6">
        {/* Header summary */}
        <div className="flex items-start justify-between bg-[#1A1B1F] p-4 rounded-xl border border-[#27282D]">
          <div>
            <h2 className="text-lg font-bold text-white">{customer.name}</h2>
            <div className="flex items-center gap-3 text-xs text-[#8F9098] mt-1 font-mono">
              <span>{customer.phone}</span>
              {customer.email && <span>· {customer.email}</span>}
              <span className="text-[#38bdf8]">· Código: {customer.card_code}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8F9098] block uppercase">Balance Actual</span>
            <div className="text-xl font-bold text-[#0EA5FF] font-display">
              {business.program_type === 'points'
                ? `${customer.point_balance.toLocaleString('es-CR')} pts`
                : `${customer.stamp_balance} / ${business.stamps_required} sellos`}
            </div>
          </div>
        </div>

        {/* Quick Operations Bar */}
        <div className="bg-[#121316] p-4 rounded-xl border border-[#27282D] flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider">
            Operaciones de Mostrador
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {business.program_type !== 'points' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={stampAmount}
                  onChange={(e) => setStampAmount(parseInt(e.target.value, 10) || 1)}
                  className="w-16 bg-[#1A1B1F] text-white text-center py-1.5 rounded-lg border border-[#27282D]"
                />
                <Button variant="primary" loading={loading} onClick={handleStamp} fullWidth>
                  + Agregar Sello
                </Button>
              </div>
            )}

            {business.program_type !== 'stamps' && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Puntos"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="w-24 bg-[#1A1B1F] text-white px-2 py-1.5 rounded-lg border border-[#27282D] text-xs"
                />
                <Button variant="primary" loading={loading} onClick={handlePoints} fullWidth>
                  + Puntos
                </Button>
              </div>
            )}

            <Button
              variant="secondary"
              disabled={loading || (!isReady && business.program_type === 'stamps')}
              onClick={handleRedeem}
              fullWidth
            >
              ★ Canjear Recompensa
            </Button>

            <a
              href={`/card/${customer.public_token}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center text-xs font-medium bg-[#1A1B1F] text-[#38bdf8] border border-[#27282D] rounded-lg hover:border-[#0EA5FF] px-3 py-2 text-center"
            >
              Abrir Tarjeta Web ↗
            </a>
          </div>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase text-[#8F9098] tracking-wider">
              Historial de Movimientos ({customer.transactions?.length || 0})
            </span>
            <Button size="sm" variant="ghost" onClick={onRotateToken}>
              Renovar Enlace (Anti-Robo)
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-[#27282D] bg-[#121316] divide-y divide-[#1A1B1F]">
            {customer.transactions?.map((tx) => (
              <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                      tx.type === 'redeem'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-[#0EA5FF]/20 text-[#0EA5FF]'
                    }`}
                  >
                    {tx.type === 'redeem' ? '★' : '+'}
                  </span>
                  <div>
                    <strong className="block text-white">
                      {tx.type === 'redeem' ? 'Canje de Premio' : tx.note || 'Acreditación'}
                    </strong>
                    <span className="text-[#64656A]">
                      Por {tx.actor_name || 'Personal'} · {formatDateTime(tx.created_at)}
                    </span>
                  </div>
                </div>
                <Badge variant={tx.type === 'redeem' ? 'warning' : 'primary'}>
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                </Badge>
              </div>
            ))}
            {!customer.transactions?.length && (
              <div className="p-6 text-center text-xs text-[#64656A]">No hay movimientos registrados.</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
