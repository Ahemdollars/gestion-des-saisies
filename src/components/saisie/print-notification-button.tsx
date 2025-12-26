'use client';

import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { generateNotificationPDF } from '@/lib/utils/notification-pdf-generator';
import toast from 'react-hot-toast';

// Interface pour les données d'une saisie nécessaires à la notification
interface SaisieNotificationData {
  id?: string; // ID de la saisie pour générer le numéro de notification
  numeroChassis: string;
  marque: string;
  modele: string;
  typeVehicule: string;
  immatriculation: string | null;
  nomConducteur: string;
  telephoneConducteur: string;
  motifInfraction: string;
  lieuSaisie: string;
  dateSaisie: Date;
  statut: string; // Statut de la saisie pour le QR Code
  agent: {
    prenom: string;
    nom: string;
  };
}

// Props du composant bouton d'impression
interface PrintNotificationButtonProps {
  saisie: SaisieNotificationData;
}

// Composant client pour générer et télécharger la notification PDF "3 volets"
// Affiche un bouton avec état de chargement et notifications toast
export function PrintNotificationButton({ saisie }: PrintNotificationButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Gestion de la génération du PDF
   * Affiche un toast de chargement, génère le PDF, puis un toast de succès
   */
  const handlePrint = async () => {
    try {
      // Activation de l'état de chargement
      setIsGenerating(true);
      
      // Affichage d'une notification de chargement
      toast.loading('Génération de la notification en cours...', { id: 'print-notification' });

      // Génération du PDF (fonction asynchrone car elle génère des QR codes)
      // On utilise setTimeout pour permettre au toast de s'afficher
      setTimeout(async () => {
        try {
          // Génération du PDF avec QR codes (fonction asynchrone)
          await generateNotificationPDF(saisie);
          
          // Notification de succès
          toast.success('Notification générée avec succès', { id: 'print-notification' });
        } catch (error) {
          console.error('Erreur lors de la génération du PDF:', error);
          toast.error('Erreur lors de la génération de la notification', { id: 'print-notification' });
        } finally {
          setIsGenerating(false);
        }
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Une erreur est survenue lors de la génération');
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Génération...</span>
        </>
      ) : (
        <>
          <Printer className="h-4 w-4" />
          <span>Imprimer la Notification</span>
        </>
      )}
    </button>
  );
}

