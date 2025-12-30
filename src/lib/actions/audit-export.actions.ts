'use server';

import { prisma } from '@/lib/prisma';

/**
 * Server Action pour récupérer les logs d'audit à exporter en PDF
 * Respecte les filtres appliqués (utilisateur et action)
 * 
 * @param userFilter - Filtre par utilisateur (nom, prénom ou email)
 * @param actionFilter - Filtre par type d'action
 * @returns Promise avec les données des logs d'audit ou une erreur
 */
export async function getAuditLogsForExport(
  userFilter?: string,
  actionFilter?: string
): Promise<{
  success: boolean;
  data?: Array<{
    dateAction: Date;
    user: {
      nom: string;
      prenom: string;
      email: string;
      role: string;
    }; // user n'est jamais null, toujours un objet avec des valeurs par défaut
    action: string; // Toujours une string, jamais null
    details: string; // Toujours une string, jamais null
  }>;
  error?: string;
}> {
  try {
    // Construction des filtres Prisma selon les paramètres
    const where: any = {};

    // Filtre par utilisateur : recherche par nom, prénom ou email
    if (userFilter && userFilter.trim()) {
      where.user = {
        OR: [
          { nom: { contains: userFilter.trim(), mode: 'insensitive' } },
          { prenom: { contains: userFilter.trim(), mode: 'insensitive' } },
          { email: { contains: userFilter.trim(), mode: 'insensitive' } },
        ],
      };
    }

    // Filtre par type d'action : recherche exacte ou partielle
    if (actionFilter && actionFilter.trim()) {
      where.action = {
        contains: actionFilter.trim(),
        mode: 'insensitive',
      };
    }

    // Récupération de tous les logs d'audit correspondant aux filtres
    // Pas de pagination pour l'export : on récupère tous les logs filtrés
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        dateAction: 'desc',
      },
      include: {
        // Inclusion de l'utilisateur qui a effectué l'action
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Transformation des données pour l'export
    // Normalisation stricte : toutes les valeurs doivent être des strings, jamais null
    const exportData = auditLogs.map((log) => ({
      dateAction: log.dateAction,
      user: log.user
        ? {
            // Normalisation : garantit que toutes les propriétés sont des strings
            nom: log.user.nom ?? '',
            prenom: log.user.prenom ?? '',
            email: log.user.email ?? '',
            // Conversion explicite du Role enum en string
            role: String(log.user.role),
          }
        : {
            // Objet par défaut si l'utilisateur est supprimé (évite null)
            nom: 'Utilisateur supprimé',
            prenom: '',
            email: '',
            role: 'INCONNU',
          },
      // Normalisation : garantit que action est toujours une string
      action: log.action ?? 'ACTION_INCONNUE',
      // Normalisation : garantit que details est toujours une string (jamais null)
      details: log.details ?? 'Aucun détail disponible',
    }));

    return {
      success: true,
      data: exportData,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la récupération des données.',
    };
  }
}

