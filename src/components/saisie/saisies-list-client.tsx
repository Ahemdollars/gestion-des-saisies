'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlerteBadge } from '@/components/ui/alerte-badge';
import { DelaiCounterCompact } from '@/components/ui/delai-counter-compact';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { StatutSaisie } from '@prisma/client';
import { SearchFilters } from './search-filters';

// Interface pour les données d'une saisie
interface SaisieData {
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

// Props du composant client pour la liste des saisies
interface SaisiesListClientProps {
  // Liste initiale de toutes les saisies (depuis le serveur)
  initialSaisies: SaisieData[];
}

// Composant client pour afficher la liste des saisies avec recherche et filtres
// Gère le filtrage côté client pour une recherche instantanée
export function SaisiesListClient({ initialSaisies }: SaisiesListClientProps) {
  // État local pour les saisies filtrées
  // Initialisé avec toutes les saisies au chargement
  const [filteredSaisies, setFilteredSaisies] = useState<SaisieData[]>(initialSaisies);

  // Fonction de callback appelée par SearchFilters quand les filtres changent
  // Met à jour l'état local avec les saisies filtrées
  const handleFilterChange = (filtered: Array<{
    id: string;
    numeroChassis: string;
    marque: string;
    nomConducteur: string;
    statut: StatutSaisie;
  }>) => {
    // Crée un Set des IDs filtrés pour une recherche rapide
    const filteredIds = new Set(filtered.map((s) => s.id));
    
    // Filtre les saisies complètes en gardant seulement celles qui sont dans le Set
    const fullFilteredSaisies = initialSaisies.filter((saisie) =>
      filteredIds.has(saisie.id)
    );
    
    // Met à jour l'état avec les saisies filtrées complètes
    setFilteredSaisies(fullFilteredSaisies);
  };

  return (
    <div className="space-y-6">
      {/* Composant de recherche et filtres */}
      <SearchFilters
        saisies={initialSaisies.map((s) => ({
          id: s.id,
          numeroChassis: s.numeroChassis,
          marque: s.marque,
          nomConducteur: s.nomConducteur,
          statut: s.statut,
        }))}
        onFilterChange={handleFilterChange}
      />

      {/* Carte blanche avec tableau des saisies filtrées */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredSaisies.length === 0 ? (
          // État vide : message centré avec bouton d'action
          <div className="p-12 text-center">
            <p className="text-slate-600 mb-4">Aucune saisie trouvée</p>
            <Link
              href="/dashboard/saisies/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              Créer une nouvelle saisie
            </Link>
          </div>
        ) : (
          // Tableau épuré des saisies filtrées
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* En-têtes du tableau avec fond gris très clair */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Numéro Châssis
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Véhicule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Conducteur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Délai
                  </th>
                </tr>
              </thead>
              {/* Corps du tableau avec lignes alternées */}
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredSaisies.map((saisie) => (
                  <tr
                    key={saisie.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* Numéro de châssis (lien vers les détails) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {saisie.numeroChassis}
                      </Link>
                    </td>
                    {/* Informations du véhicule (Marque + Modèle) */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="block"
                      >
                        <div className="text-sm font-medium text-slate-800">
                          {saisie.marque} {saisie.modele}
                        </div>
                        {saisie.immatriculation && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            {saisie.immatriculation}
                          </div>
                        )}
                      </Link>
                    </td>
                    {/* Informations du conducteur */}
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="block"
                      >
                        <div className="text-sm text-slate-800">
                          {saisie.nomConducteur}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {saisie.telephoneConducteur}
                        </div>
                      </Link>
                    </td>
                    {/* Date de saisie */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="block"
                      >
                        <span className="text-sm text-slate-800">
                          {new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(saisie.dateSaisie).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </Link>
                    </td>
                    {/* Statut avec badge coloré et alerte légale */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusBadge statut={saisie.statut} />
                        <AlerteBadge dateSaisie={saisie.dateSaisie} />
                      </div>
                    </td>
                    {/* Compteur de délai avec règles visuelles */}
                    <td className="px-6 py-4">
                      <DelaiCounterCompact dateSaisie={saisie.dateSaisie} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

