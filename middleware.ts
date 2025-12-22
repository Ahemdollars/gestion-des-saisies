import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { canAccessRoute } from '@/lib/utils/permissions';

// Middleware de protection des routes avec contrôle d'accès RBAC
// S'exécute avant chaque requête pour vérifier l'authentification et les permissions
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérification de l'authentification pour les routes protégées
  const session = await auth();

  // Protection de toutes les routes commençant par /dashboard
  if (pathname.startsWith('/dashboard')) {
    // Si l'utilisateur n'est pas connecté, redirection vers /login
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      // Conservation de l'URL de destination pour redirection après connexion
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Vérification RBAC : contrôle d'accès basé sur les rôles
    // Vérifie si l'utilisateur connecté a le droit d'accéder à cette route
    const userRole = session.user.role as Role;
    const hasAccess = canAccessRoute(userRole, pathname);

    // Si l'utilisateur n'a pas accès à cette route, redirection vers le dashboard avec message d'erreur
    // IMPORTANT : Utilisation de replace pour éviter les boucles infinies de redirection
    if (!hasAccess) {
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'access_denied');
      // Utilisation de redirect() avec replace pour éviter de polluer l'historique
      return NextResponse.redirect(dashboardUrl);
    }
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login, redirection vers /dashboard
  // IMPORTANT : Vérification que la redirection ne crée pas de boucle infinie
  if (pathname === '/login' && session) {
    // Redirection vers le dashboard uniquement si l'utilisateur peut y accéder
    const userRole = session.user?.role as Role;
    if (userRole && canAccessRoute(userRole, '/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si l'utilisateur n'a pas accès au dashboard, on le laisse sur la page de login
    // (cas théorique, ne devrait pas arriver)
  }

  return NextResponse.next();
}

// Configuration des routes à protéger
export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - api (routes API)
     * - _next/static (fichiers statiques)
     * - _next/image (optimisation d'images)
     * - favicon.ico, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

