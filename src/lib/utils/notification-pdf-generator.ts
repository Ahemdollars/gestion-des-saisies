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
function drawDottedLine(doc: jsPDF, x: number, y: number, width: number, color: [number, number, number] = [180, 180, 180]): void {
  const dashLength = 2; // Longueur de chaque point
  const gapLength = 1.5; // Espace entre les points
  let currentX = x;
  
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.setLineWidth(0.2); // Ligne plus fine pour ne pas masquer le texte
  
  while (currentX < x + width) {
    const endX = Math.min(currentX + dashLength, x + width);
    doc.line(currentX, y, endX, y);
    currentX += dashLength + gapLength;
  }
}

/**
 * Dessine un champ avec pointillés et texte dynamique
 * Utilise splitTextToSize pour gérer le retour à la ligne automatique
 * @param doc - Instance jsPDF
 * @param x - Position X de départ
 * @param y - Position Y (baseline)
 * @param width - Largeur disponible pour le texte
 * @param text - Texte à afficher (peut être vide)
 * @param maxDotsWidth - Largeur maximale des pointillés
 * @returns Nouvelle position Y après le texte (pour gérer les retours à la ligne)
 */
function drawDottedField(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  text: string,
  maxDotsWidth: number
): number {
  // Dessine d'abord les pointillés sur toute la largeur disponible
  const dotsWidth = Math.min(maxDotsWidth, width);
  drawDottedLine(doc, x, y, dotsWidth);
  
  // Si du texte est fourni, l'afficher par-dessus les pointillés avec gestion du retour à la ligne
  if (text && text.trim()) {
    // Utilise splitTextToSize pour gérer les retours à la ligne automatiques
    const textLines = doc.splitTextToSize(text, dotsWidth - 2); // -2mm de marge pour éviter le débordement
    
    // Affiche chaque ligne de texte
    textLines.forEach((line: string, index: number) => {
      doc.text(line, x + 1, y - (index * 4), { maxWidth: dotsWidth - 2 });
    });
    
    // Retourne la nouvelle position Y si plusieurs lignes
    return y + (textLines.length > 1 ? (textLines.length - 1) * 4 : 0);
  }
  
  return y;
}

/**
 * Génère un PDF de notification officielle
 * FIDÉLITÉ ABSOLUE : Reproduit EXACTEMENT le document physique (image_afe75e.jpg)
 * 
 * Format : UN SEUL exemplaire par page A4 avec marges de 20mm
 * 
 * Règles strictes :
 * - lineHeight: 2.0 (ZÉRO CHEVAUCHEMENT)
 * - splitTextToSize pour TOUS les champs dynamiques (text wrapping)
 * - Texte affiché "sur" les pointillés sans masquage
 * - Police Serif (Times New Roman) EXCLUSIVEMENT
 * - Structure identique au document physique
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
  currentY += 10; // Espacement minimal de 10mm entre chaque bloc

  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('DIRECTION GENERALE DES DOUANES', margin, currentY);
  currentY += 10;

  // Bureau des Douanes de : avec pointillés pour remplissage (sur sa propre ligne avec espace)
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  const bureauLabel = 'Bureau des Douanes de :';
  doc.text(bureauLabel, margin, currentY);
  
  // Pointillés après le label avec gestion du texte dynamique
  const bureauLabelWidth = doc.getTextWidth(bureauLabel);
  const bureauDotsX = margin + bureauLabelWidth + 2;
  const bureauDotsWidth = contentWidth - bureauLabelWidth - 5;
  
  // Utilise drawDottedField pour gérer le retour à la ligne si nécessaire
  const bureauText = saisie.lieuSaisie || '';
  const newY = drawDottedField(doc, bureauDotsX, currentY, bureauDotsWidth, bureauText, bureauDotsWidth);
  currentY = Math.max(currentY, newY) + 10; // Espacement minimal de 10mm après avec marge de sécurité
  
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
  doc.text(deviseText, pageWidth - margin - deviseWidth, margin + 10);

  // Espace après "Bureau des Douanes" pour le logo et le titre
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
    
  currentY += 10; // Espacement minimal de 10mm après le titre
  doc.setTextColor(0, 0, 0); // Retour au noir

  // ========== CORPS DU TEXTE NARRATIF (PHRASÉOLOGIE EXACTE) ==========
  
  // Police Serif (Times) pour tout le texte
  const fontSize = 10;
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');
  const lineHeight = fontSize * 2.0; // Hauteur de ligne STRICTE : 2.0x (20mm) - ZÉRO CHEVAUCHEMENT
    
    // Formatage de la date selon le modèle officiel
    const dateSaisie = new Date(saisie.dateSaisie);
    const jour = dateSaisie.getDate();
    const moisComplet = dateSaisie.toLocaleDateString('fr-FR', { month: 'long' });
    const mois = moisComplet.charAt(0).toUpperCase() + moisComplet.slice(1);
    const annee = dateSaisie.getFullYear();
    const dateComplete = `${jour} ${mois}`;
    
  // Variables pour le texte narratif (normalisées pour éviter les valeurs null)
  const bureau = saisie.lieuSaisie || '';
  const agent = `${saisie.agent.prenom || ''} ${saisie.agent.nom || ''}`.trim();
  const marque = saisie.marque || '';
  const modele = saisie.modele || '';
  const chassis = saisie.numeroChassis || '';
  const immat = saisie.immatriculation || '';
  const conducteur = saisie.nomConducteur || '';
  const telephone = saisie.telephoneConducteur || '';
  const motif = saisie.motifInfraction || '';

  // Ligne 1 : "L'an deux mil .............................. et le .............................."
  // CORRECTION : Déplacer le point de départ X vers la droite (x: 80) pour éviter le chevauchement avec le logo
  const text1StartX = 80; // Position X décalée pour laisser l'espace libre au logo à gauche
  let text1 = 'L\'an deux mil ';
  doc.text(text1, text1StartX, currentY);
  const text1Width = doc.getTextWidth(text1);
  const anneeDotsX = text1StartX + text1Width + 2;
  const anneeDotsWidth = 50;
  
  // Dessine les pointillés et le texte avec gestion du retour à la ligne
  const anneeText = annee ? annee.toString() : '';
  const anneeY = drawDottedField(doc, anneeDotsX, currentY, anneeDotsWidth, anneeText, anneeDotsWidth);
  
  let text1Part2 = ' et le ';
  const text1Part2X = anneeDotsX + anneeDotsWidth + 5; // Espacement augmenté
  doc.text(text1Part2, text1Part2X, currentY);
  const text1Part2Width = doc.getTextWidth(text1Part2);
  const dateDotsX = text1Part2X + text1Part2Width + 2;
  const dateDotsWidth = 50;
  
  const dateY = drawDottedField(doc, dateDotsX, currentY, dateDotsWidth, dateComplete, dateDotsWidth);
  currentY = Math.max(currentY, Math.max(anneeY, dateY)) + lineHeight; // Utilise le maximum pour gérer les retours à la ligne

  // Ligne 2 : "À la requête du Directeur Général des Douanes dont le bureau est à Bamako, lequel fait élection de domicile au Bureau de Monsieur le Chef de Bureau de .................................................. chargé des poursuites aux fins du présent."
  let text2 = 'À la requête du Directeur Général des Douanes dont le bureau est à Bamako, lequel fait élection de domicile au Bureau de Monsieur le Chef de Bureau de ';
  const text2Lines = doc.splitTextToSize(text2, contentWidth);
  
  text2Lines.forEach((line: string, index: number) => {
    if (index === text2Lines.length - 1) {
      // Dernière ligne : ajouter les pointillés pour le bureau avec gestion du retour à la ligne
      doc.text(line, margin, currentY);
      const lineWidth = doc.getTextWidth(line);
      const bureauDotsX2 = margin + lineWidth + 2;
      const bureauDotsWidth2 = Math.min(60, contentWidth - lineWidth - 10);
      
      // Utilise drawDottedField pour gérer le retour à la ligne
      const bureauY = drawDottedField(doc, bureauDotsX2, currentY, bureauDotsWidth2, bureau, bureauDotsWidth2);
      
      const text2End = ' chargé des poursuites aux fins du présent.';
      const endX = bureauDotsX2 + bureauDotsWidth2 + 5;
      const endLines = doc.splitTextToSize(text2End, contentWidth - (endX - margin));
      endLines.forEach((endLine: string, endIndex: number) => {
        doc.text(endLine, endX, currentY + (endIndex * 4), { maxWidth: contentWidth - (endX - margin) });
      });
      
      currentY = Math.max(currentY, bureauY) + lineHeight;
    } else {
      doc.text(line, margin, currentY, { align: 'justify', maxWidth: contentWidth });
      currentY += lineHeight;
    }
  });

  // Ligne 3 : "Nous soussignés .......................................................................... (Noms, Prénoms, Grades)"
  let text3 = 'Nous soussignés ';
  doc.text(text3, margin, currentY);
  const text3Width = doc.getTextWidth(text3);
  const agentDotsX = margin + text3Width + 2;
  const agentDotsWidth = Math.min(80, contentWidth - text3Width - 10);
  
  // Utilise drawDottedField pour gérer le retour à la ligne si le nom est long
  const agentY = drawDottedField(doc, agentDotsX, currentY, agentDotsWidth, agent, agentDotsWidth);
  
  const text3End = ' (Noms, Prénoms, Grades)';
  const text3EndX = agentDotsX + agentDotsWidth + 5;
  doc.text(text3End, text3EndX, currentY);
  
  currentY = Math.max(currentY, agentY) + lineHeight;

  // Ligne 4 : "tous en service au Bureau de .................................................. et y demeurant, certifions ce qui suit :"
  let text4 = 'tous en service au Bureau de ';
  doc.text(text4, margin, currentY);
  const text4Width = doc.getTextWidth(text4);
  const bureauDotsX3 = margin + text4Width + 2;
  const bureauDotsWidth3 = Math.min(60, contentWidth - text4Width - 10);
  
  // Utilise drawDottedField pour gérer le retour à la ligne
  const bureauY3 = drawDottedField(doc, bureauDotsX3, currentY, bureauDotsWidth3, bureau, bureauDotsWidth3);
  
  const text4End = ' et y demeurant, certifions ce qui suit :';
  const text4EndX = bureauDotsX3 + bureauDotsWidth3 + 5;
  const text4EndLines = doc.splitTextToSize(text4End, contentWidth - (text4EndX - margin));
  text4EndLines.forEach((endLine: string, endIndex: number) => {
    doc.text(endLine, text4EndX, currentY + (endIndex * 4), { maxWidth: contentWidth - (text4EndX - margin) });
  });
  
  currentY = Math.max(currentY, bureauY3) + lineHeight;

  // Ligne 5 : "Nous adressant à Mme/Mlle/Mr ......................................................................................"
  let text5 = 'Nous adressant à Mme/Mlle/Mr ';
  doc.text(text5, margin, currentY);
  const text5Width = doc.getTextWidth(text5);
  const destinataireDotsX = margin + text5Width + 2;
  const destinataireDotsWidth = Math.min(100, contentWidth - text5Width - 5);
  
  // Utilise drawDottedField pour gérer le retour à la ligne si le nom est long
  const destinataireText = conducteur || '';
  const destinataireY = drawDottedField(doc, destinataireDotsX, currentY, destinataireDotsWidth, destinataireText, destinataireDotsWidth);
  
  currentY = Math.max(currentY, destinataireY) + lineHeight;

  // Ligne 6 : "à (heures) ............................ lieu/ville ou quartier ........................................................"
  let text6 = 'à (heures) ';
  doc.text(text6, margin, currentY);
  const text6Width = doc.getTextWidth(text6);
  const heuresDotsX = margin + text6Width + 2;
  const heuresDotsWidth = 40;
  
  // Dessine les pointillés pour les heures (pas de données disponibles)
  drawDottedLine(doc, heuresDotsX, currentY, heuresDotsWidth);
  
  let text6Part2 = ' lieu/ville ou quartier ';
  const text6Part2X = heuresDotsX + heuresDotsWidth + 5;
  doc.text(text6Part2, text6Part2X, currentY);
  const text6Part2Width = doc.getTextWidth(text6Part2);
  const lieuDotsX = text6Part2X + text6Part2Width + 2;
  const lieuDotsWidth = Math.min(80, contentWidth - (lieuDotsX - margin) - 5);
  
  // Utilise drawDottedField pour gérer le retour à la ligne
  const lieuText = bureau || '';
  const lieuY = drawDottedField(doc, lieuDotsX, currentY, lieuDotsWidth, lieuText, lieuDotsWidth);
  
  currentY = Math.max(currentY, lieuY) + lineHeight;

  // Ligne 7 : "lui ou leur notifions la saisie du ...................................................................................."
  let text7 = 'lui ou leur notifions la saisie du ';
  doc.text(text7, margin, currentY);
  const text7Width = doc.getTextWidth(text7);
  const saisieDotsX = margin + text7Width + 2;
  const saisieDotsWidth = Math.min(100, contentWidth - text7Width - 5);
  
  // Utilise drawDottedField pour gérer le retour à la ligne
  const saisieText = `${saisie.typeVehicule || ''} ${chassis ? `(Châssis: ${chassis})` : ''}`.trim();
  const saisieY = drawDottedField(doc, saisieDotsX, currentY, saisieDotsWidth, saisieText, saisieDotsWidth);
  
  currentY = Math.max(currentY, saisieY) + lineHeight;

  // Ligne 8 : "Marque .................... Modèle .................... Puissance/Cylindrée .................... 1ère année de mise en circulation ...................."
  // CORRECTION : Utiliser splitTextToSize pour éviter la coupure du texte "1ère année de mise en circulation"
  let text8 = 'Marque ';
  doc.text(text8, margin, currentY);
  const text8Width = doc.getTextWidth(text8);
  const marqueDotsX = margin + text8Width + 2;
  const marqueDotsWidth = 30;
  
  // Utilise drawDottedField pour gérer le retour à la ligne
  const marqueY = drawDottedField(doc, marqueDotsX, currentY, marqueDotsWidth, marque, marqueDotsWidth);
  
  let text8Part2 = ' Modèle ';
  const text8Part2X = marqueDotsX + marqueDotsWidth + 5;
  doc.text(text8Part2, text8Part2X, currentY);
  const text8Part2Width = doc.getTextWidth(text8Part2);
  const modeleDotsX = text8Part2X + text8Part2Width + 2;
  const modeleDotsWidth = 30;
  
  // Utilise drawDottedField pour gérer le retour à la ligne
  const modeleY = drawDottedField(doc, modeleDotsX, currentY, modeleDotsWidth, modele, modeleDotsWidth);
  
  let text8Part3 = ' Puissance/Cylindrée ';
  const text8Part3X = modeleDotsX + modeleDotsWidth + 5;
  doc.text(text8Part3, text8Part3X, currentY);
  const text8Part3Width = doc.getTextWidth(text8Part3);
  const puissanceDotsX = text8Part3X + text8Part3Width + 2;
  const puissanceDotsWidth = 30;
  
  // Dessine les pointillés pour la puissance (pas de données disponibles)
  drawDottedLine(doc, puissanceDotsX, currentY, puissanceDotsWidth);
  
  // CORRECTION : Utiliser splitTextToSize pour "1ère année de mise en circulation" pour éviter la coupure
  let text8Part4 = ' 1ère année de mise en circulation ';
  const text8Part4X = puissanceDotsX + puissanceDotsWidth + 5;
  
  // Calcul de la largeur disponible restante
  const remainingWidth = contentWidth - (text8Part4X - margin);
  
  // Si le texte est trop long, utiliser splitTextToSize pour forcer un retour à la ligne
  const text8Part4Lines = doc.splitTextToSize(text8Part4, remainingWidth - 35); // -35 pour laisser de l'espace aux pointillés
  
  // Affiche le texte sur une ou plusieurs lignes
  text8Part4Lines.forEach((line: string, lineIndex: number) => {
    doc.text(line, text8Part4X, currentY + (lineIndex * lineHeight));
  });
  
  // Position des pointillés pour l'année de mise en circulation
  const anneeCirculationDotsX = text8Part4X + doc.getTextWidth(text8Part4Lines[text8Part4Lines.length - 1]) + 2;
  const anneeCirculationDotsWidth = Math.min(30, remainingWidth - doc.getTextWidth(text8Part4Lines[text8Part4Lines.length - 1]) - 5);
  
  // Dessine les pointillés pour l'année de mise en circulation (pas de données disponibles)
  drawDottedLine(doc, anneeCirculationDotsX, currentY + ((text8Part4Lines.length - 1) * lineHeight), anneeCirculationDotsWidth);
  
  // Utilise le maximum des Y pour gérer les retours à la ligne (prend en compte les lignes multiples de text8Part4)
  const maxText8Y = Math.max(marqueY, modeleY, currentY + ((text8Part4Lines.length - 1) * lineHeight));
  currentY = Math.max(currentY, maxText8Y) + lineHeight;

  // Espacement minimal de 10mm entre le corps du texte et les signatures
  currentY += 10;

  // ========== BAS DE PAGE : SIGNATURES (DEUX COLONNES CÔTE À CÔTE) ==========
  
  // CORRECTION : Déplacer les signatures tout en bas de la page (y: 250)
  const signatureY = 250; // Position fixe en bas de page selon spécification
  const signatureLeftX = margin; // X: 20mm (gauche)
  const signatureRightX = 120; // X: 120mm (droite)
  const signatureBlockWidth = 80; // Largeur de chaque bloc de signature
  
  // Zone de signature GAUCHE : "Le/la Contrevenant(e)"
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Le/la Contrevenant(e)', signatureLeftX, signatureY);
  
  // Ligne pour le nom/prénom (optionnel)
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  let signatureLeftBottomY = signatureY + 5;
  if (conducteur) {
    const conducteurLines = doc.splitTextToSize(`(Nom Prénom : ${conducteur})`, signatureBlockWidth);
    conducteurLines.forEach((line: string, index: number) => {
      doc.text(line, signatureLeftX, signatureLeftBottomY + (index * 4), { maxWidth: signatureBlockWidth });
    });
    signatureLeftBottomY += conducteurLines.length * 4;
  }
  
  // Espace de 15mm pour la signature physique
  const signatureSpace = 15;
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Signature :', signatureLeftX, signatureY + signatureSpace);
  
  // Zone de signature DROITE : "Le Chef de Poste/Escouade des douanes"
  const signatureRightText = 'Le Chef de Poste/Escouade des douanes';
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(signatureRightText, signatureRightX, signatureY);
  
  // Ligne pour le numéro matricule, nom et grade (optionnel)
  doc.setFontSize(8);
  doc.setFont('times', 'italic');
  let signatureRightBottomY = signatureY + 5;
  if (agent) {
    const agentLines = doc.splitTextToSize(`(N° Mle Nom et Grade : ${agent})`, signatureBlockWidth);
    agentLines.forEach((line: string, index: number) => {
      doc.text(line, signatureRightX, signatureRightBottomY + (index * 4), { maxWidth: signatureBlockWidth });
    });
    signatureRightBottomY += agentLines.length * 4;
  }
  
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.text('Signature :', signatureRightX, signatureY + signatureSpace);

  // Espacement minimal de 10mm entre le corps du texte et le bloc légal
  currentY += 10;

  // ========== BLOC LÉGAL ET FINAL (AVANT LES SIGNATURES) ==========
  
  // Ligne 9 : "conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes."
  // Utilise splitTextToSize avec maxWidth de 170mm pour forcer le retour à la ligne
  doc.setFontSize(fontSize);
  doc.setFont('times', 'normal');
  const text9 = 'conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes.';
  const text9Lines = doc.splitTextToSize(text9, contentWidth); // contentWidth = 170mm
  text9Lines.forEach((line: string) => {
    doc.text(line, margin, currentY, { align: 'justify', maxWidth: contentWidth });
    currentY += lineHeight;
  });

  // Espacement minimal de 10mm avant la sommation
  currentY += 10;

  // CORRECTION : Phrase de sommation complète et bien formatée
  // Ligne 10 : "avec sommation de nous suivre au bureau pour assister à la rédaction du procès-verbal, copie du présent acte lui a été remise."
  // Utilise splitTextToSize avec maxWidth de 170mm pour éviter le débordement
  const text10 = 'avec sommation de nous suivre au bureau pour assister à la rédaction du procès-verbal, copie du présent acte lui a été remise.';
  
  // Taille et position du QR code pour calculer la zone interdite
  const qrSize = 15; // mm
  const qrX = 170; // Position X du QR code (extrême droite selon spécification)
  const qrY = 270; // CORRECTION : Position Y du QR code (aligné avec la mention finale "remise" selon spécification)
  
  // Largeur sécurisée pour éviter le chevauchement avec le QR code
  // Le texte ne doit pas dépasser la position X du QR code (170mm)
  const safeTextWidth = qrX - margin - 5; // Largeur sécurisée : jusqu'au QR code
  
  // Utilise splitTextToSize avec la largeur sécurisée pour éviter le chevauchement
  const text10Lines = doc.splitTextToSize(text10, safeTextWidth);
  
  // Affiche chaque ligne de la sommation avec vérification de chevauchement
  text10Lines.forEach((line: string, index: number) => {
    const lineY = currentY + (index * lineHeight);
    
    // Si la ligne est trop basse et pourrait chevaucher le QR code verticalement
    if (lineY + 5 >= qrY) {
      // Décale le texte encore plus à gauche pour éviter le chevauchement
      const extraSafeWidth = qrX - margin - 10;
      const extraSafeLines = doc.splitTextToSize(line, extraSafeWidth);
      extraSafeLines.forEach((extraSafeLine: string, extraIndex: number) => {
        doc.text(extraSafeLine, margin, lineY + (extraIndex * lineHeight), { align: 'justify', maxWidth: extraSafeWidth });
      });
    } else {
      // Ligne normale, utilise la largeur sécurisée
      doc.text(line, margin, lineY, { align: 'justify', maxWidth: safeTextWidth });
    }
  });
  
  // Mise à jour de currentY après toutes les lignes de la sommation
  currentY += text10Lines.length * lineHeight;

  // Espacement avant les signatures
  currentY += 10;

  // ========== BAS DE PAGE : SIGNATURES (DEUX COLONNES CÔTE À CÔTE) ==========
  
  // CORRECTION : Les signatures sont déjà placées à y: 250 (défini plus haut)
  // Le code des signatures reste inchangé, seule la position Y a été modifiée plus haut

  // Calcul de la position Y après les signatures (utilise le maximum des deux blocs)
  const signatureBottomY = Math.max(signatureY + signatureSpace, Math.max(signatureLeftBottomY, signatureRightBottomY));

  // ========== QR CODE DE SÉCURITÉ (ANCRE DE SÉCURITÉ - BAS À DROITE) ==========
  
  // CORRECTION : QR Code placé à l'extrême droite, aligné sur la même ligne que la mention finale "remise"
  // Coordonnées : x: 170mm, y: 270mm (selon spécification)
  // Le QR code est aligné avec la dernière ligne de la sommation
  
  // Position finale du QR code (bas à droite, aligné avec "remise")
  const finalQrX = 170; // x: 170mm (extrême droite selon spécification)
  const finalQrY = 270; // CORRECTION : y: 270mm (aligné avec la mention finale "remise" selon spécification)
  
  // Ajout du QR Code au PDF (dernier élément, isolé, aligné avec "remise")
  doc.addImage(qrCodeImage, 'PNG', finalQrX, finalQrY, qrSize, qrSize);

  // Téléchargement automatique du PDF
  const fileName = `Notification_Saisie_${saisie.numeroChassis}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
