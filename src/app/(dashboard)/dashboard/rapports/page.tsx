import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { TrendingUp, Users, AlertTriangle, Inbox } from 'lucide-react';
import { ExportButton } from '@/components/rapports/export-button';
import { YearSelector } from '@/components/rapports/year-selector';
import { canAccessRoute } from '@/lib/utils/permissions';

// Page de rapports et statistiques
// Affiche les statistiques professionnelles avec design "Clean UI"
// Supporte la sélection d'année (2024 ou 2025)
export default async function RapportsPage({
  searchParams,
}: {
  searchParams: Promise<{ annee?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Vérification de sécurité : redirection si non connecté
  if (!session) {
    redirect('/login');
  }

  // Contrôle d'accès RBAC : vérification des permissions pour cette route
  const userRole = session.user.role as Role;
  if (!canAccessRoute(userRole, '/dashboard/rapports')) {
    // Redirection vers le dashboard avec message d'erreur si accès refusé
    redirect('/dashboard?error=access_denied');
  }

  // Récupération de toutes les années distinctes présentes dans la table Saisie
  // Optimisation : récupération uniquement des dates nécessaires (pas toutes les données)
  const toutesSaisies = await prisma.saisie.findMany({
    select: {
      dateSaisie: true,
    },
    // Limite optionnelle pour améliorer les performances si beaucoup de données
    // On garde toutes les saisies car on a besoin de toutes les années
  });

  // Extraction des années uniques depuis les dates de saisie
  // Utilisation d'un Set pour garantir l'unicité
  const anneesUniques = new Set<number>();
  toutesSaisies.forEach((saisie) => {
    const annee = new Date(saisie.dateSaisie).getFullYear();
    anneesUniques.add(annee);
  });

  // Ajout de l'année en cours même si aucune saisie n'a encore été faite
  const anneeEnCours = new Date().getFullYear();
  anneesUniques.add(anneeEnCours);

  // Tri des années de la plus récente à la plus ancienne
  const anneesDisponibles = Array.from(anneesUniques).sort((a, b) => b - a);

  // Récupération de l'année sélectionnée (par défaut année en cours)
  const anneeSelectionnee = params.annee
    ? parseInt(params.annee)
    : anneeEnCours;

  // Calcul de la date de début de l'année sélectionnée
  const debutAnnee = new Date(`${anneeSelectionnee}-01-01`);
  debutAnnee.setHours(0, 0, 0, 0);

  // Calcul de la date de fin de l'année sélectionnée
  const finAnnee = new Date(`${anneeSelectionnee}-12-31`);
  finAnnee.setHours(23, 59, 59, 999);

  // Nombre total de véhicules saisis sur l'année sélectionnée
  const totalSaisies = await prisma.saisie.count({
    where: {
      dateSaisie: {
        gte: debutAnnee,
        lte: finAnnee,
      },
    },
  });

  // Répartition par motif d'infraction
  // Récupération de toutes les saisies de l'année sélectionnée avec leurs motifs
  const saisiesAnnee = await prisma.saisie.findMany({
    where: {
      dateSaisie: {
        gte: debutAnnee,
        lte: finAnnee,
      },
    },
    select: {
      motifInfraction: true,
    },
  });

  // Calcul de la répartition par motif
  // Groupement des motifs similaires (ex: "Défaut de T1", "Contrebande", etc.)
  const motifsCount: Record<string, number> = {};
  saisiesAnnee.forEach((saisie) => {
    // Extraction du motif principal (premiers mots du motif)
    const motifPrincipal = saisie.motifInfraction
      .split(' ')
      .slice(0, 3)
      .join(' ')
      .toLowerCase();

    // Normalisation des motifs similaires
    let motifNormalise = motifPrincipal;
    if (motifPrincipal.includes('défaut') || motifPrincipal.includes('defaut')) {
      motifNormalise = 'Défaut de T1';
    } else if (
      motifPrincipal.includes('contrebande') ||
      motifPrincipal.includes('contre')
    ) {
      motifNormalise = 'Contrebande';
    } else if (
      motifPrincipal.includes('falsification') ||
      motifPrincipal.includes('faux')
    ) {
      motifNormalise = 'Falsification de documents';
    } else if (motifPrincipal.includes('non paiement')) {
      motifNormalise = 'Non paiement de droits';
    } else {
      // Garde les 3 premiers mots en capitalisant
      motifNormalise =
        saisie.motifInfraction.split(' ').slice(0, 3).join(' ') || 'Autre';
    }

    motifsCount[motifNormalise] = (motifsCount[motifNormalise] || 0) + 1;
  });

  // Tri des motifs par nombre décroissant
  const motifsTries = Object.entries(motifsCount)
    .map(([motif, count]) => ({ motif, count }))
    .sort((a, b) => b.count - a.count);

  // Performance par agent (qui a fait le plus de saisies)
  const performanceAgents = await prisma.saisie.groupBy({
    by: ['agentId'],
    where: {
      dateSaisie: {
        gte: debutAnnee,
        lte: finAnnee,
      },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10, // Top 10 agents
  });

  // Récupération des informations des agents pour afficher leurs noms
  const agentsIds = performanceAgents.map((p) => p.agentId);
  const agents = await prisma.user.findMany({
    where: {
      id: {
        in: agentsIds,
      },
    },
    select: {
      id: true,
      prenom: true,
      nom: true,
      role: true,
    },
  });

  // Création d'un map pour accéder rapidement aux agents
  const agentsMap = new Map(agents.map((a) => [a.id, a]));

  // Combinaison des performances avec les noms des agents
  const performanceAvecNoms = performanceAgents.map((perf) => {
    const agent = agentsMap.get(perf.agentId);
    return {
      agent: agent
        ? `${agent.prenom} ${agent.nom}`
        : 'Agent inconnu',
      role: agent?.role || 'N/A',
      count: perf._count.id,
    };
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec sélecteur d'année et bouton d'export */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Rapports & Statistiques
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              Analyse des données de saisies pour l'année {anneeSelectionnee}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Sélecteur d'année dynamique avec toutes les années disponibles */}
            <YearSelector
              currentYear={anneeEnCours}
              availableYears={anneesDisponibles}
            />
            {/* Bouton d'export PDF */}
            <ExportButton />
          </div>
        </div>

        {/* Carte : Nombre total de saisies */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Total des Saisies {anneeSelectionnee}
              </h2>
              <p className="text-xs text-slate-500">
                Nombre total de véhicules saisis sur l'année
              </p>
            </div>
          </div>
          <div className="mt-4">
            {totalSaisies === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Inbox className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-lg font-medium text-slate-600">
                  Aucune saisie enregistrée
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  pour l'année {anneeSelectionnee}
                </p>
              </div>
            ) : (
              <>
                <p className="text-4xl font-bold text-slate-800">{totalSaisies}</p>
                <p className="text-sm text-slate-500 mt-1">véhicules saisis</p>
              </>
            )}
          </div>
        </div>

        {/* Grille : Répartition par motif et Performance par agent */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte : Répartition par motif d'infraction */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Répartition par Motif
                </h2>
                <p className="text-xs text-slate-500">
                  Motifs d'infraction les plus fréquents
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {motifsTries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Inbox className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-slate-500 text-center">
                    Aucune saisie enregistrée pour {anneeSelectionnee}
                  </p>
                </div>
              ) : (
                motifsTries.map(({ motif, count }, index) => {
                  // Calcul du pourcentage
                  const pourcentage = totalSaisies > 0
                    ? Math.round((count / totalSaisies) * 100)
                    : 0;

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-800">
                          {motif}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {count} ({pourcentage}%)
                        </span>
                      </div>
                      {/* Barre de progression visuelle */}
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${pourcentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Carte : Performance par agent */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Performance par Agent
                </h2>
                <p className="text-xs text-slate-500">
                  Top 10 des agents les plus actifs
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {performanceAvecNoms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Inbox className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-slate-500 text-center">
                    Aucune performance enregistrée pour {anneeSelectionnee}
                  </p>
                </div>
              ) : (
                performanceAvecNoms.map((perf, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      {/* Badge de classement */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : index === 1
                              ? 'bg-gray-100 text-gray-800'
                              : index === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {perf.agent}
                        </p>
                        <p className="text-xs text-slate-500">{perf.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-800">
                        {perf.count}
                      </p>
                      <p className="text-xs text-slate-500">saisies</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

