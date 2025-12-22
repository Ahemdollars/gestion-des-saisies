import type { ReactNode } from 'react';
import Link from 'next/link';

// Composant de carte KPI (Key Performance Indicator)
// Affiche une métrique importante avec un titre et une valeur
// Peut être cliquable pour rediriger vers une page filtrée
interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: 'default' | 'alert';
  description?: string;
  href?: string; // URL optionnelle pour rendre la carte cliquable
}

export function KPICard({
  title,
  value,
  icon,
  variant = 'default',
  description,
  href,
}: KPICardProps) {
  // Contenu de la carte (réutilisable pour le lien ou la div)
  const cardContent = (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p
            className={`text-3xl font-bold ${
              variant === 'alert' ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {value}
          </p>
          {description && (
            <p className="text-xs text-gray-400 mt-2">{description}</p>
          )}
        </div>
        {icon && (
          <div
            className={`ml-4 p-3 rounded-lg ${
              variant === 'alert'
                ? 'bg-red-50 text-red-600'
                : 'bg-blue-50 text-blue-600'
            }`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  // Si un href est fourni, la carte est cliquable
  // Ajout d'un effet hover plus prononcé pour indiquer l'interactivité
  if (href) {
    return (
      <Link
        href={href}
        className="block cursor-pointer group"
        aria-label={`Voir les détails de ${title}`}
      >
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group-hover:scale-[1.02]">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
              <p
                className={`text-3xl font-bold ${
                  variant === 'alert' ? 'text-red-600' : 'text-gray-900'
                }`}
              >
                {value}
              </p>
              {description && (
                <p className="text-xs text-gray-400 mt-2">{description}</p>
              )}
            </div>
            {icon && (
              <div
                className={`ml-4 p-3 rounded-lg ${
                  variant === 'alert'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                {icon}
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Sinon, affichage normal sans lien
  return cardContent;
}

