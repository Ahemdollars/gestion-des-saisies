'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSaisiesForExport } from '@/lib/actions/pdf-export.actions';
import { generateRapportPDFClient } from '@/lib/utils/pdf-generator-client';

// Composant client pour le bouton d'export PDF
// Génère un PDF professionnel avec les données de saisies
export function ExportButton() {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Gestion de l'export PDF
   * Récupère les données via Server Action puis génère le PDF côté client
   */
  const handleExportPDF = async () => {
    // Récupération de l'année sélectionnée (par défaut année en cours)
    const annee = searchParams.get('annee')
      ? parseInt(searchParams.get('annee')!)
      : new Date().getFullYear();

    setIsExporting(true);

    try {
      // Affichage d'une notification de chargement
      toast.loading('Génération du PDF en cours...', { id: 'pdf-export' });

      // Appel de la Server Action pour récupérer les données
      const result = await getSaisiesForExport(annee);

      if (!result.success || !result.data) {
        // Affichage d'une notification d'erreur
        toast.error(result.error || 'Erreur lors de la récupération des données', {
          id: 'pdf-export',
        });
        setIsExporting(false);
        return;
      }

      // Génération du PDF côté client avec les données récupérées
      generateRapportPDFClient(result.data, annee);

      // Affichage d'une notification de succès
      toast.success('PDF généré avec succès !', { id: 'pdf-export' });
    } catch (error) {
      // Gestion des erreurs inattendues
      toast.error('Une erreur inattendue est survenue', { id: 'pdf-export' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExportPDF}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Génération...</span>
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          <span>Exporter en PDF</span>
        </>
      )}
    </button>
  );
}

