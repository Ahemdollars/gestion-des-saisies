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
  motifInfraction: z
    .string()
    .min(1, 'Le motif de l\'infraction est requis')
    .max(500, 'Le motif est trop long'),
  lieuSaisie: z
    .string()
    .min(1, 'Le lieu de saisie est requis')
    .max(200, 'Le lieu est trop long'),
});

// Type TypeScript dérivé du schéma Zod
export type CreateSaisieInput = z.infer<typeof createSaisieSchema>;

