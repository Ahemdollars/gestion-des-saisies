import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Activity, Shield, User, Search, Filter } from 'lucide-react';
import { AuditLogsTable } from '@/components/audit/audit-logs-table';
import { AuditLogsFilters } from '@/components/audit/audit-logs-filters';

// Page de journal d'audit
// Route : /dashboard/audit
// Affiche tous les logs d'audit du système pour la traçabilité complète
// Accessible uniquement aux administrateurs (rôle ADMIN)
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    user?: string;
    action?: string;
  }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Vérification de sécurité : redirection si non connecté
  if (!session) {
    redirect('/login');
  }

  // Contrôle d'accès strict : seuls les ADMIN peuvent accéder à cette page
  // Si l'utilisateur n'est pas ADMIN, redirection vers le dashboard avec message d'erreur
  if (session.user.role !== Role.ADMIN) {
    redirect('/dashboard?error=access_denied');
  }

  // Pagination : récupération du numéro de page depuis les searchParams
  // Par défaut, on affiche la page 1
  const currentPage = parseInt(params.page || '1', 10);
  const itemsPerPage = 20; // Nombre de logs par page pour éviter de ralentir le système

  // Calcul de l'offset pour la pagination Prisma
  const skip = (currentPage - 1) * itemsPerPage;

  // Construction des filtres Prisma selon les paramètres de recherche
  const where: any = {};

  // Filtre par utilisateur : recherche par nom, prénom ou email
  if (params.user) {
    where.user = {
      OR: [
        { nom: { contains: params.user, mode: 'insensitive' } },
        { prenom: { contains: params.user, mode: 'insensitive' } },
        { email: { contains: params.user, mode: 'insensitive' } },
      ],
    };
  }

  // Filtre par type d'action : recherche exacte ou partielle
  if (params.action) {
    where.action = {
      contains: params.action,
      mode: 'insensitive',
    };
  }

  // Récupération du nombre total de logs (pour la pagination)
  // Compte tous les logs correspondant aux filtres
  const totalLogs = await prisma.auditLog.count({
    where,
  });

  // Calcul du nombre total de pages
  const totalPages = Math.ceil(totalLogs / itemsPerPage);

  // Récupération des logs d'audit avec pagination et filtres
  // Inclut les relations User et Saisie pour afficher les détails complets
  // Triés par date décroissante (plus récents en premier)
  const auditLogs = await prisma.auditLog.findMany({
    where,
    skip,
    take: itemsPerPage,
    orderBy: {
      dateAction: 'desc',
    },
    include: {
      // Inclusion de l'utilisateur qui a effectué l'action
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
        },
      },
      // Inclusion de la saisie concernée (si elle existe)
      saisie: {
        select: {
          id: true,
          numeroChassis: true,
          marque: true,
          modele: true,
        },
      },
    },
  });

  // Récupération de la liste des utilisateurs pour le filtre
  // Permet d'afficher un dropdown avec tous les utilisateurs
  const users = await prisma.user.findMany({
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
    },
    orderBy: {
      nom: 'asc',
    },
  });

  // Récupération des types d'actions distincts pour le filtre
  // Permet d'afficher un dropdown avec tous les types d'actions disponibles
  const distinctActions = await prisma.auditLog.findMany({
    select: {
      action: true,
    },
    distinct: ['action'],
    orderBy: {
      action: 'asc',
    },
  });

  const actionTypes = distinctActions.map((log) => log.action);

  return (
    // Fond de page gris très clair style "Premium"
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec titre et icône */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icône de sécurité pour indiquer l'importance de cette page */}
            <div className="p-3 bg-blue-100 rounded-xl">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              {/* Typographie élégante avec Inter/Geist */}
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Journal d'Audit
              </h1>
              <p className="text-slate-600 mt-2 text-sm">
                Traçabilité complète de toutes les actions effectuées dans le système
              </p>
            </div>
          </div>
        </div>

        {/* Composant de filtres pour rechercher par utilisateur ou type d'action */}
        <AuditLogsFilters
          users={users}
          actionTypes={actionTypes}
          currentUserFilter={params.user || ''}
          currentActionFilter={params.action || ''}
        />

        {/* Composant de tableau avec les logs d'audit */}
        <AuditLogsTable
          logs={auditLogs}
          currentPage={currentPage}
          totalPages={totalPages}
          totalLogs={totalLogs}
        />
      </div>
    </div>
  );
}

