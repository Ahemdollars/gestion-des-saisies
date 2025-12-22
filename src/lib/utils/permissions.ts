import { Role } from '@prisma/client';

/**
 * Détermine si un utilisateur peut accéder à une route selon son rôle
 * Conformément au cahier des charges RBAC
 * 
 * @param userRole - Rôle de l'utilisateur connecté
 * @param route - Route à vérifier (ex: '/dashboard/utilisateurs')
 * @returns true si l'utilisateur peut accéder à la route, false sinon
 */
export function canAccessRoute(userRole: Role, route: string): boolean {
  // ADMIN : Accès complet à toutes les routes
  if (userRole === Role.ADMIN) {
    return true;
  }

  // Routes accessibles à tous les utilisateurs connectés
  const publicRoutes = ['/dashboard', '/dashboard/saisies'];
  if (publicRoutes.some((r) => route.startsWith(r))) {
    return true;
  }

  // CHEF_BUREAU et CHEF_BRIGADE : Accès aux rapports
  if (
    (userRole === Role.CHEF_BUREAU || userRole === Role.CHEF_BRIGADE) &&
    route.startsWith('/dashboard/rapports')
  ) {
    return true;
  }

  // Routes restreintes : Utilisateurs et Audit (ADMIN uniquement)
  if (
    route.startsWith('/dashboard/utilisateurs') ||
    route.startsWith('/dashboard/audit')
  ) {
    return false;
  }

  // Par défaut, refuser l'accès aux routes non listées
  return false;
}

/**
 * Détermine quels liens de navigation doivent être affichés selon le rôle
 * 
 * @param userRole - Rôle de l'utilisateur connecté
 * @returns Tableau des routes autorisées pour ce rôle
 */
export function getAuthorizedRoutes(userRole: Role): string[] {
  // Routes de base accessibles à tous
  const baseRoutes = ['/dashboard', '/dashboard/saisies'];

  switch (userRole) {
    case Role.ADMIN:
      // ADMIN : Accès complet
      return [
        '/dashboard',
        '/dashboard/saisies',
        '/dashboard/rapports',
        '/dashboard/utilisateurs',
        '/dashboard/audit',
      ];

    case Role.CHEF_BUREAU:
    case Role.CHEF_BRIGADE:
      // Chefs : Dashboard, Saisies, Rapports
      return ['/dashboard', '/dashboard/saisies', '/dashboard/rapports'];

    case Role.AGENT_BRIGADE:
      // Agent Brigade : Dashboard et Saisies uniquement
      return ['/dashboard', '/dashboard/saisies'];

    case Role.AGENT_CONSULTATION:
      // Agent Consultation : Dashboard et Saisies (lecture seule)
      return ['/dashboard', '/dashboard/saisies'];

    default:
      // Par défaut, seulement les routes de base
      return baseRoutes;
  }
}

/**
 * Détermine si un utilisateur peut créer une nouvelle saisie
 * 
 * @param userRole - Rôle de l'utilisateur connecté
 * @returns true si l'utilisateur peut créer une saisie, false sinon
 */
export function canCreateSaisie(userRole: Role): boolean {
  // AGENT_CONSULTATION ne peut pas créer de saisies (lecture seule)
  return userRole !== Role.AGENT_CONSULTATION;
}

/**
 * Détermine si un utilisateur peut modifier une saisie
 * 
 * @param userRole - Rôle de l'utilisateur connecté
 * @param saisieAgentId - ID de l'agent qui a créé la saisie
 * @param currentUserId - ID de l'utilisateur connecté
 * @returns true si l'utilisateur peut modifier la saisie, false sinon
 */
export function canEditSaisie(
  userRole: Role,
  saisieAgentId: string,
  currentUserId: string
): boolean {
  // ADMIN peut modifier toutes les saisies
  if (userRole === Role.ADMIN) {
    return true;
  }

  // AGENT_CONSULTATION ne peut pas modifier (lecture seule)
  if (userRole === Role.AGENT_CONSULTATION) {
    return false;
  }

  // L'agent qui a créé la saisie peut la modifier
  return saisieAgentId === currentUserId;
}

