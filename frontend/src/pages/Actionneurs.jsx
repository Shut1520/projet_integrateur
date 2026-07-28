/**
 * Page de gestion des actionneurs (UC4, UC5, UC13).
 * Permet d'activer/desactiver les actionneurs, de programmer une duree
 * d'activation, et aux admins de creer/supprimer des actionneurs.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  Plus,
  Clock,
  Trash2,
  Power,
  Search,
  Filter,
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Liste des types d'actionneurs disponibles
const TYPES_ACTIONNEUR = ['pompe', 'ventilation', 'eclairage'];

/**
 * Page Controle des Actionneurs.
 * Affiche la liste des actionneurs sous forme de cartes avec
 * boutons d'activation, programmation et suppression (admin).
 */
export const Actionneurs = () => {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();

  const [actionneurs, setActionneurs] = useState([]);
  const [parcelles, setParcelles] = useState([]);

  // Filtres
  const [search, setSearch] = useState('');
  const [parcelleFilter, setParcelleFilter] = useState('Toutes');
  const [etatFilter, setEtatFilter] = useState('Tous');

  // Modales
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedForSchedule, setSelectedForSchedule] = useState(null);
  const [scheduleDuration, setScheduleDuration] = useState(30);

  // Etats du formulaire de creation
  const [nom, setNom] = useState('');
  const [type, setType] = useState('pompe');
  const [reference, setReference] = useState('');
  const [gpio, setGpio] = useState('');
  const [idParcelle, setIdParcelle] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const isAdmin = hasRole('admin');

  // Chargement initial des actionneurs et parcelles
  const loadData = async () => {
    try {
      const [acts, parcs] = await Promise.all([
        apiService.getActionneurs(),
        apiService.getParcelles(),
      ]);
      setActionneurs(Array.isArray(acts) ? acts : []);
      setParcelles(Array.isArray(parcs) ? parcs : []);
    } catch (err) {
      console.error('Erreur loadData Actionneurs:', err);
      addToast({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les actionneurs.',
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Envoi d'une commande ON ou OFF (UC4).
   */
  const handleToggle = async (act) => {
    const nextEtat = act.etat === 'actif' ? 'inactif' : 'actif';
    const nextAction = nextEtat === 'actif' ? 'on' : 'off';
    try {
      await apiService.updateActionneur(act.id, { etat: nextEtat });
      await apiService.commanderActionneur(act.id, nextAction);
      addToast({
        type: 'success',
        title: 'Commande envoyee',
        message: `${act.nom} -> ${nextEtat.toUpperCase()}`,
      });
      await loadData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Echec de la commande',
        message: err.response?.data?.detail || 'Erreur lors de l\'envoi.',
      });
    }
  };

  /**
   * Prepare et ouvre la modale de programmation pour un actionneur donne.
   */
  const handleOpenSchedule = (act) => {
    setSelectedForSchedule(act);
    setScheduleDuration(30);
    setIsScheduleOpen(true);
  };

  /**
   * Programmation d'une duree (UC4_ext : Programmer une duree d'activation).
   */
  const handleConfirmSchedule = async () => {
    if (!selectedForSchedule) return;
    try {
      await apiService.commanderActionneur(
        selectedForSchedule.id,
        'programmer',
        scheduleDuration
      );
      addToast({
        type: 'success',
        title: 'Programmation enregistree',
        message: `${selectedForSchedule.nom} programme pour ${scheduleDuration}s`,
      });
      setIsScheduleOpen(false);
      setSelectedForSchedule(null);
      await loadData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.response?.data?.detail || 'Programmation impossible.',
      });
    }
  };

  /**
   * Ouvre la modale de creation en reinitialisant tous les champs du formulaire.
   */
  const openCreate = () => {
    setNom('');
    setType('pompe');
    setReference('');
    setGpio('');
    setIdParcelle(parcelles[0]?.id || '');
    setIsAddOpen(true);
  };

  /**
   * Creation d'un actionneur (UC13 - Admin only).
   */
  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = {
      nom,
      type,
      reference: reference || null,
      gpio: parseInt(gpio, 10),
      etat: 'inactif',
      id_parcelle: parseInt(idParcelle, 10),
    };
    try {
      await apiService.createActionneur(payload);
      addToast({ type: 'success', title: 'Actionneur cree', message: nom });
      setIsAddOpen(false);
      await loadData();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.response?.data?.detail || 'Creation impossible.',
      });
    }
  };

  const handleDelete = (act) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer cet actionneur',
      message: `Voulez-vous vraiment supprimer l'actionneur " ${act.nom} " ? Cette action est irreversible.`,
      onConfirm: async () => {
        try {
          await apiService.deleteActionneur(act.id);
          addToast({ type: 'success', title: 'Actionneur supprime', message: act.nom });
          await loadData();
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Erreur',
            message: 'Suppression impossible (commandes liees ?).',
          });
        }
      },
    });
  };

  const getParcelleName = (id) => {
    const p = parcelles.find((x) => x.id === id);
    return p?.nom || '—';
  };

  // Application des filtres (recherche + parcelle + etat)
  const filteredActionneurs = useMemo(() => {
    return actionneurs.filter((a) => {
      const matchSearch =
        (a.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.reference || '').toLowerCase().includes(search.toLowerCase());
      const matchParcelle = parcelleFilter === 'Toutes' || String(a.id_parcelle) === String(parcelleFilter);
      const matchEtat = etatFilter === 'Tous' ||
        (etatFilter === 'Actif' && a.etat === 'actif') ||
        (etatFilter === 'Inactif' && a.etat === 'inactif');
      return matchSearch && matchParcelle && matchEtat;
    });
  }, [actionneurs, search, parcelleFilter, etatFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-[#2E7D32]" />
            <span>Controle des Actionneurs</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Pilotez manuellement vos actionneurs ou programmez une activation
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter</span>
          </button>
        )}
      </div>

      {/* Barre de filtres */}
      {actionneurs.length > 0 && (
        <div className="bg-white dark:bg-[#161B22] p-4 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] dark:text-white mr-2">
            <Filter className="w-4 h-4 text-[#2E7D32]" />
            <span>Filtres :</span>
          </div>

          {/* Filtre par parcelle */}
          <select
            value={parcelleFilter}
            onChange={(e) => setParcelleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
          >
            <option value="Toutes">Toutes les parcelles</option>
            {parcelles.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>

          {/* Filtre par etat */}
          <select
            value={etatFilter}
            onChange={(e) => setEtatFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
          >
            <option value="Tous">Tous les etats</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>

          {/* Barre de recherche */}
          <div className="relative flex-1 min-w-[200px] ml-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un actionneur..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none"
            />
          </div>
        </div>
      )}

      {filteredActionneurs.length === 0 ? (
        <div className="bg-white dark:bg-[#161B22] p-12 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
          <Zap className="w-12 h-12 text-[#5A5A5A] dark:text-[#8B949E] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">
            {actionneurs.length === 0 ? 'Aucun actionneur' : 'Aucun actionneur ne correspond aux filtres'}
          </p>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
            {actionneurs.length === 0
              ? 'Aucun actionneur n\'est encore enregistre.'
              : 'Essayez de modifier vos criteres de recherche.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActionneurs.map((act) => {
            const isOn = act.etat === 'actif';
            return (
              <div
                key={act.id}
                className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] hover:border-[#2E7D32]/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isOn ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 'bg-[#5A5A5A]/10 text-[#5A5A5A]'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">{act.nom}</h3>
                      <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] font-medium">
                        {getParcelleName(act.id_parcelle)} • GPIO {act.gpio}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isOn
                        ? 'bg-[#43A047]/10 text-[#43A047]'
                        : 'bg-[#5A5A5A]/10 text-[#5A5A5A]'
                    }`}
                  >
                    {isOn ? 'ACTIF' : 'INACTIF'}
                  </span>
                </div>

                <div className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] mb-3">
                  <span className="font-bold">Type :</span> {act.type || '—'}
                  {act.reference && (
                    <> • <span className="font-bold">Ref :</span> {act.reference}</>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#E0E0E0] dark:border-[#30363D]">
                  <button
                    onClick={() => handleToggle(act)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg ${
                      isOn
                        ? 'text-[#E53935] hover:bg-[#E53935]/10'
                        : 'text-[#2E7D32] hover:bg-[#2E7D32]/10'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {isOn ? 'Arreter' : 'Activer'}
                  </button>
                  <button
                    onClick={() => handleOpenSchedule(act)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#1E88E5] hover:bg-[#1E88E5]/10 rounded-lg"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Programmer
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(act)}
                      className="p-1.5 text-[#E53935] hover:bg-[#E53935]/10 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Programmation duree */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title="Programmer une duree">
        <div className="space-y-4">
          <p className="text-sm text-[#5A5A5A] dark:text-[#8B949E]">
            Active <span className="font-bold text-[#1A1A1A] dark:text-white">{selectedForSchedule?.nom}</span> pendant :
          </p>
          <div>
            <label className="block text-xs font-bold mb-1">Duree (en secondes)</label>
            <input
              type="number"
              min="1"
              max="3600"
              value={scheduleDuration}
              onChange={(e) => setScheduleDuration(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
            <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] mt-1">
              1s minimum • 1h maximum
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsScheduleOpen(false)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleConfirmSchedule}
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#2E7D32] hover:bg-[#256629] rounded-xl"
            >
              Programmer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Creation (UC13) */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Nouvel actionneur">
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold mb-1">Nom</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              placeholder="Ex: Pompe principale"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
              >
                {TYPES_ACTIONNEUR.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">GPIO</label>
              <input
                type="number"
                value={gpio}
                onChange={(e) => setGpio(e.target.value)}
                required
                min="0"
                placeholder="Ex: 26"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Reference (optionnel)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: SKU-POMP-26"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Parcelle</label>
            <select
              value={idParcelle}
              onChange={(e) => setIdParcelle(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D]"
            >
              <option value="">Selectionner...</option>
              {parcelles.map((p) => (
                <option key={p.id} value={p.id}>{p.nom}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#2E7D32] hover:bg-[#256629] rounded-xl"
            >
              Creer
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
