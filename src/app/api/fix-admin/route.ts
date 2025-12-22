import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

/**
 * Route API temporaire pour migrer le mot de passe de l'admin vers bcrypt
 * 
 * Cette route :
 * 1. Recherche l'utilisateur admin@douanes.ml
 * 2. Hache le mot de passe "admin123" avec bcrypt (salt rounds: 10)
 * 3. Met à jour l'entrée dans la base de données avec le nouveau hash
 * 4. Retourne un message JSON de confirmation
 * 
 * ATTENTION : Cette route est temporaire et doit être supprimée après usage pour la sécurité
 * 
 * Utilisation : Visitez http://localhost:3000/api/fix-admin dans votre navigateur
 */
export async function GET() {
  try {
    console.log('🔐 Démarrage de la migration du mot de passe admin...');

    // ÉTAPE 1 : Recherche de l'utilisateur admin dans la base de données
    const adminEmail = 'admin@douanes.ml';
    const admin = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        motDePasse: true, // On récupère le mot de passe pour vérifier s'il est déjà hashé
      },
    });

    // Vérification que l'admin existe
    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          error: 'L\'utilisateur admin@douanes.ml n\'existe pas dans la base de données.',
        },
        { status: 404 }
      );
    }

    // Vérification si le mot de passe est déjà hashé (commence par $2a$ ou $2b$ pour bcrypt)
    // Si c'est déjà hashé, on ne fait rien pour éviter de re-hasher un hash
    if (admin.motDePasse.startsWith('$2a$') || admin.motDePasse.startsWith('$2b$')) {
      return NextResponse.json(
        {
          success: true,
          message: 'Le mot de passe de l\'admin est déjà hashé avec bcrypt.',
          info: 'Aucune action nécessaire.',
        },
        { status: 200 }
      );
    }

    console.log('✅ Utilisateur admin trouvé :', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    });

    // ÉTAPE 2 : Hachage du mot de passe avec bcrypt
    // Utilisation d'un salt de 10 rounds (même valeur que dans createUser)
    const plainPassword = 'admin123';
    const saltRounds = 10;
    
    console.log('🔒 Hachage du mot de passe avec bcrypt (salt rounds: 10)...');
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    console.log('✅ Mot de passe hashé avec succès');

    // ÉTAPE 3 : Mise à jour de l'entrée dans la base de données
    console.log('💾 Mise à jour du mot de passe dans la base de données...');
    
    const updatedAdmin = await prisma.user.update({
      where: {
        email: adminEmail,
      },
      data: {
        motDePasse: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    console.log('✅ Mot de passe mis à jour avec succès !');

    // Retour d'une réponse JSON de succès
    return NextResponse.json(
      {
        success: true,
        message: 'Admin mis à jour avec succès',
        details: {
          email: updatedAdmin.email,
          role: updatedAdmin.role,
          motDePasse: '***hashé avec bcrypt***',
        },
        instructions: {
          connexion: {
            email: 'admin@douanes.ml',
            motDePasse: 'admin123',
          },
          prochaineEtape: 'Vous pouvez maintenant vous connecter avec ces identifiants. Le mot de passe est sécurisé avec bcrypt.',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Gestion des erreurs
    console.error('❌ Erreur lors de la migration du mot de passe :', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Une erreur est survenue lors de la migration du mot de passe.',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

