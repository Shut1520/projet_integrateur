import React from 'react';
import { Sprout, Cpu, Zap, MapPin } from 'lucide-react';

export const ParcelleSummaryBar = ({ parcelles, capteurs, actionneurs }) => {
  const pList = Array.isArray(parcelles) ? parcelles : [];
  const cList = Array.isArray(capteurs) ? capteurs : [];
  const aList = Array.isArray(actionneurs) ? actionneurs : [];

  const totalSuperficie = pList.reduce((sum, p) => sum + (p.superficie || 0), 0);

  const stats = [
    {
      label: 'Parcelles',
      count: pList.length,
      icon: Sprout,
      color: 'text-[#2E7D32]',
      bg: 'bg-[#2E7D32]/10',
    },
    {
      label: 'Capteurs',
      count: cList.length,
      icon: Cpu,
      color: 'text-[#2563EB]',
      bg: 'bg-[#2563EB]/10',
    },
    {
      label: 'Actionneurs',
      count: aList.length,
      icon: Zap,
      color: 'text-[#FF8F00]',
      bg: 'bg-[#FF8F00]/10',
    },
    {
      label: 'Superficie',
      count: totalSuperficie > 0 ? `${totalSuperficie.toLocaleString('fr-FR')}` : '0',
      suffix: ' m²',
      icon: MapPin,
      color: 'text-[#8E24AA]',
      bg: 'bg-[#8E24AA]/10',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] dark:text-[#8B949E]">
                {s.label}
              </p>
              <p className={`text-sm font-extrabold ${s.color}`}>
                {s.count}{s.suffix || ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
