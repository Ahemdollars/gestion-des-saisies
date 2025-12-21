import { handlers } from '@/lib/auth';

// Route API pour NextAuth
// Gère toutes les requêtes d'authentification (GET et POST)
// Les routes sont automatiquement générées par NextAuth :
// - GET/POST /api/auth/signin
// - GET/POST /api/auth/signout
// - GET /api/auth/session
// - etc.
export const { GET, POST } = handlers;

