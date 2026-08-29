import React from 'react';
import { DashboardData } from '@/types';
import { MetricCard } from '@/components/ui/MetricCard';

export function MetricsGrid({ data }: { data: DashboardData }) {
  const { business } = data;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Total Clientes"
        value={data.customers}
        hint={`+${data.new_customers_month} este mes`}
        icon={<span>👥</span>}
      />
      <MetricCard
        label={business.program_type === 'points' ? 'Puntos Otorgados' : 'Sellos Entregados'}
        value={business.program_type === 'points' ? data.points_awarded : data.stamps_awarded}
        hint="Acumulado histórico"
        icon={<span>✨</span>}
      />
      <MetricCard
        label="Recompensas Canjeadas"
        value={data.rewards_redeemed}
        hint="Beneficios entregados"
        icon={<span>🎁</span>}
      />
      <MetricCard
        label="Tarjetas Activas"
        value={data.active_cards}
        hint="En circulación"
        icon={<span>💳</span>}
      />
    </div>
  );
}
