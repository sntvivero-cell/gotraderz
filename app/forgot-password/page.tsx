import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/app/components/auth/ForgotPasswordForm';

// Server Component wrapper solo para poder exportar `metadata` (un Client Component
// no puede — mismo motivo por el que app/page.tsx es un wrapper fino alrededor de
// HomeFeed, ver comentario ahí). Un paso de un flujo de sesión, sin valor de
// indexación propio: noindex explícito acá, y no se agrega a sitemap.ts (que ya es
// una lista blanca de rutas públicas de contenido, no una lista negra — esta ruta
// simplemente nunca estuvo en ella).
export const metadata: Metadata = {
  title: 'Forgot password — GoTraderz',
  description: 'Reset your GoTraderz password.',
  robots: { index: false, follow: true },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
