import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/ui/status-badge';
import { DelaiCounter } from '@/components/ui/delai-counter';
import { ActionButtons } from '@/components/saisie/action-buttons';
import { PrintNotificationButton } from '@/components/saisie/print-notification-button';
import { 
  Car, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  Shield, 
  Clock,
  History,
  AlertTriangle,
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { calculateDaysRemaining, getAlerteLevel, getAlerteMessage } from '@/lib/utils/saisie.utils';
import { Role } from '@prisma/client';

// Page de détails d'une saisie
// Affiche toutes les informations du véhicule et l'historique des actions
export default async function SaisieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  // Vérification de sécurité
  if (!session) {
    redirect('/login');
  }

  // Récupération de la saisie avec toutes les relations
  const saisie = await prisma.saisie.findUnique({
    where: { id },
    include: {
      agent: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
          role: true,
        },
      },
      auditLogs: {
        orderBy: {
          dateAction: 'desc',
        },
        include: {
          user: {
            select: {
              prenom: true,
              nom: true,
              role: true,
            },
          },
        },
        take: 20, // Limite à 20 dernières actions
      },
    },
  });

  // Si la saisie n'existe pas, redirection
  if (!saisie) {
    redirect('/dashboard/saisies');
  }

  // Calcul des alertes légales (90 jours)
  const joursRestants = calculateDaysRemaining(saisie.dateSaisie);
  const alerteLevel = getAlerteLevel(saisie.dateSaisie);
  const alerteMessage = getAlerteMessage(saisie.dateSaisie);

  // Vérification des permissions pour les actions de direction
  // Seuls ADMIN, CHEF_BUREAU et CHEF_BRIGADE peuvent valider/annuler
  const canManage = 
    session.user.role === 'ADMIN' || 
    session.user.role === 'CHEF_BUREAU' || 
    session.user.role === 'CHEF_BRIGADE';

  // Vérification si la saisie peut être modifiée
  // Une saisie peut être modifiée si :
  // 1. Son statut est SAISI_EN_COURS (non validée)
  // 2. L'utilisateur est l'agent qui a créé la saisie OU un ADMIN
  const canEdit = 
    saisie.statut === 'SAISI_EN_COURS' && 
    (saisie.agentId === session.user.id || session.user.role === 'ADMIN');

  return (
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Détails de la Saisie
          </h1>
          <p className="text-slate-600 mt-2 text-sm">
            Informations complètes du véhicule saisi
          </p>
        </div>

        {/* Section : Compteur de Délai Légal (Art. 296) */}
        {/* Affiche le nombre de jours restants avec règles visuelles */}
        <DelaiCounter dateSaisie={saisie.dateSaisie} />

        {/* Section : Actions disponibles */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Bouton d'impression de la notification officielle */}
            {/* CONFORMITÉ CAHIER DES CHARGES : Génération automatique de la Fiche de Notification */}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">
                Fiche de Notification Officielle
              </h2>
              <p className="text-sm text-slate-600">
                Générer automatiquement la notification "3 volets" conforme au carnet officiel :
                <br />
                <span className="text-xs text-slate-500 mt-1 block">
                  • Volet Propriétaire (remis à la personne à bord) • Volet Véhicule (reste dans le véhicule) • Souche Guichet (archives)
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Bouton Modifier (visible uniquement si la saisie peut être modifiée) */}
              {canEdit && (
                <Link
                  href={`/dashboard/saisies/${id}/edit`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                >
                  <Edit className="h-4 w-4" />
                  <span>Modifier</span>
                </Link>
              )}
              {/* Bouton d'impression */}
            <PrintNotificationButton
              saisie={{
                id: saisie.id, // ID de la saisie pour générer le numéro de notification
                numeroChassis: saisie.numeroChassis,
                marque: saisie.marque,
                modele: saisie.modele,
                typeVehicule: saisie.typeVehicule,
                immatriculation: saisie.immatriculation,
                nomConducteur: saisie.nomConducteur,
                telephoneConducteur: saisie.telephoneConducteur,
                motifInfraction: saisie.motifInfraction,
                lieuSaisie: saisie.lieuSaisie,
                dateSaisie: saisie.dateSaisie,
                statut: saisie.statut, // Statut pour le QR Code
                agent: {
                  prenom: saisie.agent.prenom,
                  nom: saisie.agent.nom,
                },
              }}
            />
            </div>
          </div>
        </div>

        {/* Section : Actions de Direction */}
        {/* Boutons de validation/annulation visibles uniquement pour ADMIN, CHEF_BUREAU et CHEF_BRIGADE */}
        {/* Le composant ActionButtons gère les confirmations, états de chargement et notifications */}
        {canManage && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Actions de Direction
              </h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Valider la sortie ou annuler la saisie du véhicule
            </p>
            {/* Composant client avec confirmations et notifications */}
            <ActionButtons
              saisieId={id}
              numeroChassis={saisie.numeroChassis}
            />
          </div>
        )}

        {/* Grille d'informations principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section : Informations du Véhicule */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Informations du Véhicule
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Numéro de Châssis</p>
                <p className="text-sm font-semibold text-slate-800">
                  {saisie.numeroChassis}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Marque</p>
                  <p className="text-sm font-medium text-slate-800">{saisie.marque}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Modèle</p>
                  <p className="text-sm font-medium text-slate-800">{saisie.modele}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Type de Véhicule</p>
                <p className="text-sm font-medium text-slate-800">
                  {saisie.typeVehicule}
                </p>
              </div>
              {saisie.immatriculation && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Immatriculation</p>
                  <p className="text-sm font-medium text-slate-800">
                    {saisie.immatriculation}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-1">Statut</p>
                <StatusBadge statut={saisie.statut} />
              </div>
            </div>
          </div>

          {/* Section : Informations du Conducteur */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <User className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Informations du Conducteur
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nom Complet</p>
                <p className="text-sm font-semibold text-slate-800">
                  {saisie.nomConducteur}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Téléphone</p>
                <p className="text-sm font-medium text-slate-800">
                  {saisie.telephoneConducteur}
                </p>
              </div>
            </div>
          </div>

          {/* Section : Informations de la Saisie */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Informations de la Saisie
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Date de Saisie</p>
                <p className="text-sm font-medium text-slate-800">
                  {new Date(saisie.dateSaisie).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Lieu de Saisie</p>
                <p className="text-sm font-medium text-slate-800">
                  {saisie.lieuSaisie}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Motif de l'Infraction</p>
                <p className="text-sm font-medium text-slate-800">
                  {saisie.motifInfraction}
                </p>
              </div>
            </div>
          </div>

          {/* Section : Agent Responsable */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Shield className="h-5 w-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">
                Agent Responsable
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Nom</p>
                <p className="text-sm font-semibold text-slate-800">
                  {saisie.agent.prenom} {saisie.agent.nom}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email</p>
                <p className="text-sm font-medium text-slate-800">
                  {saisie.agent.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Rôle</p>
                <p className="text-sm font-medium text-slate-800">
                  {saisie.agent.role}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section : Historique des Actions */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gray-100 rounded-lg">
              <History className="h-5 w-5 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              Historique des Actions
            </h2>
          </div>
          <div className="space-y-3">
            {saisie.auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Aucune action enregistrée
              </p>
            ) : (
              saisie.auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    {log.details && (
                      <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-slate-500">
                        Par {log.user.prenom} {log.user.nom} ({log.user.role})
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(log.dateAction).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

