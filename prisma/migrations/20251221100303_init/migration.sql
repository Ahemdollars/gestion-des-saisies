-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CHEF_BUREAU', 'CHEF_BRIGADE', 'AGENT_BRIGADE', 'AGENT_CONSULTATION');

-- CreateEnum
CREATE TYPE "StatutSaisie" AS ENUM ('SAISI_EN_COURS', 'VALIDE_POUR_DEPOT', 'EN_DEPOT', 'SORTIE_AUTORISEE', 'SORTIE_EFFECTUEE', 'VENTE_ENCHERES');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saisies" (
    "id" TEXT NOT NULL,
    "numeroChassis" TEXT NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "typeVehicule" TEXT NOT NULL,
    "immatriculation" TEXT,
    "nomConducteur" TEXT NOT NULL,
    "telephoneConducteur" TEXT NOT NULL,
    "motifInfraction" TEXT NOT NULL,
    "dateSaisie" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lieuSaisie" TEXT NOT NULL,
    "statut" "StatutSaisie" NOT NULL DEFAULT 'SAISI_EN_COURS',
    "agentId" TEXT NOT NULL,

    CONSTRAINT "saisies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "dateAction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "saisieId" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "saisies_numeroChassis_key" ON "saisies"("numeroChassis");

-- AddForeignKey
ALTER TABLE "saisies" ADD CONSTRAINT "saisies_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_saisieId_fkey" FOREIGN KEY ("saisieId") REFERENCES "saisies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
