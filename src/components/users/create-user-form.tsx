'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/lib/actions/user.actions';
import { Plus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Role } from '@prisma/client';

// Composant formulaire de création d'utilisateur
// Modal avec formulaire pour créer un nouvel utilisateur
export function CreateUserForm() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Gestion de la soumission du formulaire
   * Appelle la Server Action pour créer l'utilisateur
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Récupération des données du formulaire
    const formData = new FormData(e.currentTarget);
    const data = {
      nom: formData.get('nom') as string,
      prenom: formData.get('prenom') as string,
      email: formData.get('email') as string,
      motDePasse: formData.get('motDePasse') as string,
      role: formData.get('role') as Role,
    };

    try {
      // Appel de la Server Action pour créer l'utilisateur
      const result = await createUser(data);

      if (!result.success) {
        // Affichage d'une notification d'erreur
        toast.error(result.error || 'Erreur lors de la création de l\'utilisateur');
        setIsSubmitting(false);
        return;
      }

      // Affichage d'une notification de succès
      toast.success('Utilisateur créé avec succès');
      
      // Fermeture du modal et rafraîchissement de la page
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      // Gestion des erreurs inattendues
      toast.error('Une erreur inattendue est survenue');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Bouton pour ouvrir le modal */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        Ajouter un Utilisateur
      </button>

      {/* Modal de création d'utilisateur */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* En-tête du modal */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-800">
                Créer un Utilisateur
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Champ Nom */}
              <div>
                {/* Label avec style premium : texte gris foncé, petit et gras */}
                <label
                  htmlFor="nom"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Nom <span className="text-red-500">*</span>
                </label>
                {/* Input avec style premium : bordure fine gris clair, coins arrondis, texte noir */}
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="DIAKITE"
                  disabled={isSubmitting}
                />
              </div>

              {/* Champ Prénom */}
              <div>
                {/* Label avec style premium : texte gris foncé, petit et gras */}
                <label
                  htmlFor="prenom"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Prénom <span className="text-red-500">*</span>
                </label>
                {/* Input avec style premium : bordure fine gris clair, coins arrondis, texte noir */}
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  required
                  minLength={2}
                  maxLength={50}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ahmed"
                  disabled={isSubmitting}
                />
              </div>

              {/* Champ Email */}
              <div>
                {/* Label avec style premium : texte gris foncé, petit et gras */}
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                {/* Input avec style premium : bordure fine gris clair, coins arrondis, texte noir */}
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="exemplet@douanes.ml"
                  disabled={isSubmitting}
                />
              </div>

              {/* Champ Mot de passe */}
              <div>
                {/* Label avec style premium : texte gris foncé, petit et gras */}
                <label
                  htmlFor="motDePasse"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Mot de passe <span className="text-red-500">*</span>
                </label>
                {/* Input avec style premium : bordure fine gris clair, coins arrondis, texte noir */}
                <input
                  type="password"
                  id="motDePasse"
                  name="motDePasse"
                  required
                  minLength={6}
                  maxLength={100}
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Minimum 6 caractères"
                  disabled={isSubmitting}
                />
              </div>

              {/* Champ Rôle */}
              <div>
                {/* Label avec style premium : texte gris foncé, petit et gras */}
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Rôle <span className="text-red-500">*</span>
                </label>
                {/* Select avec style premium : bordure fine gris clair, coins arrondis, texte noir */}
                <select
                  id="role"
                  name="role"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  <option value="">Sélectionner un rôle</option>
                  <option value={Role.ADMIN}>Administrateur</option>
                  <option value={Role.CHEF_BUREAU}>Chef de Bureau</option>
                  <option value={Role.CHEF_BRIGADE}>Chef de Brigade</option>
                  <option value={Role.AGENT_BRIGADE}>Agent de Brigade</option>
                  <option value={Role.AGENT_CONSULTATION}>
                    Agent Consultation
                  </option>
                </select>
              </div>

              {/* Boutons d'action avec style premium */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                {/* Bouton Annuler : gris clair pour l'action secondaire */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-gray-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                {/* Bouton Créer : bleu pour l'action principale */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Création...</span>
                    </>
                  ) : (
                    'Créer l\'utilisateur'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

