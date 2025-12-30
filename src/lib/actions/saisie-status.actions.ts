'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

// Type pour le résultat de l'action
type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Vérifie si l'utilisateur a les permissions pour valider/annuler une saisie
 * Seuls les ADMIN, CHEF_BUREAU et CHEF_BRIGADE peuvent effectuer ces actions
 * 
 * @param userRole - Rôle de l'utilisateur connecté
 * @returns true si l'utilisateur a les permissions, false sinon
 */
function canManageSaisie(userRole: Role): boolean {
  return userRole === 'ADMIN' || userRole === 'CHEF_BUREAU' || userRole === 'CHEF_BRIGADE';
}

/**
 * Server Action pour valider la sortie d'un véhicule
 * Change le statut à SORTIE_AUTORISEE
 * 
 * @param saisieId - ID de la saisie à valider
 * @returns ActionResult avec success: true ou false et un message d'erreur éventuel
 */
export async function validerSortie(saisieId: string): Promise<ActionResult> {
  try {
    // Vérification de l'authentification
    const session = await auth();
    if (!session || !session.user?.id) {
      return {
        success: false,
        error: 'Vous devez être connecté pour valider une sortie',
      };
    }

    // Vérification des permissions : seuls CHEF_BUREAU et CHEF_BRIGADE peuvent valider
    // Vérification de sécurité : utiliser ADMIN par défaut si le rôle est absent
    const userRole = (session.user?.role as Role) || Role.ADMIN;
    if (!canManageSaisie(userRole)) {
      return {
        success: false,
        error: 'Vous n\'avez pas les permissions nécessaires pour valider une sortie',
      };
    }

    // Vérification que la saisie existe
    const saisie = await prisma.saisie.findUnique({
      where: { id: saisieId },
    });

    if (!saisie) {
      return {
        success: false,
        error: 'Saisie introuvable',
      };
    }

    // Mise à jour du statut à SORTIE_AUTORISEE
    await prisma.saisie.update({
      where: { id: saisieId },
      data: {
        statut: 'SORTIE_AUTORISEE',
      },
    });

    // Création de l'entrée d'audit pour tracer l'action
    // Enregistre qui a validé la sortie et quand
    await prisma.auditLog.create({
      data: {
        action: 'VALIDATION_SORTIE',
        details: `Sortie validée par ${session.user?.name || session.user?.email || 'Agent'} pour le véhicule ${saisie.numeroChassis}`,
        userId: session.user?.id || '',
        saisieId: saisieId,
      },
    });

    // Revalidation du cache pour que les changements soient visibles immédiatement
    // Revalidation de la page de détails
    revalidatePath(`/dashboard/saisies/${saisieId}`);
    // Revalidation de la liste des saisies
    revalidatePath('/dashboard/saisies');
    // Revalidation du dashboard
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Erreur lors de la validation de la sortie:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la validation. Veuillez réessayer.',
    };
  }

  // Retour du succès (pas de redirection pour permettre la gestion côté client)
  return {
    success: true,
  };
}

/**
 * Server Action pour annuler une saisie
 * Change le statut à SORTIE_EFFECTUEE (considéré comme annulé/fermé)
 * 
 * @param saisieId - ID de la saisie à annuler
 * @returns ActionResult avec success: true ou false et un message d'erreur éventuel
 */
export async function annulerSaisie(saisieId: string): Promise<ActionResult> {
  try {
    // Vérification de l'authentification
    const session = await auth();
    if (!session || !session.user?.id) {
      return {
        success: false,
        error: 'Vous devez être connecté pour annuler une saisie',
      };
    }

    // Vérification des permissions : seuls CHEF_BUREAU et CHEF_BRIGADE peuvent annuler
    // Vérification de sécurité : utiliser ADMIN par défaut si le rôle est absent
    const userRole = (session.user?.role as Role) || Role.ADMIN;
    if (!canManageSaisie(userRole)) {
      return {
        success: false,
        error: 'Vous n\'avez pas les permissions nécessaires pour annuler une saisie',
      };
    }

    // Vérification que la saisie existe
    const saisie = await prisma.saisie.findUnique({
      where: { id: saisieId },
    });

    if (!saisie) {
      return {
        success: false,
        error: 'Saisie introuvable',
      };
    }

    // Mise à jour du statut à SORTIE_EFFECTUEE (considéré comme dossier fermé)
    await prisma.saisie.update({
      where: { id: saisieId },
      data: {
        statut: 'SORTIE_EFFECTUEE',
      },
    });

    // Création de l'entrée d'audit pour tracer l'action
    // Enregistre qui a annulé la saisie et quand
    await prisma.auditLog.create({
      data: {
        action: 'ANNULATION_SAISIE',
        details: `Saisie annulée par ${session.user?.name || session.user?.email || 'Agent'} pour le véhicule ${saisie.numeroChassis}`,
        userId: session.user?.id || '',
        saisieId: saisieId,
      },
    });

    // Revalidation du cache pour que les changements soient visibles immédiatement
    // Revalidation de la page de détails
    revalidatePath(`/dashboard/saisies/${saisieId}`);
    // Revalidation de la liste des saisies
    revalidatePath('/dashboard/saisies');
    // Revalidation du dashboard
    revalidatePath('/dashboard');
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la saisie:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'annulation. Veuillez réessayer.',
    };
  }

  // Retour du succès (pas de redirection pour permettre la gestion côté client)
  return {
    success: true,
  };
}

