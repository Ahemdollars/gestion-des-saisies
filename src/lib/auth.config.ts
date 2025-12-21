import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './prisma';

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

        // Vérification du mot de passe
        // TODO: Utiliser bcrypt pour comparer le mot de passe hashé
        // Pour l'instant, on compare en texte clair car le seed utilise 'admin123'
        const isPasswordValid = credentials.password === user.motDePasse;

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

