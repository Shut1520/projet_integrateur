/**
 * Page Tableau de Bord (Dashboard).
 * Affiche en temps réel : jauges de capteurs, graphique d'évolution,
 * panneau d'alertes actives et contrôle rapide des actionneurs.
 * Données chargées depuis l'API backend via apiService.
 */
import React, { useState, useEffect } from 'react';
import { GaugeCard } from '../components/ui/GaugeCard';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../utils/formatters';
import {
  RefreshCw,
  Zap,
  AlertTriangle,
  Droplets,
  Wind,
  Lightbulb,
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

// Enregistrement des composants Chart.js nécessaires pour les graphiques
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

/**
 * Composant principal du tableau de bord.
 * Charge les mesures de tous les types de capteurs, les actionneurs
 * et les alertes au montage, puis les affiche dans une grille responsive.
 */
export const Dashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();

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

  // Données du graphique (remplaçent les données hardcodées)
  const [chartDataTemp, setChartDataTemp] = useState([]);
  const [chartDataHumSol, setChartDataHumSol] = useState([]);

  /**
   * Récupère la dernière mesure d'un capteur par son nom.
   * D'abord résout le nom → id via la liste des capteurs, puis filtre par id_capteur.
   */
  const getLatestMesure = async (capteurNom, capteurMap) => {
    try {
      const capteurId = capteurMap[capteurNom];
      if (!capteurId) return null;
      const mesures = await apiService.getMesures();
      if (!Array.isArray(mesures)) return null;
      const filtered = mesures
        .filter((m) => m.id_capteur === capteurId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return filtered[0] || null;
    } catch (err) {
      console.error(`Erreur getLatestMesure ${capteurNom}:`, err);
      return null;
    }
  };

  /**
   * Chargement complet des données du dashboard.
   * Récupère capteurs → actionneurs → alertes → dernières mesures par type.
   */
  const loadData = async () => {
    try {
      const [capteurs, acts, alts] = await Promise.all([
        apiService.getCapteurs(),
        apiService.getActionneurs(),
        apiService.getAlertes(),
      ]);
      // Construire la map nom → id pour résoudre les filtres
      const capteurMap = {};
      (Array.isArray(capteurs) ? capteurs : []).forEach((c) => {
        capteurMap[c.nom] = c.id;
      });
      // Charger les dernières mesures en parallèle
      const [mTemp, mHum, mLux, mCo2, mEau] = await Promise.all([
        getLatestMesure('dht22', capteurMap),
        getLatestMesure('yl-69', capteurMap),
        getLatestMesure('bh1750', capteurMap),
        getLatestMesure('sen0159', capteurMap),
        getLatestMesure('niveau_eau', capteurMap),
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

  /**
   * Charge les données du graphique pour un type de capteur et une plage donnée.
   * Utilise l'API getMesures avec filtre capteur_id et limite.
   */
  const loadChartData = async (capteurNom, capteurMap, range) => {
    try {
      const capteurId = capteurMap[capteurNom];
      if (!capteurId) return [];
      const params = { capteur_id: capteurId, limite: range === '24h' ? 8 : 7 };
      if (range === '7j') {
        const depuis = new Date();
        depuis.setDate(depuis.getDate() - 7);
        params.depuis = depuis.toISOString();
      }
      const mesures = await apiService.getMesures(params);
      if (!Array.isArray(mesures)) return [];
      return mesures
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        .map((m) => m.valeur);
    } catch (err) {
      console.error(`Erreur loadChartData ${capteurNom}:`, err);
      return [];
    }
  };

  /**
   * Recharge les données du graphique quand la plage change.
   */
  const refreshChartData = async (range) => {
    const [capteurs] = await Promise.all([apiService.getCapteurs()]);
    const capteurMap = {};
    (Array.isArray(capteurs) ? capteurs : []).forEach((c) => {
      capteurMap[c.nom] = c.id;
    });
    const [temp, hum] = await Promise.all([
      loadChartData('dht22', capteurMap, range),
      loadChartData('yl-69', capteurMap, range),
    ]);
    setChartDataTemp(temp);
    setChartDataHumSol(hum);
  };

  // Initialisation : chargement des données + minuteur pour "dernière MAJ"
  useEffect(() => {
    loadData();
    refreshChartData(chartRange);
    const interval = setInterval(() => {
      setLastUpdateSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rechargement du graphique quand la plage change
  useEffect(() => {
    refreshChartData(chartRange);
  }, [chartRange]);

  /**
   * Rafraîchissement manuel des données avec spin animation.
   * Affiche un toast de confirmation une fois les données rechargées.
   */
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshChartData(chartRange)]);
    setTimeout(() => {
      setRefreshing(false);
      addToast({ type: 'success', title: 'Données actualisées', message: 'Les capteurs ont été relus.' });
    }, 400);
  };

  /**
   * Envoie une commande ON/OFF à un actionneur depuis le tableau de bord.
   */
  const handleToggleActuator = async (act) => {
    const nextEtat = act.etat === 'actif' ? 'inactif' : 'actif';
    const nextAction = nextEtat === 'actif' ? 'on' : 'off';
    try {
      // 1. Mettre a jour l'etat de l'actionneur dans la BDD
      await apiService.updateActionneur(act.id, { etat: nextEtat });
      // 2. Enregistrer la commande pour traçabilité / ESP32
      await apiService.commanderActionneur(act.id, nextAction);
      addToast({
        type: 'success',
        title: 'Actionneur mis à jour',
        message: `${act.nom} → ${nextEtat.toUpperCase()}`,
      });
      await loadData();
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de commander cet actionneur' });
    }
  };

  /**
   * Marque une alerte comme résolue côté backend
   * et la retire de la liste affichée.
   */
  const handleResolveAlerte = async (id) => {
    try {
      await apiService.resoudreAlerte(id);
      setAlertes((prev) => prev.filter((a) => a.id !== id));
      addToast({ type: 'success', title: 'Alerte résolue', message: 'L\'alerte a été marquée comme résolue.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de résoudre l\'alerte.' });
    }
  };

  // Configuration du graphique Chart.js selon le thème actuel
  const isDark = theme === 'dark';
  const labels24h = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const labels7d = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const chartData = {
    labels: chartRange === '24h' ? labels24h : labels7d,
    datasets: [
      {
        label: 'Température Air (°C)',
        data: chartDataTemp.length > 0 ? chartDataTemp : (chartRange === '24h' ? labels24h : labels7d).map(() => null),
        borderColor: '#2E7D32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        tension: 0.35,
        fill: true,
        spanGaps: true,
      },
      {
        label: 'Humidité Sol (%)',
        data: chartDataHumSol.length > 0 ? chartDataHumSol : (chartRange === '24h' ? labels24h : labels7d).map(() => null),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        tension: 0.35,
        fill: true,
        spanGaps: true,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
            Vue d'ensemble
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Surveillance en temps réel des serres connectées.
          </p>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
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
          onClick={() => navigate('/history?capteur=dht22')}
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
          onClick={() => navigate('/history?capteur=yl-69')}
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
          onClick={() => navigate('/history?capteur=bh1750')}
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
          onClick={() => navigate('/history?capteur=sen0159')}
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
          onClick={() => navigate('/history?capteur=niveau_eau')}
        />
      </div>

      {/* Row 2: Chart (Left 8 cols) & Alerts/Actuators (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Temperature Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161B22] p-5 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">Température (24h)</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartRange('24h')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  chartRange === '24h'
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-gray-100 text-[#5A5A5A] dark:bg-gray-800 dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setChartRange('7j')}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  chartRange === '7j'
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-gray-100 text-[#5A5A5A] dark:bg-gray-800 dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                7j
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Right Column: Alerts & Actuators */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Alerts Panel */}
          <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] border-l-4 border-l-[#E53935] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-[#E53935]" />
              <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">Alertes Actives</h3>
            </div>

            {alertes.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs font-medium text-[#5A5A5A] dark:text-[#8B949E]">
                  Aucune alerte active.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {alertes.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg bg-[#E53935]/5 border border-[#E53935]/10 flex items-start gap-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-[#E53935] shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#E53935]">{a.type}</p>
                      <p className="text-xs text-[#1A1A1A] dark:text-gray-200 mt-1 leading-snug">
                        {a.message}
                      </p>
                      <button
                        onClick={() => handleResolveAlerte(a.id)}
                        className="mt-2 text-[11px] font-bold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
                      >
                        Résoudre
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actuators Panel */}
          <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-[#2E7D32]" />
              <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">Actionneurs</h3>
            </div>

            <div className="space-y-3">
              {actionneurs.map((act) => {
                const isOn = act.etat === 'actif';
                const nomLower = (act.nom || '').toLowerCase();
                let ActIcon = Zap;
                if (nomLower.includes('pompe')) ActIcon = Droplets;
                else if (nomLower.includes('ventil')) ActIcon = Wind;
                else if (nomLower.includes('éclair') || nomLower.includes('lumi')) ActIcon = Lightbulb;
                return (
                  <div
                    key={act.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2E7D32]/10 flex items-center justify-center shrink-0">
                        <ActIcon className="w-4 h-4 text-[#2E7D32]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                          {act.nom}
                        </h4>
                        <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                          GPIO {act.gpio} • {act.etat}
                        </p>
                      </div>
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
