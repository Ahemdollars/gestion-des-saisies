import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware de protection des routes
// S'exécute avant chaque requête pour vérifier l'authentification
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
  }

  // Si l'utilisateur est connecté et essaie d'accéder à /login, redirection vers /dashboard
  if (pathname === '/login' && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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

