import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Composant Input réutilisable avec styles cohérents
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            // Style premium : bordure fine gris clair, coins arrondis, texte noir
            'w-full rounded-lg border px-4 py-2.5 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200',
            // Gestion des erreurs : bordure rouge si erreur
            error
              ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
              : 'border-slate-200',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

