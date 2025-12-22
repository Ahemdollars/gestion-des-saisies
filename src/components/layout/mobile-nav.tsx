'use client';

import { useState } from 'react';
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

// Composant de navigation mobile
// Affiche un menu burger en haut et une barre de navigation en bas sur mobile
// Remplace la Sidebar fixe sur les écrans < 768px
export function MobileNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Configuration des liens de navigation (identique à la Sidebar)
  const navItems = [
    {
      href: '/dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
    },
    {
      href: '/dashboard/saisies',
      label: 'Saisies',
      icon: FileText,
    },
    {
      href: '/dashboard/rapports',
      label: 'Rapports',
      icon: BarChart3,
    },
    {
      href: '/dashboard/utilisateurs',
      label: 'Utilisateurs',
      icon: Users,
    },
    {
      href: '/dashboard/audit',
      label: 'Audit',
      icon: Activity,
    },
  ];

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
      {/* Navigation rapide avec les 4 liens les plus utilisés */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <nav className="flex items-center justify-around px-2 py-2">
          {/* Tableau de bord */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs font-medium">Accueil</span>
          </Link>

          {/* Saisies */}
          <Link
            href="/dashboard/saisies"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              pathname.startsWith('/dashboard/saisies')
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs font-medium">Saisies</span>
          </Link>

          {/* Rapports */}
          <Link
            href="/dashboard/rapports"
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/rapports'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Rapports</span>
          </Link>

          {/* Menu (ouvre le menu burger) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
              isMenuOpen
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </nav>
      </div>
    </>
  );
}

