import bcrypt from 'bcrypt';
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
  // Le mot de passe 'admin123' est hashé avec bcrypt (salt rounds: 10)
  // Sécurité : Le mot de passe n'est jamais stocké en texte clair
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@douanes.ml',
      motDePasse: hashedPassword, // Utilisez la version hachée ici
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

