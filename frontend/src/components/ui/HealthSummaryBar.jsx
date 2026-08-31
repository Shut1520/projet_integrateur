import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Sprout } from 'lucide-react';

export const HealthSummaryBar = ({ capteurs, alertes, parcelles }) => {
  const navigate = useNavigate();

  const capteursActifs = Array.isArray(capteurs)
    ? capteurs.filter((c) => c.etat === 'actif').length
    : 0;
  const capteursTotal = Array.isArray(capteurs) ? capteurs.length : 0;
  const alertesCount = Array.isArray(alertes) ? alertes.length : 0;
  const parcellesCount = Array.isArray(parcelles) ? parcelles.length : 0;

  const capteursPercent = capteursTotal > 0 ? Math.round((capteursActifs / capteursTotal) * 100) : 0;

  const getCapteursColor = () => {
    if (capteursTotal === 0) return 'text-[#5A5A5A] dark:text-[#8B949E]';
    if (capteursPercent === 100) return 'text-[#2E7D32]';
    if (capteursPercent >= 50) return 'text-[#FF8F00]';
    return 'text-[#E53935]';
  };

  const getCapteursBg = () => {
    if (capteursTotal === 0) return 'bg-[#5A5A5A]/10';
    if (capteursPercent === 100) return 'bg-[#2E7D32]/10';
    if (capteursPercent >= 50) return 'bg-[#FF8F00]/10';
    return 'bg-[#E53935]/10';
  };

  const getAlertesColor = () => {
    if (alertesCount === 0) return 'text-[#2E7D32]';
    const maxSeverite = alertes.some((a) => a.severite === 'critique')
      ? 'critique'
      : alertes.some((a) => a.severite === 'haute')
      ? 'haute'
      : 'basse';
    if (maxSeverite === 'critique') return 'text-[#E53935]';
    if (maxSeverite === 'haute') return 'text-[#FF8F00]';
    return 'text-[#2563EB]';
  };

  const getAlertesBg = () => {
    if (alertesCount === 0) return 'bg-[#2E7D32]/10';
    const maxSeverite = alertes.some((a) => a.severite === 'critique')
      ? 'critique'
      : alertes.some((a) => a.severite === 'haute')
      ? 'haute'
      : 'basse';
    if (maxSeverite === 'critique') return 'bg-[#E53935]/10';
    if (maxSeverite === 'haute') return 'bg-[#FF8F00]/10';
    return 'bg-[#2563EB]/10';
  };

  return (
    <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Capteurs */}
        <button
          onClick={() => navigate('/capteurs')}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5F7F2] dark:hover:bg-[#22272e] transition-colors text-left"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCapteursBg()}`}>
            <Activity className={`w-5 h-5 ${getCapteursColor()}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] dark:text-[#8B949E]">
              Capteurs
            </p>
            <p className={`text-sm font-extrabold ${getCapteursColor()}`}>
              {capteursActifs}/{capteursTotal} actifs
            </p>
          </div>
        </button>

        {/* Alertes */}
        <button
          onClick={() => navigate('/alertes')}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#F5F7F2] dark:hover:bg-[#22272e] transition-colors text-left"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getAlertesBg()}`}>
            <AlertTriangle className={`w-5 h-5 ${getAlertesColor()}`} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] dark:text-[#8B949E]">
              Alertes
            </p>
            <p className={`text-sm font-extrabold ${getAlertesColor()}`}>
              {alertesCount} active{alertesCount !== 1 ? 's' : ''}
            </p>
          </div>
        </button>

        {/* Parcelles */}
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-[#2E7D32]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A5A] dark:text-[#8B949E]">
              Parcelles
            </p>
            <p className="text-sm font-extrabold text-[#2E7D32]">
              {parcellesCount} suivie{parcellesCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
