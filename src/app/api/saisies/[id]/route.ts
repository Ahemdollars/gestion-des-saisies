import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Route API pour récupérer une saisie par son ID
// Utilisée par la page d'édition pour charger les données
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérification de l'authentification
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Récupération de la saisie avec les relations
    const saisie = await prisma.saisie.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            prenom: true,
            nom: true,
            email: true,
          },
        },
      },
    });

    if (!saisie) {
      return NextResponse.json(
        { error: 'Saisie non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(saisie);
  } catch (error) {
    console.error('Erreur lors de la récupération de la saisie:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

