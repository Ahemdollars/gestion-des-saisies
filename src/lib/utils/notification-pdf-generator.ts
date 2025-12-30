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
 * - Logo à gauche (20mm), titre NOTIFICATION décalé à droite du logo
 * - Texte narratif EXACT avec pointillés pour remplissage manuel
 * - lineHeight: 1.8, justification sur 170mm
 * - Signatures avec 4cm d'espace
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
  const contentWidth = 170; // Largeur justifiée : 170mm
  
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

  // Bureau des Douanes de : avec pointillés pour remplissage (sur sa propre ligne avec espace)
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  const bureauLabel = 'Bureau des Douanes de :';
  doc.text(bureauLabel, margin, currentY);
  
  // Pointillés après le label
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

  // Espace après "Bureau des Douanes"
  currentY += 10;

  // ========== LOGO ET TITRE CENTRAL ==========
  
  // Logo officiel (bouclier bleu) à GAUCHE, à 20mm du bord
  const logoSize = 18; // Taille du logo en mm
  const logoX = margin; // 20mm du bord gauche
  const logoY = currentY; // Aligné avec le titre NOTIFICATION
  
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'PNG', logoX, logoY, logoSize, logoSize);
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du logo au PDF');
    }
  }
  
  // Titre "NOTIFICATION N°..." décalé à DROITE du logo pour ne jamais le toucher
  doc.setFontSize(14);
  doc.setFont('times', 'bold');
  doc.setTextColor(200, 0, 0); // ROUGE pour le titre
  const titreText = `NOTIFICATION N° ${notificationNumber} /DGD`;
  
  // Position du titre : à droite du logo avec espacement
  const logoRightEdge = logoX + logoSize;
  const titreX = logoRightEdge + 10; // 10mm d'espace après le logo
  doc.text(titreText, titreX, currentY + 5);
  
  // Soulignement du titre en ROUGE
  const titreWidth = doc.getTextWidth(titreText);
  doc.setDrawColor(200, 0, 0); // ROUGE pour la ligne de soulignement
  doc.setLineWidth(0.5);
  doc.line(titreX, currentY + 6, titreX + titreWidth, currentY + 6);
  
  currentY += 20;
  doc.setTextColor(0, 0, 0); // Retour au noir

  // ========== CORPS DU TEXTE NARRATIF (PHRASÉOLOGIE EXACTE) ==========
  
  // Police Serif (Times) pour tout le texte
  const fontSize = 10;
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');
  const lineHeight = fontSize * 1.8; // Hauteur de ligne (1.8x la taille de police) = 18mm
  
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


  // Ligne 1 : "L'an deux mil .............................. et le .............................."
  let text1 = 'L\'an deux mil ';
  doc.text(text1, margin, currentY);
  const text1Width = doc.getTextWidth(text1);
  const anneeDotsX = margin + text1Width + 2;
  const anneeDotsWidth = 50;
  drawDottedLine(doc, anneeDotsX, currentY, anneeDotsWidth);
  if (annee) {
    doc.text(annee.toString(), anneeDotsX, currentY);
  }
  
  let text1Part2 = ' et le ';
  const text1Part2X = anneeDotsX + anneeDotsWidth + 2;
  doc.text(text1Part2, text1Part2X, currentY);
  const text1Part2Width = doc.getTextWidth(text1Part2);
  const dateDotsX = text1Part2X + text1Part2Width;
  const dateDotsWidth = 50;
  drawDottedLine(doc, dateDotsX, currentY, dateDotsWidth);
  if (dateComplete) {
    doc.text(dateComplete, dateDotsX, currentY);
  }
  
  currentY += lineHeight;

  // Ligne 2 : "À la requête du Directeur Général des Douanes dont le bureau est à Bamako, lequel fait élection de domicile au Bureau de Monsieur le Chef de Bureau de .................................................. chargé des poursuites aux fins du présent."
  let text2 = 'À la requête du Directeur Général des Douanes dont le bureau est à Bamako, lequel fait élection de domicile au Bureau de Monsieur le Chef de Bureau de ';
  const text2Lines = doc.splitTextToSize(text2, contentWidth);
  text2Lines.forEach((line: string, index: number) => {
    if (index === text2Lines.length - 1) {
      // Dernière ligne : ajouter les pointillés pour le bureau
      doc.text(line, margin, currentY);
      const lineWidth = doc.getTextWidth(line);
      const bureauDotsX2 = margin + lineWidth + 2;
      const bureauDotsWidth2 = 60;
      drawDottedLine(doc, bureauDotsX2, currentY, bureauDotsWidth2);
      if (bureau) {
        doc.text(bureau, bureauDotsX2, currentY);
      }
      const text2End = ' chargé des poursuites aux fins du présent.';
      doc.text(text2End, bureauDotsX2 + bureauDotsWidth2 + 2, currentY);
    } else {
      doc.text(line, margin, currentY, { align: 'justify', maxWidth: contentWidth });
    }
    currentY += lineHeight;
  });

  // Ligne 3 : "Nous soussignés .......................................................................... (Noms, Prénoms, Grades)"
  let text3 = 'Nous soussignés ';
  doc.text(text3, margin, currentY);
  const text3Width = doc.getTextWidth(text3);
  const agentDotsX = margin + text3Width + 2;
  const agentDotsWidth = 80;
  drawDottedLine(doc, agentDotsX, currentY, agentDotsWidth);
  if (agent) {
    doc.text(agent, agentDotsX, currentY);
  }
  const text3End = ' (Noms, Prénoms, Grades)';
  doc.text(text3End, agentDotsX + agentDotsWidth + 2, currentY);
  currentY += lineHeight;

  // Ligne 4 : "tous en service au Bureau de .................................................. et y demeurant, certifions ce qui suit :"
  let text4 = 'tous en service au Bureau de ';
  doc.text(text4, margin, currentY);
  const text4Width = doc.getTextWidth(text4);
  const bureauDotsX3 = margin + text4Width + 2;
  const bureauDotsWidth3 = 60;
  drawDottedLine(doc, bureauDotsX3, currentY, bureauDotsWidth3);
  if (bureau) {
    doc.text(bureau, bureauDotsX3, currentY);
  }
  const text4End = ' et y demeurant, certifions ce qui suit :';
  doc.text(text4End, bureauDotsX3 + bureauDotsWidth3 + 2, currentY);
  currentY += lineHeight;

  // Ligne 5 : "Nous adressant à Mme/Mlle/Mr ......................................................................................"
  let text5 = 'Nous adressant à Mme/Mlle/Mr ';
  doc.text(text5, margin, currentY);
  const text5Width = doc.getTextWidth(text5);
  const destinataireDotsX = margin + text5Width + 2;
  const destinataireDotsWidth = 100;
  drawDottedLine(doc, destinataireDotsX, currentY, destinataireDotsWidth);
  // Pas de données de destinataire, on laisse vide
  currentY += lineHeight;

  // Ligne 6 : "à (heures) ............................ lieu/ville ou quartier ........................................................"
  let text6 = 'à (heures) ';
  doc.text(text6, margin, currentY);
  const text6Width = doc.getTextWidth(text6);
  const heuresDotsX = margin + text6Width + 2;
  const heuresDotsWidth = 40;
  drawDottedLine(doc, heuresDotsX, currentY, heuresDotsWidth);
  
  let text6Part2 = ' lieu/ville ou quartier ';
  const text6Part2X = heuresDotsX + heuresDotsWidth + 2;
  doc.text(text6Part2, text6Part2X, currentY);
  const text6Part2Width = doc.getTextWidth(text6Part2);
  const lieuDotsX = text6Part2X + text6Part2Width;
  const lieuDotsWidth = 80;
  drawDottedLine(doc, lieuDotsX, currentY, lieuDotsWidth);
  // Pas de données de lieu/heure, on laisse vide
  currentY += lineHeight;

  // Ligne 7 : "lui ou leur notifions la saisie du ...................................................................................."
  let text7 = 'lui ou leur notifions la saisie du ';
  doc.text(text7, margin, currentY);
  const text7Width = doc.getTextWidth(text7);
  const saisieDotsX = margin + text7Width + 2;
  const saisieDotsWidth = 100;
  drawDottedLine(doc, saisieDotsX, currentY, saisieDotsWidth);
  // Pas de données spécifiques, on laisse vide
  currentY += lineHeight;

  // Ligne 8 : "Marque .................... Modèle .................... Puissance/Cylindrée .................... 1ère année de mise en circulation ...................."
  let text8 = 'Marque ';
  doc.text(text8, margin, currentY);
  const text8Width = doc.getTextWidth(text8);
  const marqueDotsX = margin + text8Width + 2;
  const marqueDotsWidth = 30;
  drawDottedLine(doc, marqueDotsX, currentY, marqueDotsWidth);
  if (marque) {
    doc.text(marque, marqueDotsX, currentY);
  }
  
  let text8Part2 = ' Modèle ';
  const text8Part2X = marqueDotsX + marqueDotsWidth + 2;
  doc.text(text8Part2, text8Part2X, currentY);
  const text8Part2Width = doc.getTextWidth(text8Part2);
  const modeleDotsX = text8Part2X + text8Part2Width;
  const modeleDotsWidth = 30;
  drawDottedLine(doc, modeleDotsX, currentY, modeleDotsWidth);
  if (modele) {
    doc.text(modele, modeleDotsX, currentY);
  }
  
  let text8Part3 = ' Puissance/Cylindrée ';
  const text8Part3X = modeleDotsX + modeleDotsWidth + 2;
  doc.text(text8Part3, text8Part3X, currentY);
  const text8Part3Width = doc.getTextWidth(text8Part3);
  const puissanceDotsX = text8Part3X + text8Part3Width;
  const puissanceDotsWidth = 30;
  drawDottedLine(doc, puissanceDotsX, currentY, puissanceDotsWidth);
  
  let text8Part4 = ' 1ère année de mise en circulation ';
  const text8Part4X = puissanceDotsX + puissanceDotsWidth + 2;
  doc.text(text8Part4, text8Part4X, currentY);
  const text8Part4Width = doc.getTextWidth(text8Part4);
  const anneeCirculationDotsX = text8Part4X + text8Part4Width;
  const anneeCirculationDotsWidth = 30;
  drawDottedLine(doc, anneeCirculationDotsX, currentY, anneeCirculationDotsWidth);
  currentY += lineHeight;

  // Ligne 9 : "conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes."
  const text9 = 'conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes.';
  const text9Lines = doc.splitTextToSize(text9, contentWidth);
  text9Lines.forEach((line: string) => {
    doc.text(line, margin, currentY, { align: 'justify', maxWidth: contentWidth });
    currentY += lineHeight;
  });

  // Ligne 10 : "avec sommation de nous suivre au bureau pour assister à la rédaction du procès-verbal, copie du présent acte lui a été remise."
  const text10 = 'avec sommation de nous suivre au bureau pour assister à la rédaction du procès-verbal, copie du présent acte lui a été remise.';
  const text10Lines = doc.splitTextToSize(text10, contentWidth);
  text10Lines.forEach((line: string) => {
    doc.text(line, margin, currentY, { align: 'justify', maxWidth: contentWidth });
    currentY += lineHeight;
  });

  // ========== BAS DE PAGE : SIGNATURES (DEUX COLONNES) ==========
  
  // Zone de signature GAUCHE : "Le/la Contrevenant(e)"
  const signatureY = pageHeight - margin - 60; // Position avec espace pour signatures
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Le/la Contrevenant(e)', margin, signatureY);
  
  // Espace de 4cm (40mm) pour la signature
  const signatureSpace = 40;
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
  const qrY = pageHeight - margin - 25; // Position tout en bas
  
  // Ajout du QR Code au PDF
  doc.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize);

  // Téléchargement automatique du PDF
  const fileName = `Notification_Saisie_${saisie.numeroChassis}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
