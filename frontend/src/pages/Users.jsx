/**
 * Page de gestion des utilisateurs (UC8 - Admin).
 * Permet de lister, créer, modifier et supprimer des comptes.
 * Affiche des statistiques (total, admins, agriculteurs) et un tableau filtrable.
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { useSearchParams } from 'react-router-dom';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { UsersSkeleton } from '../components/ui/UsersSkeleton';
import {
  Users as UsersIcon,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Trash2,
  Edit,
  Mail,
  Clock,
  Power,
} from 'lucide-react';

/**
 * Page Gestion des Utilisateurs.
 * Réservée aux administrateurs.
 */
export const UsersPage = () => {
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState(searchParams.get('role') || 'Tous');

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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agriculteur');
  const [password, setPassword] = useState('');
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  /**
   * Récupère la liste complète des utilisateurs depuis le backend.
   */
  const loadUsers = async () => {
    try {
      const data = await apiService.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /**
   * Ouvre la modale en mode création (champs vides).
   */
  const handleOpenAddModal = () => {
    setEditingUser(null);
    setNom('');
    setEmail('');
    setRole('agriculteur');
    setPassword('');
    setIsModalOpen(true);
  };

  /**
   * Ouvre la modale en mode édition avec les données de l'utilisateur sélectionné.
   */
  const handleOpenEditModal = (u) => {
    setEditingUser(u);
    setNom(u.nom);
    setEmail(u.email);
    setRole(u.role);
    setPassword('');
    setIsModalOpen(true);
  };

  /**
   * Soumission du formulaire utilisateur.
   * Crée un nouvel utilisateur ou met à jour l'existant.
   * Le mot de passe est obligatoire à la création, optionnel à la modification.
   */
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!nom || !email) {
      addToast({ type: 'error', title: 'Erreur', message: 'Veuillez saisir le nom et l\'email.' });
      return;
    }
    if (!editingUser && (!password || password.length < 8)) {
      addToast({ type: 'error', title: 'Erreur', message: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    try {
      if (editingUser) {
        const payload = { nom, email, role };
        if (password) payload.password = password;
        await apiService.updateUser(editingUser.id, payload);
        addToast({ type: 'success', title: 'Utilisateur mis à jour', message: 'Modifications enregistrées.' });
      } else {
        await apiService.createUser({ nom, email, password, role });
        addToast({ type: 'success', title: 'Utilisateur créé', message: 'Nouveau membre ajouté.' });
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'Un utilisateur existe déjà avec cet email.'
          : err.response?.status === 422
          ? 'Données invalides.'
          : 'Enregistrement impossible.';
      addToast({ type: 'error', title: 'Erreur', message });
    }
  };

  /**
   * Supprime un utilisateur après confirmation.
   * Échoue si des ressources lui sont rattachées (parcelles, commandes).
   */
  const handleDeleteUser = (id) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer cet utilisateur',
      message: 'Voulez-vous vraiment supprimer cet utilisateur ? Cette action est irréversible.',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await apiService.deleteUser(id);
          addToast({ type: 'success', title: 'Supprimé', message: 'L\'utilisateur a été retiré.' });
          loadUsers();
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Erreur',
            message: 'Suppression impossible (parcelles ou commandes liées ?).',
          });
        }
      },
    });
  };

  /**
   * Active ou désactive un utilisateur (UC8 - Admin).
   */
  const handleToggleUser = async (u) => {
    const action = u.actif ? 'désactiver' : 'activer';
    setConfirmModal({
      open: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} cet utilisateur`,
      message: `Voulez-vous vraiment ${action} le compte de « ${u.nom} » ?`,
      confirmLabel: action.charAt(0).toUpperCase() + action.slice(1),
      onConfirm: async () => {
        try {
          await apiService.toggleUser(u.id);
          addToast({
            type: 'success',
            title: 'Succès',
            message: `Le compte de « ${u.nom} » a été ${u.actif ? 'désactivé' : 'activé'}.`,
          });
          loadUsers();
        } catch (err) {
          addToast({
            type: 'error',
            title: 'Erreur',
            message: err.response?.data?.detail || 'Impossible de modifier l\'état de l\'utilisateur.',
          });
        }
      },
    });
  };

  // Libellé français du rôle
  const roleLabel = (r) => (r === 'admin' ? 'Administrateur' : r === 'agriculteur' ? 'Agriculteur' : r);

  const handleSearchChange = (value) => {
    setSearch(value);
    updateParams('q', value);
  };

  const handleRoleFilterChange = (value) => {
    setSelectedRoleFilter(value);
    updateParams('role', value);
  };

  const safeUsers = Array.isArray(users) ? users : [];

  // Filtrage combiné par recherche texte et par rôle
  const filteredUsers = safeUsers.filter((u) => {
    const matchSearch =
      (u.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = selectedRoleFilter === 'Tous' || u.role === selectedRoleFilter;
    return matchSearch && matchRole;
  });

  // Statistiques pour les cartes de résumé en haut de page
  const adminsCount = safeUsers.filter((u) => u.role === 'admin').length;
  const agriculteursCount = safeUsers.filter((u) => u.role === 'agriculteur').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
           <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
            <UsersIcon className="w-6 h-6 text-[#2E7D32]" />
            <span>Gestion des Utilisateurs</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Administration des comptes, des rôles et des autorisations d'accès
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un utilisateur</span>
        </button>
      </div>

      {loading ? (
        <UsersSkeleton />
      ) : (
        <React.Fragment>
          {/* Bento Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center font-bold text-lg">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">Total Utilisateurs</p>
                <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white">{users.length}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#8E24AA]/10 text-[#8E24AA] flex items-center justify-center font-bold text-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">Administrateurs</p>
                <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white">{adminsCount}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#1E88E5]/10 text-[#1E88E5] flex items-center justify-center font-bold text-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E]">Agriculteurs / Ops</p>
                <h3 className="text-xl font-black text-[#1A1A1A] dark:text-white">{agriculteursCount}</h3>
              </div>
            </div>
          </div>

          {/* Filter and Table Container */}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] shadow-xs overflow-hidden">
            {/* Controls Bar */}
            <div className="p-4 border-b border-[#E0E0E0] dark:border-[#30363D] flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => handleRoleFilterChange(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none font-medium"
              >
                <option value="Tous">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="agriculteur">Agriculteur</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F7F2] dark:bg-[#0D1117] text-[#5A5A5A] dark:text-[#8B949E] font-bold uppercase tracking-wider border-b border-[#E0E0E0] dark:border-[#30363D]">
                  <tr>
                    <th className="px-5 py-3">Utilisateur</th>
                    <th className="px-5 py-3">Rôle</th>
                    <th className="px-5 py-3">Dernière Connexion</th>
                    <th className="px-5 py-3">Statut</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0] dark:divide-[#30363D]">
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-[#F5F7F2]/60 dark:hover:bg-[#22272e]/50 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center font-bold text-xs shrink-0">
                            {u.nom.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#1A1A1A] dark:text-white">{u.nom}</p>
                            <p className="text-[11px] text-[#5A5A5A] dark:text-[#8B949E] flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span>{u.email}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            u.role === 'admin'
                              ? 'bg-[#8E24AA]/10 text-[#8E24AA]'
                              : 'bg-[#1E88E5]/10 text-[#1E88E5]'
                          }`}
                        >
                          {u.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {roleLabel(u.role)}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-[#5A5A5A] dark:text-[#8B949E]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            u.actif
                              ? 'bg-[#2E7D32]/10 text-[#2E7D32]'
                              : 'bg-[#E53935]/10 text-[#E53935]'
                          }`}
                        >
                          {u.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleUser(u)}
                            aria-label="Activer/Désactiver"
                            className={`p-1.5 rounded-lg ${
                              u.actif
                                ? 'text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#E53935] hover:bg-[#E53935]/10'
                                : 'text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#2E7D32] hover:bg-[#2E7D32]/10'
                            }`}
                            title={u.actif ? 'Désactiver' : 'Activer'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            aria-label="Modifier"
                            className="p-1.5 rounded-lg text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#2E7D32] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            aria-label="Supprimer"
                            className="p-1.5 rounded-lg text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#E53935] hover:bg-[#E53935]/10"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un Utilisateur'}
      >
        <form onSubmit={handleSaveUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Alain Lemaire"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Adresse Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alain.l@sai.agri"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              Rôle
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
            >
              <option value="agriculteur">Agriculteur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
              {editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-[#E0E0E0] dark:border-[#30363D] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#5A5A5A] dark:text-[#8B949E]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', onConfirm: null })}
      />
    </div>
  );
};
