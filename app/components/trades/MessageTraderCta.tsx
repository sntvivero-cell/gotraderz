'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useUser } from '@/app/hooks/useUser';
import { getOrCreateConversation } from '@/app/lib/conversations';

interface MessageTraderCtaProps {
  traderUserId: string;
  // Ruta relativa a volver después de iniciar sesión (ver ?next= en /login) — siempre
  // la propia página pública del trade, para que un visitante sin cuenta no pierda el
  // link que le compartieron.
  loginNext: string;
}

// CTA grande para visitantes de la página pública /trade/[tradeGroupId] — distinto
// del icono de mensaje que ya tiene TradeCard (ese ignora si hay sesión real: acá sí
// nos importa, porque si la persona YA está logueada (ej. abrió su propio link
// compartido, o ya tenía sesión en otra pestaña) tiene que poder escribir directo en
// vez de que la mandemos a /login de nuevo.
export function MessageTraderCta({ traderUserId, loginNext }: MessageTraderCtaProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El propio dueño abrió su link compartido: no tiene sentido ofrecerle mandarse un
  // mensaje a sí mismo.
  if (!isLoading && user?.id === traderUserId) return null;

  async function handleClick() {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(loginNext)}`);
      return;
    }

    setError(null);
    setIsStarting(true);

    try {
      const conversationId = await getOrCreateConversation(user.id, traderUserId);
      router.push(`/mensajes/${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the conversation.');
      setIsStarting(false);
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isStarting || isLoading}
        className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#2E9BF5] px-4 py-2.5 text-xs
                   font-semibold text-white transition hover:bg-[#2589db] disabled:cursor-not-allowed
                   disabled:opacity-50"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {isStarting ? 'Opening…' : 'Message trader'}
      </button>
      {error && <p className="mt-1.5 text-[10px] font-semibold text-[#FF3D3D]">{error}</p>}
    </div>
  );
}
