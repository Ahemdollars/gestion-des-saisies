import { Clock, AlertTriangle } from 'lucide-react';
import { getAlerteLevel, getAlerteMessage } from '@/lib/utils/saisie.utils';

// Composant Badge d'alerte pour les délais légaux (90 jours)
// Affiche un badge coloré selon le niveau d'alerte
interface AlerteBadgeProps {
  dateSaisie: Date;
}

export function AlerteBadge({ dateSaisie }: AlerteBadgeProps) {
  const alerteLevel = getAlerteLevel(dateSaisie);
  const alerteMessage = getAlerteMessage(dateSaisie);

  // Si pas d'alerte, on n'affiche rien
  if (alerteLevel === 'normal') {
    return null;
  }

  // Configuration des couleurs selon le niveau d'alerte
  const alerteConfig = {
    warning: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: Clock,
    },
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      icon: AlertTriangle,
    },
  };

  const config = alerteConfig[alerteLevel];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="h-3 w-3" />
      {alerteMessage}
    </span>
  );
}

