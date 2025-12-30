// Export du type Role pour éviter l'import de @prisma/client dans Edge Runtime
// Ce fichier permet d'utiliser Role dans le middleware sans charger Prisma Client
// qui n'est pas compatible avec Edge Runtime
export enum Role {
  ADMIN = 'ADMIN',
  CHEF_BUREAU = 'CHEF_BUREAU',
  CHEF_BRIGADE = 'CHEF_BRIGADE',
  AGENT_BRIGADE = 'AGENT_BRIGADE',
  AGENT_CONSULTATION = 'AGENT_CONSULTATION',
}

