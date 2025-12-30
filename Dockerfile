# Utilisation de Node.js v20 (LTS) sur une base Alpine légère et sécurisée
FROM node:20-alpine

# Définition du dossier de travail dans le conteneur
WORKDIR /app

# Installation des bibliothèques système nécessaires à Prisma sur Alpine
RUN apk add --no-cache libc6-compat openssl

# Copie des fichiers de dépendances en premier pour optimiser le cache Docker
COPY package*.json ./
COPY prisma ./prisma/

# Installation propre des modules Node.js
RUN npm install --fetch-retries=5 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

# Copie de l'intégralité de votre code source
COPY . .

# Génération du client Prisma pour l'accès à la base de données
RUN npx prisma generate

# Construction de l'application Next.js (Build de production)
RUN npm run build

# Port utilisé par l'application
EXPOSE 3000

# Commande de démarrage officielle
CMD ["npm", "start"]