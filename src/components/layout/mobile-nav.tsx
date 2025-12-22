'use client';

import { useState, useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Activity,
  Menu,
  X,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Role } from '@prisma/client';
import { canCreateSaisie } from '@/lib/utils/permissions';

// Props du composant MobileNav
interface MobileNavProps {
  // Rôle de l'utilisateur connecté (passé depuis le layout serveur)
  userRole: Role;
}

// Type pour un élément de navigation avec ses permissions
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  // Tableau des rôles autorisés à voir ce lien
  rolesAutorises: Role[];
}

// Configuration complète de tous les liens de navigation possibles
// Définie en dehors du composant pour éviter la recréation à chaque rendu
// Même structure que la Sidebar pour garantir la cohérence
const ALL_NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Tableau de bord',
    icon: LayoutDashboard,
    // Tableau de bord : accessible à TOUS les rôles
    rolesAutorises: [
      Role.ADMIN,
      Role.CHEF_BUREAU,
      Role.CHEF_BRIGADE,
      Role.AGENT_BRIGADE,
      Role.AGENT_CONSULTATION,
    ],
  },
  {
    href: '/dashboard/saisies',
    label: 'Saisies',
    icon: FileText,
    // Saisies : accessible à TOUS les rôles (lecture seule pour AGENT_CONSULTATION)
    rolesAutorises: [
      Role.ADMIN,
      Role.CHEF_BUREAU,
      Role.CHEF_BRIGADE,
      Role.AGENT_BRIGADE,
      Role.AGENT_CONSULTATION,
    ],
  },
  {
    href: '/dashboard/rapports',
    label: 'Rapports',
    icon: BarChart3,
    // Rapports : accessible uniquement aux ADMIN, CHEF_BUREAU et CHEF_BRIGADE
    rolesAutorises: [Role.ADMIN, Role.CHEF_BUREAU, Role.CHEF_BRIGADE],
  },
  {
    href: '/dashboard/utilisateurs',
    label: 'Utilisateurs',
    icon: Users,
    // Utilisateurs : accessible UNIQUEMENT aux ADMIN
    rolesAutorises: [Role.ADMIN],
  },
  {
    href: '/dashboard/audit',
    label: 'Audit',
    icon: Activity,
    // Journal d'Audit : accessible UNIQUEMENT aux ADMIN
    rolesAutorises: [Role.ADMIN],
  },
];

// Composant de navigation mobile
// Affiche un menu burger en haut et une barre de navigation en bas sur mobile
// Remplace la Sidebar fixe sur les écrans < 768px
// Filtre les liens selon les permissions RBAC (même logique que la Sidebar)
// Les liens non autorisés sont complètement invisibles
// Optimisé avec useMemo et React.memo pour éviter les recalculs inutiles et les boucles de re-rendu
// React.memo empêche le re-rendu si les props (userRole) n'ont pas changé
const MobileNavComponent = ({ userRole }: MobileNavProps) => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Filtrage des liens de navigation selon le rôle de l'utilisateur
  // Utilise useMemo pour mémoriser le résultat et éviter les recalculs à chaque rendu
  // Ne recalcule que si userRole change, ce qui évite les boucles de compilation
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) =>
      item.rolesAutorises.includes(userRole)
    );
  }, [userRole]); // Dépendance uniquement sur userRole, qui est stable

  // Vérification si l'utilisateur peut créer des saisies pour la barre de navigation basse
  // AGENT_CONSULTATION ne peut pas créer de saisies (lecture seule)
  const canCreate = useMemo(() => canCreateSaisie(userRole), [userRole]);

  // Fonction pour fermer le menu après navigation
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  // Fonction pour gérer la déconnexion
  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Menu Burger en haut (visible uniquement sur mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between p-4">
          {/* Logo */}
          <div>
            <h1 className="text-lg font-bold text-white">DOUANES MALI</h1>
            <p className="text-xs text-slate-400">Gestion des Saisies</p>
          </div>
          
          {/* Bouton Menu Burger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Ouvrir le menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menu déroulant (affiché quand isMenuOpen = true) */}
        {isMenuOpen && (
          <div className="border-t border-slate-800 bg-slate-900">
            <nav className="p-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                // Détection du lien actif
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Barre de navigation basse (visible uniquement sur mobile) */}
      {/* Navigation optimisée pour le terrain : 3 icônes principales pour un accès rapide */}
      {/* Design épuré et ergonomique pour les agents en patrouille */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom">
        <nav className="flex items-center justify-around px-4 py-3">
          {/* 1. Accueil - Tableau de bord */}
          {/* prefetch={false} pour éviter les re-compilations lors du changement d'onglet */}
          <Link
            href="/dashboard"
            prefetch={false}
            className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all min-w-[70px] ${
              pathname === '/dashboard'
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="h-6 w-6" />
            <span className="text-xs font-semibold">Accueil</span>
          </Link>

          {/* 2. Bouton central "+" pour Nouvelle Saisie */}
          {/* Bouton principal avec accent visuel - Visible uniquement si l'utilisateur peut créer */}
          {/* prefetch={false} pour éviter les re-compilations lors du changement d'onglet */}
          {canCreate ? (
            <Link
              href="/dashboard/saisies/new"
              prefetch={false}
              className={`flex flex-col items-center justify-center gap-1 px-6 py-3 rounded-2xl transition-all shadow-lg ${
                pathname === '/dashboard/saisies/new'
                  ? 'bg-blue-600 text-white shadow-blue-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-300'
              }`}
            >
              <div className="h-8 w-8 flex items-center justify-center bg-white/20 rounded-full">
                <span className="text-2xl font-bold leading-none">+</span>
              </div>
              <span className="text-xs font-bold">Nouvelle</span>
            </Link>
          ) : (
            // Si l'utilisateur ne peut pas créer, afficher un placeholder invisible pour garder la symétrie
            <div className="w-16" />
          )}

          {/* 3. Liste Saisies */}
          {/* prefetch={false} pour éviter les re-compilations lors du changement d'onglet */}
          <Link
            href="/dashboard/saisies"
            prefetch={false}
            className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl transition-all min-w-[70px] ${
              pathname.startsWith('/dashboard/saisies') && !pathname.includes('/new')
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <FileText className="h-6 w-6" />
            <span className="text-xs font-semibold">Liste</span>
          </Link>
        </nav>
      </div>
    </>
  );
};

// Export du composant mémorisé avec React.memo
// Ne se re-rend que si userRole change (comparaison stricte)
// Évite les boucles de compilation en empêchant les re-rendus inutiles
export const MobileNav = memo(MobileNavComponent, (prevProps, nextProps) => {
  // Comparaison personnalisée : ne re-rend que si le rôle change
  return prevProps.userRole === nextProps.userRole;
});

