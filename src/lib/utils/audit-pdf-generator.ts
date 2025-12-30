import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface pour les données de log d'audit à exporter
// Toutes les valeurs sont garanties d'être des strings, jamais null
interface AuditLogData {
  dateAction: Date | string;
  user: {
    nom: string;
    prenom: string;
    email: string;
    role: string;
  }; // user n'est jamais null, toujours un objet avec des valeurs par défaut
  action: string; // Toujours une string, jamais null
  details: string; // Toujours une string, jamais null
}

/**
 * Génère un PDF professionnel avec les logs d'audit (côté client)
 * Contient un tableau récapitulatif avec les colonnes Date, Utilisateur, Action et Détails
 * 
 * @param auditLogs - Tableau des logs d'audit à exporter
 * @param auditorName - Nom de l'auditeur qui génère le rapport
 * @param userFilter - Filtre utilisateur appliqué (optionnel)
 * @param actionFilter - Filtre action appliqué (optionnel)
 * @returns void - Télécharge le PDF automatiquement
 */
export function generateAuditPDFClient(
  auditLogs: AuditLogData[],
  auditorName: string,
  userFilter?: string,
  actionFilter?: string
): void {
  // Création d'une nouvelle instance de jsPDF en format A4
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Configuration des couleurs officielles
  const primaryColor: [number, number, number] = [0, 51, 102]; // Bleu foncé (couleur Douanes)
  const secondaryColor: [number, number, number] = [200, 200, 200]; // Gris clair pour les bordures

  // Formatage de la date de génération
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // MÉTADONNÉES EN HAUT À DROITE (petit texte)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const pageWidth = doc.internal.pageSize.width;
  doc.text(`Date : ${dateGeneration}`, pageWidth - 20, 15, { align: 'right' });
  doc.text(`Auditeur : ${auditorName}`, pageWidth - 20, 20, { align: 'right' });

  // EN-TÊTE OFFICIEL CENTRÉ
  doc.setFontSize(18);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRECTION GÉNÉRALE DES DOUANES DU MALI', 105, 30, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('JOURNAL D\'AUDIT', 105, 38, { align: 'center' });

  // LIGNE HORIZONTALE ÉPAISSE SOUS L'EN-TÊTE
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(1.5); // Ligne épaisse
  doc.line(20, 42, 190, 42);

  // Affichage des filtres appliqués si présents (sous la ligne épaisse)
  let filterInfo = '';
  if (userFilter && userFilter.trim()) {
    filterInfo += `Filtre utilisateur : ${userFilter.trim()}`;
  }
  if (actionFilter && actionFilter.trim()) {
    if (filterInfo) filterInfo += ' | ';
    filterInfo += `Filtre action : ${actionFilter.trim()}`;
  }
  
  let startY = 48; // Position de départ du tableau
  if (filterInfo) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text(filterInfo, 105, 48, { align: 'center' });
    startY = 52; // Ajuster la position si filtres présents
  }

  // Préparation des données pour le tableau
  const tableData = auditLogs.map((log) => {
    // Formatage de la date
    const dateObj =
      typeof log.dateAction === 'string'
        ? new Date(log.dateAction)
        : log.dateAction;
    const dateFormatee = dateObj.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Formatage de l'utilisateur
    // user n'est jamais null grâce à la normalisation dans audit-export.actions.ts
    const utilisateur = log.user.email
      ? `${log.user.prenom} ${log.user.nom} (${log.user.email})`
      : `${log.user.prenom} ${log.user.nom}`.trim() || 'Utilisateur supprimé';

    // Formatage de l'action (remplacer les underscores par des espaces)
    const actionFormatee = log.action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    // Limitation de la longueur des détails pour éviter les cellules trop larges
    const detailsLimites = log.details.length > 80 
      ? log.details.substring(0, 77) + '...' 
      : log.details;

    return [
      dateFormatee,
      utilisateur,
      actionFormatee,
      detailsLimites,
    ];
  });

  // Ajout du tableau avec autoTable (thème striped pour lignes alternées)
  autoTable(doc, {
    head: [['Date', 'Utilisateur', 'Action', 'Détails']],
    body: tableData.length > 0 ? tableData : [['Aucun log', '', '', '']],
    startY: startY + 5,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [0, 0, 0],
      overflow: 'linebreak',
      cellWidth: 'wrap',
      font: 'helvetica', // Police helvetica pour le tableau
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      font: 'helvetica',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Gris clair pour lignes alternées
    },
    columnStyles: {
      0: { cellWidth: 35, font: 'helvetica' }, // Date
      1: { cellWidth: 50, font: 'helvetica' }, // Utilisateur
      2: { cellWidth: 40, font: 'helvetica' }, // Action
      3: { cellWidth: 65, font: 'helvetica' }, // Détails
    },
    margin: { top: startY + 5, left: 20, right: 20 },
    theme: 'striped', // Thème striped pour lignes alternées grises
    didDrawPage: function (data: any) {
      // Callback pour ajouter le pied de page sur chaque page
      const pageCount = doc.getNumberOfPages();
      const pageHeight = doc.internal.pageSize.height;
      
      // Numérotation de page (ex: "Page 1 sur 5")
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${data.pageNumber} sur ${pageCount}`,
        pageWidth - 20,
        pageHeight - 15,
        { align: 'right' }
      );
      
      // Mention officielle en bas de page
      doc.text(
        'Document généré automatiquement par le Système de Gestion des Saisies',
        105,
        pageHeight - 10,
        { align: 'center' }
      );
    },
  });

  // Calcul de la position Y après le tableau sur la dernière page
  let finalY = (doc as any).lastAutoTable.finalY || 100;
  const pageHeight = doc.internal.pageSize.height;

  // Vérifier s'il y a assez d'espace pour les statistiques et la signature
  // Sinon, créer une nouvelle page
  if (finalY > pageHeight - 40) {
    doc.addPage();
    finalY = 20;
  }

  // Statistiques du rapport
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Total des logs exportés : ${auditLogs.length}`,
    105,
    finalY + 10,
    { align: 'center' }
  );

  // Ligne de séparation avant la signature
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, finalY + 15, 190, finalY + 15);

  // Ligne de signature pour l'auditeur
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Signature de l\'auditeur', 105, finalY + 25, { align: 'center' });

  doc.setFontSize(9);
  doc.text('_________________________', 105, finalY + 32, { align: 'center' });

  // Nom du fichier avec la date
  const dateFile = new Date().toISOString().split('T')[0];
  const fileName = `Journal_Audit_${dateFile}_${Date.now()}.pdf`;

  // Téléchargement du PDF
  doc.save(fileName);
}

