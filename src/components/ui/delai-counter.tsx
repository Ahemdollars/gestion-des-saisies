import { Clock, AlertTriangle } from 'lucide-react';
import { calculateDaysRemaining, calculateDaysSinceSaisie } from '@/lib/utils/saisie.utils';

// Composant Compteur de Délai Légal (Art. 296)
// Affiche le nombre de jours restants avant dépôt/enchères avec règles visuelles
interface DelaiCounterProps {
  dateSaisie: Date;
}

export function DelaiCounter({ dateSaisie }: DelaiCounterProps) {
  // Calcul du nombre de jours restants (peut être négatif si délai dépassé)
  const joursRestants = calculateDaysRemaining(dateSaisie);
  const joursEcoules = calculateDaysSinceSaisie(dateSaisie);

  // Détermination du style selon les règles visuelles
  // 0 à 75 jours : Texte normal (Gris)
  // 76 à 89 jours : Texte Orange (Alerte approche)
  // 90 jours et plus : Texte Rouge clignotant ("DÉLAI DÉPASSÉ - VENTE ENCHÈRES")
  let textColor = 'text-slate-600'; // Par défaut : gris
  let bgColor = 'bg-slate-50';
  let borderColor = 'border-slate-200';
  let icon = Clock;
  let message = '';

  if (joursEcoules >= 90) {
    // 90 jours et plus : Rouge clignotant
    textColor = 'text-red-600';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    icon = AlertTriangle;
    message = `DÉLAI DÉPASSÉ - VENTE ENCHÈRES (${joursEcoules - 90} jour(s) en retard)`;
  } else if (joursEcoules >= 76) {
    // 76 à 89 jours : Orange (Alerte approche)
    textColor = 'text-orange-600';
    bgColor = 'bg-orange-50';
    borderColor = 'border-orange-200';
    icon = AlertTriangle;
    message = `${joursRestants} jour(s) restant(s) - Alerte approche`;
  } else {
    // 0 à 75 jours : Texte normal (Gris)
    textColor = 'text-slate-600';
    bgColor = 'bg-slate-50';
    borderColor = 'border-slate-200';
    icon = Clock;
    message = `${joursRestants} jour(s) restant(s) avant dépôt/enchères`;
  }

  const Icon = icon;

  return (
    <div
      className={`rounded-2xl border p-4 ${bgColor} ${borderColor} ${
        joursEcoules >= 90 ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${textColor}`} />
        <div>
          <p className={`text-sm font-semibold ${textColor}`}>
            Jours restants avant dépôt/enchères
          </p>
          <p className={`text-lg font-bold mt-1 ${textColor}`}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

