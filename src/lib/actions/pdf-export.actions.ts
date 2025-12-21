'use server';

import { prisma } from '@/lib/prisma';

/**
 * Server Action pour récupérer les données à exporter en PDF
 * Retourne les données des saisies pour l'année sélectionnée
 * 
 * @param annee - Année des saisies à exporter
 * @returns Promise avec les données des saisies ou une erreur
 */
export async function getSaisiesForExport(annee: number): Promise<{
  success: boolean;
  data?: Array<{
    numeroChassis: string;
    marque: string;
    modele: string;
    dateSaisie: Date;
    statut: string;
  }>;
  error?: string;
}> {
  try {
    // Calcul des dates de début et fin d'année
    const debutAnnee = new Date(`${annee}-01-01`);
    debutAnnee.setHours(0, 0, 0, 0);

    const finAnnee = new Date(`${annee}-12-31`);
    finAnnee.setHours(23, 59, 59, 999);

    // Récupération de toutes les saisies de l'année avec les informations nécessaires
    const saisies = await prisma.saisie.findMany({
      where: {
        dateSaisie: {
          gte: debutAnnee,
          lte: finAnnee,
        },
      },
      select: {
        numeroChassis: true,
        marque: true,
        modele: true,
        dateSaisie: true,
        statut: true,
      },
      orderBy: {
        dateSaisie: 'desc',
      },
    });

    return {
      success: true,
      data: saisies,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des données.',
    };
  }
}

