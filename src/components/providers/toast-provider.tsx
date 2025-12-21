'use client';

import { Toaster } from 'react-hot-toast';

// Provider pour les notifications toast
// Affiche les notifications en haut de l'écran
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Style des notifications de succès (vert)
        success: {
          duration: 4000,
          style: {
            background: '#10b981',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        // Style des notifications d'erreur (rouge)
        error: {
          duration: 4000,
          style: {
            background: '#ef4444',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
      }}
    />
  );
}

