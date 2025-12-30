/**
 * Script de vérification de l'intégrité des mots de passe
 * 
 * Ce script :
 * 1. Vérifie que tous les utilisateurs ont des mots de passe hashés avec bcrypt
 * 2. Identifie les utilisateurs avec des mots de passe en texte clair
 * 3. Propose de migrer automatiquement les mots de passe non hashés
 * 
 * Commande d'exécution :
 * npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/verify-passwords.ts
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Vérifie si une chaîne est un hash bcrypt valide
 * Un hash bcrypt commence toujours par $2a$, $2b$, $2x$ ou $2y$ suivi d'un nombre
 */
function isBcryptHash(password: string): boolean {
  return /^\$2[abxy]\$\d{2}\$/.test(password);
}

/**
 * Fonction principale pour vérifier l'intégrité des mots de passe
 */
async function verifyPasswords() {
  try {
    console.log('🔍 Vérification de l\'intégrité des mots de passe...\n');

    // Récupération de tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        motDePasse: true,
      },
    });

    if (users.length === 0) {
      console.log('⚠️  Aucun utilisateur trouvé dans la base de données.');
      return;
    }

    console.log(`📊 Nombre total d'utilisateurs : ${users.length}\n`);

    const usersWithPlainText: typeof users = [];
    const usersWithBcrypt: typeof users = [];

    // Classification des utilisateurs
    for (const user of users) {
      if (isBcryptHash(user.motDePasse)) {
        usersWithBcrypt.push(user);
      } else {
        usersWithPlainText.push(user);
      }
    }

    // Affichage des résultats
    console.log(`✅ Utilisateurs avec mot de passe hashé (bcrypt) : ${usersWithBcrypt.length}`);
    if (usersWithBcrypt.length > 0) {
      usersWithBcrypt.forEach((user) => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

    console.log(`\n⚠️  Utilisateurs avec mot de passe en texte clair : ${usersWithPlainText.length}`);
    if (usersWithPlainText.length > 0) {
      usersWithPlainText.forEach((user) => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }

    // Résumé
    console.log('\n' + '='.repeat(60));
    if (usersWithPlainText.length === 0) {
      console.log('✅ Tous les mots de passe sont correctement hashés avec bcrypt !');
    } else {
      console.log(`⚠️  ${usersWithPlainText.length} utilisateur(s) ont des mots de passe en texte clair.`);
      console.log('   Ces utilisateurs seront automatiquement migrés lors de leur prochaine connexion.');
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des mots de passe :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution du script
verifyPasswords();

