'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/lib/actions/user.actions';
import { Edit, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

// Composant client pour les actions sur un utilisateur
// Gère les boutons Modifier et Supprimer avec confirmation de sécurité
interface UserActionsProps {
  userId: string;
  userEmail: string;
  userName: string; // Nom complet de l'utilisateur
  currentUserId: string; // ID de l'utilisateur connecté (pour empêcher l'auto-suppression)
}

export function UserActions({
  userId,
  userEmail,
  userName,
  currentUserId,
}: UserActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  /**
   * Gestion de la suppression d'un utilisateur
   * Affiche une confirmation avant d'exécuter l'action
   */
  const handleDelete = () => {
    // Vérification de sécurité : empêche un administrateur de se supprimer lui-même
    if (userId === currentUserId) {
      toast.error('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    // Affichage de la fenêtre de confirmation
    setShowConfirmDelete(true);
  };

  /**
   * Confirmation de la suppression après clic sur "Confirmer"
   */
  const confirmDelete = async () => {
    setIsDeleting(true);
    setShowConfirmDelete(false);

    try {
      // Appel de la Server Action pour supprimer l'utilisateur
      const result = await deleteUser(userId);

      if (!result.success) {
        // Affichage d'une notification d'erreur en rouge
        toast.error(result.error || 'Erreur lors de la suppression');
        setIsDeleting(false);
        return;
      }

      // Affichage d'une notification de succès en vert
      toast.success('Utilisateur supprimé avec succès');
      
      // Réinitialisation de l'état de chargement avant le rafraîchissement
      setIsDeleting(false);
      
      // Rafraîchissement de la page pour retirer l'utilisateur supprimé
      router.refresh();
    } catch (error) {
      // Gestion des erreurs inattendues
      toast.error('Une erreur inattendue est survenue');
      setIsDeleting(false);
    }
  };

  /**
   * Gestion de la modification d'un utilisateur
   * TODO: Implémenter la page de modification
   */
  const handleEdit = () => {
    // Pour l'instant, on affiche un message
    toast('Fonctionnalité de modification à venir', {
      icon: 'ℹ️',
      duration: 3000,
    });
    // TODO: Rediriger vers /dashboard/utilisateurs/[id]/edit
  };

  return (
    <>
      {/* Boutons d'action */}
      <div className="flex items-center gap-2">
        {/* Bouton Modifier (icône Edit) */}
        <button
          type="button"
          onClick={handleEdit}
          disabled={isDeleting}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Modifier l'utilisateur"
        >
          <Edit className="h-3.5 w-3.5" />
          <span>Modifier</span>
        </button>

        {/* Bouton Supprimer (icône Trash) */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting || userId === currentUserId}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          title={
            userId === currentUserId
              ? 'Vous ne pouvez pas supprimer votre propre compte'
              : 'Supprimer l\'utilisateur'
          }
        >
          {isDeleting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Suppression...</span>
            </>
          ) : (
            <>
              <Trash2 className="h-3.5 w-3.5" />
              <span>Supprimer</span>
            </>
          )}
        </button>
      </div>

      {/* Fenêtre de confirmation pour la suppression */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer l'utilisateur{' '}
              <span className="font-semibold">{userName}</span> ({userEmail}) ?
              Cette action est irréversible et supprimera définitivement le compte.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  'Confirmer la suppression'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

