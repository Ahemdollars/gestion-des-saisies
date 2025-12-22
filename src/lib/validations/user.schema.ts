import { z } from 'zod';
import { Role } from '@prisma/client';

// Schéma de validation pour la création d'un utilisateur
// Utilise Zod pour valider tous les champs obligatoires
export const createUserSchema = z.object({
  // Nom de l'utilisateur (obligatoire, minimum 2 caractères)
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  
  // Prénom de l'utilisateur (obligatoire, minimum 2 caractères)
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  
  // Email de l'utilisateur (obligatoire, format email valide, unique en base)
  email: z
    .string()
    .email('Format d\'email invalide')
    .min(5, 'L\'email doit contenir au moins 5 caractères')
    .max(100, 'L\'email ne peut pas dépasser 100 caractères'),
  
  // Mot de passe (obligatoire, minimum 6 caractères pour la sécurité)
  motDePasse: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  
  // Rôle de l'utilisateur (obligatoire, doit être un des rôles définis)
  role: z.nativeEnum(Role, {
    message: 'Rôle invalide',
  }),
});

// Type TypeScript dérivé du schéma Zod
// Permet d'avoir l'autocomplétion et la vérification de type
export type CreateUserInput = z.infer<typeof createUserSchema>;

