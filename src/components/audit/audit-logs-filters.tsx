'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';

// Interface pour les props du composant de filtres
interface AuditLogsFiltersProps {
  // Liste de tous les utilisateurs pour le dropdown
  users: Array<{
    id: string;
    nom: string;
    prenom: string;
    email: string;
  }>;
  // Liste de tous les types d'actions distincts
  actionTypes: string[];
  // Valeur actuelle du filtre utilisateur
  currentUserFilter: string;
  // Valeur actuelle du filtre action
  currentActionFilter: string;
}

// Composant client pour les filtres de recherche des logs d'audit
// Permet de filtrer par utilisateur ou par type d'action
export function AuditLogsFilters({
  users,
  actionTypes,
  currentUserFilter,
  currentActionFilter,
}: AuditLogsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // État local pour les valeurs des filtres
  // Initialisés avec les valeurs des searchParams
  const [userFilter, setUserFilter] = useState(currentUserFilter);
  const [actionFilter, setActionFilter] = useState(currentActionFilter);

  // Fonction pour appliquer les filtres et mettre à jour l'URL
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Réinitialise la page à 1 lors d'un nouveau filtre
    params.delete('page');

    // Ajoute ou supprime le filtre utilisateur
    if (userFilter.trim()) {
      params.set('user', userFilter.trim());
    } else {
      params.delete('user');
    }

    // Ajoute ou supprime le filtre action
    if (actionFilter.trim()) {
      params.set('action', actionFilter.trim());
    } else {
      params.delete('action');
    }

    // Mise à jour de l'URL avec les nouveaux filtres
    router.push(`/dashboard/audit?${params.toString()}`);
  };

  // Fonction pour réinitialiser tous les filtres
  const resetFilters = () => {
    setUserFilter('');
    setActionFilter('');
    router.push('/dashboard/audit');
  };

  // Fonction pour formater le label d'une action en texte lisible
  const formatActionLabel = (action: string): string => {
    // Remplace les underscores par des espaces et met en forme
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    // Carte blanche avec les filtres
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      {/* En-tête avec titre et bouton de réinitialisation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-600" />
          <h2 className="text-lg font-semibold text-slate-800">Filtres de Recherche</h2>
        </div>
        {/* Bouton pour réinitialiser tous les filtres */}
        {(userFilter || actionFilter) && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Grille responsive pour les champs de filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Champ de recherche par utilisateur */}
        <div className="relative">
          {/* Label du champ de recherche utilisateur */}
          <label
            htmlFor="user-filter"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Rechercher par utilisateur
          </label>
          {/* Input de recherche avec icône */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="user-filter"
              type="text"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              onKeyDown={(e) => {
                // Applique les filtres en appuyant sur Entrée
                if (e.key === 'Enter') {
                  applyFilters();
                }
              }}
              placeholder="Nom, prénom ou email..."
              className="w-full pl-10 pr-4 py-2.5 text-slate-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Dropdown de filtre par type d'action */}
        <div>
          {/* Label du filtre action */}
          <label
            htmlFor="action-filter"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Filtrer par type d'action
          </label>
          {/* Select pour choisir le type d'action */}
          <select
            id="action-filter"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              // Applique automatiquement le filtre lors du changement
              setTimeout(() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete('page');
                if (e.target.value) {
                  params.set('action', e.target.value);
                } else {
                  params.delete('action');
                }
                router.push(`/dashboard/audit?${params.toString()}`);
              }, 0);
            }}
            className="w-full px-4 py-2.5 text-slate-900 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">Tous les types d'actions</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {formatActionLabel(action)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bouton pour appliquer les filtres (si recherche textuelle) */}
      {userFilter && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={applyFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="h-4 w-4" />
            Appliquer les filtres
          </button>
        </div>
      )}
    </div>
  );
}

