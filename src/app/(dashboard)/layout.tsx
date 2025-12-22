import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { Role } from '@prisma/client';
import { canAccessRoute } from '@/lib/utils/permissions';

// Layout du dashboard
// Structure responsive avec sidebar sur desktop et navigation mobile sur mobile
// Protection RBAC : vérifie les permissions avant d'afficher les composants
// Toutes les pages du dashboard héritent de ce layout
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Vérification de sécurité : redirection si non connecté
  if (!session) {
    redirect('/login');
  }

  // Récupération du rôle de l'utilisateur pour le contrôle d'accès RBAC
  const userRole = session.user.role as Role;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation mobile (visible uniquement sur mobile) */}
      {/* Passe le rôle de l'utilisateur pour filtrer les liens selon les permissions */}
      <MobileNav userRole={userRole} />

      {/* Sidebar fixe à gauche (visible uniquement sur desktop) */}
      {/* Passe le rôle de l'utilisateur pour filtrer les liens selon les permissions */}
      <Sidebar userRole={userRole} />

      {/* Contenu principal avec marge pour la sidebar sur desktop */}
      {/* Sur mobile, le contenu prend toute la largeur */}
      <div className="md:ml-64">
        {/* Header fixe en haut (visible uniquement sur desktop) */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Contenu de la page */}
        {/* Sur mobile : marge en haut pour le menu burger, marge en bas pour la nav basse */}
        {/* Sur desktop : marge en haut pour le header */}
        <main className="pt-16 md:pt-16 pb-20 md:pb-8 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

