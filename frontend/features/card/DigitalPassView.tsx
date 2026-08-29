'use client';
import React from 'react';
import { PublicCard } from '@/types';
import BrandSymbol from '@/components/brand/BrandSymbol';

interface DigitalPassViewProps {
  card: PublicCard;
  token: string;
}

export function DigitalPassView({ card, token }: DigitalPassViewProps) {
  const { business } = card;
  const isPoints = business.program_type === 'points';
  const totalStamps = Math.max(business.stamps_required || 10, 2);
  const currentStamps = card.stamp_balance;
  const isCompleted = currentStamps >= totalStamps;

  return (
    <div
      className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl transition-all border border-white/10"
      style={{
        background: `linear-gradient(145deg, #141518 0%, #0A0A0C 100%)`,
        boxShadow: `0 20px 40px -15px rgba(0,0,0,0.8), 0 0 30px -10px ${business.primary_color}40`,
      }}
    >
      {/* Glow highlight */}
      <div
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ backgroundColor: business.primary_color }}
      />

      {/* Header */}
      <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandSymbol size={32} />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">{business.name}</h2>
            <span className="text-[10px] uppercase font-semibold text-[#8F9098] tracking-widest">
              TARJETA DE CLIENTE FRECUENTE
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8F9098] uppercase tracking-wider block">Titular</span>
            <strong className="text-lg text-white font-semibold">{card.customer_name}</strong>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8F9098] uppercase tracking-wider block">Beneficio</span>
            <span className="text-xs font-bold text-[#38bdf8]">{business.reward_name}</span>
          </div>
        </div>

        {/* Balance representation */}
        {isPoints ? (
          <div className="bg-[#1A1B1F]/80 p-5 rounded-2xl border border-white/5 text-center">
            <span className="text-xs text-[#8F9098] uppercase tracking-wider block mb-1">
              Saldo Acumulado
            </span>
            <div className="text-4xl font-extrabold text-white tracking-tight font-display">
              {card.point_balance.toLocaleString('es-CR')}
              <span className="text-lg text-[#0EA5FF] ml-1.5 font-normal">pts</span>
            </div>
            <div className="text-xs text-[#8F9098] mt-2">
              Canjeá cuando alcances los puntos de cada beneficio
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-[#CFCFD4]">
              <span>Progreso de Sellos</span>
              <span className="font-bold text-white">
                {currentStamps} de {totalStamps}
              </span>
            </div>

            {/* Stamps Grid */}
            <div className="grid grid-cols-5 gap-2.5">
              {Array.from({ length: totalStamps }).map((_, idx) => {
                const filled = idx < currentStamps;
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                      filled
                        ? 'bg-[#0EA5FF] text-white border-[#38bdf8] shadow-[0_0_12px_rgba(14,165,255,0.4)]'
                        : 'bg-[#1A1B1F]/60 text-[#64656A] border-white/5'
                    }`}
                  >
                    {filled ? '✓' : idx + 1}
                  </div>
                );
              })}
            </div>

            {isCompleted && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold p-2.5 rounded-xl text-center animate-pulse">
                🎉 ¡Premio disponible! Presentá este código en caja.
              </div>
            )}
          </div>
        )}

        {/* QR Code and Card Code */}
        <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-inner">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(card.card_code)}&bgcolor=ffffff&color=000000&margin=0`}
            alt="QR de Cliente"
            width={140}
            height={140}
            className="w-36 h-36 object-contain"
          />
          <span className="font-mono text-sm font-bold tracking-widest text-black">
            {card.card_code}
          </span>
        </div>
      </div>
    </div>
  );
}
