'use client';

import { useMemo, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Activity,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Role } from '@prisma/client';

// Props du composant Sidebar
interface SidebarProps {
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
// Chaque lien définit explicitement quels rôles peuvent le voir
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
    label: 'Journal d\'Audit',
    icon: Activity,
    // Journal d'Audit : accessible UNIQUEMENT aux ADMIN
    rolesAutorises: [Role.ADMIN],
  },
];

// Composant Sidebar
// Navigation latérale fixe avec liens de menu filtrés selon les permissions RBAC
// Affiche uniquement les liens autorisés pour le rôle de l'utilisateur
// Les liens non autorisés sont complètement invisibles (pas seulement désactivés)
// Optimisé avec useMemo et React.memo pour éviter les recalculs inutiles et les boucles de re-rendu
// React.memo empêche le re-rendu si les props (userRole) n'ont pas changé
const SidebarComponent = ({ userRole }: SidebarProps) => {
  const pathname = usePathname();

  // Filtrage des liens de navigation selon le rôle de l'utilisateur
  // Utilise useMemo pour mémoriser le résultat et éviter les recalculs à chaque rendu
  // Ne recalcule que si userRole change, ce qui évite les boucles de compilation
  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) =>
      item.rolesAutorises.includes(userRole)
    );
  }, [userRole]); // Dépendance uniquement sur userRole, qui est stable

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Sidebar visible uniquement sur desktop (md et plus) */}
      {/* Sur mobile, elle est remplacée par MobileNav */}
      <div className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-slate-900 flex-col">
      {/* Logo / En-tête */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">DOUANES MALI</h1>
        <p className="text-xs text-slate-400 mt-1">Gestion des Saisies</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Détection du lien actif : correspondance exacte ou sous-route
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* Bouton de déconnexion */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
    </>
  );
};

// Export du composant mémorisé avec React.memo
// Ne se re-rend que si userRole change (comparaison stricte)
export const Sidebar = memo(SidebarComponent, (prevProps, nextProps) => {
  // Comparaison personnalisée : ne re-rend que si le rôle change
  return prevProps.userRole === nextProps.userRole;
});

