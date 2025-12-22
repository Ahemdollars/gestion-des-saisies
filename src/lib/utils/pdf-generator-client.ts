import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface pour les données de saisie à exporter
interface SaisieData {
  numeroChassis: string;
  marque: string;
  modele: string;
  dateSaisie: Date | string;
  statut: string;
}

/**
 * Génère un PDF professionnel avec les données de saisies (côté client)
 * Contient un tableau récapitulatif et une ligne de signature
 * 
 * @param saisies - Tableau des saisies à exporter
 * @param annee - Année des saisies
 * @returns void - Télécharge le PDF automatiquement
 */
export function generateRapportPDFClient(
  saisies: SaisieData[],
  annee: number
): void {
  // Création d'une nouvelle instance de jsPDF en format A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Configuration des couleurs
  // Utilisation de tuples pour TypeScript (type [number, number, number])
  const primaryColor: [number, number, number] = [0, 51, 102]; // Bleu foncé (couleur Douanes)
  const secondaryColor: [number, number, number] = [200, 200, 200]; // Gris clair pour les bordures

  // En-tête du document avec logo et titre
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DOUANES MALI', 105, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('GESTION DES SAISIES', 105, 28, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Rapport Annuel ${annee}`, 105, 35, { align: 'center' });

  // Ligne de séparation
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  // Préparation des données pour le tableau
  const tableData = saisies.map((saisie) => {
    // Formatage de la date
    const dateObj =
      typeof saisie.dateSaisie === 'string'
        ? new Date(saisie.dateSaisie)
        : saisie.dateSaisie;
    const dateFormatee = dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // Formatage du statut (remplacer les underscores par des espaces)
    const statutFormate = saisie.statut.replace(/_/g, ' ');

    return [
      saisie.numeroChassis,
      saisie.marque,
      saisie.modele,
      dateFormatee,
      statutFormate,
    ];
  });

  // Ajout du tableau avec autoTable
  autoTable(doc, {
    head: [['N° Châssis', 'Marque', 'Modèle', 'Date de Saisie', 'Statut']],
    body: tableData.length > 0 ? tableData : [['Aucune saisie', '', '', '', '']],
    startY: 50,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 50, left: 20, right: 20 },
    theme: 'striped',
  });

  // Calcul de la position Y après le tableau
  const finalY = (doc as any).lastAutoTable.finalY || 100;

  // Ajout d'une ligne de séparation avant la signature
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 10, 190, finalY + 10);

  // Ligne de signature pour le Chef de Bureau
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Signature du Chef de Bureau', 105, finalY + 20, { align: 'center' });

  doc.setFontSize(9);
  doc.text('_________________________', 105, finalY + 30, { align: 'center' });

  // Pied de page avec date de génération
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Document généré le ${dateGeneration}`,
    105,
    280,
    { align: 'center' }
  );

  // Nom du fichier avec l'année
  const fileName = `Rapport_Saisies_${annee}_${new Date().toISOString().split('T')[0]}.pdf`;

  // Téléchargement du PDF
  doc.save(fileName);
}

