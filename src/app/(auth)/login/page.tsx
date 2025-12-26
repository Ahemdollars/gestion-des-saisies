'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

/**
 * Page de connexion - Style Institutionnel Douanes Maliennes
 * CONFORMITÉ MODÈLE : Fidélité visuelle exacte au modèle institutionnel fourni
 * 
 * Structure visuelle :
 * 1. En-tête : Texte centré en vert foncé "Bienvenue dans l'application de gestion des Saisies de Véhicules"
 * 2. Logo Central : Image imposante mais équilibrée au centre
 * 3. Texte de transition : "Saisissez vos identifiants" en noir, au-dessus du formulaire
 * 4. Formulaire :
 *    - Inputs avec fond bleu ciel très clair (comme sur l'image modèle)
 *    - Bouton "Se connecter" en VERT vif avec texte blanc
 *    - Design épuré, carte blanche sur fond gris très clair
 * 
 * Logique :
 * - Intégration NextAuth conservée
 * - Centrage vertical et horizontal parfait
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Gestion de la soumission du formulaire
   * Conserve la logique NextAuth existante pour connecter l'utilisateur selon son rôle
   * (Admin, Agent, Chef de Bureau, Chef de Brigade)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Tentative de connexion via NextAuth
      // La configuration dans auth.config.ts gère l'authentification selon les rôles
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Affichage de l'erreur si les identifiants sont incorrects
        setError('Email ou mot de passe incorrect');
        setIsLoading(false);
      } else {
        // Redirection vers le dashboard en cas de succès
        // Le middleware gère les redirections selon les rôles
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      {/* Carte blanche : Design épuré avec ombre légère et coins arrondis */}
      <div className="w-full max-w-md">
        <div className="rounded-xl bg-white shadow-lg border border-gray-100 p-8 md:p-10">
          {/* En-tête : Texte centré en vert foncé selon le modèle institutionnel */}
          <div className="text-center mb-8">
            <h1 className="text-xl md:text-2xl font-bold text-green-700 mb-8 leading-tight">
              Bienvenue dans l'application de gestion des Saisies de Véhicules
            </h1>

            {/* Logo Central : Imposant mais équilibré, parfaitement centré */}
            <div className="flex justify-center mb-8">
              <div className="relative w-full max-w-[280px] h-[160px]">
                <Image
                  src="/images/logo-douanes.png"
                  alt="Logo Douanes Mali"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 240px, 280px"
                />
              </div>
            </div>

            {/* Texte de transition : "Saisissez vos identifiants" en noir, au-dessus du formulaire */}
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-6">
              Saisissez vos identifiants
            </h2>
          </div>

          {/* Formulaire de connexion */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Message d'erreur */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600 text-center">{error}</p>
              </div>
            )}

            {/* Champ Email : Fond bleu ciel très clair (comme sur l'image modèle) */}
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-sky-50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Email"
                disabled={isLoading}
              />
            </div>

            {/* Champ Mot de passe : Fond bleu ciel très clair (comme sur l'image modèle) */}
            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 bg-sky-50 px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Mot de passe"
                disabled={isLoading}
              />
            </div>

            {/* Bouton de connexion : VERT vif avec texte blanc selon le modèle institutionnel */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-green-500 px-4 py-3.5 text-base font-semibold text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Connexion...</span>
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        {/* Footer informatif */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Système de gestion des saisies - Douanes du Mali
        </p>
      </div>
    </div>
  );
}

