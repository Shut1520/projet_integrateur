/**
 * Page Tableau de Bord (Dashboard).
 * Affiche en temps réel : jauges de capteurs, graphique d'évolution,
 * panneau d'alertes actives et contrôle rapide des actionneurs.
 * Données chargées depuis l'API backend via apiService.
 */
import React, { useState, useEffect } from 'react';
import { GaugeCard } from '../components/ui/GaugeCard';
import { DashboardSkeleton } from '../components/ui/DashboardSkeleton';
import { HealthSummaryBar } from '../components/ui/HealthSummaryBar';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

import {
  RefreshCw,
  Zap,
  AlertTriangle,
  Droplets,
  Wind,
  Lightbulb,
  ChevronRight,
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

// Configuration des capteurs pour le graphique
const SENSOR_CONFIG = [
  { key: 'dht22', label: 'Temp Air', color: '#2E7D32', bg: 'rgba(46, 125, 50, 0.1)', unit: '°C' },
  { key: 'yl-69', label: 'Hum Sol', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)', unit: '%' },
  { key: 'bh1750', label: 'Luminosité', color: '#CA8A04', bg: 'rgba(202, 138, 4, 0.08)', unit: 'lx' },
  { key: 'sen0159', label: 'CO2', color: '#059669', bg: 'rgba(5, 150, 105, 0.08)', unit: 'ppm' },
  { key: 'niveau_eau', label: 'Niveau Eau', color: '#0891B2', bg: 'rgba(8, 145, 178, 0.08)', unit: '%' },
];

// Sévérité des alertes → couleurs
const SEVERITE_BORDER = {
  critique: 'border-l-[#E53935]',
  haute: 'border-l-[#FF8F00]',
  basse: 'border-l-[#2563EB]',
};
const SEVERITE_BG = {
  critique: 'bg-[#E53935]/5 border-[#E53935]/10',
  haute: 'bg-[#FF8F00]/5 border-[#FF8F00]/10',
  basse: 'bg-[#2563EB]/5 border-[#2563EB]/10',
};
const SEVERITE_TEXT = {
  critique: 'text-[#E53935]',
  haute: 'text-[#FF8F00]',
  basse: 'text-[#2563EB]',
};
const SEVERITE_BADGE = {
  critique: 'bg-[#E53935] text-white',
  haute: 'bg-[#FF8F00] text-white',
  basse: 'bg-[#2563EB] text-white',
};

/**
 * Composant principal du tableau de bord.
 * Charge les mesures de tous les types de capteurs, les actionneurs
 * et les alertes au montage, puis les affiche dans une grille responsive.
 */
export const Dashboard = () => {
  const { addToast } = useToast();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [lastUpdateSecs, setLastUpdateSecs] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [chartRange, setChartRange] = useState('24h');
  const [selectedSensors, setSelectedSensors] = useState(['dht22', 'yl-69']);

  // Mesures par type (capteur) pour les jauges
  const [gauges, setGauges] = useState({
    temp: null,
    humSol: null,
    lux: null,
    co2: null,
    eau: null,
  });

  // Mesures précédentes pour calculer les tendances
  const [prevGauges, setPrevGauges] = useState({
    temp: null,
    humSol: null,
    lux: null,
    co2: null,
    eau: null,
  });

  const [capteurs, setCapteurs] = useState([]);
  const [actionneurs, setActionneurs] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Données du graphique par capteur
  const [chartDataMap, setChartDataMap] = useState({});

  // Map nom capteur → id (pour résoudre les filtres sans re-fetch)
  const [capteurMap, setCapteurMap] = useState({});

  /**
   * Extrait la dernière mesure d'un capteur à partir d'une liste déjà chargée.
   */
  const findLatestMesure = (mesures, capteurId) => {
    return mesures
      .filter((m) => m.id_capteur === capteurId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
  };

  /**
   * Extrait la mesure d'il y a ~24h pour calculer la tendance.
   */
  const findPreviousMesure = (mesures, capteurId) => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return mesures
      .filter((m) => m.id_capteur === capteurId && new Date(m.timestamp) <= yesterday)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
  };

  /**
   * Chargement complet des données du dashboard.
   */
  const loadData = async () => {
    try {
      const [capteursData, acts, alts, mesures, parcellesData] = await Promise.all([
        apiService.getCapteurs(),
        apiService.getActionneurs(),
        apiService.getAlertes(),
        apiService.getMesures(),
        apiService.getParcelles(),
      ]);
      // Construire la map nom → id
      const map = {};
      const capteursList = Array.isArray(capteursData) ? capteursData : [];
      capteursList.forEach((c) => { map[c.nom] = c.id; });
      setCapteurMap(map);
      setCapteurs(capteursList);

      // Filtrer localement la dernière mesure par type + tendance
      const mesuresList = Array.isArray(mesures) ? mesures : [];

      const sensorNames = ['dht22', 'yl-69', 'bh1750', 'sen0159', 'niveau_eau'];
      const gaugeKeys = ['temp', 'humSol', 'lux', 'co2', 'eau'];
      const newGauges = {};
      const newPrev = {};

      sensorNames.forEach((name, i) => {
        const latest = findLatestMesure(mesuresList, map[name]);
        const prev = findPreviousMesure(mesuresList, map[name]);
        newGauges[gaugeKeys[i]] = latest?.valeur ?? null;
        newPrev[gaugeKeys[i]] = prev?.valeur ?? null;
      });

      setActionneurs(Array.isArray(acts) ? acts : []);
      setAlertes(Array.isArray(alts) ? alts.filter((a) => a.etat !== 'resolue') : []);
      setParcelles(Array.isArray(parcellesData) ? parcellesData : []);
      setGauges(newGauges);
      setPrevGauges(newPrev);
      setLastUpdateSecs(0);
    } catch (err) {
      console.error('Erreur load Dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les données du graphique pour un type de capteur et une plage donnée.
   */
  const loadChartData = async (capteurNom, map, range) => {
    try {
      const capteurId = map[capteurNom];
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
   * Recharge les données du graphique pour tous les capteurs sélectionnés.
   */
  const refreshChartData = async (range) => {
    const map = Object.keys(capteurMap).length > 0 ? capteurMap : null;
    if (!map) return;
    const results = await Promise.all(
      SENSOR_CONFIG.map((s) => loadChartData(s.key, map, range))
    );
    const newData = {};
    SENSOR_CONFIG.forEach((s, i) => {
      newData[s.key] = results[i];
    });
    setChartDataMap(newData);
  };

  // Initialisation
  useEffect(() => {
    loadData().then(() => refreshChartData(chartRange));
    const interval = setInterval(() => {
      setLastUpdateSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rechargement du graphique quand la plage ou les capteurs changent
  useEffect(() => {
    refreshChartData(chartRange);
  }, [chartRange]);

  /**
   * Toggle un capteur dans la sélection du graphique.
   */
  const toggleSensor = (sensorKey) => {
    setSelectedSensors((prev) => {
      if (prev.includes(sensorKey)) {
        // Ne pas désélectionner si c'est le dernier
        if (prev.length === 1) return prev;
        return prev.filter((k) => k !== sensorKey);
      }
      return [...prev, sensorKey];
    });
  };

  /**
   * Rafraîchissement manuel des données avec spin animation.
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
      await apiService.updateActionneur(act.id, { etat: nextEtat });
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
   * Marque une alerte comme résolue côté backend.
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

  // Formatage de l'indicateur "dernière MAJ"
  const formatLastUpdate = () => {
    if (lastUpdateSecs < 5) return 'À l\'instant';
    if (lastUpdateSecs < 60) return `Il y a ${lastUpdateSecs}s`;
    return `Il y a ${Math.floor(lastUpdateSecs / 60)}min`;
  };

  const getLastUpdateColor = () => {
    if (lastUpdateSecs < 30) return 'bg-[#2E7D32]/10 text-[#2E7D32]';
    if (lastUpdateSecs < 300) return 'bg-[#FF8F00]/10 text-[#FF8F00]';
    return 'bg-[#E53935]/10 text-[#E53935]';
  };

  // Calcul des tendances
  const getTrend = (key) => {
    const current = gauges[key];
    const previous = prevGauges[key];
    if (current == null || previous == null) return null;
    return current - previous;
  };

  // Configuration du graphique Chart.js
  const isDark = theme === 'dark';
  const labels24h = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
  const labels7d = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const chartData = {
    labels: chartRange === '24h' ? labels24h : labels7d,
    datasets: SENSOR_CONFIG.filter((s) => selectedSensors.includes(s.key)).map((s) => ({
      label: `${s.label} (${s.unit})`,
      data: chartDataMap[s.key]?.length > 0
        ? chartDataMap[s.key]
        : (chartRange === '24h' ? labels24h : labels7d).map(() => null),
      borderColor: s.color,
      backgroundColor: s.bg,
      tension: 0.35,
      fill: false,
      spanGaps: true,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDark ? '#F0F0F0' : '#1A1A1A',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A', font: { size: 10 } },
      },
      y: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A', font: { size: 10 } },
      },
    },
  };

  // Sévérité maximale des alertes pour le style du panneau
  const maxSeverite = alertes.some((a) => a.severite === 'critique')
    ? 'critique'
    : alertes.some((a) => a.severite === 'haute')
    ? 'haute'
    : alertes.length > 0
    ? 'basse'
    : null;

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header avec indicateur MAJ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
            Vue d'ensemble
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Surveillance en temps réel des serres connectées.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getLastUpdateColor()}`}>
            {formatLastUpdate()}
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="btn-press px-3 py-1.5 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Bande résumé santé */}
      <HealthSummaryBar capteurs={capteurs} alertes={alertes} parcelles={parcelles} />

      {/* Jauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 card-stagger">
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
          trend={getTrend('temp')}
          trendLabel="vs hier"
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
          trend={getTrend('humSol')}
          trendLabel="vs hier"
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
          trend={getTrend('lux')}
          trendLabel="vs hier"
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
          trend={getTrend('co2')}
          trendLabel="vs hier"
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
          trend={getTrend('eau')}
          trendLabel="vs hier"
        />
      </div>

      {/* Graphique + Alertes/Actionneurs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graphique multi-capteurs */}
        <div className="lg:col-span-8 bg-white dark:bg-[#161B22] p-5 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">Évolution des mesures</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartRange('24h')}
                className={`btn-press text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  chartRange === '24h'
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-gray-100 text-[#5A5A5A] dark:bg-gray-800 dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                24h
              </button>
              <button
                onClick={() => setChartRange('7j')}
                className={`btn-press text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  chartRange === '7j'
                    ? 'bg-[#2E7D32] text-white'
                    : 'bg-gray-100 text-[#5A5A5A] dark:bg-gray-800 dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
                }`}
              >
                7j
              </button>
            </div>
          </div>

          {/* Pills sélection capteurs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {SENSOR_CONFIG.map((s) => (
              <button
                key={s.key}
                onClick={() => toggleSensor(s.key)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all border ${
                  selectedSensors.includes(s.key)
                    ? 'border-transparent text-white'
                    : 'border-[#E0E0E0] dark:border-[#30363D] text-[#5A5A5A] dark:text-[#8B949E] hover:border-[#5A5A5A]'
                }`}
                style={selectedSensors.includes(s.key) ? { backgroundColor: s.color } : {}}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="h-72 w-full">
            {chartData.datasets.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#5A5A5A] dark:text-[#8B949E]">
                Sélectionnez au moins un capteur
              </div>
            )}
          </div>
        </div>

        {/* Colonne droite : Alertes & Actionneurs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Panneau Alertes */}
          <div className={`bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] border-l-4 shadow-sm ${
            maxSeverite ? SEVERITE_BORDER[maxSeverite] : 'border-l-[#2E7D32]'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 ${maxSeverite ? SEVERITE_TEXT[maxSeverite] : 'text-[#2E7D32]'}`} />
                <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                  Alertes Actives
                  {alertes.length > 0 && (
                    <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E53935]/10 text-[#E53935]">
                      {alertes.length}
                    </span>
                  )}
                </h3>
              </div>
              {alertes.length > 3 && (
                <button
                  onClick={() => navigate('/alertes')}
                  className="text-[10px] font-bold text-[#2E7D32] dark:text-[#66BB6A] hover:underline flex items-center gap-0.5"
                >
                  Voir toutes <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {alertes.length === 0 ? (
              <div className="py-6 text-center">
                <div className="w-10 h-10 rounded-full bg-[#2E7D32]/10 flex items-center justify-center mx-auto mb-2">
                  <AlertTriangle className="w-5 h-5 text-[#2E7D32]" />
                </div>
                <p className="text-xs font-bold text-[#2E7D32]">Aucune alerte active</p>
                <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] mt-0.5">
                  Tous les capteurs sont dans les seuils normaux.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {alertes.slice(0, 3).map((a) => {
                  const sev = a.severite || 'basse';
                  return (
                    <div
                      key={a.id}
                      className={`p-3 rounded-lg border flex items-start gap-3 ${SEVERITE_BG[sev] || SEVERITE_BG.basse}`}
                    >
                      <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${SEVERITE_TEXT[sev] || SEVERITE_TEXT.basse}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className={`text-xs font-bold ${SEVERITE_TEXT[sev] || SEVERITE_TEXT.basse}`}>
                            {a.type_alerte || a.type}
                          </p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${SEVERITE_BADGE[sev] || SEVERITE_BADGE.basse}`}>
                            {sev}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#1A1A1A] dark:text-gray-200 mt-1 leading-snug">
                          {a.message}
                        </p>
                        <button
                          onClick={() => handleResolveAlerte(a.id)}
                          className="btn-press mt-1.5 text-[10px] font-bold text-[#2E7D32] dark:text-[#66BB6A] hover:underline"
                        >
                          Résoudre
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panneau Actionneurs */}
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
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isOn ? 'bg-[#2E7D32]/10' : 'bg-[#5A5A5A]/10'
                      }`}>
                        <ActIcon className={`w-4 h-4 ${isOn ? 'text-[#2E7D32]' : 'text-[#5A5A5A]'}`} />
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
              {actionneurs.length === 0 && (
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] text-center py-3">
                  Aucun actionneur configuré
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
