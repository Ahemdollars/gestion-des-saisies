import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@douanes.ml' },
  });

  if (existingAdmin) {
    console.log('✅ L\'utilisateur admin existe déjà, seed ignoré.');
    return;
  }

  // Créer l'utilisateur admin
  // NOTE: Le mot de passe 'admin123' est temporaire et non hashé.
  // Dans la production, il faudra utiliser bcrypt pour hasher les mots de passe.
  // Pour l'instant, on simule avec une chaîne simple pour le développement.
  const admin = await prisma.user.create({
    data: {
      email: 'admin@douanes.ml',
      motDePasse: 'admin123', // TODO: Hasher avec bcrypt en production
      nom: 'Super',
      prenom: 'Admin',
      role: Role.ADMIN,
    },
  });

  console.log('✅ Utilisateur admin créé avec succès:', {
    id: admin.id,
    email: admin.email,
    role: admin.role,
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

