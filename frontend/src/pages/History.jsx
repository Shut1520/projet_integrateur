/**
 * Page d'historique des mesures.
 * Affiche un graphique d'évolution temporelle et un tableau paginé
 * des relevés de capteurs avec filtrage, recherche et export CSV.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Filter,
  Search,
  History as HistoryIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
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

// Nombre de mesures affichées par page dans le tableau
const ITEMS_PER_PAGE = 8;

/**
 * Page Historique des Mesures.
 * Charge jusqu'à 500 mesures, les enrichit avec les noms de capteurs
 * et parcelles, puis offre filtrage, pagination et graphique.
 */
export const History = () => {
  const { addToast } = useToast();
  const { theme } = useTheme();

  const [mesures, setMesures] = useState([]);
  const [capteurs, setCapteurs] = useState([]);
  const [parcelles, setParcelles] = useState([]);

  const [searchParams] = useSearchParams();
  const initialSensor = searchParams.get('capteur') || '';

  const [search, setSearch] = useState('');
  const [selectedCapteur, setSelectedCapteur] = useState('Tous');
  const [selectedParcelle, setSelectedParcelle] = useState('Toutes');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [m, c, p] = await Promise.all([
          apiService.getMesures({ limit: 500 }),
          apiService.getCapteurs(),
          apiService.getParcelles(),
        ]);
        setMesures(Array.isArray(m) ? m : []);
        setCapteurs(Array.isArray(c) ? c : []);
        setParcelles(Array.isArray(p) ? p : []);

        if (initialSensor) {
          const match = (Array.isArray(c) ? c : []).find(
            (cap) => cap.nom && cap.nom.toLowerCase() === initialSensor.toLowerCase()
          );
          if (match) setSelectedCapteur(match.id);
        }
      } catch (err) {
        console.error('Erreur History:', err);
      }
    }
    fetchAll();
  }, []);

  // Index de résolution rapide : ID capteur → objet capteur complet
  const capteurById = useMemo(
    () => Object.fromEntries(capteurs.map((c) => [c.id, c])),
    [capteurs]
  );
  const parcelleById = useMemo(
    () => Object.fromEntries(parcelles.map((p) => [p.id, p])),
    [parcelles]
  );

  /**
   * Enrichit une mesure brute avec les noms résolus de capteur et parcelle.
   */
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

  // Application combinée des filtres (recherche texte, capteur, parcelle)
  const filtered = useMemo(() => {
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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageItems = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Construction du jeu de données pour le graphique Chart.js
  // Synchronise avec les données FILTREES et groupe par CAPTEUR.
  // Chaque dataset est aligné sur les mêmes labels (timestamps) pour éviter le décalage.
  const chartData = useMemo(() => {
    // On prend les données filtrées, triées chronologiquement
    const sorted = [...filtered].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (sorted.length === 0) {
      return { labels: [], datasets: [] };
    }

    // On limite à 50 points maximum pour la lisibilité
    const recent = sorted.slice(-50);

    // Labels = timestamps uniques formatés
    const labels = recent.map((m) => {
      const d = new Date(m.timestamp);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    });

    // Index rapide : timestamp brut -> index dans le tableau recent
    const tsToIndex = {};
    recent.forEach((m, idx) => { tsToIndex[m.timestamp] = idx; });

    // Groupe par capteur
    const byCapteur = {};
    recent.forEach((m) => {
      const key = m.capteur_nom || `Capteur #${m.id_capteur}`;
      if (!byCapteur[key]) byCapteur[key] = new Array(recent.length).fill(null);
      const idx = tsToIndex[m.timestamp];
      byCapteur[key][idx] = m.valeur;
    });

    const colors = [
      '#2E7D32', '#2563EB', '#D97706', '#E53935', '#0891B2',
      '#8E24AA', '#FB8C00', '#43A047',
    ];

    const datasets = Object.entries(byCapteur).map(([nom, data], i) => ({
      label: nom,
      data,
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + '15',
      tension: 0.3,
      fill: false,
      pointRadius: 3,
      pointHoverRadius: 5,
      spanGaps: true, // Relie les points même s'il y a des null entre eux
    }));

    return { labels, datasets };
  }, [filtered]);

  // Options du graphique adaptées au thème clair/sombre
  const isDark = theme === 'dark';
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
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A', maxRotation: 45, minRotation: 30 },
      },
      y: {
        grid: { color: isDark ? '#30363D' : '#E0E0E0' },
        ticks: { color: isDark ? '#8B949E' : '#5A5A5A' },
      },
    },
  };

  /**
   * Échappe une valeur CSV selon la RFC 4180.
   * - Si la valeur contient des guillemets, des virgules ou des sauts de ligne,
   *   elle est entourée de guillemets et les guillemets internes sont doublés.
   */
  const escapeCSV = (value) => {
    if (value == null) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  /**
   * Exporte les données filtrées en CSV proprement formaté.
   * Ajoute un BOM UTF-8 pour Excel, des en-têtes français clairs,
   * et échappe correctement les valeurs.
   */
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      addToast({ type: 'warning', title: 'Export vide', message: 'Aucune mesure à exporter avec les filtres actuels.' });
      return;
    }

    const headers = ['ID', 'Capteur', 'Parcelle', 'Valeur', 'Unite', 'Source', 'Date et Heure'];
    const rows = filtered.map((m) => [
      m.id,
      m.capteur_nom,
      m.parcelle_nom,
      m.valeur,
      m.unite,
      m.source || 'esp32',
      formatDate(m.timestamp),
    ]);

    const csvLines = [headers.map(escapeCSV).join(';'), ...rows.map((row) => row.map(escapeCSV).join(';'))];
    const csvContent = '\uFEFF' + csvLines.join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sai_historique_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Export CSV',
      message: `${filtered.length} mesure${filtered.length > 1 ? 's' : ''} exportée${filtered.length > 1 ? 's' : ''}.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
            <HistoryIcon className="w-6 h-6 text-[#2E7D32]" />
            <span>Historique des Mesures</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Consultation, filtrage et export des données temporelles
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

      <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mr-2">
          <Filter className="w-4 h-4 text-[#2E7D32]" />
          <span>Filtres :</span>
        </div>

        <select
          value={selectedCapteur}
          onChange={(e) => { setSelectedCapteur(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
        >
          <option value="Tous">Tous les capteurs</option>
          {capteurs.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>

        <select
          value={selectedParcelle}
          onChange={(e) => { setSelectedParcelle(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
        >
          <option value="Toutes">Toutes les parcelles</option>
          {parcelles.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px] ml-auto">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2E7D32]" />
            <span>Tendances récentes</span>
          </h3>
        </div>
        <div className="h-60 w-full">
          {chartData.datasets.length > 0 ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-[#5A5A5A] dark:text-[#8B949E]">
              Aucune mesure à afficher pour le moment
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E0E0E0] dark:border-[#30363D] flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
            Relevés ({filtered.length})
          </h3>
        </div>

        {pageItems.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#5A5A5A] dark:text-[#8B949E]">
            Aucune mesure trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
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
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 flex items-center justify-between border-t border-[#E0E0E0] dark:border-[#30363D]">
            <span className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E0E0E0] dark:border-[#30363D] disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
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
