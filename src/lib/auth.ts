import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

// Instance principale de NextAuth
// Utilise la configuration définie dans auth.config.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
});

