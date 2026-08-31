import React from 'react';
import { Thermometer, Droplets, Sun, Wind, Waves } from 'lucide-react';

export const GaugeCard = ({
  title,
  value,
  unit,
  min = 0,
  max = 100,
  iconType,
  status = 'Normal',
  parcelleNom,
  onClick,
}) => {
  let Icon = Thermometer;
  let iconColor = 'text-amber-600';
  let gaugeColor = '#D97706';

  if (iconType === 'temp') {
    Icon = Thermometer;
    iconColor = 'text-amber-600';
    gaugeColor = '#D97706';
  } else if (iconType === 'hum') {
    Icon = Droplets;
    iconColor = 'text-blue-600';
    gaugeColor = '#2563EB';
  } else if (iconType === 'lux') {
    Icon = Sun;
    iconColor = 'text-yellow-600';
    gaugeColor = '#CA8A04';
  } else if (iconType === 'co2') {
    Icon = Wind;
    iconColor = 'text-emerald-600';
    gaugeColor = '#059669';
  } else if (iconType === 'water') {
    Icon = Waves;
    iconColor = 'text-cyan-600';
    gaugeColor = '#0891B2';
  }

  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm flex flex-col justify-between transition-shadow duration-200 ${onClick ? 'btn-press cursor-pointer hover:border-[#2E7D32]/50 hover:shadow-md' : ''}`}
      style={{ transitionTimingFunction: 'var(--ease-out)' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] dark:text-[#8B949E]">
            {title}
          </span>
          {parcelleNom && (
            <span className="text-[9px] text-[#5A5A5A] dark:text-[#8B949E] mt-0.5">
              {parcelleNom}
            </span>
          )}
        </div>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>

      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
          {value}
        </span>
        <span className="text-xs font-semibold text-[#5A5A5A] dark:text-[#8B949E]">
          {unit}
        </span>
      </div>

      <div className="w-full h-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#22272e] overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${percentage}%`, backgroundColor: gaugeColor, transitionTimingFunction: 'var(--ease-out)' }}
        />
      </div>
    </div>
  );
};
