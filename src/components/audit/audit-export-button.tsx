'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FileDown, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAuditLogsForExport } from '@/lib/actions/audit-export.actions';
import { generateAuditPDFClient } from '@/lib/utils/audit-pdf-generator';

// Interface pour les props du composant
interface AuditExportButtonProps {
  auditorName: string;
}

// Composant client pour le bouton d'export PDF du Journal d'Audit
// Génère un PDF professionnel avec les logs d'audit filtrés
export function AuditExportButton({ auditorName }: AuditExportButtonProps) {
  const searchParams = useSearchParams();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Gestion de l'export PDF
   * Récupère les données via Server Action puis génère le PDF côté client
   * Respecte les filtres appliqués (utilisateur et action)
   */
  const handleExportPDF = async () => {
    // Récupération des filtres actuels depuis les searchParams
    const userFilter = searchParams.get('user') || undefined;
    const actionFilter = searchParams.get('action') || undefined;

    setIsExporting(true);

    try {
      // Affichage d'une notification de chargement
      toast.loading('Génération du PDF en cours...', { id: 'audit-pdf-export' });

      // Appel de la Server Action pour récupérer les données avec les filtres
      const result = await getAuditLogsForExport(userFilter, actionFilter);

      if (!result.success || !result.data) {
        // Affichage d'une notification d'erreur
        toast.error(result.error || 'Erreur lors de la récupération des données', {
          id: 'audit-pdf-export',
        });
        setIsExporting(false);
        return;
      }

      // Génération du PDF côté client avec les données récupérées
      generateAuditPDFClient(
        result.data,
        auditorName,
        userFilter,
        actionFilter
      );

      // Affichage d'une notification de succès
      toast.success('PDF généré avec succès !', { id: 'audit-pdf-export' });
    } catch (error) {
      // Gestion des erreurs inattendues
      console.error('Erreur lors de l\'export PDF:', error);
      toast.error('Une erreur inattendue est survenue', { id: 'audit-pdf-export' });
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

