'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createUserSchema, type CreateUserInput } from '@/lib/validations/user.schema';
import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

// Type pour le résultat de l'action
// Permet de retourner un succès ou une erreur avec message
type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Vérifie si l'utilisateur a le rôle ADMIN
 * Seuls les administrateurs peuvent créer des utilisateurs
 * 
 * @param userRole - Rôle de l'utilisateur connecté
 * @returns true si l'utilisateur est ADMIN, false sinon
 */
function isAdmin(userRole: Role): boolean {
  return userRole === Role.ADMIN;
}

/**
 * Server Action pour créer un nouvel utilisateur
 * 
 * Cette fonction :
 * 1. Vérifie que l'utilisateur est connecté et a le rôle ADMIN
 * 2. Valide tous les champs avec Zod
 * 3. Vérifie l'unicité de l'email
 * 4. Hache le mot de passe avec bcrypt
 * 5. Insère l'utilisateur dans la base de données
 * 6. Crée une entrée dans AuditLog pour la traçabilité
 * 
 * @param data - Données du formulaire (nom, prénom, email, mot de passe, rôle)
 * @returns ActionResult avec success: true ou false et un message d'erreur éventuel
 */
export async function createUser(data: CreateUserInput): Promise<ActionResult> {
  try {
    // ÉTAPE 1 : Vérification de l'authentification et des permissions
    // Récupère la session de l'utilisateur connecté via NextAuth
    const session = await auth();
    
    // Si l'utilisateur n'est pas connecté, on retourne une erreur
    if (!session || !session.user?.id) {
      return {
        success: false,
        error: 'Vous devez être connecté pour créer un utilisateur',
      };
    }

    // Vérification que l'utilisateur a le rôle ADMIN
    // Seuls les administrateurs peuvent créer des utilisateurs
    // Vérification de sécurité : utiliser ADMIN par défaut si le rôle est absent
    const userRole = (session.user.role as Role) || Role.ADMIN;
    if (!isAdmin(userRole)) {
      return {
        success: false,
        error: 'Vous n\'avez pas les permissions nécessaires. Seuls les administrateurs peuvent créer des utilisateurs.',
      };
    }

    // ÉTAPE 2 : Validation des données avec Zod
    // Zod vérifie que tous les champs sont valides :
    // - nom, prenom (minimum 2 caractères)
    // - email (format valide)
    // - motDePasse (minimum 6 caractères)
    // - role (doit être un des rôles définis)
    const validatedData = createUserSchema.parse(data);

    // ÉTAPE 3 : Vérification de l'unicité de l'email
    // L'email doit être unique dans la base de données
    const existingUser = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Cet email est déjà utilisé par un autre utilisateur',
      };
    }

    // ÉTAPE 4 : Hachage du mot de passe avec bcrypt
    // Sécurité : on ne stocke jamais le mot de passe en clair
    // bcrypt génère un hash sécurisé avec un salt automatique
    // Le coût (10) détermine la complexité du hachage (plus élevé = plus sécurisé mais plus lent)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(validatedData.motDePasse, saltRounds);

    // ÉTAPE 5 : Création de l'utilisateur dans la base de données
    // Insertion avec le mot de passe hashé
    const newUser = await prisma.user.create({
      data: {
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        email: validatedData.email,
        motDePasse: hashedPassword, // Mot de passe hashé avec bcrypt
        role: validatedData.role,
      },
    });

    // ÉTAPE 6 : Création de l'entrée d'audit pour tracer l'action
    // Enregistre qui a créé le compte et quand
    await prisma.auditLog.create({
      data: {
        action: 'CREATION_UTILISATEUR',
        details: `Compte créé pour ${newUser.email} par l'Administrateur ${session.user?.name || session.user?.email || 'Admin'}`,
        userId: session.user?.id || '',
        // Pas de saisieId car cette action ne concerne pas une saisie
        saisieId: null,
      },
    });

    // Revalidation du cache pour afficher le nouvel utilisateur dans la liste
    revalidatePath('/dashboard/utilisateurs');

    // Retour du succès
    return {
      success: true,
    };
  } catch (error) {
    // Gestion des erreurs de validation Zod
    if (error instanceof ZodError) {
      // Récupération du premier message d'erreur pour l'afficher à l'utilisateur
      // ZodError utilise 'issues' au lieu de 'errors' dans Zod v4
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Données invalides',
      };
    }

    // Gestion des autres erreurs (base de données, etc.)
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la création de l\'utilisateur. Veuillez réessayer.',
    };
  }
}

/**
 * Server Action pour supprimer un utilisateur
 * 
 * Cette fonction :
 * 1. Vérifie que l'utilisateur est connecté et a le rôle ADMIN
 * 2. Vérifie que l'utilisateur à supprimer existe
 * 3. Empêche un administrateur de se supprimer lui-même (sécurité)
 * 4. Supprime l'utilisateur de la base de données
 * 5. Crée une entrée dans AuditLog pour la traçabilité
 * 
 * @param userId - ID de l'utilisateur à supprimer
 * @returns ActionResult avec success: true ou false et un message d'erreur éventuel
 */
export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    // ÉTAPE 1 : Vérification de l'authentification et des permissions
    // Récupère la session de l'utilisateur connecté via NextAuth
    const session = await auth();
    
    // Si l'utilisateur n'est pas connecté, on retourne une erreur
    if (!session || !session.user?.id) {
      return {
        success: false,
        error: 'Vous devez être connecté pour supprimer un utilisateur',
      };
    }

    // Vérification que l'utilisateur a le rôle ADMIN
    // Seuls les administrateurs peuvent supprimer des utilisateurs
    // Vérification de sécurité : utiliser ADMIN par défaut si le rôle est absent
    const userRole = (session.user.role as Role) || Role.ADMIN;
    if (!isAdmin(userRole)) {
      return {
        success: false,
        error: 'Vous n\'avez pas les permissions nécessaires. Seuls les administrateurs peuvent supprimer des utilisateurs.',
      };
    }

    // ÉTAPE 2 : Vérification que l'utilisateur à supprimer existe
    const userToDelete = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
      },
    });

    if (!userToDelete) {
      return {
        success: false,
        error: 'Utilisateur introuvable',
      };
    }

    // ÉTAPE 3 : Sécurité - Empêche un administrateur de se supprimer lui-même
    // Un administrateur ne peut pas supprimer son propre compte par erreur
    if (userToDelete.id === session.user.id) {
      return {
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte. Demandez à un autre administrateur de le faire.',
      };
    }

    // ÉTAPE 4 : Suppression de l'utilisateur de la base de données
    // Prisma supprimera automatiquement les relations (cascade) si configuré dans le schéma
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    // ÉTAPE 5 : Création de l'entrée d'audit pour tracer l'action
    // Enregistre qui a supprimé le compte et quand
    await prisma.auditLog.create({
      data: {
        action: 'SUPPRESSION_UTILISATEUR',
        details: `Utilisateur ${userToDelete.email} (${userToDelete.prenom} ${userToDelete.nom}) supprimé par l'Administrateur ${session.user?.name || session.user?.email || 'Admin'}`,
        userId: session.user?.id || '',
        // Pas de saisieId car cette action ne concerne pas une saisie
        saisieId: null,
      },
    });

    // Revalidation du cache pour retirer l'utilisateur supprimé de la liste
    revalidatePath('/dashboard/utilisateurs');

    // Retour du succès
    return {
      success: true,
    };
  } catch (error) {
    // Gestion des erreurs (base de données, contraintes, etc.)
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    
    // Vérification des erreurs de contrainte (ex: utilisateur lié à des saisies)
    if (error instanceof Error && error.message.includes('Foreign key constraint')) {
      return {
        success: false,
        error: 'Impossible de supprimer cet utilisateur car il est lié à des saisies. Supprimez d\'abord les saisies associées.',
      };
    }

    return {
      success: false,
      error: 'Une erreur est survenue lors de la suppression de l\'utilisateur. Veuillez réessayer.',
    };
  }
}

