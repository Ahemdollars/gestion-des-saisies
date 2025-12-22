/**
 * Script temporaire pour migrer le mot de passe de l'admin vers bcrypt
 * 
 * Ce script :
 * 1. Recherche l'utilisateur admin@douanes.ml
 * 2. Hache le mot de passe 'admin123' avec bcrypt (salt 10)
 * 3. Met à jour l'entrée dans la base de données
 * 
 * ATTENTION : Ce script est temporaire et doit être supprimé après usage pour la sécurité
 * 
 * Commande d'exécution :
 * npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fix-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Création d'une instance PrismaClient pour ce script
const prisma = new PrismaClient();

/**
 * Fonction principale pour migrer le mot de passe de l'admin
 */
async function fixAdminPassword() {
  try {
    console.log('🔐 Démarrage de la migration du mot de passe admin...');

    // ÉTAPE 1 : Recherche de l'utilisateur admin dans la base de données
    const adminEmail = 'admin@douanes.ml';
    const admin = await prisma.user.findUnique({
      where: {
        email: adminEmail,
      },
    });

    // Vérification que l'admin existe
    if (!admin) {
      console.error('❌ Erreur : L\'utilisateur admin@douanes.ml n\'existe pas dans la base de données.');
      process.exit(1);
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
    });

    console.log('✅ Mot de passe mis à jour avec succès !');
    console.log('📋 Résumé :', {
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      motDePasse: '***hashé***',
    });

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('📝 Vous pouvez maintenant vous connecter avec :');
    console.log('   Email: admin@douanes.ml');
    console.log('   Mot de passe: admin123');
    console.log('\n⚠️  IMPORTANT : Supprimez ce script après usage pour la sécurité !');

  } catch (error) {
    // Gestion des erreurs
    console.error('❌ Erreur lors de la migration du mot de passe :', error);
    process.exit(1);
  } finally {
    // Fermeture de la connexion Prisma
    await prisma.$disconnect();
    console.log('\n🔌 Connexion à la base de données fermée.');
  }
}

// Exécution du script
fixAdminPassword();

