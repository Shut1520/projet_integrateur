/**
 * Page Profil (UC2 partiel + gestion tokens API).
 * Permet à l'utilisateur de :
 *  - Modifier ses informations (nom, email)
 *  - Voir et gérer ses tokens API (génération / révocation)
 *  - Se déconnecter
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/formatters';
import { ProfileSkeleton } from '../components/ui/ProfileSkeleton';
import {
  UserCircle,
  Key,
  Copy,
  Plus,
  Trash2,
  Save,
  User,
  Mail,
  Camera,
  CheckCircle,
  Power,
} from 'lucide-react';

/**
 * Page Profil (UC2 partiel + gestion tokens API).
 * Permet de :
 *  - Modifier ses informations (nom, email)
 *  - Voir et gérer ses tokens API (génération / révocation)
 */
export const Profile = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const { addToast } = useToast();

  // État du formulaire profil
  const [nom, setNom] = useState(user?.nom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Tokens API (clé pour le CLI ou intégrations externes)
  const [tokens, setTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);

  // États pour la modale de génération de clé API
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Charger les tokens de l'utilisateur courant via le backend
  const loadTokens = async () => {
    if (!user?.id) return;
    try {
      const data = await apiService.getTokens({ utilisateur_id: user.id });
      setTokens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur loadTokens:', err);
      setTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, [user?.id]);

  /**
   * Sauvegarde du profil : envoie les modifications au backend via /api/utilisateurs/{id}.
   * Note : pour une vraie prod, il faudrait un endpoint /me (PATCH /api/utilisateurs/me)
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      await apiService.updateUser(user.id, { nom, email });
      updateUserProfile({ nom, email });
      addToast({
        type: 'success',
        title: 'Profil mis à jour',
        message: 'Vos informations ont été enregistrées.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Erreur',
        message: err.response?.data?.detail || 'Impossible de mettre à jour le profil.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  /**
   * Génère un token API via le backend.
   * La clé est retournée une seule fois à la création.
   * Recharge la liste depuis le backend pour éviter les doublons.
   */
  const handleCreateApiKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;
    try {
      const result = await apiService.createToken({
        nom: keyName,
        id_utilisateur: user.id,
      });
      const newKey = {
        ...result,
        keyPrefix: `${result.cle_api.substring(0, 12)}...`,
        keyFull: result.cle_api,
      };
      setGeneratedKey(newKey);
      // Recharger depuis le backend pour éviter les doublons
      await loadTokens();
      addToast({
        type: 'success',
        title: 'Clé API générée',
        message: 'Conservez cette clé en lieu sûr. Elle ne sera plus affichée.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Erreur', message: 'Échec de la génération.' });
    }
  };

  /**
   * Copie un texte dans le presse-papier avec notification toast.
   */
  const handleCopyKey = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => addToast({ type: 'info', title: 'Copié', message: 'Clé copiée dans le presse-papier.' }),
      () => addToast({ type: 'error', title: 'Erreur', message: 'Impossible de copier.' })
    );
  };

  /**
   * Révoque (supprime) une clé API via le backend après confirmation.
   */
  const handleDeleteApiKey = (id) => {
    setConfirmModal({
      open: true,
      title: 'Révoquer cette clé API',
      message: 'Voulez-vous vraiment révoquer cette clé API ? Elle ne pourra plus être utilisée.',
      confirmLabel: 'Révoquer',
      onConfirm: async () => {
        try {
          await apiService.revokeToken(id);
          setTokens((prev) => prev.filter((k) => k.id !== id));
          addToast({ type: 'success', title: 'Clé révoquée', message: 'La clé a été supprimée.' });
        } catch (err) {
          addToast({ type: 'error', title: 'Erreur', message: 'Impossible de révoquer la clé.' });
        }
      },
    });
  };

  /**
   * Copie un texte dans le presse-papier avec notification toast.
   */
  const handleToggle2FA = () => {
    setTwoFactorEnabled((v) => !v);
    addToast({
      type: 'info',
      title: twoFactorEnabled ? '2FA désactivée' : '2FA activée',
      message: 'Simulation : la 2FA réelle nécessite un setup backend.',
    });
  };

  // Libellé du rôle utilisateur pour l'affichage
  const roleLabel = user?.role === 'admin' ? 'Administrateur' : user?.role === 'agriculteur' ? 'Agriculteur' : user?.role;

  if (loadingTokens) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-[#2E7D32]" />
          <span>Mon Profil & Sécurité</span>
        </h1>
        <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
          Paramètres du compte, sécurité et jetons d'API
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Identity Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-[#E0E0E0] dark:border-[#30363D]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center font-extrabold text-xl">
                {user?.nom?.charAt(0) || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 bg-[#2E7D32] text-white rounded-full shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-[#1A1A1A] dark:text-white">{user?.nom}</h2>
              <span className="inline-block text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] mt-1">
                {roleLabel}
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white">
              Informations Personnelles
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                Nom complet
              </label>
              <div className="relative focus-halo rounded-xl">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                Adresse Email
              </label>
              <div className="relative focus-halo rounded-xl">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5A5A5A] dark:text-[#8B949E]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] text-[#1A1A1A] dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2.5 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Enregistrement...' : 'Enregistrer le profil'}</span>
            </button>
          </form>
        </div>

        {/* Security & API Keys */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] space-y-4">
            <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Power className="w-4 h-4 text-[#2E7D32]" />
              <span>Sécurité du Compte</span>
            </h3>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 bg-[#E53935]/10 hover:bg-[#E53935]/20 text-[#E53935] text-xs font-bold rounded-xl border border-[#E53935]/30 flex items-center justify-center gap-2 transition-colors"
            >
              Se déconnecter
            </button>
          </div>

          <div className="bg-white dark:bg-[#161B22] p-6 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#2E7D32]" />
                <span>Clés d'API</span>
              </h3>
              <button
                onClick={() => {
                  setGeneratedKey(null);
                  setKeyName('');
                  setIsApiKeyModalOpen(true);
                }}
                className="p-1.5 bg-[#2E7D32] hover:bg-[#256629] text-white rounded-lg shadow-md"
                title="Générer une clé"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {loadingTokens ? (
              <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] text-center py-3">
                Chargement...
              </p>
            ) : tokens.length === 0 ? (
              <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] text-center py-3">
                Aucune clé API. Cliquez sur + pour en générer une.
              </p>
            ) : (
              <div className="space-y-2.5">
                {tokens.map((k) => (
                  <div
                    key={k.id}
                    className="p-3 rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1A1A1A] dark:text-white truncate">
                        {k.nom}
                      </p>
                      <p className="text-[10px] font-mono text-[#5A5A5A] dark:text-[#8B949E]">
                        {k.keyPrefix || `${k.cle_api?.substring(0, 12)}...`}
                      </p>
                      <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E]">
                        Créée le {formatDate(k.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyKey(k.keyFull || k.cle_api)}
                        className="p-1.5 text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#1A1A1A]"
                        title="Copier"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteApiKey(k.id)}
                        className="p-1.5 text-[#5A5A5A] dark:text-[#8B949E] hover:text-[#E53935]"
                        title="Révoquer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      <Modal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        title="Générer une clé API"
      >
        {generatedKey ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#43A047]/10 border border-[#43A047]/30 text-center">
              <CheckCircle className="w-8 h-8 text-[#43A047] mx-auto mb-2" />
              <h4 className="font-bold text-sm text-[#1A1A1A] dark:text-white">Clé créée avec succès</h4>
              <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
                Copiez cette clé maintenant. Elle ne sera plus affichée ensuite.
              </p>
            </div>

            <div className="p-3 bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] rounded-xl font-mono text-xs text-[#1A1A1A] dark:text-white flex items-center justify-between gap-2">
              <span className="truncate">{generatedKey.keyFull}</span>
              <button
                onClick={() => handleCopyKey(generatedKey.keyFull)}
                className="p-1.5 bg-[#2E7D32] text-white rounded-lg shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => setIsApiKeyModalOpen(false)}
              className="w-full py-2 bg-[#2E7D32] text-white text-xs font-bold rounded-xl"
            >
              J'ai copié la clé, fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateApiKey} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white mb-1">
                Nom / Description
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Ex: Application Mobile Technicien"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#F5F7F2] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(false)}
                className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D]"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 text-sm font-bold text-white bg-[#2E7D32] hover:bg-[#256629] rounded-xl"
              >
                Générer
              </button>
            </div>
          </form>
        )}
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
