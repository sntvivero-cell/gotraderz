import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/app/components/auth/ResetPasswordForm';

// Server Component wrapper solo para poder exportar `metadata` (ver mismo comentario
// en app/forgot-password/page.tsx). Página de un solo uso por link de email, con
// tokens de sesión en el hash mientras se procesa — noindex explícito, y afuera de
// sitemap.ts (lista blanca de rutas públicas de contenido).
export const metadata: Metadata = {
  title: 'Reset password — GoTraderz',
  description: 'Set a new password for your GoTraderz account.',
  robots: { index: false, follow: true },
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
