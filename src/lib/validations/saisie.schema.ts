import { z } from 'zod';

// Schéma de validation Zod pour la création d'une saisie
// Utilisé à la fois côté client (react-hook-form) et serveur (Server Action)
export const createSaisieSchema = z.object({
  // Informations du véhicule
  numeroChassis: z
    .string()
    .min(1, 'Le numéro de châssis est requis')
    .max(100, 'Le numéro de châssis est trop long'),
  marque: z
    .string()
    .min(1, 'La marque est requise')
    .max(50, 'La marque est trop longue'),
  modele: z
    .string()
    .min(1, 'Le modèle est requis')
    .max(50, 'Le modèle est trop long'),
  typeVehicule: z
    .string()
    .min(1, 'Le type de véhicule est requis')
    .max(50, 'Le type de véhicule est trop long'),
  immatriculation: z.string().max(20, 'L\'immatriculation est trop longue').optional().or(z.literal('')),

  // Informations du conducteur
  nomConducteur: z
    .string()
    .min(1, 'Le nom du conducteur est requis')
    .max(100, 'Le nom est trop long'),
  telephoneConducteur: z
    .string()
    .min(1, 'Le téléphone du conducteur est requis')
    .max(20, 'Le numéro de téléphone est trop long')
    .regex(/^[0-9+\-\s()]+$/, 'Format de téléphone invalide'),

  // Informations de la saisie
  // Liste des infractions légales selon le Code des Douanes du Mali
  motifInfraction: z.enum([
    'Défaut de T1',
    'Contrebande (Art. 429)',
    'Importation sans déclaration (Art. 432)',
    'Dépassement de délai (Art. 296/440)',
    'Autre (préciser)',
  ], {
    errorMap: () => ({ message: 'Veuillez sélectionner un motif d\'infraction' }),
  }),
  // Détails supplémentaires si "Autre (préciser)" est sélectionné
  // Ce champ est optionnel mais sera validé conditionnellement dans le formulaire
  motifInfractionDetails: z.string().max(500, 'Les détails sont trop longs').optional(),
}).refine(
  // Validation conditionnelle : si "Autre (préciser)" est sélectionné, les détails sont requis
  (data) => {
    if (data.motifInfraction === 'Autre (préciser)') {
      return data.motifInfractionDetails && data.motifInfractionDetails.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Veuillez préciser les détails de l\'infraction',
    path: ['motifInfractionDetails'], // Le message d'erreur sera associé au champ motifInfractionDetails
  }
);
  lieuSaisie: z
    .string()
    .min(1, 'Le lieu de saisie est requis')
    .max(200, 'Le lieu est trop long'),
}).refine(
  // Validation conditionnelle : si "Autre (préciser)" est sélectionné, les détails sont requis
  (data) => {
    if (data.motifInfraction === 'Autre (préciser)') {
      return data.motifInfractionDetails && data.motifInfractionDetails.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Veuillez préciser les détails de l\'infraction',
    path: ['motifInfractionDetails'], // Le message d'erreur sera associé au champ motifInfractionDetails
  }
);

// Type TypeScript dérivé du schéma Zod
export type CreateSaisieInput = z.infer<typeof createSaisieSchema>;

