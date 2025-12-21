import type { ReactNode } from 'react';

// Composant de carte KPI (Key Performance Indicator)
// Affiche une métrique importante avec un titre et une valeur
interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: 'default' | 'alert';
  description?: string;
}

export function KPICard({
  title,
  value,
  icon,
  variant = 'default',
  description,
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
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
          <div className="ml-4 p-3 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

