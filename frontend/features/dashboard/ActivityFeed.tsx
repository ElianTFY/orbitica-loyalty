import React from 'react';
import { DashboardActivity } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';

export function ActivityFeed({ activities }: { activities: DashboardActivity[] }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Actividad Reciente</CardTitle>
          <span className="text-xs text-[#8F9098]">Movimientos en vivo en el mostrador</span>
        </div>
        <Badge variant="primary" size="sm">LIVE FEED</Badge>
      </CardHeader>

      <div className="flex-1 overflow-y-auto divide-y divide-[#1A1B1F] pr-1">
        {activities.map((a) => (
          <div key={a.id} className="py-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  a.type === 'redeem'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#0EA5FF]/20 text-[#0EA5FF]'
                }`}
              >
                {a.type === 'redeem' ? '★' : '+'}
              </span>
              <div>
                <strong className="block text-white font-medium">{a.customer_name}</strong>
                <span className="text-[#8F9098]">
                  {a.type === 'redeem' ? 'Canjeó premio' : a.note || 'Acreditó sellos'} · Por {a.actor_name || 'Personal'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={a.type === 'redeem' ? 'warning' : 'primary'} size="sm">
                {a.type === 'redeem' ? 'Canje' : `+${a.amount}`}
              </Badge>
              <div className="text-[10px] text-[#64656A] mt-0.5">{formatDateTime(a.created_at)}</div>
            </div>
          </div>
        ))}
        {!activities.length && (
          <div className="py-8 text-center text-xs text-[#64656A]">Todavía no hay movimientos registrados hoy.</div>
        )}
      </div>
    </Card>
  );
}
