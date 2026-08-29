'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import BrandLogo from '@/components/brand/BrandLogo';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { PublicCard } from '@/types';
import { DigitalPassView } from '@/features/card/DigitalPassView';

export default function CardPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [card, setCard] = useState<PublicCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletStatus, setWalletStatus] = useState<{ apple: boolean; google: boolean }>({ apple: false, google: false });
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      if (!token) return;
      try {
        const [cardRes, walletRes] = await Promise.all([
          fetch(`/api/backend/api/public/card/${token}`),
          fetch(`/api/backend/api/public/card/${token}/wallet/status`),
        ]);

        if (!cardRes.ok) throw new Error('Tarjeta no encontrada o vencida.');
        const cData = await cardRes.json();
        setCard(cData);

        if (walletRes.ok) {
          const wData = await walletRes.json();
          setWalletStatus(wData);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar tarjeta.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
        <Skeleton className="h-96 w-full max-w-sm rounded-3xl" />
      </div>
    );
  }

  if (!card || !token) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 text-center">
        <BrandLogo product="LOYALTY" size="md" />
        <Card className="mt-6 p-6 max-w-sm">
          <p className="text-sm text-rose-400 font-medium">{error || 'Tarjeta no disponible.'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4 py-8 text-[#E5E6EA]">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">
        <BrandLogo product="LOYALTY" size="sm" />

        <DigitalPassView card={card} token={token} />

        <div className="w-full flex flex-col gap-2.5">
          {walletStatus.apple && (
            <a
              href={`/api/backend/api/public/card/${token}/wallet/apple`}
              className="w-full py-3 px-4 rounded-xl bg-black text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/20 hover:border-white/40 transition-all shadow-lg"
            >
              <span>🍏</span> Agregar a Apple Wallet
            </a>
          )}

          {walletStatus.google && (
            <a
              href={`/api/backend/api/public/card/${token}/wallet/google`}
              className="w-full py-3 px-4 rounded-xl bg-[#1A1B1F] text-white text-xs font-semibold flex items-center justify-center gap-2 border border-[#27282D] hover:border-[#0EA5FF] transition-all"
            >
              <span>💳</span> Guardar en Google Wallet
            </a>
          )}
        </div>

        <div className="text-center text-[11px] text-[#64656A]">
          Guardá esta página en tus marcadores o agregala a la pantalla de inicio de tu teléfono.
        </div>
      </div>
    </div>
  );
}
