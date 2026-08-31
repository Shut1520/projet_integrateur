/**
 * Page d'historique.
 * Affiche deux onglets : Mesures (releves de capteurs) et Actions (audit trail).
 */
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import { HistorySkeleton } from '../components/ui/HistorySkeleton';
import {
  Download,
  Filter,
  Search,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Activity,
  ClipboardList,
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PAGE_SIZES = [10, 15, 25, 50];

const TYPE_ACTION_COLORS = {
  creation: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  modification: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  suppression: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  activation: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  desactivation: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  commande: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const TYPE_ACTION_LABELS = {
  creation: 'Creation',
  modification: 'Modification',
  suppression: 'Suppression',
  activation: 'Activation',
  desactivation: 'Desactivation',
  commande: 'Commande',
};

const ENTITE_LABELS = {
  parcelle: 'Parcelle',
  capteur: 'Capteur',
  actionneur: 'Actionneur',
};

/**
 * Page Historique.
 * Charge mesures + actions et offre filtrage, pagination, graphique.
 */
export const History = () => {
  const { addToast } = useToast();
  const { theme } = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'mesures');
  const [selectedCapteur, setSelectedCapteur] = useState(searchParams.get('capteur') || 'Tous');
  const [selectedParcelle, setSelectedParcelle] = useState(searchParams.get('parcelle') || 'Toutes');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(Number(searchParams.get('pageSize')) || 15);

  // Filtres specifiques aux actions
  const [selectedEntite, setSelectedEntite] = useState(searchParams.get('entite') || 'Toutes');
  const [selectedTypeAction, setSelectedTypeAction] = useState(searchParams.get('type') || 'Tous');

  const [mesures, setMesures] = useState([]);
  const [capteurs, setCapteurs] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const updateParams = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === 'Tous' || value === 'Toutes' || value === '' || value === 1) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      next.delete('page');
      return next;
    });
  };

  useEffect(() => {
    async function fetchAll() {
      try {
        const [m, c, p, a] = await Promise.all([
          apiService.getMesures({ limit: 500 }),
          apiService.getCapteurs(),
          apiService.getParcelles(),
          apiService.getHistorique({ limit: 200 }),
        ]);
        setMesures(Array.isArray(m) ? m : []);
        setCapteurs(Array.isArray(c) ? c : []);
        setParcelles(Array.isArray(p) ? p : []);
        setActions(Array.isArray(a) ? a : []);

        const initialSensor = searchParams.get('capteur');
        if (initialSensor) {
          const match = (Array.isArray(c) ? c : []).find(
            (cap) => cap.nom && cap.nom.toLowerCase() === initialSensor.toLowerCase()
          );
          if (match) setSelectedCapteur(String(match.id));
        }
      } catch (err) {
        console.error('Erreur History:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const capteurById = useMemo(
    () => Object.fromEntries(capteurs.map((c) => [c.id, c])),
    [capteurs]
  );
  const parcelleById = useMemo(
    () => Object.fromEntries(parcelles.map((p) => [p.id, p])),
    [parcelles]
  );

  // ─── Donnees MESURES ───
  const enrichMesure = (m) => {
    const cap = capteurById[m.id_capteur];
    const parc = cap ? parcelleById[cap.id_parcelle] : null;
    return {
      ...m,
      capteur_nom: cap?.nom || `Capteur #${m.id_capteur}`,
      capteur_code: cap?.nom || '',
      parcelle_nom: parc?.nom || '—',
      parcelle_id: cap?.id_parcelle || null,
    };
  };

  const enriched = useMemo(() => mesures.map(enrichMesure), [mesures, capteurById, parcelleById]);

  const filteredMesures = useMemo(() => {
    return enriched.filter((m) => {
      const matchSearch =
        (m.capteur_nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.capteur_code || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.parcelle_nom || '').toLowerCase().includes(search.toLowerCase());
      const matchCapteur = selectedCapteur === 'Tous' || String(m.id_capteur) === String(selectedCapteur);
      const matchParcelle = selectedParcelle === 'Toutes' || String(m.parcelle_id) === String(selectedParcelle);
      return matchSearch && matchCapteur && matchParcelle;
    });
  }, [enriched, search, selectedCapteur, selectedParcelle]);

  // ─── Donnees ACTIONS ───
  const filteredActions = useMemo(() => {
    return actions.filter((a) => {
      const matchSearch =
        (a.details || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.utilisateur_nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (ENTITE_LABELS[a.entite] || '').toLowerCase().includes(search.toLowerCase());
      const matchEntite = selectedEntite === 'Toutes' || a.entite === selectedEntite.toLowerCase();
      const matchType = selectedTypeAction === 'Tous' || a.type_action === selectedTypeAction.toLowerCase();
      return matchSearch && matchEntite && matchType;
    });
  }, [actions, search, selectedEntite, selectedTypeAction]);

  // ─── Pagination unifiee ───
  const currentData = activeTab === 'mesures' ? filteredMesures : filteredActions;
  const totalPages = Math.max(1, Math.ceil(currentData.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const pageItems = currentData.slice(startIndex, startIndex + pageSize);

  // ─── Graphique (mesures uniquement) ───
  const chartData = useMemo(() => {
    const sorted = [...filteredMesures].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (sorted.length === 0) return { labels: [], datasets: [] };

    const recent = sorted.slice(-50);
    const labels = recent.map((m) => {
      const d = new Date(m.timestamp);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });

    const tsToIndex = {};
    recent.forEach((m, idx) => { tsToIndex[m.timestamp] = idx; });

    const byCapteur = {};
    recent.forEach((m) => {
      const key = m.capteur_nom || `Capteur #${m.id_capteur}`;
      if (!byCapteur[key]) byCapteur[key] = new Array(recent.length).fill(null);
      byCapteur[key][tsToIndex[m.timestamp]] = m.valeur;
    });

    const colors = ['#2E7D32', '#2563EB', '#D97706', '#E53935', '#0891B2', '#8E24AA', '#FB8C00', '#43A047'];

    const datasets = Object.entries(byCapteur).map(([nom, data], i) => ({
      label: nom,
      data,
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '15',
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true,
    }));

    return { labels, datasets };
  }, [filteredMesures]);

  const isDark = theme === 'dark';
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: isDark ? '#F0F0F0' : '#1A1A1A', font: { family: 'Inter', size: 12 } },
      },
    },
    scales: {
      x: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A', maxRotation: 45, minRotation: 30 },
      },
      y: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A' },
      },
    },
  };

  const escapeCSV = (value) => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    if (activeTab === 'mesures') {
      if (filteredMesures.length === 0) {
        addToast({ type: 'warning', title: 'Export vide', message: 'Aucune mesure a exporter.' });
        return;
      }
      const headers = ['ID', 'Capteur', 'Parcelle', 'Valeur', 'Unite', 'Source', 'Date et Heure'];
      const rows = filteredMesures.map((m) => [m.id, m.capteur_nom, m.parcelle_nom, m.valeur, m.unite, m.source || 'esp32', formatDate(m.timestamp)]);
      const csvLines = [headers.map(escapeCSV).join(';'), ...rows.map((row) => row.map(escapeCSV).join(';'))];
      const csvContent = '\uFEFF' + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sai_mesures_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Export CSV', message: `${filteredMesures.length} mesure(s) exportee(s).` });
    } else {
      if (filteredActions.length === 0) {
        addToast({ type: 'warning', title: 'Export vide', message: 'Aucune action a exporter.' });
        return;
      }
      const headers = ['ID', 'Date', 'Utilisateur', 'Action', 'Entite', 'ID Entite', 'Details'];
      const rows = filteredActions.map((a) => [a.id, formatDate(a.created_at), a.utilisateur_nom, TYPE_ACTION_LABELS[a.type_action] || a.type_action, ENTITE_LABELS[a.entite] || a.entite, a.entite_id, a.details || '']);
      const csvLines = [headers.map(escapeCSV).join(';'), ...rows.map((row) => row.map(escapeCSV).join(';'))];
      const csvContent = '\uFEFF' + csvLines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `sai_actions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast({ type: 'success', title: 'Export CSV', message: `${filteredActions.length} action(s) exportee(s).` });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    updateParams('tab', tab);
  };

  const handleCapteurChange = (value) => {
    setSelectedCapteur(value);
    setCurrentPage(1);
    updateParams('capteur', value);
  };

  const handleParcelleChange = (value) => {
    setSelectedParcelle(value);
    setCurrentPage(1);
    updateParams('parcelle', value);
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  if (loading) {
    return <HistorySkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
           <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <HistoryIcon className="w-6 h-6 text-[#2E7D32]" />
            <span>Historique</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Consultation, filtrage et export des donnees
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-[#F5F7F2] dark:bg-[#0D1117] rounded-xl border border-[#E0E0E0] dark:border-[#30363D] w-fit">
        <button
          onClick={() => handleTabChange('mesures')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'mesures'
              ? 'bg-white dark:bg-[#161B22] text-[#1A1A1A] dark:text-white shadow-sm'
              : 'text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Mesures ({mesures.length})
        </button>
        <button
          onClick={() => handleTabChange('actions')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'actions'
              ? 'bg-white dark:bg-[#161B22] text-[#1A1A1A] dark:text-white shadow-sm'
              : 'text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A] dark:hover:text-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Actions ({actions.length})
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mr-2">
          <Filter className="w-4 h-4 text-[#2E7D32]" />
          <span>Filtres :</span>
        </div>

        {activeTab === 'mesures' ? (
          <>
            <select
              value={selectedCapteur}
              onChange={(e) => handleCapteurChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              <option value="Tous">Tous les capteurs</option>
              {capteurs.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>

            <select
              value={selectedParcelle}
              onChange={(e) => handleParcelleChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              <option value="Toutes">Toutes les parcelles</option>
              {parcelles.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <select
              value={selectedEntite}
              onChange={(e) => { setSelectedEntite(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              <option value="Toutes">Toutes les entites</option>
              <option value="Parcelle">Parcelle</option>
              <option value="Capteur">Capteur</option>
              <option value="Actionneur">Actionneur</option>
            </select>

            <select
              value={selectedTypeAction}
              onChange={(e) => { setSelectedTypeAction(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              <option value="Tous">Toutes les actions</option>
              <option value="Creation">Creation</option>
              <option value="Modification">Modification</option>
              <option value="Suppression">Suppression</option>
              <option value="Activation">Activation</option>
              <option value="Desactivation">Desactivation</option>
              <option value="Commande">Commande</option>
            </select>
          </>
        )}

        <div className="relative flex-1 min-w-[200px] ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
          />
        </div>
      </div>

      {/* Graphique (mesures uniquement) */}
      {activeTab === 'mesures' && (
        <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
              <span>Tendances recentes</span>
            </h3>
          </div>
          <div className="h-60 w-full">
            {chartData.datasets.length > 0 ? (
              <Line data={chartData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[#5A5A5A] dark:text-[#8B949E]">
                Aucune mesure a afficher pour le moment
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E0E0E0] dark:border-[#30363D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
            {activeTab === 'mesures' ? `Releves (${filteredMesures.length})` : `Actions (${filteredActions.length})`}
          </h3>
          <div className="flex items-center gap-3 text-xs text-[#5A5A5A] dark:text-[#8B949E]">
            <span>Affichage {startIndex + 1}-{Math.min(startIndex + pageSize, currentData.length)} sur {currentData.length}</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-2 py-1 text-xs rounded-lg bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} / page</option>
              ))}
            </select>
          </div>
        </div>

        {pageItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#5A5A5A] dark:text-[#8B949E]">
            {currentData.length === 0 && (search || (activeTab === 'mesures' && (selectedCapteur !== 'Tous' || selectedParcelle !== 'Toutes')) || (activeTab === 'actions' && (selectedEntite !== 'Toutes' || selectedTypeAction !== 'Tous')))
              ? `Aucun(e) ${activeTab === 'mesures' ? 'releve' : 'enregistrement'} ne correspond aux filtres.`
              : `Aucun(e) ${activeTab === 'mesures' ? 'releve' : 'enregistrement'} trouve(e).`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'mesures' ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F2] dark:bg-[#0D1117] text-[#5A5A5A] dark:text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#E0E0E0] dark:border-[#30363D]">
                  <tr>
                    <th className="px-5 py-3">Date & Heure</th>
                    <th className="px-5 py-3">Capteur</th>
                    <th className="px-5 py-3">Parcelle</th>
                    <th className="px-5 py-3">Valeur</th>
                    <th className="px-5 py-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((m) => (
                    <tr key={m.id} className="border-b border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#F5F7F2] dark:hover:bg-[#0D1117]">
                      <td className="px-5 py-3 font-mono text-[#5A5A5A] dark:text-[#8B949E]">
                        {formatDate(m.timestamp)}
                      </td>
                      <td className="px-5 py-3 font-bold text-[#1A1A1A] dark:text-white">
                        {m.capteur_nom}
                      </td>
                      <td className="px-5 py-3 text-[#5A5A5A] dark:text-[#8B949E]">
                        {m.parcelle_nom}
                      </td>
                      <td className="px-5 py-3 font-extrabold text-[#1A1A1A] dark:text-white">
                        {m.valeur} <span className="text-[10px] text-[#5A5A5A]">{m.unite}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5A5A5A]/10 text-[#5A5A5A]">
                          {m.source || 'esp32'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F2] dark:bg-[#0D1117] text-[#5A5A5A] dark:text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#E0E0E0] dark:border-[#30363D]">
                  <tr>
                    <th className="px-5 py-3">Date & Heure</th>
                    <th className="px-5 py-3">Utilisateur</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Entite</th>
                    <th className="px-5 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((a) => (
                    <tr key={a.id} className="border-b border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#F5F7F2] dark:hover:bg-[#0D1117]">
                      <td className="px-5 py-3 font-mono text-[#5A5A5A] dark:text-[#8B949E]">
                        {formatDate(a.created_at)}
                      </td>
                      <td className="px-5 py-3 font-bold text-[#1A1A1A] dark:text-white">
                        {a.utilisateur_nom}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_ACTION_COLORS[a.type_action] || 'bg-gray-100 text-gray-800'}`}>
                          {TYPE_ACTION_LABELS[a.type_action] || a.type_action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-[#5A5A5A] dark:text-[#8B949E]">
                        {ENTITE_LABELS[a.entite] || a.entite} #{a.entite_id}
                      </td>
                      <td className="px-5 py-3 text-[#5A5A5A] dark:text-[#8B949E] max-w-[300px] truncate">
                        {a.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 flex items-center justify-between border-t border-[#E0E0E0] dark:border-[#30363D]">
            <span className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">
              Page {safeCurrentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                aria-label="Page precedente"
                className="p-1.5 rounded-lg border border-[#E0E0E0] dark:border-[#30363D] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                aria-label="Page suivante"
                className="p-1.5 rounded-lg border border-[#E0E0E0] dark:border-[#30363D] disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
