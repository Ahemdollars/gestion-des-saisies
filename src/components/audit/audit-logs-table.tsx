'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Activity, User, FileText, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

// Interface pour un log d'audit avec ses relations
interface AuditLogWithRelations {
  id: string;
  action: string;
  details: string | null;
  dateAction: Date;
  user: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  };
  saisie: {
    id: string;
    numeroChassis: string;
    marque: string;
    modele: string;
  } | null;
}

// Props du composant de tableau des logs d'audit
interface AuditLogsTableProps {
  // Liste des logs d'audit à afficher
  logs: AuditLogWithRelations[];
  // Page actuelle de la pagination
  currentPage: number;
  // Nombre total de pages
  totalPages: number;
  // Nombre total de logs (pour l'affichage)
  totalLogs: number;
}

// Composant client pour afficher le tableau des logs d'audit
// Affiche les logs avec pagination et design Premium
export function AuditLogsTable({
  logs,
  currentPage,
  totalPages,
  totalLogs,
}: AuditLogsTableProps) {
  const searchParams = useSearchParams();

  // Récupération des paramètres de filtre depuis l'URL pour les conserver dans la pagination
  const userParam = searchParams.get('user') || '';
  const actionParam = searchParams.get('action') || '';

  // Fonction pour construire l'URL de pagination en conservant les filtres
  const buildPaginationUrl = (page: number): string => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    if (userParam) params.set('user', userParam);
    if (actionParam) params.set('action', actionParam);
    return `/dashboard/audit?${params.toString()}`;
  };
  // Fonction pour obtenir l'icône selon le type d'action
  const getActionIcon = (action: string) => {
    // Retourne une icône différente selon le type d'action
    if (action.includes('CREATION')) {
      return <FileText className="h-4 w-4" />;
    }
    if (action.includes('SUPPRESSION') || action.includes('ANNULATION')) {
      return <Shield className="h-4 w-4" />;
    }
    if (action.includes('VALIDATION')) {
      return <Activity className="h-4 w-4" />;
    }
    // Icône par défaut
    return <Activity className="h-4 w-4" />;
  };

  // Fonction pour obtenir la couleur du badge selon le type d'action
  const getActionBadgeColor = (action: string): string => {
    // Retourne une couleur différente selon le type d'action
    if (action.includes('CREATION')) {
      return 'bg-green-50 text-green-700 border border-green-200';
    }
    if (action.includes('SUPPRESSION') || action.includes('ANNULATION')) {
      return 'bg-red-50 text-red-700 border border-red-200';
    }
    if (action.includes('VALIDATION')) {
      return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
    // Couleur par défaut
    return 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  // Fonction pour formater le label d'une action en texte lisible
  const formatActionLabel = (action: string): string => {
    // Remplace les underscores par des espaces et met en forme
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fonction pour générer les liens de pagination
  const getPaginationLinks = () => {
    const links = [];
    const maxVisiblePages = 5; // Nombre maximum de pages visibles dans la pagination

    // Calcul de la plage de pages à afficher
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Ajustement si on est proche de la fin
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Bouton "Précédent"
    if (currentPage > 1) {
      links.push(
        <Link
          key="prev"
          href={buildPaginationUrl(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      );
    }

    // Pages numérotées
    for (let i = startPage; i <= endPage; i++) {
      links.push(
        <Link
          key={i}
          href={buildPaginationUrl(i)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            i === currentPage
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </Link>
      );
    }

    // Bouton "Suivant"
    if (currentPage < totalPages) {
      links.push(
        <Link
          key="next"
          href={buildPaginationUrl(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      );
    }

    return links;
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      {/* En-tête avec statistiques */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Total de logs : <span className="font-semibold text-slate-800">{totalLogs}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Page {currentPage} sur {totalPages}
            </p>
          </div>
        </div>
      </div>

      {/* Tableau des logs */}
      {logs.length === 0 ? (
        // État vide : message centré
        <div className="p-12 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">Aucun log d'audit trouvé</p>
          <p className="text-sm text-slate-500">
            Les actions effectuées dans le système apparaîtront ici
          </p>
        </div>
      ) : (
        <>
          {/* Tableau épuré des logs */}
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* En-têtes du tableau avec fond gris très clair */}
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Détails
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Saisie concernée
                  </th>
                </tr>
              </thead>
              {/* Corps du tableau avec lignes alternées */}
              <tbody className="bg-white divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* Date et heure de l'action */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-800">
                        {new Date(log.dateAction).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.dateAction).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                    </td>
                    {/* Informations de l'utilisateur */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <User className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800">
                            {log.user.prenom} {log.user.nom}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {log.user.email}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {log.user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Type d'action avec badge coloré */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${getActionBadgeColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                          {formatActionLabel(log.action)}
                        </span>
                      </div>
                    </td>
                    {/* Détails de l'action */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-800 max-w-md">
                        {log.details || (
                          <span className="text-slate-400 italic">Aucun détail</span>
                        )}
                      </div>
                    </td>
                    {/* Saisie concernée (lien si disponible) */}
                    <td className="px-6 py-4">
                      {log.saisie ? (
                        <Link
                          href={`/dashboard/saisies/${log.saisie.id}`}
                          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>{log.saisie.marque} {log.saisie.modele}</span>
                          <span className="text-xs text-slate-500">
                            ({log.saisie.numeroChassis})
                          </span>
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400 italic">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination en bas du tableau */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Affichage de {(currentPage - 1) * 20 + 1} à{' '}
                  {Math.min(currentPage * 20, totalLogs)} sur {totalLogs} logs
                </div>
                <div className="flex items-center gap-2">
                  {getPaginationLinks()}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

