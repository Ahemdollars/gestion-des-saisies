'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createSaisieSchema, type CreateSaisieInput } from '@/lib/validations/saisie.schema';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';

// Type pour le résultat de l'action
// Permet de retourner un succès ou une erreur avec message
type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Server Action pour créer une nouvelle saisie de véhicule
 * 
 * Cette fonction :
 * 1. Vérifie l'authentification de l'utilisateur
 * 2. Valide tous les champs obligatoires avec Zod
 * 3. Vérifie l'unicité du numéro de châssis
 * 4. Insère les données dans la table Saisie
 * 5. Crée une entrée dans AuditLog pour la traçabilité
 * 6. Redirige vers la liste des saisies
 * 
 * @param data - Données du formulaire (châssis, marque, modèle, conducteur, etc.)
 * @returns ActionResult avec success: true ou false et un message d'erreur éventuel
 */
export async function createSaisie(
  data: CreateSaisieInput
): Promise<ActionResult> {
  try {
    // ÉTAPE 1 : Vérification de l'authentification
    // Récupère la session de l'utilisateur connecté via NextAuth
    const session = await auth();
    
    // Si l'utilisateur n'est pas connecté, on retourne une erreur
    if (!session || !session.user?.id) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer une saisie',
      };
    }

    // ÉTAPE 2 : Validation des données avec Zod
    // Zod vérifie que tous les champs obligatoires sont remplis :
    // - numeroChassis, marque, modele, typeVehicule (véhicule)
    // - nomConducteur, telephoneConducteur (conducteur)
    // - motifInfraction, lieuSaisie (infraction)
    // Si un champ est manquant ou invalide, Zod lève une exception
    const validatedData = createSaisieSchema.parse(data);

    // ÉTAPE 3 : Vérification de l'unicité du numéro de châssis
    // Le numéro de châssis doit être unique dans la base de données
    const existingSaisie = await prisma.saisie.findUnique({
      where: {
        numeroChassis: validatedData.numeroChassis,
      },
    });

    // Si un véhicule avec ce numéro de châssis existe déjà, on retourne une erreur
    if (existingSaisie) {
      return {
        success: false,
        error: `Un véhicule avec le numéro de châssis "${validatedData.numeroChassis}" existe déjà`,
      };
    }

    // ÉTAPE 4 : Création de la saisie dans la base de données
    // On insère toutes les données validées dans la table Saisie
    const saisie = await prisma.saisie.create({
      data: {
        // Informations du véhicule (validées par Zod)
        numeroChassis: validatedData.numeroChassis,
        marque: validatedData.marque,
        modele: validatedData.modele,
        typeVehicule: validatedData.typeVehicule,
        immatriculation: validatedData.immatriculation || null, // Optionnel, peut être null
        
        // Informations du conducteur (validées par Zod)
        nomConducteur: validatedData.nomConducteur,
        telephoneConducteur: validatedData.telephoneConducteur,
        
        // Informations de l'infraction (validées par Zod)
        motifInfraction: validatedData.motifInfraction,
        lieuSaisie: validatedData.lieuSaisie,
        
        // Données automatiques
        agentId: session.user.id, // ID de l'agent connecté récupéré depuis la session
        statut: 'SAISI_EN_COURS', // Statut par défaut : toute nouvelle saisie est "en cours"
        dateSaisie: new Date(), // Date et heure actuelles de la création
        
        // IMPORTANT - Rappel légal (Art. 296) :
        // Le délai de dépôt est de 90 jours à compter de la date de saisie.
        // Le champ dateSaisie servira de point de départ pour l'alerte automatique
        // qui sera gérée par une tâche planifiée (Cron) pour vérifier les délais.
      },
    });

    // ÉTAPE 5 : Création de l'entrée dans AuditLog pour la traçabilité
    // Permet de savoir QUI a créé QUOI et QUAND
    await prisma.auditLog.create({
      data: {
        action: 'CREATION_SAISIE',
        // Message d'audit : "Nouvelle saisie effectuée pour le véhicule [N° Châssis]"
        details: `Nouvelle saisie effectuée pour le véhicule ${validatedData.numeroChassis} par ${session.user.name || session.user.email}`,
        userId: session.user.id, // ID de l'utilisateur qui a effectué l'action
        saisieId: saisie.id, // ID de la saisie créée
      },
    });

    // ÉTAPE 6 : Revalidation du cache Next.js
    // Force Next.js à régénérer la page /dashboard/saisies pour afficher la nouvelle saisie
    revalidatePath('/dashboard/saisies');
  } catch (error) {
    // GESTION DES ERREURS
    
    // Erreur de validation Zod : un champ obligatoire est manquant ou invalide
    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Les données fournies sont invalides. Veuillez vérifier que tous les champs obligatoires sont remplis.',
      };
    }

    // Autres erreurs (base de données, réseau, etc.)
    console.error('Erreur lors de la création de la saisie:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de la saisie. Veuillez réessayer.',
    };
  }

  // ÉTAPE 7 : Redirection vers la liste des saisies
  // IMPORTANT : redirect() doit être appelé EN DEHORS du bloc try/catch
  // pour que Next.js puisse l'intercepter correctement et éviter l'erreur NEXT_REDIRECT
  // Si on arrive ici, c'est que toutes les étapes précédentes ont réussi
  redirect('/dashboard/saisies');
}

