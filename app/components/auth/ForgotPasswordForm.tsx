'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';

// Mismo criterio de "sin reenvíos seguidos" que ya usa el resto de la app (ver
// handleResendConfirmation en app/login/page.tsx), pero con cuenta atrás visible en
// vez de un simple disabled — acá sí importa, porque Supabase devuelve su propio
// error de rate limit si se insiste antes de este margen (ver más abajo).
const RESEND_COOLDOWN_SECONDS = 60;

type NoticeType = 'success' | 'rate-limit' | 'error';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: NoticeType; message: string } | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((seconds) => (seconds <= 1 ? 0 : seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (cooldownSeconds > 0) return;

    setIsSubmitting(true);
    setNotice(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsSubmitting(false);
    // Arranca el cooldown tanto en éxito como en error: reintentar de inmediato tras
    // un rate limit es inútil, y en cualquier otro caso tampoco tiene sentido permitir
    // reenvíos instantáneos.
    setCooldownSeconds(RESEND_COOLDOWN_SECONDS);

    if (error) {
      // Código real que expone @supabase/auth-js para este caso específico (ver
      // error-codes.ts del paquete instalado) — se chequea por código Y por status
      // como respaldo, por si una versión futura del API cambia el string del code
      // pero mantiene el 429.
      if (error.code === 'over_email_send_rate_limit' || error.status === 429) {
        setNotice({ type: 'rate-limit', message: 'Please wait a minute before requesting another link.' });
        return;
      }
      // Cualquier OTRO error (red caída, Supabase con un 5xx, etc.): un mensaje
      // genérico de fallo, distinto del de éxito — no decimos "revisá tu email"
      // cuando sabemos que la llamada ni llegó a completarse. Esto no delata si la
      // cuenta existe: Supabase nunca devuelve un error por "email no encontrado" en
      // este endpoint a propósito (evita que alguien use este formulario para
      // enumerar qué emails están registrados), así que ningún branch de error de
      // acá puede revelarlo tampoco.
      setNotice({ type: 'error', message: 'Something went wrong. Please try again in a moment.' });
      return;
    }

    setNotice({
      type: 'success',
      message: "If an account exists for that email, we've sent a link to reset your password.",
    });
  }

  const noticeStyles: Record<NoticeType, string> = {
    success: 'border-[#2E9BF5]/40 bg-[#2E9BF5]/10 text-[#2E9BF5]',
    'rate-limit': 'border-[#FFCB05]/40 bg-[#FFCB05]/10 text-[#FFCB05]',
    error: 'border-[#FF3D3D]/40 bg-[#FF3D3D]/10 text-[#FF3D3D]',
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4 text-[#F4F6F8]">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[#8792A0] transition hover:text-[#F4F6F8]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to log in
        </Link>

        <div className="rounded-2xl border border-[#232D38] bg-[#131A22] p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E9BF5]/10">
              <Mail className="h-5 w-5 text-[#2E9BF5]" />
            </div>
            <h1 className="mt-3 text-base font-extrabold tracking-tight">Forgot your password?</h1>
            <p className="mt-1 text-xs text-[#5C6773]">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#8792A0]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="trainer@example.com"
                className="w-full rounded-lg border border-[#232D38] bg-[#0B0F14] px-3 py-2 text-sm
                           text-[#F4F6F8] placeholder:text-[#5C6773] outline-none transition
                           focus:border-[#2E9BF5]"
              />
            </div>

            {notice && (
              <p className={`rounded-xl border px-3 py-2.5 text-xs font-semibold ${noticeStyles[notice.type]}`}>
                {notice.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || cooldownSeconds > 0}
              className="mt-2 rounded-full bg-[#2E9BF5] px-5 py-2.5 text-xs font-semibold text-white
                         transition hover:bg-[#2589db] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Sending…'
                : cooldownSeconds > 0
                  ? `Send reset link (${cooldownSeconds}s)`
                  : 'Send reset link'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
