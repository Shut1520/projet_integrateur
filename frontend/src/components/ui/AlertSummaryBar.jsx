import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle, Clock } from 'lucide-react';

export const AlertSummaryBar = ({ alertes }) => {
  const list = Array.isArray(alertes) ? alertes : [];

  const active = list.filter((a) => a.etat === 'active');
  const critique = active.filter((a) => a.severite === 'critique');
  const haute = active.filter((a) => a.severite === 'haute');
  const resolues = list.filter((a) => a.etat === 'resolue');

  const stats = [
    {
      label: 'Actives',
      count: active.length,
      icon: AlertTriangle,
      color: active.length > 0 ? 'text-[#E53935]' : 'text-[#2E7D32]',
      bg: active.length > 0 ? 'bg-[#E53935]/10' : 'bg-[#2E7D32]/10',
    },
    {
      label: 'Critiques',
      count: critique.length,
      icon: AlertOctagon,
      color: critique.length > 0 ? 'text-[#E53935]' : 'text-[#5A5A5A] dark:text-[#8B949E]',
      bg: critique.length > 0 ? 'bg-[#E53935]/10' : 'bg-[#5A5A5A]/10',
    },
    {
      label: 'Hautes',
      count: haute.length,
      icon: Clock,
      color: haute.length > 0 ? 'text-[#FF8F00]' : 'text-[#5A5A5A] dark:text-[#8B949E]',
      bg: haute.length > 0 ? 'bg-[#FF8F00]/10' : 'bg-[#5A5A5A]/10',
    },
    {
      label: 'Résolues',
      count: resolues.length,
      icon: CheckCircle,
      color: 'text-[#2E7D32]',
      bg: 'bg-[#2E7D32]/10',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm">
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
