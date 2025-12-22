import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Interface pour les données d'une saisie nécessaires à la notification
interface SaisieNotificationData {
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
  agent: {
    prenom: string;
    nom: string;
  };
}

/**
 * Génère un PDF de notification officielle "3 volets"
 * Format : Volet Propriétaire, Volet Véhicule, Souche Guichet
 * Séparés par des pointillés comme stipulé dans le cahier des charges
 * 
 * @param saisie - Données de la saisie à inclure dans la notification
 */
export function generateNotificationPDF(saisie: SaisieNotificationData): void {
  // Création d'un nouveau document PDF en format A4 (portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Dimensions de la page A4
  const pageWidth = 210; // mm
  const pageHeight = 297; // mm
  const margin = 15; // Marges en mm
  const contentWidth = pageWidth - (margin * 2);
  
  // Hauteur de chaque volet (environ 1/3 de la page moins les marges)
  const voletHeight = (pageHeight - (margin * 4)) / 3;

  // Fonction pour dessiner une ligne pointillée horizontale
  const drawDottedLine = (y: number) => {
    const dashLength = 3; // Longueur de chaque tiret
    const gapLength = 2; // Espace entre les tirets
    let x = margin;
    
    while (x < pageWidth - margin) {
      doc.line(x, y, Math.min(x + dashLength, pageWidth - margin), y);
      x += dashLength + gapLength;
    }
  };

  // Fonction pour générer un volet complet
  const generateVolet = (
    startY: number,
    title: string,
    isLast: boolean = false
  ) => {
    let currentY = startY;

    // En-tête avec logo et titre
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DOUANES MALI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('GUICHET UNIQUE - GESTION DES SAISIES', pageWidth / 2, currentY, { align: 'center' });
    currentY += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 8;

    // Ligne de séparation
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;

    // Informations du véhicule
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DU VÉHICULE', margin, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    const vehiculeInfo = [
      ['Numéro de châssis', saisie.numeroChassis],
      ['Marque', saisie.marque],
      ['Modèle', saisie.modele],
      ['Type', saisie.typeVehicule],
      ['Immatriculation', saisie.immatriculation || 'N/A'],
    ];

    vehiculeInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} :`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      const textWidth = doc.getTextWidth(value);
      if (textWidth > contentWidth - 60) {
        // Texte trop long, on le divise en plusieurs lignes
        const lines = doc.splitTextToSize(value, contentWidth - 60);
        doc.text(lines[0], margin + 50, currentY);
        currentY += 5;
        for (let i = 1; i < lines.length; i++) {
          doc.text(lines[i], margin + 50, currentY);
          currentY += 5;
        }
      } else {
        doc.text(value, margin + 50, currentY);
        currentY += 5;
      }
    });

    currentY += 3;

    // Informations du conducteur
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DU CONDUCTEUR', margin, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    const conducteurInfo = [
      ['Nom complet', saisie.nomConducteur],
      ['Téléphone', saisie.telephoneConducteur],
    ];

    conducteurInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} :`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(value, margin + 50, currentY);
      currentY += 5;
    });

    currentY += 3;

    // Informations de la saisie
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS DE LA SAISIE', margin, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    const saisieInfo = [
      ['Motif de l\'infraction', saisie.motifInfraction],
      ['Lieu de saisie', saisie.lieuSaisie],
      ['Date de saisie', new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })],
      ['Agent responsable', `${saisie.agent.prenom} ${saisie.agent.nom}`],
    ];

    saisieInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label} :`, margin, currentY);
      doc.setFont('helvetica', 'normal');
      const textWidth = doc.getTextWidth(value);
      if (textWidth > contentWidth - 60) {
        const lines = doc.splitTextToSize(value, contentWidth - 60);
        doc.text(lines[0], margin + 50, currentY);
        currentY += 5;
        for (let i = 1; i < lines.length; i++) {
          doc.text(lines[i], margin + 50, currentY);
          currentY += 5;
        }
      } else {
        doc.text(value, margin + 50, currentY);
        currentY += 5;
      }
    });

    currentY += 5;

    // Ligne de signature
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Signature et cachet du Chef de Bureau', margin, currentY);
    doc.text('Date : _______________', pageWidth - margin - 40, currentY);
    currentY += 8;

    // Ligne pointillée de séparation (sauf pour le dernier volet)
    if (!isLast) {
      drawDottedLine(currentY);
    }

    return currentY;
  };

  // Génération des 3 volets
  let startY = margin + 10;
  
  // Volet 1 : Propriétaire
  startY = generateVolet(startY, 'VOLET PROPRIÉTAIRE', false);
  startY += 5;

  // Volet 2 : Véhicule
  startY = generateVolet(startY, 'VOLET VÉHICULE', false);
  startY += 5;

  // Volet 3 : Souche Guichet
  generateVolet(startY, 'SOUCHE GUICHET', true);

  // Téléchargement automatique du PDF
  const fileName = `Notification_Saisie_${saisie.numeroChassis}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

