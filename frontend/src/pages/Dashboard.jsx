import React, { useState, useEffect } from 'react';
import { GaugeCard } from '../components/ui/GaugeCard';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { formatTimeAgo } from '../utils/formatters';
import {
  RefreshCw,
  Zap,
  AlertTriangle,
  Activity,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { theme } = useTheme();

  const [lastUpdateSecs, setLastUpdateSecs] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [chartRange, setChartRange] = useState('24h');

  // Mesures par type (capteur) pour les jauges
  const [gauges, setGauges] = useState({
    temp: null,
    humSol: null,
    lux: null,
    co2: null,
    eau: null,
  });

  const [actionneurs, setActionneurs] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Récupère la dernière mesure d'un capteur par son nom.
   */
  const getLatestMesure = async (capteurNom) => {
    try {
      const mesures = await apiService.getMesures();
      if (!Array.isArray(mesures)) return null;
      // On cherche la mesure la plus récente pour ce capteur
      const filtered = mesures
        .filter((m) => m.capteur_nom === capteurNom)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return filtered[0] || null;
    } catch (err) {
      console.error(`Erreur getLatestMesure ${capteurNom}:`, err);
      return null;
    }
  };

  const loadData = async () => {
    try {
      const [acts, alts, mTemp, mHum, mLux, mCo2, mEau] = await Promise.all([
        apiService.getActionneurs(),
        apiService.getAlertes(),
        getLatestMesure('dht22'),
        getLatestMesure('yl-69'),
        getLatestMesure('bh1750'),
        getLatestMesure('sen0159'),
        getLatestMesure('niveau_eau'),
      ]);
      setActionneurs(Array.isArray(acts) ? acts : []);
      setAlertes(Array.isArray(alts) ? alts.filter((a) => a.etat !== 'resolue') : []);
      setGauges({
        temp: mTemp?.valeur ?? null,
        humSol: mHum?.valeur ?? null,
        lux: mLux?.valeur ?? null,
        co2: mCo2?.valeur ?? null,
        eau: mEau?.valeur ?? null,
      });
      setLastUpdateSecs(0);
    } catch (err) {
      console.error('Erreur load Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setLastUpdateSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setTimeout(() => {
      setRefreshing(false);
      addToast({ type: 'success', title: 'Données actualisées', message: 'Les capteurs ont été relus.' });
    }, 400);
  };

  const handleToggleActuator = async (act) => {
    const nextAction = act.etat === 'actif' ? 'off' : 'on';
    try {
      await apiService.commanderActionneur(act.id, nextAction);
      addToast({
        type: 'info',
        title: 'Actionneur mis à jour',
        message: `${act.nom} → ${nextAction.toUpperCase()}`,
      });
      await loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de commander cet actionneur' });
    }
  };

  const handleResolveAlerte = async (id) => {
    try {
      await apiService.resoudreAlerte(id);
      setAlertes((prev) => prev.filter((a) => a.id !== id));
      addToast({ type: 'success', title: 'Alerte résolue', message: 'L\'alerte a été marquée comme résolue.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de résoudre l\'alerte.' });
    }
  };

  // Chart config
  const isDark = theme === 'dark';
  const labels24h = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const labels7d = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const chartData = {
    labels: chartRange === '24h' ? labels24h : labels7d,
    datasets: [
      {
        label: 'Température Air (°C)',
        data: chartRange === '24h' ? [21, 20, 22, 24, 26, 25.3, 23, 22] : [22, 24, 25, 23, 26, 24.5, 25.3],
        borderColor: '#2E7D32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Humidité Sol (%)',
        data: chartRange === '24h' ? [55, 52, 50, 48, 46, 45, 47, 49] : [60, 58, 52, 49, 47, 45, 45],
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        tension: 0.35,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#F0F0F0' : '#1A1A1A',
          font: { family: 'Inter', size: 12 },
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A' },
      },
      y: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A' },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#2E7D32]" />
            <span>Tableau de Bord</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Supervision et contrôle en temps réel du Système Agricole Intelligent
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#5A5A5A] dark:text-[#8B949E] font-medium bg-white dark:bg-[#161B22] px-3 py-1.5 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]">
            Dernière mise à jour : {formatTimeAgo(lastUpdateSecs)}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Row 1: 5 Mini Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <GaugeCard
          title="Température Air"
          value={gauges.temp ?? '—'}
          unit="°C"
          min={0}
          max={40}
          iconType="temp"
          status={gauges.temp == null ? 'Inconnu' : gauges.temp > 28 ? 'Alerte' : 'Normal'}
          parcelleNom="DHT22"
        />
        <GaugeCard
          title="Humidité du Sol"
          value={gauges.humSol ?? '—'}
          unit="%"
          min={0}
          max={100}
          iconType="hum"
          status={gauges.humSol == null ? 'Inconnu' : gauges.humSol < 30 ? 'Alerte' : 'Normal'}
          parcelleNom="YL-69"
        />
        <GaugeCard
          title="Luminosité"
          value={gauges.lux ?? '—'}
          unit="lx"
          min={0}
          max={2000}
          iconType="lux"
          status={gauges.lux == null ? 'Inconnu' : 'Normal'}
          parcelleNom="BH1750"
        />
        <GaugeCard
          title="Taux de CO2"
          value={gauges.co2 ?? '—'}
          unit="ppm"
          min={0}
          max={1200}
          iconType="co2"
          status={gauges.co2 == null ? 'Inconnu' : gauges.co2 > 800 ? 'Critique' : 'Normal'}
          parcelleNom="SEN0159"
        />
        <GaugeCard
          title="Niveau d'Eau"
          value={gauges.eau ?? '—'}
          unit="%"
          min={0}
          max={100}
          iconType="water"
          status={gauges.eau == null ? 'Inconnu' : gauges.eau < 20 ? 'Critique' : 'Normal'}
          parcelleNom="Capteur niveau"
        />
      </div>

      {/* Row 2: Chart (Left 8 cols) & Control/Alerts (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Temperature & Moisture Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2E7D32]" />
                <span>Évolution Température & Humidité</span>
              </h3>
              <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-0.5">
                Courbes comparatives mesurées par la station météo principale
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#f8faf5] dark:bg-[#0D1117] p-1 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] self-start sm:self-auto">
              <button
                onClick={() => setChartRange('24h')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartRange === '24h'
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                24 Heures
              </button>
              <button
                onClick={() => setChartRange('7j')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  chartRange === '7j'
                    ? 'bg-[#2E7D32] text-white shadow-xs'
                    : 'text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                7 Jours
              </button>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Right Column: Alerts & Actuators Control */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Alerts Panel */}
          <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0] dark:border-[#30363D] mb-3">
              <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#E53935]" />
                <span>Alertes Actives ({alertes.length})</span>
              </h3>
            </div>

            {alertes.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#43A047] mx-auto mb-2" />
                <p className="text-xs font-medium text-[#5A5A5A] dark:text-[#8B949E]">
                  Tous les systèmes fonctionnent normalement.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertes.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 rounded-xl bg-[#E53935]/5 border border-[#E53935]/20 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#E53935]">{a.titre}</p>
                        <span className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                          {a.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-[#1A1A1A] dark:text-gray-200 mt-1 leading-snug">
                        {a.message}
                      </p>
                      <button
                        onClick={() => handleResolveAlerte(a.id)}
                        className="mt-2 text-[11px] font-bold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
                      >
                        Résoudre l'alerte
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actuators Control Panel */}
          <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E0E0E0] dark:border-[#30363D] mb-4">
              <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#2E7D32]" />
                <span>Contrôle Rapide Actionneurs</span>
              </h3>
            </div>

            <div className="space-y-3">
              {actionneurs.map((act) => {
                const isOn = act.statut === 'EN MARCHE';
                return (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                        {act.nom}
                      </h4>
                      <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                        GPIO {act.gpio} • {act.dureeActivite || act.statut}
                      </p>
                    </div>

                    <button
                      onClick={() => handleToggleActuator(act)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isOn ? 'bg-[#2E7D32]' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          isOn ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
