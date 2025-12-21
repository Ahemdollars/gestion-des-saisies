'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

// Provider de session NextAuth
// Enveloppe l'application pour fournir la session aux composants clients
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

