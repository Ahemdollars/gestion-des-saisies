import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';

// Configuration de base de NextAuth
// Ce fichier contient la configuration des providers et callbacks
export const authConfig = {
  // Pages personnalisées (redirection vers /login)
  pages: {
    signIn: '/login',
  },
  // Configuration des providers d'authentification
  providers: [
    Credentials({
      // Fonction d'autorisation : vérifie les identifiants
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Recherche de l'utilisateur dans la base de données
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          return null;
        }

        // Vérification du mot de passe avec bcrypt
        // Sécurité : comparaison du mot de passe saisi avec le hash stocké en base
        // bcrypt.compare() vérifie si le mot de passe en clair correspond au hash
        // Cette fonction gère automatiquement le salt et la comparaison sécurisée
        let isPasswordValid = false;

        try {
          // Tentative de comparaison avec bcrypt (pour les nouveaux utilisateurs)
          // bcrypt.compare() retourne true si les mots de passe correspondent, false sinon
          // Si le mot de passe en DB n'est pas un hash bcrypt valide, cela lancera une erreur
          isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.motDePasse
          );
        } catch (error) {
          // Si bcrypt.compare() échoue, cela signifie que le mot de passe en DB n'est pas hashé
          // (cas de l'admin créé via seed.ts avec mot de passe en texte clair)
          // On fait une comparaison en texte clair uniquement pour la transition
          // ATTENTION : Cette logique de transition doit être supprimée une fois tous les utilisateurs migrés
          if (credentials.password === user.motDePasse) {
            // Mot de passe en texte clair correspond, on accepte la connexion
            // TODO : Migrer automatiquement ce mot de passe vers bcrypt après connexion
            isPasswordValid = true;
            
            // Optionnel : Hash automatique du mot de passe lors de la première connexion
            // Décommentez les lignes suivantes pour migrer automatiquement :
            /*
            const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { motDePasse: hashedPassword },
            });
            */
          } else {
            // Le mot de passe ne correspond pas, connexion refusée
            isPasswordValid = false;
          }
        }

        // Si le mot de passe ne correspond pas, on retourne null (connexion refusée)
        if (!isPasswordValid) {
          return null;
        }

        // Retour de l'utilisateur avec les informations nécessaires
        return {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
        };
      },
    }),
  ],
  // Callbacks pour personnaliser le comportement
  callbacks: {
    // Callback pour personnaliser les données de la session
    async session({ session, token }) {
      // Ajout du rôle et de l'ID utilisateur dans la session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    // Callback pour personnaliser le token JWT
    async jwt({ token, user }) {
      // Lors de la première connexion, on ajoute les infos utilisateur au token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
} satisfies NextAuthConfig;

