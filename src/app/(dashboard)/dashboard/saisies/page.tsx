import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/status-badge';
import { AlerteBadge } from '@/components/ui/alerte-badge';
import { DelaiCounterCompact } from '@/components/ui/delai-counter-compact';
import { Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { calculateDaysSinceSaisie } from '@/lib/utils/saisie.utils';

// Page liste des saisies
// Route : /dashboard/saisies
// Affiche toutes les saisies dans un tableau épuré avec design "Pâtés App"
// Supporte un filtre pour les véhicules en vente aux enchères (délai > 90 jours)
export default async function SaisiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Vérification de sécurité : redirection si non connecté
  if (!session) {
    redirect('/login');
  }

  // Récupération de toutes les saisies avec les informations de l'agent
  // Triées par date décroissante (plus récentes en premier)
  const toutesSaisies = await prisma.saisie.findMany({
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

  // Filtrage selon le paramètre de filtre
  // Si filtre = "vente-encheres", on ne garde que les véhicules avec délai > 90 jours
  let saisies = toutesSaisies;
  if (params.filtre === 'vente-encheres') {
    saisies = toutesSaisies.filter(
      (saisie) => calculateDaysSinceSaisie(saisie.dateSaisie) >= 90
    );
  }

  return (
    // Fond de page gris très clair style "Pâtés App"
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec titre et bouton "Nouvelle Saisie" */}
        <div className="flex items-center justify-between">
          <div>
            {/* Typographie élégante avec Inter/Geist (déjà configuré dans layout) */}
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              {params.filtre === 'vente-encheres' ? (
                <>
                  Véhicules en Vente aux Enchères
                  <span className="ml-3 inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-lg">
                    <AlertTriangle className="h-4 w-4" />
                    {/* Correction : utilisation de {">"} pour éviter l'erreur de parsing JSX */}
                    Délai dépassé ({'>'}90j)
                  </span>
                </>
              ) : (
                'Saisies'
              )}
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              {params.filtre === 'vente-encheres'
                ? 'Véhicules éligibles à la vente aux enchères (Article 296)'
                : 'Liste épurée des véhicules saisis'}
            </p>
          </div>
          {/* Bouton "Nouvelle Saisie" avec icône '+' */}
          <Link
            href="/dashboard/saisies/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Saisie
          </Link>
        </div>

        {/* Carte blanche avec coins très arrondis et ombre douce */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {saisies.length === 0 ? (
            // État vide : message centré avec bouton d'action
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">Aucune saisie enregistrée</p>
              <Link
                href="/dashboard/saisies/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-700 hover:shadow-md transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Créer la première saisie
              </Link>
            </div>
          ) : (
            // Tableau épuré des saisies
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* En-têtes du tableau avec fond gris très clair */}
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Numéro Châssis
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Véhicule
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Conducteur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Délai
                    </th>
                  </tr>
                </thead>
                {/* Corps du tableau avec lignes alternées */}
                <tbody className="bg-white divide-y divide-gray-100">
                  {saisies.map((saisie) => (
                    <tr
                      key={saisie.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* Numéro de châssis (lien vers les détails) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/saisies/${saisie.id}`}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {saisie.numeroChassis}
                        </Link>
                      </td>
                      {/* Informations du véhicule (Marque + Modèle) */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/saisies/${saisie.id}`}
                          className="block"
                        >
                          <div className="text-sm font-medium text-slate-800">
                            {saisie.marque} {saisie.modele}
                          </div>
                          {saisie.immatriculation && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              {saisie.immatriculation}
                            </div>
                          )}
                        </Link>
                      </td>
                      {/* Informations du conducteur */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/dashboard/saisies/${saisie.id}`}
                          className="block"
                        >
                          <div className="text-sm text-slate-800">
                            {saisie.nomConducteur}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {saisie.telephoneConducteur}
                          </div>
                        </Link>
                      </td>
                      {/* Date de saisie */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/saisies/${saisie.id}`}
                          className="block"
                        >
                          <span className="text-sm text-slate-800">
                            {new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {new Date(saisie.dateSaisie).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </Link>
                      </td>
                      {/* Statut avec badge coloré et alerte légale */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <StatusBadge statut={saisie.statut} />
                          <AlerteBadge dateSaisie={saisie.dateSaisie} />
                        </div>
                      </td>
                      {/* Compteur de délai avec règles visuelles */}
                      <td className="px-6 py-4">
                        <DelaiCounterCompact dateSaisie={saisie.dateSaisie} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

