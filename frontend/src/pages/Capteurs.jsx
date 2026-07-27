/**
 * Page de gestion des capteurs (UC12 - Admin).
 * CRUD complet sur les capteurs d'une parcelle avec
 * formulaire de création/édition et suppression.
 */
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';
import { Cpu, Plus, Edit, Trash2, MapPin, Wifi, WifiOff } from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

/**
 * Page de gestion des capteurs (UC12 - Admin).
 * CRUD complet sur les capteurs d'une parcelle.
 */
export const Capteurs = () => {
  const { addToast } = useToast();
  const [capteurs, setCapteurs] = useState([]);
  const [parcelles, setParcelles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapteur, setEditingCapteur] = useState(null);

  // Form
  const [nom, setNom] = useState('');
  const [reference, setReference] = useState('');
  const [gpio, setGpio] = useState('');
  const [protocole, setProtocole] = useState('digital');
  const [etat, setEtat] = useState('actif');
  const [idParcelle, setIdParcelle] = useState('');
    const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Constantes des choix possibles pour les selects du formulaire
  const PROTOCOLES = ['digital', 'analog', 'i2c'];
  const ETATS = ['actif', 'inactif', 'defaillant'];

/**
 * Charge les listes de capteurs et de parcelles en parallèle.
 */
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
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Réinitialise le formulaire en mode création et ouvre la modale.
   */
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

  /**
   * Pré-remplit le formulaire avec les données d'un capteur existant
   * et ouvre la modale en mode édition.
   */
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

  /**
   * Soumission du formulaire : crée ou met à jour un capteur selon le mode.
   * Gère les erreurs 409 (doublon) et 422 (validation).
   */
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
        addToast({ type: 'success', title: 'Capteur mis à jour', message: `${nom} modifié.` });
      } else {
        await apiService.createCapteur(payload);
        addToast({ type: 'success', title: 'Capteur créé', message: `${nom} ajouté.` });
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      const message =
        err.response?.status === 409
          ? 'Un capteur existe déjà avec cette configuration.'
          : err.response?.status === 422
          ? 'Données invalides. Vérifiez les champs.'
          : 'Erreur lors de l\'enregistrement.';
      addToast({ type: 'error', title: 'Erreur', message });
    }
  };

  /**
   * Supprime un capteur après confirmation de l'utilisateur.
   */
  const handleDelete = (cap) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer ce capteur',
      message: `Voulez-vous vraiment supprimer le capteur « ${cap.nom} » ? Cette action est irréversible.`,
      onConfirm: async () => {
        try {
          await apiService.deleteCapteur(cap.id);
          addToast({ type: 'success', title: 'Capteur supprimé', message: cap.nom });
          await loadData();
        } catch (err) {
          addToast({ type: 'error', title: 'Erreur', message: 'Suppression impossible.' });
        }
      },
    });
  };

  // Résolution du nom de parcelle à partir de son ID
  const getParcelleName = (id) => {
    const p = parcelles.find((x) => x.id === id);
    return p?.nom || '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E0E0E0] dark:border-[#30363D]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#2E7D32]" />
            <span>Gestion des Capteurs</span>
          </h1>
          <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1 font-medium">
            Enregistrez, modifiez ou retirez les capteurs de vos parcelles
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-[#2E7D32] hover:bg-[#256629] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un capteur</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capteurs.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#161B22] p-12 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] text-center">
            <Cpu className="w-12 h-12 text-[#5A5A5A] dark:text-[#8B949E] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#1A1A1A] dark:text-white">Aucun capteur enregistré</p>
            <p className="text-xs text-[#5A5A5A] dark:text-[#8B949E] mt-1">
              Commencez par ajouter un capteur à une parcelle.
            </p>
          </div>
        ) : (
          capteurs.map((cap) => {
            const isOn = cap.etat === 'actif';
            return (
              <div
                key={cap.id}
                className="bg-white dark:bg-[#161B22] p-5 rounded-2xl border border-[#E0E0E0] dark:border-[#30363D] hover:border-[#2E7D32]/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2E7D32]/10 text-[#2E7D32] flex items-center justify-center">
                      {isOn ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white">{cap.nom}</h3>
                      <p className="text-[10px] text-[#5A5A5A] dark:text-[#8B949E] font-medium">
                        {cap.reference || 'Sans référence'}
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

                <div className="space-y-1.5 text-xs text-[#5A5A5A] dark:text-[#8B949E]">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    <span>{getParcelleName(cap.id_parcelle)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Cpu className="w-3 h-3" />
                    <span>GPIO {cap.gpio} • {cap.protocole}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#E0E0E0] dark:border-[#30363D]">
                  <button
                    onClick={() => openEdit(cap)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#2E7D32] hover:bg-[#2E7D32]/10 rounded-lg"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(cap)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold text-[#E53935] hover:bg-[#E53935]/10 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

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
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1">Référence (optionnel)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: DHT22-AM2302"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Protocole</label>
              <select
                value={protocole}
                onChange={(e) => setProtocole(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                {PROTOCOLES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">État</label>
              <select
                value={etat}
                onChange={(e) => setEtat(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
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
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#f8faf5] dark:bg-[#0D1117] border border-[#E0E0E0] dark:border-[#30363D] focus:outline-none focus:border-[#2E7D32]"
              >
                <option value="">Sélectionner...</option>
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
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-[#E0E0E0] dark:border-[#30363D] hover:bg-[#f2f4ef] dark:hover:bg-[#22272e]"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-sm font-bold text-white bg-[#2E7D32] hover:bg-[#256629] rounded-xl"
            >
              {editingCapteur ? 'Mettre à jour' : 'Créer'}
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
