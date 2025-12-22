'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { StatutSaisie } from '@prisma/client';

// Interface pour les props du composant de recherche et filtres
interface SearchFiltersProps {
  // Liste de toutes les saisies à filtrer (pour la recherche côté client)
  saisies: Array<{
    id: string;
    numeroChassis: string;
    marque: string;
    nomConducteur: string;
    statut: StatutSaisie;
  }>;
  // Fonction de callback pour retourner les saisies filtrées
  onFilterChange: (filteredSaisies: Array<{
    id: string;
    numeroChassis: string;
    marque: string;
    nomConducteur: string;
    statut: StatutSaisie;
  }>) => void;
}

// Composant client pour la recherche et les filtres
// Permet de filtrer la liste des saisies en temps réel par :
// - Numéro de Châssis
// - Nom du conducteur
// - Marque du véhicule
// - Statut (dropdown)
export function SearchFilters({ saisies, onFilterChange }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // État local pour la recherche textuelle (châssis, conducteur, marque)
  const [searchQuery, setSearchQuery] = useState('');
  
  // État local pour le filtre par statut
  // Récupère le statut depuis les searchParams s'il existe
  const [selectedStatut, setSelectedStatut] = useState<StatutSaisie | 'TOUS'>(
    (searchParams.get('statut') as StatutSaisie) || 'TOUS'
  );

  // Fonction pour obtenir le label lisible d'un statut
  const getStatutLabel = (statut: StatutSaisie | 'TOUS'): string => {
    const labels: Record<StatutSaisie | 'TOUS', string> = {
      TOUS: 'Tous les statuts',
      SAISI_EN_COURS: 'Saisi en cours',
      VALIDE_POUR_DEPOT: 'Validé pour dépôt',
      EN_DEPOT: 'En dépôt',
      SORTIE_AUTORISEE: 'Sortie autorisée',
      SORTIE_EFFECTUEE: 'Sortie effectuée',
      VENTE_ENCHERES: 'Vente aux enchères',
    };
    return labels[statut] || statut;
  };

  // Liste de tous les statuts disponibles pour le dropdown
  const statutsList: Array<StatutSaisie | 'TOUS'> = [
    'TOUS',
    'SAISI_EN_COURS',
    'VALIDE_POUR_DEPOT',
    'EN_DEPOT',
    'SORTIE_AUTORISEE',
    'SORTIE_EFFECTUEE',
    'VENTE_ENCHERES',
  ];

  // Filtrage en temps réel des saisies selon la recherche et le statut
  // Utilise useMemo pour optimiser les performances (recalcul uniquement si saisies, searchQuery ou selectedStatut changent)
  const filteredSaisies = useMemo(() => {
    let result = [...saisies];

    // Filtre par recherche textuelle (insensible à la casse)
    // Recherche dans : numéro de châssis, nom du conducteur, marque
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((saisie) => {
        // Recherche dans le numéro de châssis
        const chassisMatch = saisie.numeroChassis.toLowerCase().includes(query);
        // Recherche dans le nom du conducteur
        const conducteurMatch = saisie.nomConducteur.toLowerCase().includes(query);
        // Recherche dans la marque
        const marqueMatch = saisie.marque.toLowerCase().includes(query);
        
        // Retourne true si au moins un champ correspond
        return chassisMatch || conducteurMatch || marqueMatch;
      });
    }

    // Filtre par statut sélectionné
    if (selectedStatut !== 'TOUS') {
      result = result.filter((saisie) => saisie.statut === selectedStatut);
    }

    return result;
  }, [saisies, searchQuery, selectedStatut]);

  // Mise à jour de l'URL avec le paramètre statut quand il change
  // Permet de partager l'URL filtrée et de conserver le filtre au rafraîchissement
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (selectedStatut === 'TOUS') {
      // Supprime le paramètre statut si "TOUS" est sélectionné
      params.delete('statut');
    } else {
      // Ajoute ou met à jour le paramètre statut
      params.set('statut', selectedStatut);
    }

    // Mise à jour de l'URL sans recharger la page
    router.replace(`/dashboard/saisies?${params.toString()}`, { scroll: false });
  }, [selectedStatut, router, searchParams]);

  // Notification du parent quand les saisies filtrées changent
  // Permet au composant parent de mettre à jour l'affichage
  useEffect(() => {
    onFilterChange(filteredSaisies);
  }, [filteredSaisies, onFilterChange]);

  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatut('TOUS');
    router.replace('/dashboard/saisies', { scroll: false });
  };

  return (
    // Barre de recherche et filtres avec design premium
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      {/* En-tête avec titre et bouton de réinitialisation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Recherche et Filtres</h2>
        </div>
        {/* Bouton pour réinitialiser tous les filtres */}
        {(searchQuery || selectedStatut !== 'TOUS') && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Grille responsive pour les champs de recherche et filtre */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Champ de recherche textuelle */}
        <div className="relative">
          {/* Label du champ de recherche */}
          <label
            htmlFor="search-input"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Rechercher
          </label>
          {/* Input de recherche avec icône */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Châssis, conducteur ou marque..."
              className="w-full pl-10 pr-4 py-2.5 text-slate-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          {/* Indicateur du nombre de résultats trouvés */}
          {searchQuery && (
            <p className="mt-1.5 text-xs text-slate-500">
              {filteredSaisies.length} résultat{filteredSaisies.length > 1 ? 's' : ''} trouvé{filteredSaisies.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Dropdown de filtre par statut */}
        <div>
          {/* Label du filtre statut */}
          <label
            htmlFor="statut-filter"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Filtrer par statut
          </label>
          {/* Select pour choisir le statut */}
          <select
            id="statut-filter"
            value={selectedStatut}
            onChange={(e) => setSelectedStatut(e.target.value as StatutSaisie | 'TOUS')}
            className="w-full px-4 py-2.5 text-slate-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            {statutsList.map((statut) => (
              <option key={statut} value={statut}>
                {getStatutLabel(statut)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

