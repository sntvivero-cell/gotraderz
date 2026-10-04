import Link from 'next/link';
import { Compass } from 'lucide-react';

// Se dispara desde notFound() en page.tsx: publicación borrada/completada/editada
// fuera de este trade_group_id, o un tradeGroupId que ni siquiera es un UUID válido.
// Nunca un error 500 — fetchPublicTradeGroup() ya valida el UUID y devuelve null en
// ambos casos (ver app/lib/tradeShare.ts).
export default function TradeNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4 text-center text-[#F4F6F8]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E9BF5]/10">
        <Compass className="h-5 w-5 text-[#2E9BF5]" />
      </div>
      <h1 className="mt-4 text-lg font-extrabold tracking-tight">This trade is no longer available</h1>
      <p className="mt-2 max-w-sm text-sm text-[#8792A0]">
        It may have been completed, edited, or removed by its owner. Browse the feed to find more trades.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-[#2E9BF5] px-5 py-2.5 text-sm font-semibold text-white transition
                   hover:bg-[#2589db]"
      >
        Browse trades
      </Link>
    </main>
  );
}
