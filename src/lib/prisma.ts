import { PrismaClient } from '@prisma/client';

// Instance globale du client Prisma
// Évite de créer plusieurs instances en développement (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Création ou réutilisation de l'instance Prisma
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// En développement, on garde l'instance dans globalThis pour éviter les multiples connexions
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

