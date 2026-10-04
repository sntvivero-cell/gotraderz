'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Check, Copy, MessageCircle, Send, Share2 } from 'lucide-react';
import { buildShareText, buildShareUrl } from '@/app/lib/tradeShare';
import type { TradePost } from '@/app/types/trades';

interface ShareTradeButtonProps {
  trade: TradePost;
  // 'icon': botón compacto de 24px para vivir junto a los otros iconos de TradeCard.
  // 'full': botón grande con label "Share", para la página pública del trade y el
  // banner de "recién publicado" — ahí sí tiene que ser imposible no verlo.
  variant?: 'icon' | 'full';
  className?: string;
}

export function ShareTradeButton({ trade, variant = 'icon', className = '' }: ShareTradeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierre con Esc o clic afuera — mismo patrón que el menú móvil de HomeFeed.
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  // stopPropagation: en TradeCard este botón vive al lado del Bookmark, fuera de
  // cualquier <Link>, pero se mantiene por consistencia con el resto de los
  // controles de la card (ver handleToggleSave/handleDelete) y por si el layout
  // cambia más adelante.
  async function handleShareClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    // navigator.share abre el picker nativo del sistema (WhatsApp/Telegram/Discord
    // si están instalados) — se prioriza en móvil, que es donde existe casi siempre y
    // da la mejor experiencia. El popover de abajo es el fallback para desktop.
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'GoTraderz',
          text: buildShareText(trade),
          url: buildShareUrl(trade.trade_group_id, 'share-native'),
        });
      } catch (err) {
        // El usuario cerró el picker sin elegir nada: no es un error real, no hay
        // nada que mostrar ni loguear.
        if (err instanceof Error && err.name === 'AbortError') return;
      }
      return;
    }

    setIsOpen((open) => !open);
  }

  async function handleCopyLink() {
    const url = buildShareUrl(trade.trade_group_id, 'share-copy');
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard API bloqueada (permisos, navegador viejo): no hay fallback
      // razonable acá — el link sigue disponible en la barra de direcciones.
    }
  }

  const shareText = buildShareText(trade);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${buildShareUrl(trade.trade_group_id, 'share-whatsapp')}`
  )}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    buildShareUrl(trade.trade_group_id, 'share-telegram')
  )}&text=${encodeURIComponent(shareText)}`;

  const buttonClasses =
    variant === 'full'
      ? 'flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#2E9BF5] px-5 text-sm font-semibold text-white transition hover:bg-[#2589db]'
      : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#232D38] text-[#8792A0] transition hover:border-[#2E9BF5] hover:text-[#2E9BF5]';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleShareClick}
        title="Share this trade"
        aria-label="Share this trade"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={buttonClasses}
      >
        <Share2 className={variant === 'full' ? 'h-4 w-4' : 'h-3 w-3'} />
        {variant === 'full' && 'Share'}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Share this trade"
          className="absolute right-0 top-full z-30 mt-2 w-60 rounded-2xl border border-[#232D38] bg-[#131A22] p-2 shadow-xl"
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-[#F4F6F8] transition hover:bg-[#0B0F14]"
          >
            <MessageCircle className="h-4 w-4 shrink-0 text-[#22C55E]" />
            WhatsApp
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-[#F4F6F8] transition hover:bg-[#0B0F14]"
          >
            <Send className="h-4 w-4 shrink-0 text-[#2E9BF5]" />
            Telegram
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm font-semibold text-[#F4F6F8] transition hover:bg-[#0B0F14]"
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-[#22C55E]" />
            ) : (
              <Copy className="h-4 w-4 shrink-0 text-[#8792A0]" />
            )}
            <span>
              {copied ? 'Copied!' : 'Copy link'}
              {/* Discord no tiene un intent web de "compartir" como WhatsApp/Telegram
                 — la única forma es pegar el link a mano en un canal/DM. */}
              <span className="block text-[10px] font-normal text-[#5C6773]">Paste it in Discord</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
