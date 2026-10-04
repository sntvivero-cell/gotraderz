'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { supabase } from '@/app/lib/supabaseClient';
import { PASSWORD_MIN_LENGTH } from '@/app/lib/authValidation';
import { Toast } from '@/app/components/publish/Toast';

type Status = 'checking' | 'ready' | 'invalid';

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    // Investigación previa (GoTrueClient.ts de @supabase/auth-js, el SDK que ya usa
    // este proyecto con su flowType 'implicit' por defecto): el link de recuperación
    // llega como #access_token=...&refresh_token=...&type=recovery en el hash.
    // getSession() hace `await this.initializePromise` ANTES de devolver nada, y ese
    // mismo initializePromise es el que procesa ese hash (lo valida, guarda la
    // sesión si el link era válido, y SOLO EN ESE CASO limpia el hash él mismo) — así
    // que un único getSession() tras el mount ya refleja el resultado final, sin
    // necesidad de suscribirse al evento PASSWORD_RECOVERY: ese evento se dispara en
    // un setTimeout(0) aparte y haría falta ganarle una carrera real para no
    // perderlo si llegara a dispararse antes de suscribirnos.
    //
    // Importante, no asumido — comprobado en el código: si el link es inválido o ya
    // fue usado, Supabase redirige con #error=access_denied&error_code=otp_expired
    // en vez de tokens, y en ESE camino el SDK NO limpia el hash (el early-throw por
    // params.error ocurre antes de la línea que lo haría). Por eso el cleanup manual
    // de abajo es necesario de verdad, no redundante con lo que ya hace el SDK.
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? 'ready' : 'invalid');

      if (typeof window !== 'undefined' && (window.location.hash || window.location.search)) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    if (updateError) {
      setIsSaving(false);
      setError(updateError.message);
      return;
    }

    // scope 'others': cierra cualquier otra sesión activa con la contraseña vieja
    // (otro navegador/dispositivo) sin disparar SIGNED_OUT en ESTA pestaña — la
    // propia documentación del SDK lo aclara ("no SIGNED_OUT event is fired"), así
    // que el push de abajo no choca con ningún listener que reaccione a ese evento
    // (ej. alguna redirección a /login en otra parte de la app).
    await supabase.auth.signOut({ scope: 'others' });

    setIsSaving(false);
    setShowSuccessToast(true);
    setTimeout(() => router.push('/'), 900);
  }

  if (status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-[#F4F6F8]">
        <p className="text-xs text-[#5C6773]">Checking your link…</p>
      </main>
    );
  }

  if (status === 'invalid') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4 text-[#F4F6F8]">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-[#232D38] bg-[#131A22] p-6 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FF3D3D]/10">
              <ShieldAlert className="h-5 w-5 text-[#FF3D3D]" />
            </div>
            <h1 className="mt-3 text-base font-extrabold tracking-tight">This link is invalid or has expired</h1>
            <p className="mt-2 text-xs text-[#8792A0]">
              Password reset links can only be used once and expire after a while. Request a new one below.
            </p>
            <Link
              href="/forgot-password"
              className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-[#2E9BF5] px-5
                         py-2.5 text-xs font-semibold text-white transition hover:bg-[#2589db]"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0B0F14] px-4 text-[#F4F6F8]">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[#232D38] bg-[#131A22] p-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2E9BF5]/10">
              <KeyRound className="h-5 w-5 text-[#2E9BF5]" />
            </div>
            <h1 className="mt-3 text-base font-extrabold tracking-tight">Set a new password</h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#8792A0]">New password</label>
              <input
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#232D38] bg-[#0B0F14] px-3 py-2 text-sm
                           text-[#F4F6F8] placeholder:text-[#5C6773] outline-none transition
                           focus:border-[#2E9BF5]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#8792A0]">Confirm new password</label>
              <input
                type="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[#232D38] bg-[#0B0F14] px-3 py-2 text-sm
                           text-[#F4F6F8] placeholder:text-[#5C6773] outline-none transition
                           focus:border-[#2E9BF5]"
              />
            </div>

            {error && (
              <p className="rounded-xl border border-[#FF3D3D]/40 bg-[#FF3D3D]/10 px-3 py-2.5 text-xs font-semibold text-[#FF3D3D]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="mt-2 rounded-full bg-[#2E9BF5] px-5 py-2.5 text-xs font-semibold text-white
                         transition hover:bg-[#2589db] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        </div>
      </div>

      {showSuccessToast && <Toast message="Password updated. Redirecting…" />}
    </main>
  );
}
