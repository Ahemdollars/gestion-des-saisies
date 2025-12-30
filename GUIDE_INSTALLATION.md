\# 🏛️ SYSTÈME DE GESTION DES SAISIES - DOUANES DU MALI

> \*\*Guide d'installation et de prise en main pour l'administrateur local.\*\*



Ce document vous accompagne pas à pas, de la réception du dossier jusqu'au lancement de l'application sur votre ordinateur.



---



\## 🛠️ 1. Préparation de l'environnement



L'application nécessite deux outils principaux pour fonctionner :

1\. \*\*Base de données\*\* : PostgreSQL (Déjà installé chez vous).

2\. \*\*Moteur d'exécution\*\* : Node.js (À installer).



\### Installation de Node.js

\- Téléchargez la version \*\*LTS\*\* (recommandée) sur : \[https://nodejs.org/](https://nodejs.org/)

\- Lancez l'installateur et cliquez sur "Suivant" partout. 

\- Pour vérifier que c'est bon, ouvrez un terminal et tapez : `node -v`. Vous devriez voir un numéro de version.



---



\## 📂 2. Décompression et Configuration



1\. \*\*Extraction\*\* : Décompressez le fichier `.zip` dans le dossier de votre choix (ex: `Documents/GestionSaisies`).

2\. \*\*Configuration de la base de données\*\* :

&nbsp;  - Ouvrez votre outil PostgreSQL (pgAdmin).

&nbsp;  - Créez une nouvelle base de données nommée `gestion\_saisies\_db`.

3\. \*\*Liaison du logiciel\*\* :

&nbsp;  - À la racine du dossier, créez un fichier nommé `.env`.

&nbsp;  - Copiez-collez la ligne suivante à l'intérieur en remplaçant par vos accès :

&nbsp;    `DATABASE\_URL="postgresql://VOTRE\_UTILISATEUR:VOTRE\_MOT\_DE\_PASSE@localhost:5432/gestion\_saisies\_db?schema=public"`

&nbsp;  - Ajoutez également : `NEXTAUTH\_SECRET="une\_cle\_secrete\_aleatoire\_tres\_longue"`



---



\## 🚀 3. Lancement du Système



Ouvrez un terminal dans le dossier du projet et exécutez les commandes suivantes dans l'ordre :



1\. \*\*Installer les bibliothèques\*\* :

&nbsp;  ```bash

&nbsp;  npm install

