'use client';
import React, { useState } from 'react';
import { User } from '@/types';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';

interface StaffTableProps {
  staff: User[];
  onToggle: (user: User) => Promise<void>;
  onOpenCreate: () => void;
}

export function StaffTable({ staff, onToggle, onOpenCreate }: StaffTableProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Equipo de Trabajo</CardTitle>
          <span className="text-xs text-[#8F9098]">Gestioná accesos para que tu personal pueda otorgar sellos y puntos</span>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenCreate}>
          + Nuevo Colaborador
        </Button>
      </CardHeader>

      <div className="overflow-x-auto rounded-xl border border-[#27282D]">
        <table className="w-full text-left text-sm text-[#E5E6EA] border-collapse">
          <thead className="text-xs uppercase bg-[#1A1B1F] text-[#8F9098] border-b border-[#27282D]">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Fecha Registro</th>
              <th className="px-4 py-3 font-semibold text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1B1F]">
            {staff.map((u) => (
              <tr key={u.id} className="hover:bg-[#1A1B1F]/40 transition-colors">
                <td className="px-4 py-3 font-semibold text-white">{u.full_name}</td>
                <td className="px-4 py-3 text-xs font-mono text-[#8F9098]">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'owner' ? 'primary' : 'neutral'}>
                    {u.role === 'owner' ? 'Dueño' : u.role === 'manager' ? 'Gerente' : 'Empleado'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.active ? 'success' : 'danger'}>
                    {u.active ? 'Activo' : 'Desactivado'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-[#8F9098]">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  {u.role !== 'owner' && (
                    <Button size="sm" variant="ghost" onClick={() => onToggle(u)}>
                      {u.active ? 'Desactivar' : 'Reactivar'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
