/**
 * Utilitaires pour la gestion des saisies
 * Fonctions de calcul et de formatage pour les alertes légales
 */

/**
 * Calcule le nombre de jours écoulés depuis la date de saisie
 * Utilisé pour déterminer les alertes des 90 jours (Art. 296)
 * 
 * @param dateSaisie - Date de saisie du véhicule
 * @returns Nombre de jours écoulés depuis la saisie
 */
export function calculateDaysSinceSaisie(dateSaisie: Date): number {
  // Date actuelle
  const now = new Date();
  
  // Date de saisie
  const saisieDate = new Date(dateSaisie);
  
  // Calcul de la différence en millisecondes
  const diffTime = now.getTime() - saisieDate.getTime();
  
  // Conversion en jours (arrondi vers le bas)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Calcule le nombre de jours restants avant la vente aux enchères
 * Délai légal : 90 jours à compter de la date de saisie (Art. 296)
 * 
 * @param dateSaisie - Date de saisie du véhicule
 * @returns Nombre de jours restants (peut être négatif si délai dépassé)
 */
export function calculateDaysRemaining(dateSaisie: Date): number {
  const DELAI_LEGAL_JOURS = 90; // Délai légal de 90 jours (Art. 296)
  const joursEcoules = calculateDaysSinceSaisie(dateSaisie);
  return DELAI_LEGAL_JOURS - joursEcoules;
}

/**
 * Détermine le niveau d'alerte selon le nombre de jours écoulés
 * 
 * @param dateSaisie - Date de saisie du véhicule
 * @returns Niveau d'alerte : 'normal' | 'warning' | 'critical'
 */
export function getAlerteLevel(dateSaisie: Date): 'normal' | 'warning' | 'critical' {
  const joursEcoules = calculateDaysSinceSaisie(dateSaisie);
  
  // Plus de 90 jours : alerte critique (délai dépassé)
  if (joursEcoules >= 90) {
    return 'critical';
  }
  
  // Plus de 75 jours : alerte warning (approche du délai)
  if (joursEcoules >= 75) {
    return 'warning';
  }
  
  // Moins de 75 jours : normal
  return 'normal';
}

/**
 * Formate le message d'alerte selon le niveau
 * 
 * @param dateSaisie - Date de saisie du véhicule
 * @returns Message d'alerte formaté
 */
export function getAlerteMessage(dateSaisie: Date): string {
  const joursRestants = calculateDaysRemaining(dateSaisie);
  const joursEcoules = calculateDaysSinceSaisie(dateSaisie);
  
  if (joursEcoules >= 90) {
    return `Délai dépassé - ${joursEcoules - 90} jour(s) en retard`;
  }
  
  if (joursRestants <= 0) {
    return 'Délai dépassé - Enchères';
  }
  
  if (joursRestants <= 15) {
    return `${joursRestants} jour(s) restant(s)`;
  }
  
  return `${joursRestants} jour(s) restant(s)`;
}

