/**
 * Page Seuils (UC7 - Configurer les seuils d'alerte).
 * Permet de définir les valeurs min/max par type de mesure
 * pour déclencher automatiquement les alertes.
 * Les seuils sont alignés sur le backend : type_mesure, valeur_min, valeur_max.
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ThresholdsSkeleton } from '../components/ui/ThresholdsSkeleton';
import { Sliders, Save, Thermometer, Droplets, Wind, Sun, Waves } from 'lucide-react';

// Correspondance type_mesure → icône et couleur pour l'affichage
const TYPE_ICONS = {
  temperature: { Icon: Thermometer, color: 'text-amber-600 bg-amber-500/10' },
  humidite_sol: { Icon: Droplets, color: 'text-blue-600 bg-blue-500/10' },
  co2: { Icon: Wind, color: 'text-emerald-600 bg-emerald-500/10' },
  luminosite: { Icon: Sun, color: 'text-yellow-600 bg-yellow-500/10' },
  niveau_eau: { Icon: Waves, color: 'text-cyan-600 bg-cyan-500/10' },
};

// Libellés français pour chaque type de mesure
const TYPE_LABELS = {
  temperature: 'Température',
  humidite_sol: 'Humidité du sol',
  co2: 'Taux de CO₂',
  luminosite: 'Luminosité',
  niveau_eau: 'Niveau d\'eau',
};

/**
 * Page Seuils (UC7 - Configurer les seuils d'alerte).
 * On charge les seuils existants et on peut les mettre à jour.
 */
export const Thresholds = () => {
  const { addToast } = useToast();
  const [seuils, setSeuils] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [s, p] = await Promise.all([
        apiService.getSeuils(),
        apiService.getParcelles(),
      ]);
      setSeuils(Array.isArray(s) ? s : []);
      setParcelles(Array.isArray(p) ? p : []);
    } catch (err) {
      console.error('Erreur load Seuils:', err);
      addToast({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les seuils.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Met à jour la valeur minimale d'un seuil.
   * S'assure que min reste inférieur à max - 1.
   */
  const handleMinChange = (id, val) => {
    setSeuils((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, valeur_min: Math.min(val, (s.valeur_max ?? 100) - 1) }
          : s
      )
    );
  };

  /**
   * Met à jour la valeur maximale d'un seuil.
   * S'assure que max reste supérieur à min + 1.
   */
  const handleMaxChange = (id, val) => {
    setSeuils((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, valeur_max: Math.max(val, (s.valeur_min ?? 0) + 1) }
          : s
      )
    );
  };

  /**
   * Sauvegarde tous les seuils modifiés en parallèle vers le backend.
   */
  const handleSave = async () => {
    setSaving(true);
    try {
      // On envoie les mises à jour en parallèle
      await Promise.all(
        seuils.map((s) =>
          apiService.updateSeuil(s.id, {
            valeur_min: Number(s.valeur_min),
            valeur_max: Number(s.valeur_max),
          })
        )
      );
      addToast({
        type: 'success',
        title: 'Seuils enregistrés',
        message: 'Les nouvelles valeurs sont prises en compte.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.response?.data?.detail || 'Enregistrement impossible.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Résolution du nom de parcelle à partir de son ID
  const getParcelleName = (id) => {
    const p = parcelles.find((x) => x.id === id);
    return p?.nom || '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
           <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Sliders className="w-6 h-6 text-[#2E7D32]" />
            <span>Configuration des Seuils</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Définissez les valeurs min/max pour déclencher les alertes et l'automatisation
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || seuils.length === 0}
          className="px-5 py-2.5 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
      </div>

      {loading ? (
        <ThresholdsSkeleton />
      ) : seuils.length === 0 ? (
        <div className="bg-white dark:bg-[#161B22] p-12 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
          <Sliders className="w-12 h-12 text-[#5A5A5A] dark:text-[#8B949E] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">Aucun seuil configuré</p>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
            Créez des seuils depuis l'API ou via l'admin.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {seuils.map((s) => {
            const visual = TYPE_ICONS[s.type_mesure] || TYPE_ICONS.temperature;
            const { Icon, color } = visual;
            const unit = s.unite || '';
            // Paramètres de plage adaptés au type de mesure
            const step =
              s.type_mesure === 'co2' ? 50 :
              s.type_mesure === 'luminosite' ? 50 :
              s.type_mesure === 'niveau_eau' ? 1 :
              1;
            const max =
              s.type_mesure === 'co2' ? 2000 :
              s.type_mesure === 'luminosite' ? 5000 :
              s.type_mesure === 'temperature' ? 50 :
              100;

            return (
              <div
                key={s.id}
                className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]"
              >
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E0E0E0] dark:border-[#30363D]">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1A1A1A] dark:text-white">
                      {TYPE_LABELS[s.type_mesure] || s.type_mesure}
                    </h3>
                    <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                      Parcelle : {getParcelleName(s.id_parcelle)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#5A5A5A] dark:text-[#8B949E]">
                        Seuil minimal
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={s.valeur_min}
                          onChange={(e) => handleMinChange(s.id, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs font-extrabold text-right rounded-lg bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
                        />
                        <span className="text-xs font-bold text-[#5A5A5A] dark:text-[#8B949E]">
                          {unit}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={max}
                      step={step}
                      value={s.valeur_min}
                      onChange={(e) => handleMinChange(s.id, Number(e.target.value))}
                      className="w-full custom-slider cursor-pointer"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#5A5A5A] dark:text-[#8B949E]">
                        Seuil maximal
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={s.valeur_max}
                          onChange={(e) => handleMaxChange(s.id, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs font-extrabold text-right rounded-lg bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
                        />
                        <span className="text-xs font-bold text-[#5A5A5A] dark:text-[#8B949E]">
                          {unit}
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={max}
                      step={step}
                      value={s.valeur_max}
                      onChange={(e) => handleMaxChange(s.id, Number(e.target.value))}
                      className="w-full custom-slider cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
