/**
 * Page Alertes.
 * Liste les alertes du système avec filtres (état, sévérité, parcelle).
 * Permet de reconnaitre ou résoudre une alerte.
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { AlertesSkeleton } from '../components/ui/AlertesSkeleton';
import { AlertSummaryBar } from '../components/ui/AlertSummaryBar';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';

const SEVERITE_COLORS = {
  critique: 'bg-[#E53935] text-white',
  haute: 'bg-[#FF8F00] text-white',
  basse: 'bg-[#2563EB] text-white',
};

const ETAT_COLORS = {
  active: 'bg-[#E53935]/10 text-[#E53935] border-[#E53935]/20',
  reconnue: 'bg-[#FF8F00]/10 text-[#FF8F00] border-[#FF8F00]/20',
  resolue: 'bg-[#2E7D32]/10 text-[#2E7D32] border-[#2E7D32]/20',
};

export const Alertes = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreEtat, setFiltreEtat] = useState(searchParams.get('etat') || '');
  const [filtreSeverite, setFiltreSeverite] = useState(searchParams.get('severite') || '');
  const [recherche, setRecherche] = useState(searchParams.get('q') || '');

  const updateParams = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  const loadAlertes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filtreEtat) params.etat = filtreEtat;
      if (filtreSeverite) params.severite = filtreSeverite;
      const data = await apiService.getAlertes(params);
      setAlertes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement alertes:', err);
      addToast({ type: 'error', title: 'Erreur', message: 'Impossible de charger les alertes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlertes();
  }, [filtreEtat, filtreSeverite]);

  const handleReconnaitre = async (id) => {
    try {
      await apiService.reconnaitreAlerte(id);
      setAlertes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, etat: 'reconnue' } : a))
      );
      addToast({ type: 'success', title: 'Alerte reconnue', message: "L'alerte a été marquée comme reconnue." });
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible de reconnaitre l'alerte." });
    }
  };

  const handleResoudre = async (id) => {
    try {
      await apiService.resoudreAlerte(id);
      setAlertes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, etat: 'resolue', date_fin: new Date().toISOString() } : a))
      );
      addToast({ type: 'success', title: 'Alerte résolue', message: "L'alerte a été marquée comme résolue." });
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: "Impossible de résoudre l'alerte." });
    }
  };

  const handleFiltreEtat = (value) => {
    setFiltreEtat(value);
    updateParams('etat', value);
  };

  const handleFiltreSeverite = (value) => {
    setFiltreSeverite(value);
    updateParams('severite', value);
  };

  const handleRecherche = (value) => {
    setRecherche(value);
    updateParams('q', value);
  };

  const alertesFiltrees = alertes.filter((a) => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    return (
      a.type?.toLowerCase().includes(q) ||
      a.message?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[#E53935]" />
            <span>Alertes</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Surveillance des événements anormaux détectés par le système.
          </p>
        </div>
        <button
          onClick={loadAlertes}
          disabled={loading}
          className="px-3 py-1.5 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Summary bar */}
      {!loading && <AlertSummaryBar alertes={alertes} />}

      {/* Filtres */}
      <div className="bg-white dark:bg-[#161B22] p-4 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Recherche texte */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => handleRecherche(e.target.value)}
              placeholder="Rechercher par type ou message..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white placeholder-[#5A5A5A] dark:placeholder-[#8B949E] focus:outline-none"
            />
          </div>

          {/* Filtre état */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
            <select
              value={filtreEtat}
              onChange={(e) => handleFiltreEtat(e.target.value)}
              className="pl-8 pr-8 py-2 text-xs rounded-lg bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">Tous les états</option>
              <option value="active">Active</option>
              <option value="reconnue">Reconnue</option>
              <option value="resolue">Résolue</option>
            </select>
          </div>

          {/* Filtre sévérité */}
          <select
            value={filtreSeverite}
            onChange={(e) => handleFiltreSeverite(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">Toutes les sévérités</option>
            <option value="critique">Critique</option>
            <option value="haute">Haute</option>
            <option value="basse">Basse</option>
          </select>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="space-y-3">
        {loading ? (
          <AlertesSkeleton />
        ) : alertesFiltrees.length === 0 ? (
          <div className="bg-white dark:bg-[#161B22] p-12 rounded-xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
            <CheckCircle className="w-12 h-12 text-[#2E7D32] mx-auto mb-3 opacity-50" />
            <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">Aucune alerte</p>
            <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
              {filtreEtat || filtreSeverite || recherche
                ? 'Aucun résultat ne correspond aux filtres.'
                : "Le système n'a détecté aucune alerte."}
            </p>
          </div>
        ) : (
          alertesFiltrees.map((a) => (
            <div
              key={a.id}
              className={`bg-white dark:bg-[#161B22] p-4 rounded-xl border shadow-sm transition-colors ${
                a.etat === 'active'
                  ? 'border-l-4 border-l-[#E53935] border border-[#E0E0E0] dark:border-[#30363D]'
                  : 'border border-[#E0E0E0] dark:border-[#30363D]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">
                  <AlertTriangle className={`w-5 h-5 ${a.etat === 'active' ? 'text-[#E53935]' : 'text-[#5A5A5A] dark:text-[#8B949E]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                      {a.type_alerte || a.type}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEVERITE_COLORS[a.severite] || 'bg-gray-200 text-gray-600'}`}>
                      {a.severite}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ETAT_COLORS[a.etat] || 'bg-gray-100 text-gray-600'}`}>
                      {a.etat}
                    </span>
                    {a.etat === 'active' && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E53935] text-white animate-pulse">
                        Nouveau
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 leading-relaxed">
                    {a.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                    <span>Parcelle #{a.id_parcelle}</span>
                    {a.valeur != null && <span>Valeur: {a.valeur}</span>}
                    {a.seuil != null && <span>Seuil: {a.seuil}</span>}
                    <span>{a.date_debut ? new Date(a.date_debut).toLocaleString('fr-FR') : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {a.etat === 'active' && (
                    <button
                      onClick={() => handleReconnaitre(a.id)}
                      className="p-1.5 rounded-lg text-[#FF8F00] hover:bg-[#FF8F00]/10 transition-colors"
                      title="Reconnaitre"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {a.etat !== 'resolue' && (
                    <button
                      onClick={() => handleResoudre(a.id)}
                      className="p-1.5 rounded-lg text-[#2E7D32] hover:bg-[#2E7D32]/10 transition-colors"
                      title="Résoudre"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
