import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

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
  statut: string; // Statut de la saisie pour le QR Code (requis)
  agent: {
    prenom: string;
    nom: string;
  };
}

/**
 * Génère un QR Code pour une saisie
 * Le QR Code contient le numéro de châssis et le statut pour vérification rapide
 * 
 * @param numeroChassis - Numéro de châssis du véhicule
 * @param statut - Statut actuel de la saisie
 * @returns Promise<string> - URL de l'image du QR Code en base64
 */
async function generateQRCode(numeroChassis: string, statut: string): Promise<string> {
  // Données encodées dans le QR Code : format JSON pour faciliter la lecture
  const qrData = JSON.stringify({
    chassis: numeroChassis,
    statut: statut,
    timestamp: new Date().toISOString(),
  });

  // Génération du QR Code en format base64 (image PNG)
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 60, // Taille du QR Code en pixels (60x60)
    margin: 1,
    color: {
      dark: '#000000', // Couleur des modules (noir)
      light: '#FFFFFF', // Couleur de fond (blanc)
    },
  });

  return qrCodeDataUrl;
}

/**
 * Génère un PDF de notification officielle "3 volets"
 * Format : Volet Propriétaire, Volet Véhicule, Souche Guichet Unique
 * Séparés par des pointillés comme stipulé dans le cahier des charges
 * Chaque volet contient un QR Code pour vérification rapide
 * 
 * @param saisie - Données de la saisie à inclure dans la notification
 */
export async function generateNotificationPDF(saisie: SaisieNotificationData): Promise<void> {
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

  // Génération du QR Code une seule fois pour tous les volets
  // Le QR Code contient le numéro de châssis et le statut pour vérification rapide
  const qrCodeImage = await generateQRCode(saisie.numeroChassis, saisie.statut);

  // Fonction pour générer un volet complet avec QR Code
  // Accède à qrCodeImage depuis la portée parente
  const generateVolet = (
    startY: number,
    title: string,
    qrCodeImage: string, // QR Code passé en paramètre pour chaque volet
    isLast: boolean = false
  ) => {
    let currentY = startY;

    // En-tête avec logo "Douanes Mali" et titre
    // Logo centré en haut de chaque volet
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 139); // Bleu marine pour le logo
    doc.text('DOUANES MALI', pageWidth / 2, currentY, { align: 'center' });
    currentY += 7;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Noir pour le reste
    doc.text('GUICHET UNIQUE - GESTION DES SAISIES', pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;

    // Titre du volet avec description selon le cahier des charges
    // Format : "VOLET X : NOM (Description de l'usage)"
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, currentY, { align: 'center' });
    currentY += 5;
    
    // Description de l'usage du volet (en italique, plus petit)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(80, 80, 80); // Gris foncé pour la description
    let description = '';
    if (title.includes('PROPRIÉTAIRE')) {
      description = '(Copie enregistrée remise à la personne à bord)';
    } else if (title.includes('VÉHICULE')) {
      description = '(Copie qui reste dans le véhicule jusqu\'à la sortie)';
    } else if (title.includes('SOUCHE GUICHET')) {
      description = '(Document de référence pour les PV et archives)';
    }
    if (description) {
      doc.text(description, pageWidth / 2, currentY, { align: 'center' });
      currentY += 5;
    }
    doc.setTextColor(0, 0, 0); // Retour au noir

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

    currentY += 3;

    // Mentions légales selon le motif de l'infraction
    // CONFORMITÉ CAHIER DES CHARGES : Affichage des articles de loi (Art. 296, 429, 432, 440)
    // Les articles 429 et 432 doivent TOUJOURS être affichés selon le cahier des charges
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100); // Gris pour les mentions légales
    doc.text('Références légales :', margin, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    // CONFORMITÉ CAHIER DES CHARGES : Mention explicite de l'Art. 296
    // "Conformément à l'Art. 296 du Code des Douanes (Délai de 90 jours)"
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(60, 60, 60); // Gris foncé pour la mention principale
    doc.text('Conformément à l\'Art. 296 du Code des Douanes (Délai de 90 jours)', margin, currentY);
    currentY += 5;
    
    // CONFORMITÉ : Les articles 429 et 432 sont TOUJOURS affichés sur le document
    // Conformément au cahier des charges des Douanes du Mali
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100); // Gris pour les autres articles
    const articlesLegaux: string[] = [
      'Art. 429 - Contrebande',
      'Art. 432 - Importation sans déclaration',
    ];
    
    // Ajout de l'article 440 si le motif concerne le dépassement de délai
    if (saisie.motifInfraction.includes('440') || saisie.motifInfraction.includes('Dépassement')) {
      articlesLegaux.push('Art. 440 - Dépassement de délai');
    }
    
    // Affichage de tous les articles légaux
    articlesLegaux.forEach((article) => {
      doc.text(`• ${article}`, margin + 5, currentY);
      currentY += 3.5;
    });
    
    currentY += 3;
    doc.setTextColor(0, 0, 0); // Retour au noir pour le QR Code

    // QR Code de sécurité pour vérification instantanée de l'authenticité
    // CONFORMITÉ CAHIER DES CHARGES : QR Code présent sur chaque volet
    // Permet de vérifier instantanément l'authenticité de la saisie en scannant le document
    const qrSize = 22; // Taille du QR Code en mm (légèrement agrandi pour meilleure lisibilité)
    const qrX = pageWidth - margin - qrSize - 5; // Position X (à droite avec marge)
    const qrY = currentY; // Position Y (après les informations)
    
    // Ajout du QR Code au PDF
    doc.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize);
    
    // Label sous le QR Code avec mention de sécurité
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0); // Noir pour le label
    doc.text('QR Code', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(60, 60, 60); // Gris foncé pour la description
    doc.text('Vérification', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
    doc.text('authenticité', qrX + qrSize / 2, qrY + qrSize + 7, { align: 'center' });

    currentY += qrSize + 8;

    // Ligne de signature
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Signature et cachet du Chef de Bureau', margin, currentY);
    doc.text('Date : _______________', pageWidth - margin - qrSize - 15, currentY);
    currentY += 8;

    // Ligne pointillée de séparation (sauf pour le dernier volet)
    if (!isLast) {
      drawDottedLine(currentY);
    }

    return currentY;
  };

  // Génération des 3 volets selon la procédure officielle des Douanes du Mali
  // CONFORMITÉ CAHIER DES CHARGES : 3 documents identiques sur une page A4
  // Format fidèle au carnet de notification officiel
  let startY = margin + 10;
  
  // Volet 1 : PROPRIÉTAIRE (Document 1)
  // CONFORMITÉ : Copie enregistrée remise à la personne à bord
  startY = generateVolet(startY, 'VOLET PROPRIÉTAIRE (Document 1)', qrCodeImage, false);
  startY += 5;

  // Volet 2 : VÉHICULE (Document 2)
  // CONFORMITÉ : Copie qui reste dans le véhicule jusqu'à la sortie
  startY = generateVolet(startY, 'VOLET VÉHICULE (Document 2)', qrCodeImage, false);
  startY += 5;

  // Volet 3 : SOUCHE GUICHET (Document 3)
  // CONFORMITÉ : Document de référence pour les PV et archives
  generateVolet(startY, 'VOLET SOUCHE GUICHET (Document 3)', qrCodeImage, true);

  // Téléchargement automatique du PDF
  const fileName = `Notification_Saisie_${saisie.numeroChassis}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

