'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSaisieSchema, type CreateSaisieInput } from '@/lib/validations/saisie.schema';
import { createSaisie } from '@/lib/actions/saisie.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';
import { canCreateSaisie } from '@/lib/utils/permissions';

// Page de création d'une nouvelle saisie
// Route : /dashboard/saisies/new
// Formulaire avec validation côté client et serveur, design "Premium"
// Protection RBAC : AGENT_CONSULTATION ne peut pas créer de saisies
export default function NewSaisiePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Vérification des permissions au chargement de la page
  useEffect(() => {
    if (status === 'loading') {
      return; // Attendre que la session soit chargée
    }

    if (!session) {
      // Redirection vers login si non connecté
      router.replace('/login');
      return;
    }

    const userRole = session.user?.role as Role;
    
    // Vérification si l'utilisateur peut créer des saisies
    // AGENT_CONSULTATION ne peut pas créer de saisies (lecture seule)
    if (!canCreateSaisie(userRole)) {
      // Redirection vers la liste des saisies avec message d'erreur
      router.replace('/dashboard/saisies?error=access_denied');
      return;
    }

    setIsCheckingAccess(false);
  }, [session, status, router]);

  // Configuration de react-hook-form avec Zod pour la validation côté client
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateSaisieInput>({
    resolver: zodResolver(createSaisieSchema),
    defaultValues: {
      immatriculation: '',
      motifInfractionDetails: '',
    },
  });

  // Surveillance de la valeur du motif d'infraction pour afficher conditionnellement le champ détails
  const motifInfraction = watch('motifInfraction');
  const showDetailsField = motifInfraction === 'Autre (préciser)';

  /**
   * Gestion de la soumission du formulaire
   * 
   * Cette fonction :
   * 1. Active l'état de chargement (bouton désactivé avec spinner)
   * 2. Envoie les données à la Server Action createSaisie
   * 3. Gère les erreurs (châssis existant, validation, etc.)
   * 4. En cas de succès, la Server Action redirige automatiquement
   * 
   * Note : La validation Zod côté client bloque déjà la soumission
   * si un champ obligatoire est vide avant l'envoi au serveur.
   */
  const onSubmit = async (data: CreateSaisieInput) => {
    // Activation de l'état de chargement
    // Le bouton affichera "Enregistrement..." et sera désactivé
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Appel de la Server Action pour créer la saisie
      // La Server Action valide les données, vérifie l'unicité du châssis,
      // insère en base de données et crée l'audit log
      const result = await createSaisie(data);

      // Si la création a échoué (ex: châssis déjà existant)
      // On affiche le message d'erreur et on réactive le formulaire
      if (!result.success) {
        setSubmitError(result.error || 'Une erreur est survenue');
        setIsSubmitting(false);
        return;
      }

      // En cas de succès, la Server Action utilise redirect() qui lance une exception
      // Next.js intercepte cette exception et redirige vers /dashboard/saisies
      // Ce code ne sera donc jamais exécuté en cas de succès
    } catch (error) {
      // Gestion des erreurs inattendues (réseau, serveur, etc.)
      setSubmitError('Une erreur inattendue est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  };

  // Affichage du chargement pendant la vérification des permissions
  if (isCheckingAccess || status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  return (
    // Fond de page gris très clair style "Premium"
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête avec typographie élégante */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Nouvelle Saisie
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            Enregistrer une nouvelle saisie de véhicule
          </p>
        </div>

        {/* Formulaire dans une carte avec coins très arrondis et ombre douce */}
        {/* OPTIMISATION MOBILE : Padding réduit sur mobile (p-4) pour maximiser l'espace */}
        {/* Largeur totale sur téléphone pour une utilisation confortable sur le terrain */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-8 lg:p-10 w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Message d'erreur global */}
            {submitError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Section 1 : Informations du Véhicule */}
            {/* Champs requis : Châssis, Marque, Modèle, Type */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-slate-800">
                  Informations du Véhicule
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Châssis, Marque, Modèle, Type
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marque */}
                <div>
                  <Label htmlFor="marque" required>
                    Marque
                  </Label>
                  <Input
                    id="marque"
                    {...register('marque')}
                    placeholder="Ex: Toyota"
                    error={errors.marque?.message}
                    className="w-full min-h-[44px] text-base md:text-sm"
                  />
                </div>

                {/* Modèle */}
                <div>
                  <Label htmlFor="modele" required>
                    Modèle
                  </Label>
                  <Input
                    id="modele"
                    {...register('modele')}
                    placeholder="Ex: Corolla"
                    error={errors.modele?.message}
                  />
                </div>

                {/* Numéro de châssis */}
                <div>
                  <Label htmlFor="numeroChassis" required>
                    Numéro de châssis
                  </Label>
                  <Input
                    id="numeroChassis"
                    {...register('numeroChassis')}
                    placeholder="Ex: JT2BF28K..."
                    error={errors.numeroChassis?.message}
                  />
                </div>

                {/* Type de véhicule */}
                <div>
                  <Label htmlFor="typeVehicule" required>
                    Type de véhicule
                  </Label>
                  <Input
                    id="typeVehicule"
                    {...register('typeVehicule')}
                    placeholder="Ex: Voiture, Moto, Camion..."
                    error={errors.typeVehicule?.message}
                  />
                </div>

                {/* Immatriculation (optionnel) */}
                <div className="md:col-span-2">
                  <Label htmlFor="immatriculation">
                    Immatriculation (optionnel)
                  </Label>
                  <Input
                    id="immatriculation"
                    {...register('immatriculation')}
                    placeholder="Ex: AB-123-CD"
                    error={errors.immatriculation?.message}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 : Informations du Conducteur & Infraction */}
            {/* Champs requis : Nom, Téléphone, Motif, Lieu */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-slate-800">
                  Informations du Conducteur & Infraction
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Nom, Téléphone, Motif, Lieu
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nom complet du conducteur */}
                <div>
                  <Label htmlFor="nomConducteur" required>
                    Nom complet du conducteur
                  </Label>
                  <Input
                    id="nomConducteur"
                    {...register('nomConducteur')}
                    placeholder="Ex: Diallo Mamadou"
                    error={errors.nomConducteur?.message}
                  />
                </div>

                {/* Téléphone du conducteur */}
                <div>
                  <Label htmlFor="telephoneConducteur" required>
                    Téléphone du conducteur
                  </Label>
                  <Input
                    id="telephoneConducteur"
                    type="tel"
                    {...register('telephoneConducteur')}
                    placeholder="Ex: +223 76 12 34 56"
                    error={errors.telephoneConducteur?.message}
                  />
                </div>

                {/* Motif de l'infraction - Liste déroulante avec articles légaux */}
                <div className="md:col-span-2">
                  <Label htmlFor="motifInfraction" required>
                    Motif de l'infraction
                  </Label>
                  <select
                    id="motifInfraction"
                    {...register('motifInfraction')}
                    className={`w-full rounded-xl border px-4 py-2.5 md:py-2.5 min-h-[44px] md:min-h-0 text-base md:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none cursor-pointer ${
                      errors.motifInfraction
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <option value="">Sélectionner un motif...</option>
                    <option value="Défaut de T1">Défaut de T1</option>
                    <option value="Contrebande (Art. 429)">Contrebande (Art. 429)</option>
                    <option value="Importation sans déclaration (Art. 432)">Importation sans déclaration (Art. 432)</option>
                    <option value="Dépassement délai (Art. 296/440)">Dépassement délai (Art. 296/440)</option>
                    <option value="Autre (préciser)">Autre (préciser)</option>
                  </select>
                  {errors.motifInfraction && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.motifInfraction.message}
                    </p>
                  )}
                </div>

                {/* Champ conditionnel pour les détails si "Autre (préciser)" est sélectionné */}
                {showDetailsField && (
                  <div className="md:col-span-2">
                    <Label htmlFor="motifInfractionDetails" required>
                      Détails de l'infraction
                    </Label>
                    <textarea
                      id="motifInfractionDetails"
                      {...register('motifInfractionDetails')}
                      rows={3}
                      className={`w-full rounded-xl border px-4 py-2.5 min-h-[88px] text-base md:text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.motifInfractionDetails
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                      placeholder="Précisez le motif de l'infraction..."
                    />
                    {errors.motifInfractionDetails && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.motifInfractionDetails.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Lieu de saisie */}
                <div className="md:col-span-2">
                  <Label htmlFor="lieuSaisie" required>
                    Lieu de saisie
                  </Label>
                  <Input
                    id="lieuSaisie"
                    {...register('lieuSaisie')}
                    placeholder="Ex: Route de Kati, km 12"
                    error={errors.lieuSaisie?.message}
                  />
                </div>
              </div>
            </div>

            {/* Boutons d'action avec coins arrondis */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  'Enregistrer la saisie'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

