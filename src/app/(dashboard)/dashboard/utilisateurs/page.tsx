import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { Plus, Users, Shield } from 'lucide-react';
import Link from 'next/link';
import { CreateUserForm } from '@/components/users/create-user-form';
import { UserActions } from '@/components/users/user-actions';

// Page de gestion des utilisateurs
// Accessible uniquement aux administrateurs (rôle ADMIN)
// Affiche la liste de tous les utilisateurs et permet d'en créer de nouveaux
export default async function UtilisateursPage() {
  const session = await auth();

  // Vérification de sécurité : redirection si non connecté
  if (!session) {
    redirect('/login');
  }

  // Contrôle d'accès : seuls les ADMIN peuvent accéder à cette page
  // Si l'utilisateur n'est pas ADMIN, redirection vers le dashboard avec message d'erreur
  if (session.user.role !== Role.ADMIN) {
    redirect('/dashboard?error=access_denied');
  }

  // Récupération de tous les utilisateurs depuis la base de données
  // Triés par date de création décroissante (plus récents en premier)
  const utilisateurs = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Fonction pour formater le rôle en texte lisible
  const getRoleLabel = (role: Role): string => {
    const roleLabels: Record<Role, string> = {
      ADMIN: 'Administrateur',
      CHEF_BUREAU: 'Chef de Bureau',
      CHEF_BRIGADE: 'Chef de Brigade',
      AGENT_BRIGADE: 'Agent de Brigade',
      AGENT_CONSULTATION: 'Agent Consultation',
    };
    return roleLabels[role] || role;
  };

  // Fonction pour obtenir la couleur du badge selon le rôle
  // Style premium avec couleurs distinctes pour chaque rôle
  // Design "Clean & Professional" avec fonds très clairs et textes colorés pour une lisibilité parfaite
  const getRoleBadgeColor = (role: Role): string => {
    const roleColors: Record<Role, string> = {
      // ADMIN : Fond rouge très clair, texte rouge foncé (lisibilité optimale)
      ADMIN: 'bg-red-50 text-red-700 border border-red-200',
      // CHEF_BUREAU : Fond bleu très clair, texte bleu foncé
      CHEF_BUREAU: 'bg-blue-50 text-blue-700 border border-blue-200',
      // CHEF_BRIGADE : Fond bleu très clair, texte bleu foncé (même couleur que CHEF_BUREAU)
      CHEF_BRIGADE: 'bg-blue-50 text-blue-700 border border-blue-200',
      // AGENT_BRIGADE : Fond vert très clair, texte vert foncé
      AGENT_BRIGADE: 'bg-green-50 text-green-700 border border-green-200',
      // AGENT_CONSULTATION : Gris pour la consultation
      AGENT_CONSULTATION: 'bg-gray-50 text-gray-700 border border-gray-200',
    };
    return roleColors[role] || 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête avec titre et bouton "Ajouter un Utilisateur" */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-slate-600 mt-2 text-sm">
              Liste de tous les utilisateurs du système
            </p>
          </div>
          {/* Bouton pour ouvrir le formulaire de création */}
          <CreateUserForm />
        </div>

        {/* Carte blanche avec tableau des utilisateurs */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {utilisateurs.length === 0 ? (
            // État vide : message centré
            <div className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">Aucun utilisateur enregistré</p>
            </div>
          ) : (
            // Tableau épuré des utilisateurs
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* En-têtes du tableau avec fond gris très clair */}
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Prénom
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                {/* Corps du tableau avec lignes alternées */}
                <tbody className="bg-white divide-y divide-gray-100">
                  {utilisateurs.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      {/* Nom */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-800">
                          {user.nom}
                        </div>
                      </td>
                      {/* Prénom */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{user.prenom}</div>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">{user.email}</div>
                      </td>
                      {/* Rôle avec badge coloré premium */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          <Shield className="h-3.5 w-3.5 mr-1.5" />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      {/* Date de création */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-800">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(user.createdAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      {/* Actions : Modifier et Supprimer */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <UserActions
                          userId={user.id}
                          userEmail={user.email}
                          userName={`${user.prenom} ${user.nom}`}
                          currentUserId={session.user.id}
                        />
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

