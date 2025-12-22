# 🚗 Système de Gestion des Saisies - Guichet Unique

> **Application web moderne pour la digitalisation de la prise en charge des véhicules saisis par les Douanes du Mali**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22.0-2D3748)](https://www.prisma.io/)

---

## 📋 Table des Matières

- [Introduction & Contexte](#-introduction--contexte)
- [Stack Technique & Choix Technologiques](#-stack-technique--choix-technologiques)
- [Architecture des Dossiers](#-architecture-des-dossiers)
- [Fonctionnalités Clés](#-fonctionnalités-clés)
- [Installation & Configuration](#-installation--configuration)
- [Sécurité (RBAC)](#-sécurité-rbac)
- [Maintenance & Évolutions](#-maintenance--évolutions)
- [Contribution](#-contribution)

---

## 🎯 Introduction & Contexte

### Présentation du Projet

Le **Système de Gestion des Saisies - Guichet Unique** est une application web développée pour les **Douanes du Mali** afin de moderniser et digitaliser la gestion des véhicules saisis dans le cadre des opérations douanières.

### Objectifs Principaux

- ✅ **Digitaliser la prise en charge** : Remplacer les processus manuels par une interface web moderne et intuitive
- ✅ **Suivi légal automatisé** : Respecter rigoureusement l'**Article 296** du Code des Douanes concernant le délai de 90 jours
- ✅ **Traçabilité complète** : Enregistrer toutes les actions effectuées dans le système pour un audit complet
- ✅ **Gestion des workflows** : Faciliter les décisions hiérarchiques (Chef de Bureau, Chef de Brigade)
- ✅ **Rapports officiels** : Générer des rapports PDF pour les besoins administratifs

### Contexte Légal

Conformément à l'**Article 296** du Code des Douanes du Mali, le guichet unique doit surveiller rigoureusement le délai de **90 jours** à partir de la date de saisie d'un véhicule. Au-delà de ce délai, les véhicules sont éligibles à la **vente aux enchères**.

---

## 🛠 Stack Technique & Choix Technologiques

### Framework Frontend & Backend

#### **Next.js 14 (App Router)** ⚡

- **Pourquoi Next.js ?**
  - **Server Components** : Rendu côté serveur pour de meilleures performances
  - **SEO optimisé** : Meilleur référencement grâce au SSR
  - **Rapidité de développement** : Routing automatique, optimisations intégrées
  - **API Routes intégrées** : Pas besoin d'un backend séparé
  - **Server Actions** : Logique backend sécurisée directement dans les composants

#### **TypeScript** 🔒

- **Sécurité du code** : Détection d'erreurs à la compilation
- **Réduction des bugs** : Typage fort pour éviter les erreurs de runtime
- **Meilleure maintenabilité** : Code auto-documenté avec les types
- **IDE amélioré** : Autocomplétion et refactoring facilités

### Base de Données

#### **PostgreSQL** 🗄️

- **Robustesse** : Base de données relationnelle éprouvée
- **ACID** : Garantit l'intégrité des données critiques
- **Performance** : Optimisé pour les requêtes complexes
- **Scalabilité** : Peut gérer de grandes quantités de données

#### **Prisma ORM** 🔧

- **Type-safety** : Génération automatique de types TypeScript
- **Migrations** : Gestion versionnée du schéma de base de données
- **Productivité** : API intuitive et expressive
- **Sécurité** : Protection contre les injections SQL

### Authentification & Sécurité

#### **NextAuth.js v5** 🔐

- **Standard de l'industrie** : Solution d'authentification éprouvée
- **Sessions sécurisées** : Gestion automatique des tokens et cookies
- **Multi-providers** : Prêt pour OAuth, SAML, etc.
- **Middleware intégré** : Protection des routes automatique

#### **Bcrypt** 🔒

- **Hachage sécurisé** : Algorithme bcrypt pour les mots de passe
- **Salt automatique** : Protection contre les attaques par dictionnaire
- **Coût configurable** : Adaptation à la puissance de calcul disponible

### Interface Utilisateur

#### **Tailwind CSS** 🎨

- **Design Premium** : Interface moderne et professionnelle
- **Responsive** : Adaptation automatique à tous les écrans
- **Performance** : CSS purgé automatiquement (taille minimale)
- **Productivité** : Développement rapide avec des classes utilitaires

#### **Lucide React** 🎯

- **Icônes modernes** : Bibliothèque d'icônes cohérente et élégante
- **Tree-shaking** : Seules les icônes utilisées sont incluses
- **TypeScript** : Support complet des types

### Reporting

#### **jsPDF & jsPDF-AutoTable** 📄

- **Génération PDF** : Création de documents PDF côté client
- **Tables professionnelles** : Formatage automatique des tableaux
- **Signature** : Support pour les lignes de signature officielles
- **Personnalisation** : En-têtes, pieds de page, logos

### Outils de Développement

- **React Hook Form** : Gestion performante des formulaires
- **Zod** : Validation de schémas TypeScript-first
- **React Hot Toast** : Notifications utilisateur élégantes
- **date-fns** : Manipulation de dates moderne et légère

---

## 📁 Architecture des Dossiers

```
gestiondessaisies/
├── prisma/                    # Configuration Prisma
│   ├── schema.prisma          # Modèle de données (User, Saisie, AuditLog)
│   ├── seed.ts                # Script de données initiales
│   └── migrations/            # Migrations de base de données
│
├── src/
│   ├── app/                   # Routes Next.js (App Router)
│   │   ├── (auth)/            # Groupe de routes d'authentification
│   │   │   └── login/         # Page de connexion
│   │   ├── (dashboard)/       # Groupe de routes protégées
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Dashboard principal (KPIs)
│   │   │       ├── saisies/           # Module de gestion des saisies
│   │   │       │   ├── page.tsx       # Liste des saisies
│   │   │       │   ├── new/           # Formulaire de création
│   │   │       │   └── [id]/          # Page de détails
│   │   │       ├── rapports/          # Module de rapports
│   │   │       ├── utilisateurs/      # Gestion des utilisateurs (ADMIN)
│   │   │       └── audit/             # Journal d'audit (ADMIN)
│   │   ├── api/               # Routes API Next.js
│   │   │   └── auth/          # Authentification NextAuth
│   │   └── layout.tsx         # Layout racine
│   │
│   ├── components/            # Composants React réutilisables
│   │   ├── audit/             # Composants du module audit
│   │   ├── dashboard/         # Composants du dashboard
│   │   ├── layout/            # Sidebar, Header
│   │   ├── rapports/          # Composants de rapports
│   │   ├── saisie/            # Composants de saisies
│   │   ├── ui/                # Composants UI de base (badges, inputs)
│   │   └── users/             # Composants de gestion utilisateurs
│   │
│   ├── lib/                   # Bibliothèques et utilitaires
│   │   ├── actions/           # Server Actions Next.js
│   │   │   ├── saisie.actions.ts       # CRUD des saisies
│   │   │   ├── saisie-status.actions.ts # Validation/Annulation
│   │   │   ├── user.actions.ts         # Gestion utilisateurs
│   │   │   └── pdf-export.actions.ts   # Export PDF
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── auth.config.ts     # Callbacks et configuration auth
│   │   ├── prisma.ts          # Client Prisma singleton
│   │   ├── utils/             # Fonctions utilitaires
│   │   │   ├── saisie.utils.ts        # Calculs délais, alertes
│   │   │   └── pdf-generator-client.ts # Génération PDF
│   │   └── validations/        # Schémas Zod
│   │       ├── saisie.schema.ts
│   │       └── user.schema.ts
│   │
│   └── types/                 # Définitions TypeScript
│       └── next-auth.d.ts     # Extension des types NextAuth
│
├── .env                       # Variables d'environnement (non versionné)
├── .env.example              # Exemple de configuration
├── package.json              # Dépendances npm
├── tsconfig.json             # Configuration TypeScript
└── README.md                 # Ce fichier
```

### Rôle des Dossiers Principaux

#### `src/app/` - Routes Next.js
- **App Router** : Système de routing basé sur le système de fichiers
- **Server Components** : Composants rendus côté serveur par défaut
- **Route Groups** : `(auth)` et `(dashboard)` pour organiser les routes
- **Dynamic Routes** : `[id]` pour les pages dynamiques

#### `src/components/` - Composants UI
- **Composants réutilisables** : Badges, inputs, cartes KPI
- **Composants métier** : Formulaires de saisie, tableaux d'audit
- **Composants layout** : Sidebar, Header pour la navigation

#### `src/lib/actions/` - Server Actions
- **Logique backend** : Toute la logique métier côté serveur
- **Sécurité** : Validation Zod, vérification des rôles
- **Base de données** : Accès Prisma, création de logs d'audit
- **Pas d'API REST** : Communication directe client-serveur

#### `prisma/` - Modèle de Données
- **schema.prisma** : Définition des modèles (User, Saisie, AuditLog)
- **migrations/** : Historique des changements de schéma
- **seed.ts** : Données initiales pour le développement

---

## ✨ Fonctionnalités Clés

### 🎛️ Dashboard Dynamique

Le tableau de bord affiche des **indicateurs clés de performance (KPIs)** en temps réel :

- 📦 **Véhicules en dépôt** : Nombre de véhicules actuellement saisis
- 📊 **Saisies du mois** : Statistiques mensuelles
- ⚠️ **Délai dépassé (>90j)** : Véhicules éligibles à la vente aux enchères (Article 296)
  - Carte cliquable pour accéder directement à la liste filtrée
- 📋 **Saisies récentes** : Dernières saisies effectuées

### 📝 Gestion du "Dossier Mère"

#### Enregistrement Complet
- **Informations véhicule** : Châssis (unique), marque, modèle, type, immatriculation
- **Informations conducteur** : Nom, prénom, téléphone
- **Informations infraction** : Motif, lieu, date de saisie
- **Agent responsable** : Enregistrement automatique de l'agent qui effectue la saisie

#### Page de Détails
- **Vue complète** : Toutes les informations du véhicule et du conducteur
- **Historique des actions** : Logs d'audit liés à cette saisie
- **Compteur de délai légal** : Affichage des jours restants avant les 90 jours
- **Badges d'alerte** : Indicateurs visuels selon le délai écoulé

### 🔄 Workflow de Décision

#### Actions Hiérarchiques
- ✅ **Valider la Sortie** : Autorisation de sortie du véhicule (Chef de Bureau/Brigade)
- ❌ **Annuler la Saisie** : Annulation de la saisie (Chef de Bureau/Brigade)

#### Restrictions de Sécurité
- **Rôles autorisés** : `CHEF_BUREAU`, `CHEF_BRIGADE`, `ADMIN`
- **Confirmation requise** : Modal de confirmation avant action irréversible
- **Traçabilité** : Enregistrement automatique dans les logs d'audit

### ⏰ Module d'Alerte Automatique (Article 296)

#### Calcul Automatique des Délais
- **Date de référence** : `dateSaisie` du véhicule
- **Délai légal** : 90 jours conformément à l'Article 296
- **Calcul en temps réel** : Mise à jour automatique chaque jour

#### Niveaux d'Alerte
- 🟢 **0-75 jours** : Statut normal (gris)
- 🟠 **76-89 jours** : Alerte approche (orange) - "Attention, délai proche"
- 🔴 **90+ jours** : Délai dépassé (rouge) - "DÉLAI DÉPASSÉ - VENTE ENCHÈRES"

#### Affichage
- **Badges colorés** : Dans la liste et sur la page de détails
- **Compteur compact** : "X jours restants" ou "Délai dépassé"
- **Filtre automatique** : Carte KPI cliquable pour voir uniquement les véhicules >90j

### 🔍 Recherche & Filtres Avancés

#### Module Saisies
- **Recherche textuelle** : Par numéro de châssis, nom du conducteur, marque
- **Filtre par statut** : Voir uniquement les véhicules avec un statut spécifique
- **Filtre "Vente aux enchères"** : Accès direct depuis le Dashboard

#### Module Audit
- **Recherche par utilisateur** : Nom, prénom ou email
- **Filtre par type d'action** : Voir uniquement certains types d'actions
- **Pagination** : 20 logs par page pour les performances

### 📊 Module de Rapports

#### Statistiques Dynamiques
- **Sélection d'année** : Dropdown avec toutes les années disponibles dans la base
- **Total de saisies** : Nombre total pour l'année sélectionnée
- **Répartition par motif** : Graphique des infractions les plus fréquentes
- **Performance par agent** : Classement des agents les plus actifs

#### Export PDF
- **Génération côté client** : Utilisation de jsPDF
- **Format professionnel** : En-tête "DOUANES MALI", tableau structuré
- **Ligne de signature** : Pour validation officielle
- **Téléchargement automatique** : Fichier PDF prêt à imprimer

### 👥 Gestion des Utilisateurs (ADMIN uniquement)

#### Fonctionnalités
- **Création d'utilisateurs** : Formulaire avec validation complète
- **Suppression sécurisée** : Confirmation obligatoire, empêche auto-suppression
- **Badges de rôles** : Affichage coloré des rôles (ADMIN, CHEF_BUREAU, etc.)
- **Hachage automatique** : Mots de passe hashés avec bcrypt

### 📋 Journal d'Audit (ADMIN uniquement)

#### Traçabilité Complète
- **Toutes les actions** : Création, modification, suppression, validation
- **Informations détaillées** : Qui, quoi, quand, détails
- **Lien vers saisie** : Accès direct à la saisie concernée
- **Pagination** : Performance optimisée pour grandes quantités de logs

---

## 🚀 Installation & Configuration

### Prérequis

- **Node.js** : Version 18.x ou supérieure
- **PostgreSQL** : Version 14.x ou supérieure
- **npm** ou **yarn** : Gestionnaire de paquets

### Étapes d'Installation

#### 1. Cloner le Projet

```bash
git clone <url-du-repo>
cd gestiondessaisies
```

#### 2. Installer les Dépendances

```bash
npm install
# ou
yarn install
```

#### 3. Configuration de l'Environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/gestion_saisies_db?schema=public"

# Secret pour NextAuth (générez une chaîne aléatoire)
AUTH_SECRET="votre-secret-tres-long-et-aleatoire-ici"

# URL de l'application (pour le développement)
NEXTAUTH_URL="http://localhost:3000"
```

**⚠️ Important** : Remplacez `VOTRE_MOT_DE_PASSE` par votre mot de passe PostgreSQL réel.

**🔐 Génération d'un AUTH_SECRET** :
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Sur Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### 4. Configuration de la Base de Données

```bash
# Générer le client Prisma
npx prisma generate

# Créer la base de données et appliquer les migrations
npx prisma migrate dev --name init

# Remplir la base avec des données initiales (optionnel)
npx prisma db seed
```

#### 5. Lancer l'Application

```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

### Compte Administrateur Initial

Après le seed, vous pouvez vous connecter avec :
- **Email** : `admin@douanes.ml`
- **Mot de passe** : `admin123` (à changer en production !)

---

## 🔒 Sécurité (RBAC)

Le système implémente un **contrôle d'accès basé sur les rôles (RBAC)** avec 5 niveaux de permissions :

### Rôles et Permissions

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Administrateur système | ✅ Accès complet à toutes les fonctionnalités<br>✅ Gestion des utilisateurs<br>✅ Journal d'audit<br>✅ Toutes les actions de saisie |
| **CHEF_BUREAU** | Chef de Bureau | ✅ Validation/Annulation de saisies<br>✅ Consultation complète<br>✅ Rapports<br>❌ Gestion utilisateurs<br>❌ Journal d'audit |
| **CHEF_BRIGADE** | Chef de Brigade | ✅ Validation/Annulation de saisies<br>✅ Consultation complète<br>✅ Rapports<br>❌ Gestion utilisateurs<br>❌ Journal d'audit |
| **AGENT_BRIGADE** | Agent de Brigade | ✅ Création de saisies<br>✅ Consultation de ses saisies<br>❌ Validation/Annulation<br>❌ Gestion utilisateurs |
| **AGENT_CONSULTATION** | Agent Consultation | ✅ Consultation seule (lecture)<br>❌ Toutes les modifications |

### Protection des Routes

- **Middleware Next.js** : Vérification automatique de l'authentification
- **Server Actions** : Vérification des rôles avant chaque action
- **Composants UI** : Affichage conditionnel selon les permissions

### Sécurité des Mots de Passe

- **Hachage bcrypt** : Salt rounds = 10
- **Pas de stockage en clair** : Tous les mots de passe sont hashés
- **Validation côté serveur** : Vérification avec `bcrypt.compare()`

---

## 🔧 Maintenance & Évolutions

### Ajouter une Nouvelle Année dans les Rapports

Le système récupère automatiquement toutes les années disponibles dans la base de données. **Aucune modification de code n'est nécessaire** :

1. Les années sont calculées dynamiquement depuis la table `Saisie`
2. Le sélecteur d'année s'adapte automatiquement
3. Les statistiques se mettent à jour selon l'année sélectionnée

### Ajouter un Nouveau Type d'Action d'Audit

Pour ajouter un nouveau type d'action dans les logs d'audit :

1. **Dans votre Server Action** (`src/lib/actions/`), utilisez un nom d'action descriptif :
   ```typescript
   await prisma.auditLog.create({
     data: {
       action: 'NOUVELLE_ACTION', // Nom en MAJUSCULES avec underscores
       details: 'Description de l\'action',
       userId: session.user.id,
       saisieId: saisieId || null,
     },
   });
   ```

2. **Le filtre dans le module Audit** s'adaptera automatiquement car il récupère tous les types distincts depuis la base

### Ajouter un Nouveau Rôle

1. **Modifier le schéma Prisma** (`prisma/schema.prisma`) :
   ```prisma
   enum Role {
     ADMIN
     CHEF_BUREAU
     CHEF_BRIGADE
     AGENT_BRIGADE
     AGENT_CONSULTATION
     NOUVEAU_ROLE  // Ajouter ici
   }
   ```

2. **Créer une migration** :
   ```bash
   npx prisma migrate dev --name add_nouveau_role
   ```

3. **Mettre à jour les vérifications de rôles** dans `src/lib/actions/` et les composants UI

### Modifier le Délai Légal (90 jours)

Le délai de 90 jours est défini dans `src/lib/utils/saisie.utils.ts` :

```typescript
// Constante pour le délai légal (Article 296)
export const DELAI_LEGAL_JOURS = 90;
```

Modifiez cette constante et toutes les références seront mises à jour automatiquement.

### Sauvegarde de la Base de Données

**Recommandation** : Mettre en place des sauvegardes régulières de PostgreSQL :

```bash
# Sauvegarde manuelle
pg_dump -U postgres gestion_saisies_db > backup_$(date +%Y%m%d).sql

# Restauration
psql -U postgres gestion_saisies_db < backup_YYYYMMDD.sql
```

---

## 🤝 Contribution

### Structure des Commits

Utilisez des messages de commit clairs :
- `feat:` : Nouvelle fonctionnalité
- `fix:` : Correction de bug
- `docs:` : Documentation
- `refactor:` : Refactorisation
- `style:` : Formatage, style

### Code Style

- **TypeScript strict** : Tous les fichiers doivent être typés
- **Commentaires en français** : Tous les commentaires doivent être en français
- **Nommage** : camelCase pour les variables, PascalCase pour les composants
- **ESLint** : Respecter les règles ESLint configurées

---

## 📞 Support

Pour toute question ou problème :
- **Email** : support@douanes.ml
- **Documentation technique** : Consultez les commentaires dans le code
- **Issues** : Utilisez le système de tickets du projet

---

## 📄 Licence

Ce projet est développé pour les **Douanes du Mali** et est destiné à un usage interne.

---

## 🙏 Remerciements

- **Next.js** : Framework React moderne
- **Prisma** : ORM type-safe
- **Tailwind CSS** : Framework CSS utilitaire
- **Lucide** : Bibliothèque d'icônes

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 0.1.0  
**Statut** : ✅ Production Ready
