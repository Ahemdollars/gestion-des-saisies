'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

// Composant client pour sélectionner l'année des rapports
// Permet de basculer entre 2024 et 2025 (ou année en cours)
interface YearSelectorProps {
  currentYear: number;
}

export function YearSelector({ currentYear }: YearSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedYear = searchParams.get('annee')
    ? parseInt(searchParams.get('annee')!)
    : currentYear;

  /**
   * Gestion du changement d'année
   * Met à jour l'URL avec le paramètre d'année pour recharger les données
   */
  const handleYearChange = (year: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('annee', year.toString());
    router.push(`/dashboard/rapports?${params.toString()}`);
  };

  // Liste des années disponibles (2024 et 2025)
  const availableYears = [2024, 2025];

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-700">
        Année :
      </label>
      <div className="relative">
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(parseInt(e.target.value))}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
        >
          {availableYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}

