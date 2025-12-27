import jsPDF from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

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
  lieuSaisie: string; // Utilisé comme nom du bureau des Douanes
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
 * Charge une image depuis le système de fichiers (pour le logo)
 * Note: En environnement client, on utilise le chemin public
 */
async function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Impossible de créer le contexte canvas'));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Dessine une ligne pointillée horizontale
 * @param doc - Instance jsPDF
 * @param x - Position X de départ
 * @param y - Position Y
 * @param width - Largeur de la ligne
 * @param color - Couleur des pointillés (par défaut gris clair pour rester visibles sous le texte)
 */
function drawDottedLine(doc: jsPDF, x: number, y: number, width: number, color: [number, number, number] = [150, 150, 150]): void {
  const dashLength = 1.5; // Longueur de chaque point
  const gapLength = 1; // Espace entre les points
  let currentX = x;
  
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.3);
  
  while (currentX < x + width) {
    const endX = Math.min(currentX + dashLength, x + width);
    doc.line(currentX, y, endX, y);
    currentX += dashLength + gapLength;
  }
}

/**
 * Génère un PDF de notification officielle
 * CONFORMITÉ DOCUMENT PHYSIQUE : Reproduit EXACTEMENT le document physique (image_93bb26.jpg)
 * 
 * Format : UN SEUL exemplaire par page A4 avec marges de 20mm
 * 
 * Style officiel (Copie conforme du document physique) :
 * - Police Serif (Times New Roman) EXCLUSIVEMENT
 * - En-tête double colonne : Gauche (MINISTERE.../DIRECTION.../Bureau...) / Droite (REPUBLIQUE.../Devise)
 * - Logo (bouclier bleu) SOUS "Bureau des Douanes", aligné horizontalement avec "NOTIFICATION"
 * - Titre central : "NOTIFICATION N° [NUMERO] /DGD" en ROUGE, GRAS, SOULIGNÉ
 * - Texte narratif avec pointillés pour remplissage manuel
 * - Données connues écrites par-dessus les pointillés (pointillés restent visibles)
 * - Bas de page : Deux colonnes de signature avec 3cm d'espace
 * - QR Code très petit (15mm) tout en bas au centre
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
  const margin = 20; // Marges de 20mm partout
  const contentWidth = pageWidth - (margin * 2);
  
  // Génération du numéro de notification basé sur l'ID de la saisie ou le numéro de châssis
  // Format : NOTIFICATION N° [NUMERO] /DGD
  const notificationNumber = saisie.id 
    ? saisie.id.substring(0, 8).toUpperCase() 
    : saisie.numeroChassis.substring(0, 8).toUpperCase();
  
  // Génération du QR Code
  const qrCodeImage = await generateQRCode(saisie.numeroChassis, saisie.statut);

  // Chargement du logo officiel (bouclier bleu)
  let logoImage: string | null = null;
  try {
    logoImage = await loadImage('/images/logo-douanes.png');
  } catch (error) {
    console.warn('Impossible de charger le logo, continuation sans logo');
  }

  // Utilisation EXCLUSIVE de la police Serif (Times New Roman)
  doc.setFont('times', 'normal');

  let currentY = margin;

  // ========== EN-TÊTE OFFICIEL (DOUBLE COLONNE) ==========
  
  // Colonne GAUCHE
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('MINISTERE DE L\'ECONOMIE ET DES FINANCES', margin, currentY);
  currentY += 4;

  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('DIRECTION GENERALE DES DOUANES', margin, currentY);
  currentY += 4;

  // Bureau des Douanes de : avec pointillés pour remplissage
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  const bureauLabel = 'Bureau des Douanes de :';
  doc.text(bureauLabel, margin, currentY);
  
  // Pointillés après le label (si le bureau est fourni, on l'écrit par-dessus)
  const bureauLabelWidth = doc.getTextWidth(bureauLabel);
  const bureauDotsWidth = contentWidth - bureauLabelWidth - 5;
  const bureauDotsX = margin + bureauLabelWidth + 2;
  
  // Dessine les pointillés
  drawDottedLine(doc, bureauDotsX, currentY, bureauDotsWidth);
  
  // Écrit le nom du bureau par-dessus les pointillés si disponible
  if (saisie.lieuSaisie) {
    doc.setFontSize(8);
    doc.setFont('times', 'normal');
    doc.text(saisie.lieuSaisie, bureauDotsX, currentY);
  }
  
  // Colonne DROITE
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  const republiqueText = 'REPUBLIQUE DU MALI';
  const republiqueWidth = doc.getTextWidth(republiqueText);
  doc.text(republiqueText, pageWidth - margin - republiqueWidth, margin);
  
  // Un Peuple - Un But - Une Foi
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  const deviseText = 'Un Peuple - Un But - Une Foi';
  const deviseWidth = doc.getTextWidth(deviseText);
  doc.text(deviseText, pageWidth - margin - deviseWidth, margin + 4);

  // Position pour le logo : SOUS "Bureau des Douanes", aligné avec le titre NOTIFICATION
  currentY += 8;
  const logoY = currentY; // Le logo sera aligné horizontalement avec le titre NOTIFICATION

  // ========== LOGO ET TITRE CENTRAL ==========
  
  // Logo officiel (bouclier bleu) SOUS "Bureau des Douanes", aligné avec "NOTIFICATION"
  const logoSize = 18; // Taille du logo en mm
  if (logoImage) {
    try {
      // Position du logo : à gauche, aligné verticalement avec le titre NOTIFICATION
      doc.addImage(logoImage, 'PNG', margin, logoY - 2, logoSize, logoSize);
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du logo au PDF');
    }
  }
  
  // Titre central : "NOTIFICATION N° [NUMERO] /DGD" en ROUGE, GRAS, SOULIGNÉ
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.setTextColor(200, 0, 0); // ROUGE pour le titre
  const titreText = `NOTIFICATION N° ${notificationNumber} /DGD`;
  doc.text(titreText, pageWidth / 2, currentY, { align: 'center' });
  
  // Soulignement du titre en ROUGE
  const titreWidth = doc.getTextWidth(titreText);
  const titreX = (pageWidth - titreWidth) / 2;
  doc.setDrawColor(200, 0, 0); // ROUGE pour la ligne de soulignement
  doc.setLineWidth(0.5);
  doc.line(titreX, currentY + 1, titreX + titreWidth, currentY + 1);
  
  currentY += 15;
  doc.setTextColor(0, 0, 0); // Retour au noir

  // ========== CORPS DU TEXTE NARRATIF AVEC POINTILLÉS ==========
  
  // Police Serif (Times) pour tout le texte
  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  
  // Formatage de la date selon le modèle officiel
  const dateSaisie = new Date(saisie.dateSaisie);
  const jour = dateSaisie.getDate();
  const moisComplet = dateSaisie.toLocaleDateString('fr-FR', { month: 'long' });
  const mois = moisComplet.charAt(0).toUpperCase() + moisComplet.slice(1);
  const annee = dateSaisie.getFullYear();
  const dateComplete = `${jour} ${mois}`;
  
  // Variables pour le texte narratif
  const bureau = saisie.lieuSaisie;
  const agent = `${saisie.agent.prenom} ${saisie.agent.nom}`;
  const marque = saisie.marque;
  const modele = saisie.modele;
  const chassis = saisie.numeroChassis;
  const immat = saisie.immatriculation || '';
  const conducteur = saisie.nomConducteur;
  const telephone = saisie.telephoneConducteur;

  // Ligne 1 : "L'an deux mil [pointillés] et le [pointillés]"
  let line1 = 'L\'an deux mil ';
  doc.text(line1, margin, currentY);
  const line1Width = doc.getTextWidth(line1);
  const anneeDotsX = margin + line1Width;
  const anneeDotsWidth = 40;
  drawDottedLine(doc, anneeDotsX, currentY, anneeDotsWidth);
  if (annee) {
    doc.text(annee.toString(), anneeDotsX, currentY);
  }
  
  let line1Part2 = ' et le ';
  const line1Part2X = anneeDotsX + anneeDotsWidth + 2;
  doc.text(line1Part2, line1Part2X, currentY);
  const line1Part2Width = doc.getTextWidth(line1Part2);
  const dateDotsX = line1Part2X + line1Part2Width;
  const dateDotsWidth = 50;
  drawDottedLine(doc, dateDotsX, currentY, dateDotsWidth);
  if (dateComplete) {
    doc.text(dateComplete, dateDotsX, currentY);
  }
  
  currentY += 6;

  // Ligne 2 : "À la requête du Directeur Général des Douanes dont le bureau est à Bamako..."
  const line2 = 'À la requête du Directeur Général des Douanes dont le bureau est à Bamako, lequel fait élection de domicile au Bureau de Monsieur le Chef de Bureau de ';
  const line2Lines = doc.splitTextToSize(line2, contentWidth);
  line2Lines.forEach((line: string) => {
    doc.text(line, margin, currentY);
    currentY += 5;
  });
  
  // Suite avec pointillés pour le bureau
  const bureauDotsWidth2 = 60;
  drawDottedLine(doc, margin, currentY, bureauDotsWidth2);
  if (bureau) {
    doc.text(bureau, margin, currentY);
  }
  
  const line2End = ', chargé des poursuites aux fins du présent.';
  doc.text(line2End, margin + bureauDotsWidth2 + 2, currentY);
  currentY += 6;

  // Ligne 3 : "Nous soussignés [pointillés] (Noms, Prénoms, Grades)"
  let line3 = 'Nous soussignés ';
  doc.text(line3, margin, currentY);
  const line3Width = doc.getTextWidth(line3);
  const agentDotsX = margin + line3Width;
  const agentDotsWidth = contentWidth - line3Width - 5;
  drawDottedLine(doc, agentDotsX, currentY, agentDotsWidth);
  if (agent) {
    doc.text(agent, agentDotsX, currentY);
  }
  
  const line3End = ' (Noms, Prénoms, Grades)';
  doc.text(line3End, agentDotsX + agentDotsWidth + 2, currentY);
  currentY += 6;

  // Ligne 4 : "certifions ce qui suit : Notifions la saisie du véhicule"
  const line4 = 'certifions ce qui suit : Notifions la saisie du véhicule ';
  doc.text(line4, margin, currentY);
  currentY += 6;

  // Ligne 5 : "Marque [pointillés] Modèle [pointillés] Puissance [pointillés]"
  let line5 = 'Marque ';
  doc.text(line5, margin, currentY);
  const line5Width = doc.getTextWidth(line5);
  const marqueDotsX = margin + line5Width;
  const marqueDotsWidth = 40;
  drawDottedLine(doc, marqueDotsX, currentY, marqueDotsWidth);
  if (marque) {
    doc.text(marque, marqueDotsX, currentY);
  }
  
  let line5Part2 = ' Modèle ';
  const line5Part2X = marqueDotsX + marqueDotsWidth + 2;
  doc.text(line5Part2, line5Part2X, currentY);
  const line5Part2Width = doc.getTextWidth(line5Part2);
  const modeleDotsX = line5Part2X + line5Part2Width;
  const modeleDotsWidth = 40;
  drawDottedLine(doc, modeleDotsX, currentY, modeleDotsWidth);
  if (modele) {
    doc.text(modele, modeleDotsX, currentY);
  }
  
  let line5Part3 = ' Puissance ';
  const line5Part3X = modeleDotsX + modeleDotsWidth + 2;
  doc.text(line5Part3, line5Part3X, currentY);
  const line5Part3Width = doc.getTextWidth(line5Part3);
  const puissanceDotsX = line5Part3X + line5Part3Width;
  const puissanceDotsWidth = 30;
  drawDottedLine(doc, puissanceDotsX, currentY, puissanceDotsWidth);
  // Pas de données de puissance disponibles, on laisse vide
  
  currentY += 6;

  // Ligne 6 : "Châssis [pointillés] immatriculé [pointillés]"
  let line6 = 'Châssis ';
  doc.text(line6, margin, currentY);
  const line6Width = doc.getTextWidth(line6);
  const chassisDotsX = margin + line6Width;
  const chassisDotsWidth = 50;
  drawDottedLine(doc, chassisDotsX, currentY, chassisDotsWidth);
  if (chassis) {
    doc.text(chassis, chassisDotsX, currentY);
  }
  
  let line6Part2 = ' immatriculé ';
  const line6Part2X = chassisDotsX + chassisDotsWidth + 2;
  doc.text(line6Part2, line6Part2X, currentY);
  const line6Part2Width = doc.getTextWidth(line6Part2);
  const immatDotsX = line6Part2X + line6Part2Width;
  const immatDotsWidth = 40;
  drawDottedLine(doc, immatDotsX, currentY, immatDotsWidth);
  if (immat) {
    doc.text(immat, immatDotsX, currentY);
  }
  
  currentY += 6;

  // Ligne 7 : "conduit par [pointillés] (Tél: [pointillés])"
  let line7 = 'conduit par ';
  doc.text(line7, margin, currentY);
  const line7Width = doc.getTextWidth(line7);
  const conducteurDotsX = margin + line7Width;
  const conducteurDotsWidth = 50;
  drawDottedLine(doc, conducteurDotsX, currentY, conducteurDotsWidth);
  if (conducteur) {
    doc.text(conducteur, conducteurDotsX, currentY);
  }
  
  let line7Part2 = ' (Tél: ';
  const line7Part2X = conducteurDotsX + conducteurDotsWidth + 2;
  doc.text(line7Part2, line7Part2X, currentY);
  const line7Part2Width = doc.getTextWidth(line7Part2);
  const telDotsX = line7Part2X + line7Part2Width;
  const telDotsWidth = 30;
  drawDottedLine(doc, telDotsX, currentY, telDotsWidth);
  if (telephone) {
    doc.text(telephone, telDotsX, currentY);
  }
  
  doc.text(')', telDotsX + telDotsWidth + 2, currentY);
  currentY += 6;

  // Ligne 8 : "conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes."
  const line8 = 'conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes.';
  const line8Lines = doc.splitTextToSize(line8, contentWidth);
  line8Lines.forEach((line: string) => {
    doc.text(line, margin, currentY);
    currentY += 5;
  });
  
  currentY += 10;

  // ========== BAS DE PAGE : SIGNATURES (DEUX COLONNES) ==========
  
  // Zone de signature GAUCHE : "Le/la Contrevenant(e)"
  const signatureY = pageHeight - margin - 50; // Position avec espace pour signatures
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Le/la Contrevenant(e)', margin, signatureY);
  
  // Espace de 3cm (30mm) pour la signature
  const signatureSpace = 30;
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text('Signature :', margin, signatureY + signatureSpace);
  
  // Zone de signature DROITE : "Le Chef de Poste/Escouade des douanes"
  const signatureRightText = 'Le Chef de Poste/Escouade des douanes';
  const signatureRightWidth = doc.getTextWidth(signatureRightText);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(signatureRightText, pageWidth - margin - signatureRightWidth, signatureY);
  
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text('Signature :', pageWidth - margin - signatureRightWidth, signatureY + signatureSpace);

  // ========== QR CODE DE SÉCURITÉ (TRÈS PETIT, TOUT EN BAS AU CENTRE) ==========
  
  // QR Code très petit (15mm) tout en bas au centre
  const qrSize = 15;
  const qrX = pageWidth / 2 - qrSize / 2; // Centré horizontalement
  const qrY = pageHeight - margin - 20; // Position tout en bas
  
  // Ajout du QR Code au PDF
  doc.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize);

  // Téléchargement automatique du PDF
  const fileName = `Notification_Saisie_${saisie.numeroChassis}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
