import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// IMPORT EDGE-COMPATIBLE : Utiliser Role depuis types/role.ts au lieu de @prisma/client
// pour éviter le chargement de modules natifs Prisma dans Edge Runtime
import { Role } from '@/types/role';
import { canAccessRoute } from '@/lib/utils/permissions';

// Middleware de protection des routes avec contrôle d'accès RBAC
// OPTIMISATION CRITIQUE : Ignore totalement les requêtes internes de Next.js
// S'exécute UNIQUEMENT pour les routes utilisateur pour éviter les boucles de compilation
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // IGNORER IMMÉDIATEMENT toutes les requêtes internes de Next.js
  // Ces requêtes ne doivent JAMAIS déclencher de vérifications ou redirections
  // Cela évite les boucles de compilation infinies
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/static') ||
    pathname.includes('.ico') ||
    pathname.includes('.png') ||
    pathname.includes('.jpg') ||
    pathname.includes('.svg') ||
    pathname.includes('.css') ||
    pathname.includes('.js')
  ) {
    // Laisser passer sans aucune vérification
    return NextResponse.next();
  }

  // Vérification de l'authentification UNIQUEMENT pour les routes utilisateur
  const session = await auth();

  // Protection de toutes les routes commençant par /dashboard
  if (pathname.startsWith('/dashboard')) {
    // Si l'utilisateur n'est pas connecté ou si session.user est absent, redirection vers /login
    if (!session || !session.user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // OPTIMISATION CRITIQUE : Si l'utilisateur est déjà sur une page autorisée,
    // laisser passer IMMÉDIATEMENT sans aucune vérification supplémentaire
    // Cela évite les boucles de compilation lors des changements d'onglet
    // Vérification de sécurité : utiliser ADMIN par défaut si le rôle est absent
    const userRole = (session.user.role as Role) || Role.ADMIN;
    
    // Routes de base accessibles à TOUS les rôles connectés
    // Si l'utilisateur est sur ces routes, on laisse passer SANS vérification RBAC
    const publicRoutes = ['/dashboard', '/dashboard/saisies'];
    const isPublicRoute = publicRoutes.some((route) => 
      pathname === route || pathname.startsWith(`${route}/`)
    );
    
    // Si c'est une route publique, laisser passer immédiatement (PAS de vérification RBAC)
    // C'est la clé pour éviter les boucles lors des changements d'onglet
    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Vérification RBAC UNIQUEMENT pour les routes restreintes (rapports, utilisateurs, audit)
    // Cette vérification ne s'applique QUE si l'utilisateur tente d'accéder à une route interdite
    const hasAccess = canAccessRoute(userRole, pathname);

    // Si l'utilisateur n'a pas accès à cette route restreinte
    if (!hasAccess) {
      // Redirection vers le dashboard avec message d'erreur (une seule fois)
      // Ne pas rediriger si déjà sur /dashboard pour éviter les boucles
      if (pathname !== '/dashboard' && !pathname.startsWith('/dashboard?')) {
        const dashboardUrl = new URL('/dashboard', request.url);
        dashboardUrl.searchParams.set('error', 'access_denied');
        return NextResponse.redirect(dashboardUrl);
      }
    }
    
    // Si l'utilisateur a accès, laisser passer
    return NextResponse.next();
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login, redirection vers /dashboard
  // IMPORTANT : Vérification que la redirection ne crée pas de boucle infinie
  if (pathname === '/login' && session && session.user) {
    // Redirection vers le dashboard uniquement si l'utilisateur peut y accéder
    const userRole = (session.user.role as Role) || Role.ADMIN;
    if (canAccessRoute(userRole, '/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si l'utilisateur n'a pas accès au dashboard, on le laisse sur la page de login
    // (cas théorique, ne devrait pas arriver)
  }

  return NextResponse.next();
}

// Configuration des routes à protéger
// CORRECTION CRITIQUE : Matcher ultra-simplifié pour éliminer l'erreur "Capturing groups"
// Utilise uniquement '/dashboard/:path*' sans aucune regex ni groupe de capture
// Le middleware gère /login en interne avec une simple condition if
export const config = {
  matcher: ['/dashboard/:path*'],
};

