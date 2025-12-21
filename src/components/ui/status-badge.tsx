import { StatutSaisie } from '@prisma/client';

// Composant Badge pour afficher le statut d'une saisie
// Utilise des couleurs différentes selon le statut
interface StatusBadgeProps {
  statut: StatutSaisie;
}

export function StatusBadge({ statut }: StatusBadgeProps) {
  // Configuration des couleurs selon le statut
  // Badges arrondis avec couleurs distinctes pour chaque statut
  const statusConfig: Record<StatutSaisie, { bg: string; text: string; label: string }> = {
    SAISI_EN_COURS: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      label: 'Saisi',
    },
    VALIDE_POUR_DEPOT: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      label: 'Validé pour dépôt',
    },
    EN_DEPOT: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      label: 'En dépôt',
    },
    SORTIE_AUTORISEE: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      label: 'Sortie autorisée',
    },
    SORTIE_EFFECTUEE: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      label: 'Sortie effectuée',
    },
    VENTE_ENCHERES: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      label: 'Vente aux enchères',
    },
  };

  const config = statusConfig[statut];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}

