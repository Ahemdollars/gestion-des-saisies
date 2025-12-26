import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { KPICard } from '@/components/dashboard/kpi-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlerteBadge } from '@/components/ui/alerte-badge';
import { Package, FileText, Gavel } from 'lucide-react';
import { calculateDaysSinceSaisie } from '@/lib/utils/saisie.utils';
import Link from 'next/link';

// Page d'accueil du dashboard
// Affiche les KPI principaux et les saisies récentes
export default async function DashboardPage() {
  const session = await auth();

  // Vérification de sécurité
  if (!session) {
    redirect('/login');
  }

  // Récupération des VRAIES statistiques depuis la base de données
  // Calcul du nombre de véhicules en dépôt (statut SAISI_EN_COURS)
  // SAISI_EN_COURS = véhicules saisis et en cours de traitement
  const enDepot = await prisma.saisie.count({
    where: {
      statut: 'SAISI_EN_COURS',
    },
  });

  // Calcul du nombre de saisies du mois en cours
  const debutMois = new Date();
  debutMois.setDate(1);
  debutMois.setHours(0, 0, 0, 0);
  
  const saisiesMois = await prisma.saisie.count({
    where: {
      dateSaisie: {
        gte: debutMois,
      },
    },
  });

  // Calcul du nombre de véhicules avec alerte > 90 jours (délai dépassé)
  // Conformément à l'Article 296 du Code des Douanes : délai légal de 90 jours
  // Le guichet unique doit surveiller rigoureusement le délai de 90 jours
  // Optimisation : récupération uniquement des dates nécessaires
  const toutesSaisies = await prisma.saisie.findMany({
    select: {
      dateSaisie: true,
    },
  });
  
  // Compte les véhicules avec 90 jours ou plus écoulés depuis la date de saisie
  // Ces véhicules sont éligibles à la vente aux enchères (délai légal dépassé)
  const aVendre = toutesSaisies.filter(
    (saisie) => calculateDaysSinceSaisie(saisie.dateSaisie) >= 90
  ).length;

  // Récupération des saisies récentes (limitées à 5)
  const saisiesRecentes = await prisma.saisie.findMany({
    take: 5,
    orderBy: {
      dateSaisie: 'desc',
    },
    include: {
      agent: {
        select: {
          prenom: true,
          nom: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* En-tête de la page */}
      {/* OPTIMISATION UX MOBILE : Espacement supplémentaire en haut pour décoller du header */}
      <div className="mt-4 md:mt-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="text-gray-500 mt-2 text-sm md:text-base">
          Vue d'ensemble de l'activité du système
        </p>
      </div>

      {/* Grille de cartes KPI */}
      {/* OPTIMISATION UX MOBILE : Marges latérales suffisantes pour ne pas toucher les bords */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <KPICard
          title="Véhicules en dépôt"
          value={enDepot}
          icon={<Package className="h-6 w-6" />}
          description="Actuellement stockés"
        />
        <KPICard
          title="Saisies du mois"
          value={saisiesMois}
          icon={<FileText className="h-6 w-6" />}
          description="Ce mois-ci"
        />
        {/* Carte cliquable pour les véhicules en vente aux enchères */}
        <KPICard
          title="Délai dépassé (>90j)"
          value={aVendre}
          icon={<Gavel className="h-6 w-6" />}
          variant="alert"
          description="Vente aux enchères"
          href="/dashboard/saisies?filtre=vente-encheres"
        />
      </div>

      {/* Section Saisies Récentes */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Saisies Récentes
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Dernières saisies enregistrées dans le système
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Numéro Châssis
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Véhicule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conducteur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {saisiesRecentes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-gray-500"
                  >
                    Aucune saisie enregistrée pour le moment
                  </td>
                </tr>
              ) : (
                saisiesRecentes.map((saisie) => (
                  <tr
                    key={saisie.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {saisie.numeroChassis}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="block"
                      >
                        <div className="text-sm text-gray-900">
                          {saisie.marque} {saisie.modele}
                        </div>
                        {saisie.immatriculation && (
                          <div className="text-xs text-gray-500">
                            {saisie.immatriculation}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="block"
                      >
                        <div className="text-sm text-gray-900">
                          {saisie.nomConducteur}
                        </div>
                        <div className="text-xs text-gray-500">
                          {saisie.telephoneConducteur}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/dashboard/saisies/${saisie.id}`}
                        className="block"
                      >
                        <span className="text-sm text-gray-900">
                          {new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <StatusBadge statut={saisie.statut} />
                        <AlerteBadge dateSaisie={saisie.dateSaisie} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {saisie.agent.prenom} {saisie.agent.nom}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
