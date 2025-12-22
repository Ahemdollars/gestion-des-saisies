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
// Design "Premium" avec coins arrondis et informations essentielles
export function SaisieCardMobile({ saisie }: SaisieCardMobileProps) {
  return (
    <Link
      href={`/dashboard/saisies/${saisie.id}`}
      className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200"
    >
      {/* En-tête avec numéro de châssis */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <Car className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {saisie.numeroChassis}
            </h3>
          </div>
          {/* Marque et modèle */}
          <p className="text-sm font-medium text-slate-700">
            {saisie.marque} {saisie.modele}
          </p>
          {saisie.immatriculation && (
            <p className="text-xs text-slate-500 mt-0.5">
              {saisie.immatriculation}
            </p>
          )}
        </div>
        {/* Badge de statut */}
        <div className="flex flex-col gap-2">
          <StatusBadge statut={saisie.statut} />
        </div>
      </div>

      {/* Informations du conducteur */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
        <User className="h-4 w-4 text-slate-400" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-800 truncate">
            {saisie.nomConducteur}
          </p>
          <p className="text-xs text-slate-500">
            {saisie.telephoneConducteur}
          </p>
        </div>
      </div>

      {/* Date et délai */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-600">
            {new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </span>
        </div>
        {/* Compteur de délai */}
        <DelaiCounterCompact dateSaisie={saisie.dateSaisie} />
      </div>

      {/* Badge d'alerte légale */}
      <div className="mt-3">
        <AlerteBadge dateSaisie={saisie.dateSaisie} />
      </div>
    </Link>
  );
}

