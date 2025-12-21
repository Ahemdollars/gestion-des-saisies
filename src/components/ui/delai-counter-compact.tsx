import { Clock, AlertTriangle } from 'lucide-react';
import { calculateDaysRemaining, calculateDaysSinceSaisie } from '@/lib/utils/saisie.utils';

// Composant Compteur de Délai Compact (pour tableaux)
// Version réduite du compteur pour affichage dans les tableaux
interface DelaiCounterCompactProps {
  dateSaisie: Date;
}

export function DelaiCounterCompact({ dateSaisie }: DelaiCounterCompactProps) {
  // Calcul du nombre de jours restants et écoulés
  const joursRestants = calculateDaysRemaining(dateSaisie);
  const joursEcoules = calculateDaysSinceSaisie(dateSaisie);

  // Détermination du style selon les règles visuelles
  // 0 à 75 jours : Texte normal (Gris)
  // 76 à 89 jours : Texte Orange (Alerte approche)
  // 90 jours et plus : Texte Rouge clignotant ("DÉLAI DÉPASSÉ - VENTE ENCHÈRES")
  let textColor = 'text-slate-600'; // Par défaut : gris
  let icon = Clock;
  let message = '';

  if (joursEcoules >= 90) {
    // 90 jours et plus : Rouge clignotant ("DÉLAI DÉPASSÉ - VENTE ENCHÈRES")
    textColor = 'text-red-600';
    icon = AlertTriangle;
    message = `DÉPASSÉ (+${joursEcoules - 90}j)`;
  } else if (joursEcoules >= 76) {
    // 76 à 89 jours : Orange (Alerte approche)
    textColor = 'text-orange-600';
    icon = AlertTriangle;
    message = `${joursRestants}j restants`;
  } else {
    // 0 à 75 jours : Texte normal (Gris)
    textColor = 'text-slate-600';
    icon = Clock;
    message = `${joursRestants}j restants`;
  }

  const Icon = icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${textColor} ${
        joursEcoules >= 90 ? 'animate-pulse font-bold' : ''
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
}

