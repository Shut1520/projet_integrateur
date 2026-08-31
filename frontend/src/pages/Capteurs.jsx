/**
 * Page de gestion des capteurs (UC12 - Admin).
 * CRUD complet sur les capteurs d'une parcelle avec
 * formulaire de creation/edition, suppression et vue detaillee.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { CapteursSkeleton } from '../components/ui/CapteursSkeleton';
import { CapteurSummaryBar } from '../components/ui/CapteurSummaryBar';
import { Cpu, Plus, Edit, Trash2, MapPin, Wifi, WifiOff, Search, Filter, Eye, Calendar } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { formatDate } from '../utils/formatters';

const PROTOCOLE_ICONS = { digital: Wifi, analog: Cpu, i2c: Cpu };
const PROTOCOLE_COLORS = {
  digital: 'text-[#2E7D32] bg-[#2E7D32]/10',
  analog: 'text-[#2563EB] bg-[#2563EB]/10',
  i2c: 'text-[#8E24AA] bg-[#8E24AA]/10',
};

/**
 * Page de gestion des capteurs (UC12 - Admin).
 * CRUD complet sur les capteurs d'une parcelle.
 */
export const Capteurs = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [capteurs, setCapteurs] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapteur, setEditingCapteur] = useState(null);

  // Filtres persistés dans l'URL
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [filterParcelle, setFilterParcelle] = useState(searchParams.get('parcelle') || 'Toutes');
  const [filterEtat, setFilterEtat] = useState(searchParams.get('etat') || 'Tous');

  const updateParams = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value || value === 'Toutes' || value === 'Tous') {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      return next;
    });
  };

  // Form
  const [nom, setNom] = useState('');
  const [reference, setReference] = useState('');
  const [gpio, setGpio] = useState('');
  const [protocole, setProtocole] = useState('digital');
  const [etat, setEtat] = useState('actif');
  const [idParcelle, setIdParcelle] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Modal detail
  const [detailCapteur, setDetailCapteur] = useState(null);
  const [reassignParcelleId, setReassignParcelleId] = useState('');

  const PROTOCOLES = ['digital', 'analog', 'i2c'];
  const ETATS = ['actif', 'inactif', 'defaillant'];

  const loadData = async () => {
    try {
      const [caps, parcs] = await Promise.all([
        apiService.getCapteurs(),
        apiService.getParcelles(),
      ]);
      setCapteurs(Array.isArray(caps) ? caps : []);
      setParcelles(Array.isArray(parcs) ? parcs : []);
    } catch (err) {
      console.error(err);
      setCapteurs([]);
      setParcelles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingCapteur(null);
    setNom('');
    setReference('');
    setGpio('');
    setProtocole('digital');
    setEtat('actif');
    setIdParcelle(parcelles[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEdit = (cap) => {
    setEditingCapteur(cap);
    setNom(cap.nom || '');
    setReference(cap.reference || '');
    setGpio(cap.gpio ?? '');
    setProtocole(cap.protocole || 'digital');
    setEtat(cap.etat || 'actif');
    setIdParcelle(cap.id_parcelle ?? '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      nom,
      reference: reference || null,
      gpio: parseInt(gpio, 10),
      protocole,
      etat,
      id_parcelle: parseInt(idParcelle, 10),
    };

    try {
      if (editingCapteur) {
        await apiService.updateCapteur(editingCapteur.id, payload);
        addToast({ type: 'success', title: 'Capteur mis a jour', message: `${nom} modifie.` });
      } else {
        await apiService.createCapteur(payload);
        addToast({ type: 'success', title: 'Capteur cree', message: `${nom} ajoute.` });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'Un capteur existe deja avec cette configuration.'
          : err.response?.status === 422
          ? 'Donnees invalides. Verifiez les champs.'
          : 'Erreur lors de l\'enregistrement.';
      addToast({ type: 'error', title: 'Erreur', message });
    }
  };

  const handleDelete = (cap) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer ce capteur',
      message: `Voulez-vous vraiment supprimer le capteur " ${cap.nom} " ? Cette action est irreversible.`,
      onConfirm: async () => {
        try {
          await apiService.deleteCapteur(cap.id);
          addToast({ type: 'success', title: 'Capteur supprime', message: cap.nom });
          setDetailCapteur(null);
          await loadData();
        } catch (err) {
          addToast({ type: 'error', title: 'Erreur', message: 'Suppression impossible.' });
        }
      },
    });
  };

  const openDetail = (cap) => {
    setDetailCapteur(cap);
    setReassignParcelleId(String(cap.id_parcelle));
  };

  /**
   * Reaffecte le capteur a une autre parcelle depuis le detail.
   */
  const handleReassign = async () => {
    if (!detailCapteur || !reassignParcelleId) return;
    try {
      await apiService.updateCapteur(detailCapteur.id, { id_parcelle: parseInt(reassignParcelleId, 10) });
      addToast({ type: 'success', title: 'Capteur reassigne', message: `${detailCapteur.nom} deplace.` });
      await loadData();
      // Mettre a jour le detail
      setDetailCapteur(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Reassignation impossible.' });
    }
  };

  const getParcelleName = (id) => {
    const p = parcelles.find((x) => x.id === id);
    return p?.nom || '—';
  };

  const handleSearchChange = (value) => {
    setSearch(value);
    updateParams('q', value);
  };

  const handleParcelleFilterChange = (value) => {
    setFilterParcelle(value);
    updateParams('parcelle', value);
  };

  const handleEtatFilterChange = (value) => {
    setFilterEtat(value);
    updateParams('etat', value);
  };

  const filtered = useMemo(() => {
    return capteurs.filter((cap) => {
      const matchSearch =
        (cap.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (cap.reference || '').toLowerCase().includes(search.toLowerCase());
      const matchParcelle = filterParcelle === 'Toutes' || String(cap.id_parcelle) === String(filterParcelle);
      const matchEtat = filterEtat === 'Tous' || cap.etat === filterEtat;
      return matchSearch && matchParcelle && matchEtat;
    });
  }, [capteurs, search, filterParcelle, filterEtat]);

  // Donnees du detail (pour rafraichir apres modif)
  const detailData = useMemo(() => {
    if (!detailCapteur) return null;
    return capteurs.find((c) => c.id === detailCapteur.id) || detailCapteur;
  }, [detailCapteur, capteurs]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
           <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <Cpu className="w-6 h-6 text-[#2E7D32]" />
            <span>Gestion des Capteurs</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Enregistrez, modifiez ou retirez les capteurs de vos parcelles
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-press px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un capteur</span>
        </button>
      </div>

      {/* Barre de filtres */}
      {capteurs.length > 0 && (
        <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mr-2">
            <Filter className="w-4 h-4 text-[#2E7D32]" />
            <span>Filtres :</span>
          </div>

          <select
            value={filterParcelle}
            onChange={(e) => handleParcelleFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
          >
            <option value="Toutes">Toutes les parcelles</option>
            {parcelles.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>

          <select
            value={filterEtat}
            onChange={(e) => handleEtatFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
          >
            <option value="Tous">Tous les etats</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="defaillant">Defaillant</option>
          </select>

          <div className="relative flex-1 min-w-[200px] ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Rechercher un capteur..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
            />
          </div>
        </div>
      )}

      {loading ? (
        <CapteursSkeleton />
      ) : (
        <React.Fragment>
          <CapteurSummaryBar capteurs={capteurs} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 card-stagger">
            {filtered.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-[#161B22] p-12 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
                <Cpu className="w-12 h-12 text-[#5A5A5A] dark:text-[#8B949E] mx-auto mb-3" />
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">
                  {capteurs.length === 0 ? 'Aucun capteur enregistre' : 'Aucun capteur ne correspond aux filtres'}
                </p>
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
                  {capteurs.length === 0
                    ? 'Commencez par ajouter un capteur a une parcelle.'
                    : 'Essayez de modifier vos criteres de recherche.'}
                </p>
              </div>
            ) : (
              filtered.map((cap) => {
                const isOn = cap.etat === 'actif';
                const ProtoIcon = PROTOCOLE_ICONS[cap.protocole] || Wifi;
                return (
                  <div
                    key={cap.id}
                    className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] hover:border-[#2E7D32]/50 hover:shadow-md transition-[border-color,box-shadow] duration-200 cursor-pointer"
                    onClick={() => openDetail(cap)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isOn ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 'bg-[#5A5A5A]/10 text-[#5A5A5A]'
                        }`}>
                          {isOn ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">{cap.nom}</h3>
                          <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] font-medium">
                            {cap.reference || 'Sans reference'}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          cap.etat === 'actif'
                            ? 'bg-[#43A047]/10 text-[#43A047]'
                            : cap.etat === 'inactif'
                            ? 'bg-[#FB8C00]/10 text-[#FB8C00]'
                            : 'bg-[#E53935]/10 text-[#E53935]'
                        }`}
                      >
                        {cap.etat}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${PROTOCOLE_COLORS[cap.protocole] || 'bg-[#5A5A5A]/10 text-[#5A5A5A]'}`}>
                        <ProtoIcon className="w-3 h-3" />
                        {cap.protocole}
                      </span>
                      <span className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">GPIO {cap.gpio}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#5A5A5A] dark:text-[#8B949E]">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        <span>{getParcelleName(cap.id_parcelle)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E0E0E0] dark:border-[#30363D]">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(cap); }}
                        className="btn-press flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#2E7D32] hover:bg-[#2E7D32]/10 rounded-lg"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Modifier
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(cap); }}
                        className="btn-press flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#E53935] hover:bg-[#E53935]/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Supprimer
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(cap); }}
                        aria-label="Voir les détails"
                        className="p-1.5 text-[#5A5A5A] dark:text-[#8B949E] hover:bg-[#F5F7F2] dark:hover:bg-[#22272e] rounded-lg"
                        title="Voir les details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </React.Fragment>
      )}

      {/* ═══ Modal Detail Capteur ═══ */}
      <Modal isOpen={!!detailData} onClose={() => setDetailCapteur(null)} title={`Detail — ${detailData?.nom || ''}`}>
        {detailData && (
          <div className="space-y-5">
            {/* Grille d'infos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Nom</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{detailData.nom}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Reference</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{detailData.reference || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">GPIO</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">Broche {detailData.gpio}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Protocole</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white uppercase">{detailData.protocole}</p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Etat</p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  detailData.etat === 'actif' ? 'bg-[#43A047]/10 text-[#43A047]' : detailData.etat === 'defaillant' ? 'bg-[#E53935]/10 text-[#E53935]' : 'bg-[#FB8C00]/10 text-[#FB8C00]'
                }`}>
                  {detailData.etat}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
                <p className="text-[10px] font-bold uppercase text-[#5A5A5A] dark:text-[#8B949E] mb-1">Parcelle</p>
                <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">{getParcelleName(detailData.id_parcelle)}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-4 text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
              {detailData.created_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Cree le {formatDate(detailData.created_at)}</span>
                </div>
              )}
              {detailData.updated_at && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Modifie le {formatDate(detailData.updated_at)}</span>
                </div>
              )}
            </div>

            {/* Reaffectation */}
            <div className="p-4 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]">
              <p className="text-xs font-bold text-[#1A1A1A] dark:text-white mb-2">Affecter a une parcelle</p>
              <div className="flex items-center gap-2">
                <select
                  value={reassignParcelleId}
                  onChange={(e) => setReassignParcelleId(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#161B22] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
                >
                  {parcelles.map((p) => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
                <button
                  onClick={handleReassign}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E88E5] hover:bg-[#1565C0] rounded-xl"
                >
                  Affecter
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[#E0E0E0] dark:border-[#30363D]">
              <button
                onClick={() => { setDetailCapteur(null); openEdit(detailData); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-[#2E7D32] hover:bg-[#2E7D32]/10 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
              <button
                onClick={() => { setDetailCapteur(null); handleDelete(detailData); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold text-[#E53935] hover:bg-[#E53935]/10 rounded-xl border border-[#E0E0E0] dark:border-[#30363D]"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ Modal Formulaire Capteur ═══ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCapteur ? 'Modifier le capteur' : 'Nouveau capteur'}>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold mb-1">Nom du capteur</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex: dht22-serre-a"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Reference (optionnel)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: DHT22-AM2302"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">GPIO</label>
              <input
                type="number"
                value={gpio}
                onChange={(e) => setGpio(e.target.value)}
                required
                min="0"
                placeholder="Ex: 4"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Protocole</label>
              <select
                value={protocole}
                onChange={(e) => setProtocole(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                {PROTOCOLES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Etat</label>
              <select
                value={etat}
                onChange={(e) => setEtat(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                {ETATS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Parcelle</label>
              <select
                value={idParcelle}
                onChange={(e) => setIdParcelle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                <option value="">Selectionner...</option>
                {parcelles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </select>
            </div>
          </div>

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
              {editingCapteur ? 'Mettre a jour' : 'Creer'}
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
