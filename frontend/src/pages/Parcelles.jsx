/**
 * Page de gestion des parcelles (UC14 - Admin + Agriculteur).
 * Permet de creer, modifier et supprimer des parcelles agricoles.
 * Les admins peuvent assigner un proprietaire ; les agriculteurs voient les leurs.
 * Click sur une carte → vue detaillee avec capteurs/actionneurs rattachés.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ParcellesSkeleton } from '../components/ui/ParcellesSkeleton';
import { ParcelleSummaryBar } from '../components/ui/ParcelleSummaryBar';
import {
  Sprout,
  Plus,
  MapPin,
  User,
  Trash2,
  Edit,
  Search,
  Filter,
  Cpu,
  Zap,
  Eye,
  ChevronRight,
  Wifi,
  WifiOff,
  Power,
  PowerOff,
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Types de culture disponibles pour le formulaire de creation/edition
const TYPES_CULTURE = [
  'Tomate', 'Poivron', 'Laitue', 'Mais', 'Ble', 'Pomme', 'Vigne',
  'Concombre', 'Courgette', 'Aubergine', 'Fraise', 'Carotte', 'Autre',
];

/**
 * Page de gestion des parcelles (UC14 - Admin + Agriculteur).
 * Aligne sur le backend : nom, localisation, superficie, type_culture, id_utilisateur.
 */
export const Parcelles = () => {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [parcelles, setParcelles] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [capteursAll, setCapteursAll] = useState([]);
  const [actionneursAll, setActionneursAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParcelle, setEditingParcelle] = useState(null);

  // Filtres persistés dans l'URL
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filterTypeCulture, setFilterTypeCulture] = useState(searchParams.get('type') || 'Tous');
  const [filterProprietaire, setFilterProprietaire] = useState(searchParams.get('proprietaire') || 'Tous');

  const updateParams = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'Tous') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  // Etats locaux du formulaire
  const [nom, setNom] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [typeCulture, setTypeCulture] = useState('Tomate');
  const [idUtilisateur, setIdUtilisateur] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Modal detail parcelle
  const [detailParcelle, setDetailParcelle] = useState(null);

  // Modal reassignation
  const [reassignModal, setReassignModal] = useState({ open: false, type: null, item: null, newParcelleId: '' });

  const isAdmin = hasRole('admin');

  /**
   * Charge les parcelles. Les admins recuperent aussi la liste des utilisateurs
   * pour le selecteur de proprietaire.
   */
  const loadData = async () => {
    try {
      const [p, u, c, a] = await Promise.all([
        apiService.getParcelles(),
        isAdmin ? apiService.getUsers() : Promise.resolve([]),
        apiService.getCapteurs(),
        apiService.getActionneurs(),
      ]);
      setParcelles(Array.isArray(p) ? p : []);
      setUtilisateurs(Array.isArray(u) ? u : []);
      setCapteursAll(Array.isArray(c) ? c : []);
      setActionneursAll(Array.isArray(a) ? a : []);
    } catch (err) {
      console.error('Erreur Parcelles:', err);
      addToast({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les parcelles.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Ouvre la modale en mode creation avec des champs vides.
   */
  const openCreate = () => {
    setEditingParcelle(null);
    setNom('');
    setLocalisation('');
    setSuperficie('');
    setTypeCulture('Tomate');
    setIdUtilisateur(user?.id || '');
    setIsModalOpen(true);
  };

  /**
   * Ouvre la modale en mode edition pre-remplie avec les donnees existantes.
   */
  const openEdit = (p) => {
    setEditingParcelle(p);
    setNom(p.nom || '');
    setLocalisation(p.localisation || '');
    setSuperficie(p.superficie ?? '');
    setTypeCulture(p.type_culture || 'Tomate');
    setIdUtilisateur(p.id_utilisateur ?? user?.id ?? '');
    setIsModalOpen(true);
  };

  /**
   * Soumission du formulaire : cree ou met a jour une parcelle.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nom || !localisation) {
      addToast({ type: 'error', title: 'Erreur', message: 'Nom et localisation obligatoires.' });
      return;
    }

    const payload = {
      nom,
      localisation,
      superficie: superficie ? Number(superficie) : null,
      type_culture: typeCulture,
      id_utilisateur: Number(idUtilisateur),
    };

    try {
      if (editingParcelle) {
        await apiService.updateParcelle(editingParcelle.id, payload);
        addToast({ type: 'success', title: 'Parcelle mise a jour', message: nom });
      } else {
        await apiService.createParcelle(payload);
        addToast({ type: 'success', title: 'Parcelle creee', message: nom });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'Une parcelle avec ce nom existe deja.'
          : err.response?.status === 422
          ? 'Donnees invalides. Verifiez les champs.'
          : 'Enregistrement impossible.';
      addToast({ type: 'error', title: 'Erreur', message });
    }
  };

  /**
   * Supprime une parcelle apres confirmation.
   */
  const handleDelete = (p) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer cette parcelle',
      message: `Voulez-vous vraiment supprimer la parcelle " ${p.nom} " ? Tous les capteurs et actionneurs attaches seront supprimes. Cette action est irreversible.`,
      onConfirm: async () => {
        try {
          await apiService.deleteParcelle(p.id);
          addToast({ type: 'success', title: 'Parcelle supprimee', message: p.nom });
          await loadData();
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Erreur',
            message: 'Suppression impossible (capteurs ou actionneurs lies).',
          });
        }
      },
    });
  };

  /**
   * Ouvre la vue detaillee d'une parcelle.
   */
  const openDetail = (p) => {
    setDetailParcelle(p);
  };

  /**
   * Ouvre la modale de reassignation d'un capteur ou actionneur.
   */
  const openReassign = (type, item) => {
    setReassignModal({ open: true, type, item, newParcelleId: String(item.id_parcelle) });
  };

  /**
   * Confirme la reassignation vers une nouvelle parcelle.
   */
  const handleConfirmReassign = async () => {
    const { type, item, newParcelleId } = reassignModal;
    if (!newParcelleId) return;
    try {
      if (type === 'capteur') {
        await apiService.updateCapteur(item.id, { id_parcelle: parseInt(newParcelleId, 10) });
      } else {
        await apiService.updateActionneur(item.id, { id_parcelle: parseInt(newParcelleId, 10) });
      }
      addToast({
        type: 'success',
        title: `${type === 'capteur' ? 'Capteur' : 'Actionneur'} reassigne`,
        message: `${item.nom} deplace vers la parcelle selectionnee.`,
      });
      setReassignModal({ open: false, type: null, item: null, newParcelleId: '' });
      await loadData();
      // Rafraichir le detail si ouvert
      if (detailParcelle) {
        const updated = (await apiService.getParcelles()).find?.((p) => p.id === detailParcelle.id);
        // On recharge simplement les donnees
      }
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Reassignation impossible.' });
    }
  };

  // Resolution du nom du proprietaire a partir de son ID
  const getOwnerName = (id) => {
    const u = utilisateurs.find((x) => x.id === id);
    return u?.nom || `Utilisateur #${id}`;
  };

  // Resolution du nom d'une parcelle par son ID
  const getParcelleName = (id) => {
    const p = parcelles.find((x) => x.id === id);
    return p?.nom || '—';
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    updateParams('q', value);
  };

  const handleTypeFilterChange = (value) => {
    setFilterTypeCulture(value);
    updateParams('type', value);
  };

  const handleProprietaireFilterChange = (value) => {
    setFilterProprietaire(value);
    updateParams('proprietaire', value);
  };

  // Liste des types de culture uniques presents dans les donnees
  const uniqueTypes = useMemo(() => {
    const types = parcelles.map((p) => p.type_culture).filter(Boolean);
    return [...new Set(types)].sort();
  }, [parcelles]);

  // Capteurs et actionneurs de la parcelle en detail
  const detailCapteurs = useMemo(() => {
    if (!detailParcelle) return [];
    return capteursAll.filter((c) => c.id_parcelle === detailParcelle.id);
  }, [detailParcelle, capteursAll]);

  const detailActionneurs = useMemo(() => {
    if (!detailParcelle) return [];
    return actionneursAll.filter((a) => a.id_parcelle === detailParcelle.id);
  }, [detailParcelle, actionneursAll]);

  // Application des filtres
  const filtered = useMemo(() => {
    return parcelles.filter((p) => {
      const matchSearch =
        (p.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.localisation || '').toLowerCase().includes(search.toLowerCase());
      const matchType = filterTypeCulture === 'Tous' || p.type_culture === filterTypeCulture;
      const matchProprietaire = filterProprietaire === 'Tous' || String(p.id_utilisateur) === String(filterProprietaire);
      return matchSearch && matchType && matchProprietaire;
    });
  }, [parcelles, search, filterTypeCulture, filterProprietaire]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
           <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Sprout className="w-6 h-6 text-[#2E7D32]" />
            <span>Gestion des Parcelles</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Creez, modifiez et organisez vos zones de culture
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-press px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle parcelle</span>
        </button>
      </div>

      {/* Barre de filtres */}
      {parcelles.length > 0 && (
        <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mr-2">
            <Filter className="w-4 h-4 text-[#2E7D32]" />
            <span>Filtres :</span>
          </div>

          <select
            value={filterTypeCulture}
            onChange={(e) => handleTypeFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
          >
            <option value="Tous">Tous les types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {isAdmin && utilisateurs.length > 0 && (
            <select
              value={filterProprietaire}
              onChange={(e) => handleProprietaireFilterChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              <option value="Tous">Tous les proprietaires</option>
              {utilisateurs.map((u) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          )}

          <div className="relative flex-1 min-w-[200px] ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher une parcelle..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
            />
          </div>
        </div>
      )}

      {loading ? (
        <ParcellesSkeleton />
      ) : (
        <React.Fragment>
          <ParcelleSummaryBar parcelles={parcelles} capteurs={capteursAll} actionneurs={actionneursAll} />

          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-[#161B22] p-12 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
              <Sprout className="w-12 h-12 text-[#5A5A5A] dark:text-[#8B949E] mx-auto mb-3" />
              <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">
                {parcelles.length === 0 ? 'Aucune parcelle' : 'Aucune parcelle ne correspond aux filtres'}
              </p>
              <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
                {parcelles.length === 0
                  ? 'Commencez par creer votre premiere parcelle.'
                  : 'Essayez de modifier vos criteres de recherche.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 card-stagger">
              {filtered.map((p) => {
            const nbCapteurs = capteursAll.filter((c) => c.id_parcelle === p.id).length;
            const nbActionneurs = actionneursAll.filter((a) => a.id_parcelle === p.id).length;
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] hover:border-[#2E7D32]/50 hover:shadow-md transition-[border-color,box-shadow] duration-200 cursor-pointer"
                onClick={() => openDetail(p)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center">
                      <Sprout className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
                        {p.nom}
                      </h3>
                      <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {p.localisation}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#43A047]/10 text-[#43A047]">
                    {p.type_culture || '—'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-[#5A5A5A] dark:text-[#8B949E] my-3">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3" />
                    <span>{getOwnerName(p.id_utilisateur)}</span>
                  </div>
                  {p.superficie != null && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span>{p.superficie} m2</span>
                    </div>
                  )}
                </div>

                {/* Compteurs capteurs/actionneurs */}
                <div className="flex items-center gap-3 mb-3 pt-2 border-t border-[#E0E0E0] dark:border-[#30363D]">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#5A5A5A] dark:text-[#8B949E]">
                    <Cpu className="w-3 h-3 text-[#2E7D32]" />
                    <span>{nbCapteurs} capteur{nbCapteurs > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#5A5A5A] dark:text-[#8B949E]">
                    <Zap className="w-3 h-3 text-[#2E7D32]" />
                    <span>{nbActionneurs} actionneur{nbActionneurs > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                    className="btn-press flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#2E7D32] hover:bg-[#2E7D32]/10 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                    className="btn-press flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#E53935] hover:bg-[#E53935]/10 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDetail(p); }}
                    className="p-1.5 text-[#5A5A5A] dark:text-[#8B949E] hover:bg-[#F5F7F2] dark:hover:bg-[#22272e] rounded-lg"
                    title="Voir les details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
          )}
        </React.Fragment>
      )}

      {/* ═══ Modal Detail Parcelle ═══ */}
      <Modal isOpen={!!detailParcelle} onClose={() => setDetailParcelle(null)} title={`Detail — ${detailParcelle?.nom || ''}`} maxWidth="max-w-2xl">
        {detailParcelle && (
          <div className="space-y-6">
            {/* Infos generales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Localisation</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{detailParcelle.localisation || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Type de culture</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{detailParcelle.type_culture || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Proprietaire</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{getOwnerName(detailParcelle.id_utilisateur)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Superficie</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{detailParcelle.superficie != null ? `${detailParcelle.superficie} m2` : '—'}</p>
              </div>
            </div>

            {/* Liste des capteurs */}
            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mb-3">
                <Cpu className="w-4 h-4 text-[#2E7D32]" />
                Capteurs ({detailCapteurs.length})
              </h4>
              {detailCapteurs.length === 0 ? (
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] italic">Aucun capteur affecte a cette parcelle.</p>
              ) : (
                <div className="space-y-2">
                  {detailCapteurs.map((cap) => (
                    <div key={cap.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cap.etat === 'actif' ? 'bg-[#43A047]/10 text-[#43A047]' : cap.etat === 'defaillant' ? 'bg-[#E53935]/10 text-[#E53935]' : 'bg-[#FB8C00]/10 text-[#FB8C00]'}`}>
                          {cap.etat === 'actif' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1A1A1A] dark:text-white">{cap.nom}</p>
                          <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">GPIO {cap.gpio} • {cap.protocole} • {cap.etat}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => openReassign('capteur', cap)}
                            className="px-2 py-1 text-[10px] font-bold text-[#1E88E5] hover:bg-[#1E88E5]/10 rounded-lg"
                          >
                            Reaffecter
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/capteurs')}
                          className="p-1 text-[#5A5A5A] dark:text-[#8B949E] hover:bg-gray-100 dark:hover:bg-[#22272e] rounded-lg"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Liste des actionneurs */}
            <div>
              <h4 className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mb-3">
                <Zap className="w-4 h-4 text-[#2E7D32]" />
                Actionneurs ({detailActionneurs.length})
              </h4>
              {detailActionneurs.length === 0 ? (
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] italic">Aucun actionneur affecte a cette parcelle.</p>
              ) : (
                <div className="space-y-2">
                  {detailActionneurs.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${act.etat === 'actif' ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 'bg-[#5A5A5A]/10 text-[#5A5A5A]'}`}>
                          {act.etat === 'actif' ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#1A1A1A] dark:text-white">{act.nom}</p>
                          <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">GPIO {act.gpio} • {act.etat}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={() => openReassign('actionneur', act)}
                            className="px-2 py-1 text-[10px] font-bold text-[#1E88E5] hover:bg-[#1E88E5]/10 rounded-lg"
                          >
                            Reaffecter
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/actionneurs')}
                          className="p-1 text-[#5A5A5A] dark:text-[#8B949E] hover:bg-gray-100 dark:hover:bg-[#22272e] rounded-lg"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ Modal Reassignation ═══ */}
      <Modal isOpen={reassignModal.open} onClose={() => setReassignModal({ open: false, type: null, item: null, newParcelleId: '' })} title={`Reaffecter — ${reassignModal.item?.nom || ''}`}>
        <div className="space-y-4">
          <p className="text-sm text-[#5A5A5A] dark:text-[#8B949E]">
            Deplacer <span className="font-bold text-[#1A1A1A] dark:text-white">{reassignModal.item?.nom}</span> vers :
          </p>
          <select
            value={reassignModal.newParcelleId}
            onChange={(e) => setReassignModal((prev) => ({ ...prev, newParcelleId: e.target.value }))}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
          >
            {parcelles.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setReassignModal({ open: false, type: null, item: null, newParcelleId: '' })}
              className="btn-press flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmReassign}
              className="btn-press flex-1 py-2.5 text-sm font-bold text-white bg-[#1E88E5] hover:bg-[#1565C0] rounded-xl"
            >
              Reaffecter
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══ Modal Formulaire Parcelle ═══ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingParcelle ? 'Modifier la parcelle' : 'Nouvelle parcelle'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold mb-1">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex: Serre A"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Localisation</label>
            <input
              type="text"
              value={localisation}
              onChange={(e) => setLocalisation(e.target.value)}
              required
              placeholder="Ex: Secteur Nord - Zone 1"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Superficie (m2)</label>
              <input
                type="number"
                step="0.01"
                value={superficie}
                onChange={(e) => setSuperficie(e.target.value)}
                placeholder="Ex: 250"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Type de culture</label>
              <select
                value={typeCulture}
                onChange={(e) => setTypeCulture(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                {TYPES_CULTURE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-bold mb-1">Proprietaire</label>
              <select
                value={idUtilisateur}
                onChange={(e) => setIdUtilisateur(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                <option value="">Selectionner...</option>
                {utilisateurs.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nom} ({u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-press flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
              >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-press flex-1 py-2.5 text-sm font-bold text-white bg-[#2E7D32] hover:bg-[#256629] rounded-xl"
            >
              {editingParcelle ? 'Mettre a jour' : 'Creer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
};
