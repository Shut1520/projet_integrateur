/**
 * Composant GaugeCard — carte jauge pour afficher une valeur de capteur.
 * Associe une icône, une couleur et un statut (Normal/Alerte/Critique)
 * selon le type de mesure (température, humidité, luminosité, CO₂, eau).
 */
import React from 'react';
import { Thermometer, Droplets, Sun, Wind, Waves } from 'lucide-react';

/**
 * Carte de mesure avec barre de progression.
 * @param {string} title - Libellé du capteur
 * @param {number|string} value - Dernière valeur mesurée
 * @param {string} unit - Unité d'affichage (°C, %, lx, ppm…)
 * @param {number} min - Valeur minimale de la plage
 * @param {number} max - Valeur maximale de la plage
 * @param {string} iconType - Clé du type d'icône (temp, hum, lux, co2, water)
 * @param {string} status - Statut visuel (Normal, Alerte, Critique)
 * @param {string} parcelleNom - Nom du capteur ou de la parcelle associée
 */
export const GaugeCard = ({
  title,
  value,
  unit,
  min = 0,
  max = 100,
  iconType,
  status = 'Normal',
  parcelleNom,
}) => {
  // Sélection de l'icône et de la palette de couleurs selon le type de capteur
  let Icon = Thermometer;
  let colorClass = 'text-[#2E7D32] bg-[#2E7D32]/10';
  let gaugeColor = '#2E7D32';

  if (iconType === 'temp') {
    Icon = Thermometer;
    colorClass = 'text-amber-600 bg-amber-500/10';
    gaugeColor = '#D97706';
  } else if (iconType === 'hum') {
    Icon = Droplets;
    colorClass = 'text-blue-600 bg-blue-500/10';
    gaugeColor = '#2563EB';
  } else if (iconType === 'lux') {
    Icon = Sun;
    colorClass = 'text-yellow-600 bg-yellow-500/10';
    gaugeColor = '#CA8A04';
  } else if (iconType === 'co2') {
    Icon = Wind;
    colorClass = 'text-emerald-600 bg-emerald-500/10';
    gaugeColor = '#059669';
  } else if (iconType === 'water') {
    Icon = Waves;
    colorClass = 'text-cyan-600 bg-cyan-500/10';
    gaugeColor = '#0891B2';
  }

  // Calcul du pourcentage de remplissage de la barre de progression
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  return (
    <div className="bg-white dark:bg-[#161B22] p-4 md:p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs flex flex-col justify-between hover:border-[#2E7D32]/50 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white leading-snug">
              {title}
            </h4>
            {parcelleNom && (
              <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">{parcelleNom}</p>
            )}
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            status === 'Normal'
              ? 'bg-[#43A047]/10 text-[#43A047]'
              : status === 'Alerte'
              ? 'bg-[#FB8C00]/10 text-[#FB8C00]'
              : 'bg-[#E53935]/10 text-[#E53935]'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-1 mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-[#1A1A1A] dark:text-white tracking-tight">
            {value}
          </span>
          <span className="text-xs font-semibold text-[#5A5A5A] dark:text-[#8B949E]">
            {unit}
          </span>
        </div>
        <span className="text-[11px] font-bold text-[#5A5A5A] dark:text-[#8B949E]">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#f2f4ef] dark:bg-[#22272e] h-2 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: gaugeColor }}
        />
      </div>
    </div>
  );
};
