'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validerSortie, annulerSaisie } from '@/lib/actions/saisie-status.actions';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Composant client pour les boutons d'action avec confirmation
// Gère les confirmations, états de chargement et notifications
interface ActionButtonsProps {
  saisieId: string;
  numeroChassis: string;
}

export function ActionButtons({ saisieId, numeroChassis }: ActionButtonsProps) {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmValidation, setShowConfirmValidation] = useState(false);
  const [showConfirmCancellation, setShowConfirmCancellation] = useState(false);

  /**
   * Gestion de la validation de la sortie
   * Affiche une confirmation avant d'exécuter l'action
   */
  const handleValiderSortie = async () => {
    // Affichage de la fenêtre de confirmation
    setShowConfirmValidation(true);
  };

  /**
   * Confirmation de la validation après clic sur "Confirmer"
   */
  const confirmValiderSortie = async () => {
    setIsValidating(true);
    setShowConfirmValidation(false);

    try {
      // Appel de la Server Action pour valider la sortie
      const result = await validerSortie(saisieId);

      if (!result.success) {
        // Affichage d'une notification d'erreur en rouge
        toast.error(result.error || 'Erreur lors de la validation');
        setIsValidating(false);
        return;
      }

      // Affichage d'une notification de succès en vert
      toast.success('Sortie validée avec succès');
      
      // Rafraîchissement de la page pour afficher les changements
      router.refresh();
    } catch (error) {
      // Gestion des erreurs inattendues
      toast.error('Une erreur inattendue est survenue');
      setIsValidating(false);
    }
  };

  /**
   * Gestion de l'annulation de la saisie
   * Affiche une confirmation avant d'exécuter l'action
   */
  const handleAnnulerSaisie = async () => {
    // Affichage de la fenêtre de confirmation
    setShowConfirmCancellation(true);
  };

  /**
   * Confirmation de l'annulation après clic sur "Confirmer"
   */
  const confirmAnnulerSaisie = async () => {
    setIsCancelling(true);
    setShowConfirmCancellation(false);

    try {
      // Appel de la Server Action pour annuler la saisie
      const result = await annulerSaisie(saisieId);

      if (!result.success) {
        // Affichage d'une notification d'erreur en rouge
        toast.error(result.error || 'Erreur lors de l\'annulation');
        setIsCancelling(false);
        return;
      }

      // Affichage d'une notification de succès en vert
      toast.success('Saisie annulée avec succès');
      
      // Rafraîchissement de la page pour afficher les changements
      router.refresh();
    } catch (error) {
      // Gestion des erreurs inattendues
      toast.error('Une erreur inattendue est survenue');
      setIsCancelling(false);
    }
  };

  return (
    <>
      {/* Boutons d'action */}
      <div className="flex items-center gap-3">
        {/* Bouton "Valider la Sortie" (Vert) */}
        <button
          type="button"
          onClick={handleValiderSortie}
          disabled={isValidating || isCancelling}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-green-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Validation...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Valider la Sortie</span>
            </>
          )}
        </button>

        {/* Bouton "Annuler la Saisie" (Rouge) */}
        <button
          type="button"
          onClick={handleAnnulerSaisie}
          disabled={isValidating || isCancelling}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isCancelling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Annulation...</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>Annuler la Saisie</span>
            </>
          )}
        </button>
      </div>

      {/* Fenêtre de confirmation pour la validation */}
      {showConfirmValidation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Confirmer la validation
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Êtes-vous sûr de vouloir autoriser la sortie du véhicule{' '}
              <span className="font-semibold">{numeroChassis}</span> ? Cette
              action est irréversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmValidation(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmValiderSortie}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fenêtre de confirmation pour l'annulation */}
      {showConfirmCancellation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Confirmer l'annulation
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Êtes-vous sûr de vouloir annuler la saisie du véhicule{' '}
              <span className="font-semibold">{numeroChassis}</span> ? Cette
              action est irréversible.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmCancellation(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAnnulerSaisie}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

