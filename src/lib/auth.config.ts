import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// IMPORT DYNAMIQUE : Prisma et bcrypt ne sont pas compatibles avec Edge Runtime
// On importe dynamiquement ces modules uniquement dans la fonction authorize
// pour éviter le crash lors du chargement du module dans Edge Runtime
// Le middleware s'exécute dans Edge Runtime, donc on ne peut pas importer ces modules au top-level
// import { prisma } from './prisma'; // ❌ Import top-level incompatible avec Edge
// import bcrypt from 'bcrypt'; // ❌ Import top-level incompatible avec Edge
import { Role } from '@prisma/client';

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
      // Configuration des champs de credentials pour NextAuth v5
      // Définit explicitement les champs attendus par le provider
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'votre@email.com',
        },
        password: {
          label: 'Mot de passe',
          type: 'password',
        },
      },
      // Fonction d'autorisation : vérifie les identifiants
      async authorize(credentials) {
        // Log de débogage : email qui tente de se connecter
        console.log('[AUTH_DEBUG] ========================================');
        console.log('[AUTH_DEBUG] Tentative de connexion');
        console.log('[AUTH_DEBUG] Type de credentials:', typeof credentials);
        console.log('[AUTH_DEBUG] Credentials reçus (objet complet):', JSON.stringify(credentials, null, 2));
        console.log('[AUTH_DEBUG] Clés de l\'objet credentials:', credentials ? Object.keys(credentials) : 'NULL/UNDEFINED');
        console.log('[AUTH_DEBUG] Email:', credentials?.email || 'NON FOURNI');
        console.log('[AUTH_DEBUG] Password présent:', credentials?.password ? 'OUI (masqué)' : 'NON FOURNI');
        
        if (!credentials) {
          console.log('[AUTH_DEBUG] ❌ Credentials est NULL ou UNDEFINED');
          console.log('[AUTH_DEBUG] ========================================');
          return null;
        }
        
        if (!credentials.email || !credentials.password) {
          console.log('[AUTH_DEBUG] ❌ Email ou mot de passe manquant');
          console.log('[AUTH_DEBUG] Email présent:', !!credentials.email);
          console.log('[AUTH_DEBUG] Password présent:', !!credentials.password);
          console.log('[AUTH_DEBUG] ========================================');
          return null;
        }

        // Recherche de l'utilisateur dans la base de données
        // IMPORT DYNAMIQUE : Chargement de Prisma uniquement quand nécessaire
        // Cela évite le crash dans Edge Runtime où Prisma n'est pas compatible
        console.log('[AUTH_DEBUG] Recherche de l\'utilisateur en base de données...');
        const { prisma } = await import('./prisma');
        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user) {
          console.log('[AUTH_DEBUG] ❌ Utilisateur NON TROUVÉ en base de données');
          console.log('[AUTH_DEBUG] ========================================');
          return null;
        }

        console.log('[AUTH_DEBUG] ✅ Utilisateur TROUVÉ en base de données');
        console.log('[AUTH_DEBUG] ID:', user.id);
        console.log('[AUTH_DEBUG] Email:', user.email);
        console.log('[AUTH_DEBUG] Nom:', user.nom);
        console.log('[AUTH_DEBUG] Prénom:', user.prenom);
        console.log('[AUTH_DEBUG] Rôle:', user.role);
        console.log('[AUTH_DEBUG] Mot de passe haché stocké en base:', user.motDePasse);
        console.log('[AUTH_DEBUG] Longueur du hash:', user.motDePasse.length, 'caractères');

        // Vérification du mot de passe avec bcrypt
        // Sécurité : comparaison du mot de passe saisi avec le hash stocké en base
        // bcrypt.compare() vérifie si le mot de passe en clair correspond au hash
        // Cette fonction gère automatiquement le salt et la comparaison sécurisée
        
        // Vérification que le hash stocké est un hash bcrypt valide
        // Un hash bcrypt commence toujours par $2a$, $2b$, $2x$ ou $2y$ suivi d'un nombre
        const isBcryptHash = /^\$2[abxy]\$\d{2}\$/.test(user.motDePasse);
        console.log('[AUTH_DEBUG] Format du hash détecté:', isBcryptHash ? 'bcrypt valide' : 'NON bcrypt (texte clair ou format inconnu)');
        
        let isPasswordValid = false;

        // IMPORT DYNAMIQUE : bcrypt n'est pas compatible avec Edge Runtime
        // On charge bcrypt uniquement quand nécessaire (dans la fonction authorize)
        // Cela évite le crash lors du chargement du module dans Edge Runtime
        const bcrypt = (await import('bcrypt')).default;
        
        if (isBcryptHash) {
          // Le mot de passe est hashé avec bcrypt, on utilise bcrypt.compare()
          console.log('[AUTH_DEBUG] Utilisation de bcrypt.compare() pour vérifier le mot de passe...');
          try {
            isPasswordValid = await bcrypt.compare(
              credentials.password as string,
              user.motDePasse
            );
            console.log('[AUTH_DEBUG] Résultat de bcrypt.compare():', isPasswordValid ? '✅ TRUE (mot de passe correct)' : '❌ FALSE (mot de passe incorrect)');
          } catch (error) {
            // Erreur lors de la comparaison bcrypt (hash corrompu, etc.)
            console.error('[AUTH_DEBUG] ❌ ERREUR lors de la comparaison bcrypt:', error);
            console.log('[AUTH_DEBUG] ========================================');
            return null;
          }
        } else {
          // Le mot de passe n'est PAS hashé avec bcrypt (ancien format ou texte clair)
          // On migre automatiquement vers bcrypt pour sécuriser le compte
          console.warn('[AUTH_DEBUG] ⚠️ Mot de passe non hashé détecté pour', user.email);
          console.log('[AUTH_DEBUG] Migration automatique vers bcrypt...');
          
          // Vérification du mot de passe en texte clair (transition)
          const plainTextMatch = credentials.password === user.motDePasse;
          console.log('[AUTH_DEBUG] Comparaison en texte clair:', plainTextMatch ? '✅ TRUE (mot de passe correspond)' : '❌ FALSE (mot de passe ne correspond pas)');
          
          if (plainTextMatch) {
            // Le mot de passe correspond, on le hash avec bcrypt et on met à jour la base
            try {
              console.log('[AUTH_DEBUG] Hachage du mot de passe avec bcrypt (salt rounds: 10)...');
              const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
              console.log('[AUTH_DEBUG] Nouveau hash généré:', hashedPassword);
              
              // Utilisation de l'instance Prisma déjà chargée (réutilise la même instance)
              await prisma.user.update({
                where: { id: user.id },
                data: { motDePasse: hashedPassword },
              });
              console.log('[AUTH_DEBUG] ✅ Mot de passe migré vers bcrypt avec succès');
              isPasswordValid = true;
            } catch (error) {
              console.error('[AUTH_DEBUG] ❌ Erreur lors de la migration du mot de passe:', error);
              console.log('[AUTH_DEBUG] ========================================');
              return null;
            }
          } else {
            // Le mot de passe ne correspond pas
            isPasswordValid = false;
            console.log('[AUTH_DEBUG] ❌ Mot de passe incorrect (texte clair)');
          }
        }

        // Si le mot de passe ne correspond pas, on retourne null (connexion refusée)
        if (!isPasswordValid) {
          console.log('[AUTH_DEBUG] ❌ AUTHENTIFICATION ÉCHOUÉE - Connexion refusée');
          console.log('[AUTH_DEBUG] ========================================');
          return null;
        }

        // Retour de l'utilisateur avec les informations nécessaires
        console.log('[AUTH_DEBUG] ✅ AUTHENTIFICATION RÉUSSIE');
        console.log('[AUTH_DEBUG] Utilisateur autorisé:', {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
        });
        console.log('[AUTH_DEBUG] ========================================');
        
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
      // Approche immuable : retourner un nouvel objet au lieu de modifier l'existant
      // Cela évite les erreurs de build TypeScript et les problèmes avec NextAuth v5
      // CRITIQUE : Garantir que session.user est toujours défini avec toutes les propriétés requises
      // Si session.user n'existe pas, le créer avec des valeurs par défaut basées sur le token
      if (!session.user) {
        return {
          ...session,
          user: {
            id: (token?.id as string) || '',
            email: (token?.email as string) || '',
            name: (token?.name as string) || null,
            role: (token?.role as Role) || Role.ADMIN,
          },
        };
      }
      
      // Si token existe, enrichir session.user avec les données du token
      // Garantir que toutes les propriétés requises sont présentes
      if (token) {
        return {
          ...session,
          user: {
            id: (token.id as string) || session.user.id || '',
            email: session.user.email || (token.email as string) || '',
            name: session.user.name || (token.name as string) || null,
            role: (token.role as Role) || session.user.role || Role.ADMIN,
          },
        };
      }
      
      // Si token n'existe pas mais session.user existe, garantir que toutes les propriétés sont présentes
      return {
        ...session,
        user: {
          id: session.user.id || '',
          email: session.user.email || '',
          name: session.user.name || null,
          role: session.user.role || Role.ADMIN,
        },
      };
    },
    // Callback pour personnaliser le token JWT
    async jwt({ token, user }) {
      // Lors de la première connexion, on ajoute les infos utilisateur au token
      // CRITIQUE : Garantir que toutes les propriétés nécessaires sont présentes dans le token
      if (user) {
        // Ajout de toutes les propriétés de l'utilisateur au token
        token.id = user.id || token.id || '';
        token.role = user.role || token.role || Role.ADMIN;
        // Ajout de l'email et du name pour faciliter la reconstruction de la session
        token.email = user.email || token.email || '';
        token.name = user.name || token.name || null;
      }
      // Garantir que le token a toujours les propriétés minimales requises
      if (!token.id) token.id = '';
      if (!token.role) token.role = Role.ADMIN;
      return token;
    },
  },
} satisfies NextAuthConfig;

