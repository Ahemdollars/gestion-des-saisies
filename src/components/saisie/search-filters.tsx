'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { StatutSaisie } from '@prisma/client';

// Interface pour les props du composant de recherche et filtres
interface SearchFiltersProps {
  // Liste de toutes les saisies à filtrer (pour la recherche côté client)
  // Cette référence est stable grâce à useMemo dans le parent
  saisies: Array<{
    id: string;
    numeroChassis: string;
    marque: string;
    nomConducteur: string;
    statut: StatutSaisie;
  }>;
  // Valeur actuelle de la recherche textuelle (contrôlée par le parent)
  searchQuery: string;
  // Statut sélectionné actuel (contrôlé par le parent)
  selectedStatut: StatutSaisie | 'TOUS';
  // Fonction de callback stable pour mettre à jour la recherche et le statut
  // Utilise useCallback dans le parent pour éviter les re-créations
  onSearchChange: (query: string, statut: StatutSaisie | 'TOUS') => void;
}

// Composant client pour la recherche et les filtres
// Permet de filtrer la liste des saisies en temps réel par :
// - Numéro de Châssis
// - Nom du conducteur
// - Marque du véhicule
// - Statut (dropdown)
// Optimisé pour éviter les boucles infinies en utilisant des props contrôlées
export function SearchFilters({ 
  saisies, 
  searchQuery, 
  selectedStatut, 
  onSearchChange 
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Calcul du nombre de résultats filtrés pour l'affichage
  // Utilise une fonction locale pour éviter les dépendances dans useMemo
  const getFilteredCount = () => {
    let result = [...saisies];

    // Filtre par recherche textuelle (insensible à la casse)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((saisie) => {
        const chassisMatch = saisie.numeroChassis.toLowerCase().includes(query);
        const conducteurMatch = saisie.nomConducteur.toLowerCase().includes(query);
        const marqueMatch = saisie.marque.toLowerCase().includes(query);
        return chassisMatch || conducteurMatch || marqueMatch;
      });
    }

    // Filtre par statut sélectionné
    if (selectedStatut !== 'TOUS') {
      result = result.filter((saisie) => saisie.statut === selectedStatut);
    }

    return result.length;
  };

  const filteredCount = getFilteredCount();

  // Mise à jour de l'URL avec le paramètre statut quand il change
  // Permet de partager l'URL filtrée et de conserver le filtre au rafraîchissement
  // OPTIMISATION : Utilise useMemo pour éviter les re-créations de l'URL
  useEffect(() => {
    // Récupération du statut actuel dans l'URL pour éviter les boucles
    const currentStatutInUrl = searchParams.get('statut');
    const currentStatutValue = currentStatutInUrl === selectedStatut ? currentStatutInUrl : null;
    
    // Ne mettre à jour l'URL que si le statut a réellement changé
    if (currentStatutValue !== selectedStatut) {
      const params = new URLSearchParams(searchParams.toString());
      
      if (selectedStatut === 'TOUS') {
        // Supprime le paramètre statut si "TOUS" est sélectionné
        params.delete('statut');
      } else {
        // Ajoute ou met à jour le paramètre statut
        params.set('statut', selectedStatut);
      }

      // Mise à jour de l'URL sans recharger la page
      // Utilise replace pour éviter d'ajouter des entrées à l'historique
      router.replace(`/dashboard/saisies?${params.toString()}`, { scroll: false });
    }
    // Dépendances limitées : seulement selectedStatut et router
    // searchParams n'est pas dans les dépendances pour éviter les boucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatut, router]);

  // Fonction pour réinitialiser tous les filtres
  const handleResetFilters = () => {
    onSearchChange('', 'TOUS');
    router.replace('/dashboard/saisies', { scroll: false });
  };

  // Gestion du changement de recherche textuelle
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value, selectedStatut);
  };

  // Gestion du changement de statut
  const handleStatutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSearchChange(searchQuery, e.target.value as StatutSaisie | 'TOUS');
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
              onChange={handleSearchChange}
              placeholder="Châssis, conducteur ou marque..."
              className="w-full pl-10 pr-4 py-2.5 text-slate-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          {/* Indicateur du nombre de résultats trouvés */}
          {(searchQuery || selectedStatut !== 'TOUS') && (
            <p className="mt-1.5 text-xs text-slate-500">
              {filteredCount} résultat{filteredCount > 1 ? 's' : ''} trouvé{filteredCount > 1 ? 's' : ''}
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
            onChange={handleStatutChange}
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

