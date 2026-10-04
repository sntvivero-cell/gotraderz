import { cache } from 'react';
import { supabaseServer } from '@/app/lib/supabaseServer';
import { TRADE_SELECT, groupTradeRows, type RawTradeRow } from '@/app/lib/tradeGrouping';
import { siteUrl } from '@/app/lib/siteUrl';
import type { PokemonVariant, TradePost } from '@/app/types/trades';

// Fuente única de verdad para todo lo que necesita la feature de "compartir un
// trade": la página pública /trade/[tradeGroupId], su generateMetadata, su
// opengraph-image.tsx, y el ShareTradeButton (cliente). Repartir esto en varios
// archivos arriesgaba que el texto/URL que se comparte terminara desincronizado del
// que se muestra en la página.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidTradeGroupId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

// Server-only: lee una publicación pública (status='active') por trade_group_id, con
// username/rank del autor ya resueltos vía profiles_with_rank. Envuelta en
// React `cache()` para que generateMetadata y el page.tsx del mismo request (que
// llaman a esto por separado) no dupliquen la consulta — memoización por request, no
// entre requests.
export const fetchPublicTradeGroup = cache(async (tradeGroupId: string): Promise<TradePost | null> => {
  // Un string que no sea un UUID real (ej. un slug cualquiera, "undefined") hace que
  // Postgres devuelva un error de cast de tipo en vez de "no hay filas" — se corta
  // ACÁ antes de pegarle a la base, así notFound() es el único resultado posible
  // para esos casos, nunca un error 500.
  if (!isValidTradeGroupId(tradeGroupId)) return null;

  const { data, error } = await supabaseServer
    .from('user_trades')
    .select(TRADE_SELECT)
    .eq('trade_group_id', tradeGroupId)
    .eq('status', 'active');

  if (error || !data || data.length === 0) return null;

  const [group] = groupTradeRows(data as unknown as RawTradeRow[]);
  if (!group) return null;

  const { data: profile } = await supabaseServer
    .from('profiles_with_rank')
    .select('username, rank')
    .eq('user_id', group.user_id)
    .maybeSingle();

  return {
    ...group,
    username: profile?.username ?? null,
    rank: profile?.rank ?? null,
  };
});

const BATTLE_LABELS: Record<string, string> = {
  dynamax: 'Dynamax',
  gigantamax: 'Gigantamax',
  shadow: 'Shadow',
  purified: 'Purified',
};

// Descripción corta en texto plano de una variante — "Shiny Charizard (Shadow,
// Beach)". Se usa donde no hay iconos/colores haciendo ese trabajo visualmente
// (TradeCard, PokemonDetailPopover): el texto de compartir y la meta description.
export function describeVariant(variant: PokemonVariant): string {
  const name = variant.is_shiny ? `Shiny ${variant.pokemon.name}` : variant.pokemon.name;
  const extras: string[] = [];
  if (variant.battle_state !== 'none') extras.push(BATTLE_LABELS[variant.battle_state]);
  if (variant.background) extras.push(variant.background.name);
  return extras.length > 0 ? `${name} (${extras.join(', ')})` : name;
}

function summarizeSide(variants: PokemonVariant[], maxNames = 3): string {
  if (variants.length === 0) return 'anything';
  const names = variants.map(describeVariant);
  const visible = names.slice(0, maxNames);
  const remaining = names.length - visible.length;
  return remaining > 0 ? `${visible.join(', ')}, and ${remaining} more` : visible.join(', ');
}

// Texto listo para pegar en WhatsApp/Telegram/Discord o usar como meta description —
// sin la URL (cada canal la agrega en un lugar distinto del mensaje, ver
// ShareTradeButton).
export function buildShareText(trade: TradePost): string {
  const offering = summarizeSide(trade.offering);
  const lookingFor = trade.open_to_offers ? 'open to any offer' : summarizeSide(trade.lookingFor);
  return `Trading ${offering} for ${lookingFor} on GoTraderz 🔄`;
}

// `ref` identifica el canal (share-whatsapp / share-telegram / share-copy /
// share-native) para distinguir de dónde vino el tráfico — puramente informativo
// (ej. en Vercel Analytics), ninguna lógica de la app depende de su valor.
export function buildShareUrl(tradeGroupId: string, ref?: string): string {
  const base = `${siteUrl()}/trade/${tradeGroupId}`;
  return ref ? `${base}?ref=${encodeURIComponent(ref)}` : base;
}
