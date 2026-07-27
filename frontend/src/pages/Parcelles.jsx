/**
 * Page de gestion des parcelles (UC14 - Admin + Agriculteur).
 * Permet de créer, modifier et supprimer des parcelles agricoles.
 * Les admins peuvent assigner un propriétaire ; les agriculteurs voient les leurs.
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  Plus,
  MapPin,
  User,
  Trash2,
  Edit,
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

// Types de culture disponibles pour le formulaire de création/édition
const TYPES_CULTURE = [
  'Tomate', 'Poivron', 'Laitue', 'Maïs', 'Blé', 'Pomme', 'Vigne',
  'Concombre', 'Courgette', 'Aubergine', 'Fraise', 'Carotte', 'Autre',
];

/**
 * Page de gestion des parcelles (UC14 - Admin + Agriculteur).
 * Aligné sur le backend : nom, localisation, superficie, type_culture, id_utilisateur.
 */
export const Parcelles = () => {
  const { user, hasRole } = useAuth();
  const { addToast } = useToast();
  const [parcelles, setParcelles] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParcelle, setEditingParcelle] = useState(null);

  // États locaux du formulaire
  const [nom, setNom] = useState('');
  const [localisation, setLocalisation] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [typeCulture, setTypeCulture] = useState('Tomate');
  const [idUtilisateur, setIdUtilisateur] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const isAdmin = hasRole('admin');

  /**
   * Charge les parcelles. Les admins récupèrent aussi la liste des utilisateurs
   * pour le sélecteur de propriétaire.
   */
  const loadData = async () => {
    try {
      const [p, u] = await Promise.all([
        apiService.getParcelles(),
        isAdmin ? apiService.getUsers() : Promise.resolve([]),
      ]);
      setParcelles(Array.isArray(p) ? p : []);
      setUtilisateurs(Array.isArray(u) ? u : []);
    } catch (err) {
      console.error('Erreur Parcelles:', err);
      addToast({
        type: 'error',
        title: 'Erreur de chargement',
        message: 'Impossible de charger les parcelles.',
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Ouvre la modale en mode création avec des champs vides.
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
   * Ouvre la modale en mode édition pré-remplie avec les données existantes.
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
   * Soumission du formulaire : crée ou met à jour une parcelle.
   * Gère les erreurs 409 (nom dupliqué) et 422 (validation).
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
        addToast({ type: 'success', title: 'Parcelle mise à jour', message: nom });
      } else {
        await apiService.createParcelle(payload);
        addToast({ type: 'success', title: 'Parcelle créée', message: nom });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'Une parcelle avec ce nom existe déjà.'
          : err.response?.status === 422
          ? 'Données invalides. Vérifiez les champs.'
          : 'Enregistrement impossible.';
      addToast({ type: 'error', title: 'Erreur', message });
    }
  };

  /**
   * Supprime une parcelle après confirmation.
   * Échoue si des capteurs ou actionneurs y sont rattachés.
   */
  const handleDelete = (p) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer cette parcelle',
      message: `Voulez-vous vraiment supprimer la parcelle « ${p.nom} » ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await apiService.deleteParcelle(p.id);
          addToast({ type: 'success', title: 'Parcelle supprimée', message: p.nom });
          await loadData();
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Erreur',
            message: 'Suppression impossible (capteurs ou actionneurs liés).',
          });
        }
      },
    });
  };

  // Résolution du nom du propriétaire à partir de son ID
  const getOwnerName = (id) => {
    const u = utilisateurs.find((x) => x.id === id);
    return u?.nom || `Utilisateur #${id}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
            <Sprout className="w-6 h-6 text-[#2E7D32]" />
            <span>Gestion des Parcelles</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Créez, modifiez et organisez vos zones de culture
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle parcelle</span>
        </button>
      </div>

      {parcelles.length === 0 ? (
        <div className="bg-white dark:bg-[#161B22] p-12 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
          <Sprout className="w-12 h-12 text-[#5A5A5A] dark:text-[#8B949E] mx-auto mb-3" />
          <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">Aucune parcelle</p>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
            Commencez par créer votre première parcelle.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parcelles.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] hover:border-[#2E7D32]/50 transition-all"
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
                    <span>{p.superficie} m²</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#E0E0E0] dark:border-[#30363D]">
                <button
                  onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#2E7D32] hover:bg-[#2E7D32]/10 rounded-lg"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#E53935] hover:bg-[#E53935]/10 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Superficie (m²)</label>
              <input
                type="number"
                step="0.01"
                value={superficie}
                onChange={(e) => setSuperficie(e.target.value)}
                placeholder="Ex: 250"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Type de culture</label>
              <select
                value={typeCulture}
                onChange={(e) => setTypeCulture(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                {TYPES_CULTURE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {isAdmin && (
            <div>
              <label className="block text-xs font-bold mb-1">Propriétaire</label>
              <select
                value={idUtilisateur}
                onChange={(e) => setIdUtilisateur(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                <option value="">Sélectionner...</option>
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
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#2E7D32] hover:bg-[#256629] rounded-xl"
            >
              {editingParcelle ? 'Mettre à jour' : 'Créer'}
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
