import { auth } from '@/lib/auth';
import { Bell, Search } from 'lucide-react';

// Composant Header
// En-tête supérieur avec recherche, notifications et informations utilisateur
export async function Header() {
  const session = await auth();

  // Vérification de sécurité : si la session ou l'utilisateur est absent, afficher des valeurs par défaut
  const userName = session?.user?.name || session?.user?.email || 'Utilisateur';
  const userRole = session?.user?.role || 'Rôle';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Actions et profil */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Informations utilisateur */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {userName}
              </p>
              <p className="text-xs text-gray-500">
                {userRole}
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {userInitial}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

