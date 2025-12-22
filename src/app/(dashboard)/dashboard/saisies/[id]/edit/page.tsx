'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSaisieSchema, type CreateSaisieInput } from '@/lib/validations/saisie.schema';
import { updateSaisie } from '@/lib/actions/saisie.actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Page d'édition d'une saisie
// Route : /dashboard/saisies/[id]/edit
// Permet de modifier une saisie tant qu'elle n'est pas encore validée
export default function EditSaisiePage() {
  const router = useRouter();
  const params = useParams();
  const saisieId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saisieData, setSaisieData] = useState<any>(null);
  const [canEdit, setCanEdit] = useState(false);

  // Configuration de react-hook-form avec Zod pour la validation côté client
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateSaisieInput>({
    resolver: zodResolver(createSaisieSchema),
  });

  // Surveillance de la valeur du motif d'infraction pour afficher conditionnellement le champ détails
  const motifInfraction = watch('motifInfraction');
  const showDetailsField = motifInfraction === 'Autre (préciser)';

  // Chargement des données de la saisie au montage du composant
  useEffect(() => {
    const fetchSaisie = async () => {
      try {
        // Récupération des données de la saisie depuis l'API
        const response = await fetch(`/api/saisies/${saisieId}`);
        if (!response.ok) {
          throw new Error('Saisie non trouvée');
        }
        const data = await response.json();
        
        setSaisieData(data);
        
        // Vérification si la saisie peut être modifiée (statut non validé)
        const canEditSaisie = data.statut === 'SAISI_EN_COURS';
        setCanEdit(canEditSaisie);
        
        // Extraction du motif et des détails si "Autre" est sélectionné
        let motif = data.motifInfraction;
        let details = '';
        if (motif.startsWith('Autre (préciser):')) {
          const parts = motif.split(':');
          motif = 'Autre (préciser)';
          details = parts.slice(1).join(':').trim();
        }
        
        // Remplissage du formulaire avec les données existantes
        reset({
          numeroChassis: data.numeroChassis,
          marque: data.marque,
          modele: data.modele,
          typeVehicule: data.typeVehicule,
          immatriculation: data.immatriculation || '',
          nomConducteur: data.nomConducteur,
          telephoneConducteur: data.telephoneConducteur,
          motifInfraction: motif as any,
          motifInfractionDetails: details,
          lieuSaisie: data.lieuSaisie,
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement de la saisie:', error);
        toast.error('Erreur lors du chargement de la saisie');
        router.push('/dashboard/saisies');
      }
    };

    fetchSaisie();
  }, [saisieId, reset, router]);

  /**
   * Gestion de la soumission du formulaire d'édition
   */
  const onSubmit = async (data: CreateSaisieInput) => {
    if (!canEdit) {
      toast.error('Cette saisie ne peut plus être modifiée');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Appel de la Server Action pour mettre à jour la saisie
      const result = await updateSaisie(saisieId, data);

      if (!result.success) {
        setSubmitError(result.error || 'Une erreur est survenue');
        setIsSubmitting(false);
        toast.error(result.error || 'Erreur lors de la modification');
        return;
      }

      // Succès : notification et redirection
      toast.success('Saisie modifiée avec succès');
      router.push(`/dashboard/saisies/${saisieId}`);
    } catch (error) {
      setSubmitError('Une erreur inattendue est survenue. Veuillez réessayer.');
      setIsSubmitting(false);
      toast.error('Erreur lors de la modification');
    }
  };

  // Affichage du chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement de la saisie...</p>
        </div>
      </div>
    );
  }

  // Vérification si la saisie peut être modifiée
  if (!canEdit) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-red-200 shadow-sm p-8 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Modification Impossible
            </h2>
            <p className="text-slate-600 mb-6">
              Cette saisie ne peut plus être modifiée car elle a déjà été validée ou annulée.
            </p>
            <Link
              href={`/dashboard/saisies/${saisieId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux détails
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    // Fond de page gris très clair style "Premium"
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête avec typographie élégante */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Modifier la Saisie
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              Modifier les informations de la saisie #{saisieData?.numeroChassis}
            </p>
          </div>
          <Link
            href={`/dashboard/saisies/${saisieId}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
        </div>

        {/* Formulaire dans une carte avec coins très arrondis et ombre douce */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 lg:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Message d'erreur global */}
            {submitError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-600">{submitError}</p>
              </div>
            )}

            {/* Section 1 : Informations du Véhicule */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-slate-800">
                  Informations du Véhicule
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Châssis, Marque, Modèle, Type
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                    disabled
                    className="bg-gray-50 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Le numéro de châssis ne peut pas être modifié
                  </p>
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
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-slate-800">
                  Informations du Conducteur & Infraction
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Nom, Téléphone, Motif, Lieu
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

                {/* Motif de l'infraction - Liste déroulante */}
                <div className="md:col-span-2">
                  <Label htmlFor="motifInfraction" required>
                    Motif de l'infraction
                  </Label>
                  <select
                    id="motifInfraction"
                    {...register('motifInfraction')}
                    className={`w-full rounded-lg border px-4 py-2.5 md:py-2.5 min-h-[44px] md:min-h-0 text-base md:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors appearance-none cursor-pointer ${
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

                {/* Champ conditionnel pour les détails */}
                {showDetailsField && (
                  <div className="md:col-span-2">
                    <Label htmlFor="motifInfractionDetails" required>
                      Détails de l'infraction
                    </Label>
                    <textarea
                      id="motifInfractionDetails"
                      {...register('motifInfractionDetails')}
                      rows={3}
                      className={`w-full rounded-lg border px-4 py-2.5 min-h-[88px] text-base md:text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
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

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
              <Link
                href={`/dashboard/saisies/${saisieId}`}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Annuler
              </Link>
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
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

