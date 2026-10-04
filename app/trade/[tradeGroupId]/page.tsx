import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { fetchPublicTradeGroup, buildShareText } from '@/app/lib/tradeShare';
import { TradeCard } from '@/app/components/trades/TradeCard';
import { ShareTradeButton } from '@/app/components/trades/ShareTradeButton';
import { MessageTraderCta } from '@/app/components/trades/MessageTraderCta';

interface TradePageProps {
  params: Promise<{ tradeGroupId: string }>;
  searchParams: Promise<{ published?: string }>;
}

// Páginas efímeras: el post que describen puede borrarse en cualquier momento (edit,
// delete, mark-as-completed, o el cleanup diario a los 15 días — ver comentario de
// `updated_at` en app/types/trades.ts). 5 minutos es suficiente para que WhatsApp/
// Telegram/Discord no repitan el fetch en cada click sin servir contenido muy viejo
// si el post cambió o desapareció mientras tanto.
export const revalidate = 300;

export async function generateMetadata({ params }: TradePageProps): Promise<Metadata> {
  const { tradeGroupId } = await params;
  const trade = await fetchPublicTradeGroup(tradeGroupId);

  if (!trade) {
    return {
      title: 'Trade not found — GoTraderz',
      description: 'This trade post is no longer available on GoTraderz.',
      robots: { index: false, follow: true },
    };
  }

  const title = `${trade.username ?? 'A trainer'}'s trade on GoTraderz`;
  const description = buildShareText(trade);
  const path = `/trade/${tradeGroupId}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'GoTraderz',
      type: 'website',
      locale: 'en_US',
      // Sin `images` acá a propósito: opengraph-image.tsx (mismo segmento) genera la
      // imagen dinámica y Next la inyecta solo en el <head>. Si esto definiera
      // `images` también, terminarían DOS <meta property="og:image"> compitiendo —
      // el archivo siempre gana igual, así que mejor no declarar la propia.
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    // Estas páginas se borran a los 15 días (cleanup diario) y describen una
    // publicación individual, no contenido de referencia — no vale la pena que
    // Google las indexe para que después den 404. `follow: true` para que el rastreo
    // siga navegando hacia "/" desde acá sin problema.
    robots: { index: false, follow: true },
  };
}

export default async function TradeDetailPage({ params, searchParams }: TradePageProps) {
  const { tradeGroupId } = await params;
  const { published } = await searchParams;
  const trade = await fetchPublicTradeGroup(tradeGroupId);

  if (!trade) notFound();

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#F4F6F8]">
      <header className="sticky top-0 z-10 border-b border-[#232D38] bg-[#0B0F14]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#232D38]
                       text-[#8792A0] transition hover:border-[#3A4C63] hover:text-[#F4F6F8]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold tracking-tight">Trade post</h1>
            <p className="text-xs text-[#5C6773]">Shared from GoTraderz</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {published === '1' && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-[#22C55E]/40 bg-[#22C55E]/10 px-3.5 py-3 text-xs font-semibold text-[#22C55E]">
            <Megaphone className="h-4 w-4 shrink-0" />
            Your trade is live — share it where you trade.
          </div>
        )}

        <div className="mb-5 flex flex-col items-center gap-3 rounded-2xl border border-[#2E9BF5]/30 bg-[#131A22] p-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-bold text-[#F4F6F8]">Help this trade travel</p>
            <p className="text-xs text-[#8792A0]">Share it on WhatsApp, Telegram, or Discord.</p>
          </div>
          <ShareTradeButton trade={trade} variant="full" />
        </div>

        <TradeCard trade={trade} currentUserId={null} />

        <div className="mt-5 flex gap-2">
          <MessageTraderCta traderUserId={trade.user_id} loginNext={`/trade/${tradeGroupId}`} />
          <Link
            href="/"
            className="flex-1 rounded-full border border-[#232D38] px-4 py-2.5 text-center text-xs font-semibold
                       text-[#8792A0] transition hover:border-[#3A4C63] hover:text-[#F4F6F8]"
          >
            Browse more trades
          </Link>
        </div>
      </div>
    </main>
  );
}
