import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Plus, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { calculateDaysSinceSaisie } from '@/lib/utils/saisie.utils';
import { SaisiesListClient } from '@/components/saisie/saisies-list-client';

// Page liste des saisies
// Route : /dashboard/saisies
// Affiche toutes les saisies dans un tableau épuré avec design "Premium"
// Supporte un filtre pour les véhicules en vente aux enchères (délai > 90 jours)
// Intègre une barre de recherche et des filtres par statut
export default async function SaisiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string; statut?: string }>;
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

  // Filtrage selon le paramètre de filtre "vente-encheres"
  // Si filtre = "vente-encheres", on ne garde que les véhicules avec délai > 90 jours
  let saisies = toutesSaisies;
  if (params.filtre === 'vente-encheres') {
    saisies = toutesSaisies.filter(
      (saisie) => calculateDaysSinceSaisie(saisie.dateSaisie) >= 90
    );
  }

  // Transformation des données en format stable pour éviter les références instables
  // Cette transformation est faite une seule fois côté serveur avant le rendu
  // Cela évite les re-créations de références à chaque rendu qui causent des boucles infinies
  const saisiesFormatees = saisies.map((saisie) => ({
    id: saisie.id,
    numeroChassis: saisie.numeroChassis,
    marque: saisie.marque,
    modele: saisie.modele,
    immatriculation: saisie.immatriculation,
    nomConducteur: saisie.nomConducteur,
    telephoneConducteur: saisie.telephoneConducteur,
    dateSaisie: saisie.dateSaisie,
    statut: saisie.statut,
  }));

  return (
    // Fond de page gris très clair style "Premium"
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
                : 'Liste épurée des véhicules saisis avec recherche et filtres'}
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

        {/* Composant client pour la liste avec recherche et filtres */}
        {/* Gère le filtrage côté client pour une recherche instantanée */}
        {/* Les données sont passées avec une référence stable pour éviter les boucles infinies */}
        <SaisiesListClient initialSaisies={saisiesFormatees} />
      </div>
    </div>
  );
}

