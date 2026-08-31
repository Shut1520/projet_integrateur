import React from 'react';
import { Power, PowerOff, Droplets, Fan, Lightbulb } from 'lucide-react';

const TYPE_ICONS = {
  pompe: Droplets,
  ventilation: Fan,
  eclairage: Lightbulb,
};

const TYPE_COLORS = {
  pompe: 'text-[#2563EB]',
  ventilation: 'text-[#0891B2]',
  eclairage: 'text-[#FF8F00]',
};

const TYPE_BG = {
  pompe: 'bg-[#2563EB]/10',
  ventilation: 'bg-[#0891B2]/10',
  eclairage: 'bg-[#FF8F00]/10',
};

export const ActionneurSummaryBar = ({ actionneurs }) => {
  const list = Array.isArray(actionneurs) ? actionneurs : [];

  const actifs = list.filter((a) => a.etat === 'actif').length;
  const inactifs = list.filter((a) => a.etat === 'inactif').length;
  const total = list.length;

  const byType = {};
  list.forEach((a) => {
    const t = a.type || 'inconnu';
    byType[t] = (byType[t] || 0) + 1;
  });

  const stats = [
    {
      label: 'Total',
      count: total,
      icon: Power,
      color: 'text-[#1A1A1A] dark:text-white',
      bg: 'bg-[#5A5A5A]/10',
    },
    {
      label: 'Actifs',
      count: actifs,
      icon: Power,
      color: 'text-[#2E7D32]',
      bg: 'bg-[#2E7D32]/10',
    },
    {
      label: 'Inactifs',
      count: inactifs,
      icon: PowerOff,
      color: 'text-[#5A5A5A] dark:text-[#8B949E]',
      bg: 'bg-[#5A5A5A]/10',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
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
      {Object.keys(byType).length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#E0E0E0] dark:border-[#30363D]">
          {Object.entries(byType).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || Power;
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full ${TYPE_BG[type] || 'bg-[#5A5A5A]/10'} ${TYPE_COLORS[type] || 'text-[#5A5A5A]'}`}
              >
                <Icon className="w-3 h-3" />
                {count} {type}{count > 1 ? 's' : ''}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
