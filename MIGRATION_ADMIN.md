# Migration du Mot de Passe Admin

## Problème Identifié

Le premier utilisateur Admin a été créé via le script `prisma/seed.ts` avec un mot de passe en **texte clair** (`admin123`), alors que les nouveaux utilisateurs créés via l'interface utilisent **bcrypt** pour hacher les mots de passe.

## Solution

Vous avez **deux options** pour résoudre ce problème :

### Option 1 : Recréer l'Admin via l'Interface (Recommandé)

1. Connectez-vous avec l'admin existant (mot de passe en texte clair fonctionne encore temporairement)
2. Allez sur `/dashboard/utilisateurs`
3. Créez un nouvel utilisateur Admin avec un mot de passe sécurisé
4. Déconnectez-vous et reconnectez-vous avec le nouvel admin
5. Supprimez l'ancien admin si nécessaire

### Option 2 : Mettre à Jour le Mot de Passe en Base de Données

Si vous préférez garder le même utilisateur, vous devez hasher son mot de passe manuellement :

```sql
-- Exemple avec Node.js (dans un script temporaire)
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash('admin123', 10);

-- Puis mettre à jour en SQL
UPDATE users SET "motDePasse" = '<hash_généré>' WHERE email = 'admin@douanes.ml';
```

**Note** : Cette option nécessite d'exécuter du code Node.js pour générer le hash, puis de mettre à jour la base de données.

## Vérification

Après la migration, testez la connexion avec le mot de passe en clair. Si la connexion échoue, c'est que le hash a bien été appliqué.

