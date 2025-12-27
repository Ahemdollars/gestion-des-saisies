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
 * Génère un PDF de notification officielle
 * CONFORMITÉ DOCUMENT PHYSIQUE : Reproduit EXACTEMENT le document physique (image_93bb26.jpg)
 * 
 * Format : UN SEUL exemplaire par page A4
 * 
 * Style officiel (Copie conforme du document physique) :
 * - Police Serif (Times) pour tout le texte
 * - En-tête gauche : MINISTERE DE L'ECONOMIE ET DES FINANCES, DIRECTION GENERALE DES DOUANES, Bureau des Douanes de : [bureau]
 * - En-tête droite : REPUBLIQUE DU MALI, Un Peuple - Un But - Une Foi
 * - Logo officiel (bouclier bleu) à gauche, aligné avec le titre "NOTIFICATION"
 * - Titre central : "NOTIFICATION N° [NUMERO] /DGD" en ROUGE, gras et souligné
 * - Texte narratif continu : "L'an deux mil [Année] et le [Date]..."
 * - Articles intégrés : 64, 69, 254, 350, 354 et 355 du code des douanes
 * - Bas de page : Deux zones de signature (Le/la Contrevenant(e) à gauche, Le Chef de Poste/Escouade à droite)
 * - QR Code de sécurité discrètement en bas pour vérification numérique
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

  let currentY = margin;

  // ========== EN-TÊTE OFFICIEL ==========
  
  // En-tête gauche : MINISTERE DE L'ECONOMIE ET DES FINANCES
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('MINISTERE DE L\'ECONOMIE ET DES FINANCES', margin, currentY);
  currentY += 4;

  // DIRECTION GENERALE DES DOUANES
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('DIRECTION GENERALE DES DOUANES', margin, currentY);
  currentY += 4;

  // Bureau des Douanes de : [Nom du Bureau]
  doc.setFontSize(8);
  doc.setFont('times', 'normal');
  doc.text(`Bureau des Douanes de : ${saisie.lieuSaisie}`, margin, currentY);
  
  // En-tête droite : REPUBLIQUE DU MALI
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

  currentY += 8;

  // ========== LOGO ET TITRE CENTRAL ==========
  
  // Logo officiel (bouclier bleu) à gauche, aligné avec le titre "NOTIFICATION"
  const logoSize = 15; // Taille du logo en mm
  const logoY = currentY - 2; // Alignement vertical avec le titre
  if (logoImage) {
    try {
      doc.addImage(logoImage, 'PNG', margin, logoY, logoSize, logoSize);
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du logo au PDF');
    }
  }
  
  // Titre central : "NOTIFICATION N° [NUMERO] /DGD" en ROUGE, gras et souligné
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
  
  currentY += 12;
  doc.setTextColor(0, 0, 0); // Retour au noir

  // ========== CORPS DU TEXTE (NARRATIF INTÉGRAL) ==========
  
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
  const immat = saisie.immatriculation || 'non immatriculé';
  const conducteur = saisie.nomConducteur;
  const telephone = saisie.telephoneConducteur;
  
  // TEXTE NARRATIF CONTINU (pas de listes)
  // Conforme au document physique : texte fluide et continu
  const paragrapheNarratif = `L'an deux mil ${annee} et le ${dateComplete}, À la requête du Directeur Général des Douanes dont le bureau est à Bamako, lequel fait élection de domicile au Bureau de Monsieur le Chef de Bureau de ${bureau}, chargé des poursuites aux fins du présent. Nous soussignés ${agent}, certifions ce qui suit : Notifions la saisie du véhicule Marque : ${marque}, Modèle : ${modele}, Châssis : ${chassis}, immatriculé ${immat}, conduit par ${conducteur} (Tél: ${telephone}), conformément aux dispositions des articles 64, 69, 254, 350, 354 et 355 du code des douanes.`;
  
  // Affichage du paragraphe narratif avec alignement JUSTIFIÉ
  const lines = doc.splitTextToSize(paragrapheNarratif, contentWidth);
  
  // Affichage ligne par ligne avec justification
  lines.forEach((line: string, index: number) => {
    // Pour la dernière ligne, on utilise 'left' car jsPDF ne justifie pas la dernière ligne
    const align = index === lines.length - 1 ? 'left' : 'justify';
    doc.text(line, margin, currentY, { align, maxWidth: contentWidth });
    currentY += 5;
  });
  
  currentY += 10;

  // ========== BAS DE PAGE : SIGNATURES ==========
  
  // Zone de signature gauche : "Le/la Contrevenant(e)"
  const signatureY = pageHeight - margin - 30; // Position fixe en bas de page
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Le/la Contrevenant(e)', margin, signatureY);
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text('Signature : _______________', margin, signatureY + 6);
  
  // Zone de signature droite : "Le Chef de Poste/Escouade"
  const signatureRightText = 'Le Chef de Poste/Escouade';
  const signatureRightWidth = doc.getTextWidth(signatureRightText);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text(signatureRightText, pageWidth - margin - signatureRightWidth, signatureY);
  doc.setFont('times', 'italic');
  doc.setFontSize(8);
  doc.text('Signature : _______________', pageWidth - margin - signatureRightWidth, signatureY + 6);

  // ========== QR CODE DE SÉCURITÉ (DISCRÈTEMENT EN BAS) ==========
  
  // QR Code de sécurité discrètement en bas pour la vérification numérique
  const qrSize = 15; // Taille réduite pour discrétion
  const qrX = pageWidth / 2 - qrSize / 2; // Centré horizontalement
  const qrY = pageHeight - margin - 10; // Position en bas
  
  // Ajout du QR Code au PDF
  doc.addImage(qrCodeImage, 'PNG', qrX, qrY, qrSize, qrSize);
  
  // Label discret sous le QR Code
  doc.setFont('times', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100); // Gris pour discrétion
  doc.text('Vérification', qrX + qrSize / 2, qrY + qrSize + 3, { align: 'center' });

  // Téléchargement automatique du PDF
  const fileName = `Notification_Saisie_${saisie.numeroChassis}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
