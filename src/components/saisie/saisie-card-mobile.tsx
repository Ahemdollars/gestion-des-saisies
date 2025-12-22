'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlerteBadge } from '@/components/ui/alerte-badge';
import { DelaiCounterCompact } from '@/components/ui/delai-counter-compact';
import { StatutSaisie } from '@prisma/client';
import { Car, User, Calendar } from 'lucide-react';

// Interface pour les données d'une saisie
interface SaisieCardData {
  id: string;
  numeroChassis: string;
  marque: string;
  modele: string;
  immatriculation: string | null;
  nomConducteur: string;
  telephoneConducteur: string;
  dateSaisie: Date;
  statut: StatutSaisie;
}

// Props du composant de carte mobile
interface SaisieCardMobileProps {
  saisie: SaisieCardData;
}

// Composant de carte pour afficher une saisie sur mobile
// Design "Premium" optimisé pour les écrans fins (téléphones)
// Informations essentielles affichées de manière lisible et aérée
// Zones de clic confortables pour une utilisation tactile fluide
export function SaisieCardMobile({ saisie }: SaisieCardMobileProps) {
  return (
    <Link
      href={`/dashboard/saisies/${saisie.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md active:scale-[0.98] transition-all duration-200 touch-manipulation"
    >
      {/* En-tête avec numéro de châssis et statut */}
      {/* Informations essentielles pour les agents en patrouille */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Numéro de châssis - Information principale */}
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 rounded-lg flex-shrink-0">
              <Car className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800 truncate">
              {saisie.numeroChassis}
            </h3>
          </div>
          {/* Marque - Information secondaire */}
          <p className="text-sm font-semibold text-slate-700 truncate">
            {saisie.marque} {saisie.modele}
          </p>
        </div>
        {/* Badge de statut - Visible en haut à droite */}
        <div className="flex-shrink-0 ml-2">
          <StatusBadge statut={saisie.statut} />
        </div>
      </div>

      {/* Date de saisie - Information clé pour le terrain */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
        <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm font-medium text-slate-700">
          {new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      {/* Informations complémentaires (conducteur et délai) */}
      <div className="space-y-2">
        {/* Conducteur */}
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-600 truncate">
              {saisie.nomConducteur}
            </p>
          </div>
        </div>
        
        {/* Compteur de délai et alerte légale */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <DelaiCounterCompact dateSaisie={saisie.dateSaisie} />
          <AlerteBadge dateSaisie={saisie.dateSaisie} />
        </div>
      </div>
    </Link>
  );
}

