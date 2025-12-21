'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';

// Composant Sidebar
// Navigation latérale fixe avec liens de menu et indication du lien actif
export function Sidebar() {
  const pathname = usePathname();

  // Configuration des liens de navigation
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
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 flex flex-col">
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
  );
}

