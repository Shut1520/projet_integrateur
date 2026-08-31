import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Cpu } from 'lucide-react';

export const CapteurSummaryBar = ({ capteurs }) => {
  const list = Array.isArray(capteurs) ? capteurs : [];

  const actifs = list.filter((c) => c.etat === 'actif').length;
  const inactifs = list.filter((c) => c.etat === 'inactif').length;
  const defaillants = list.filter((c) => c.etat === 'defaillant').length;
  const total = list.length;

  const stats = [
    {
      label: 'Total',
      count: total,
      icon: Cpu,
      color: 'text-[#1A1A1A] dark:text-white',
      bg: 'bg-[#5A5A5A]/10',
    },
    {
      label: 'Actifs',
      count: actifs,
      icon: Wifi,
      color: 'text-[#2E7D32]',
      bg: 'bg-[#2E7D32]/10',
    },
    {
      label: 'Inactifs',
      count: inactifs,
      icon: WifiOff,
      color: 'text-[#5A5A5A] dark:text-[#8B949E]',
      bg: 'bg-[#5A5A5A]/10',
    },
    {
      label: 'Défaillants',
      count: defaillants,
      icon: AlertTriangle,
      color: defaillants > 0 ? 'text-[#E53935]' : 'text-[#5A5A5A] dark:text-[#8B949E]',
      bg: defaillants > 0 ? 'bg-[#E53935]/10' : 'bg-[#5A5A5A]/10',
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
                {s.count}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
