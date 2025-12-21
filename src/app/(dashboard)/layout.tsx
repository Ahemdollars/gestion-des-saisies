import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

// Layout du dashboard
// Structure avec sidebar fixe à gauche et header en haut
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar fixe à gauche */}
      <Sidebar />

      {/* Contenu principal avec marge pour la sidebar */}
      <div className="ml-64">
        {/* Header fixe en haut */}
        <Header />

        {/* Contenu de la page avec marge pour le header */}
        <main className="pt-16 p-8">{children}</main>
      </div>
    </div>
  );
}

