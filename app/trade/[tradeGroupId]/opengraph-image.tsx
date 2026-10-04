import { ImageResponse } from 'next/og';
import { fetchPublicTradeGroup } from '@/app/lib/tradeShare';
import type { PokemonVariant } from '@/app/types/trades';

export const alt = 'GoTraderz trade post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BG = '#0B0F14';
const PANEL = '#131A22';
const BORDER = '#232D38';
const BLUE = '#2E9BF5';
const RED = '#FF3D3D';
const YELLOW = '#FFCB05';
const TEXT = '#F4F6F8';
const MUTED = '#8792A0';

// Mismo tope visual que TradeCard (MAX_VISIBLE_PER_SIDE) para que la preview nunca
// muestre algo que la propia card no mostraría — 4 por lado + "+N more".
const MAX_SPRITES = 4;

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

// ImageResponse (Satori) descarga imágenes remotas por su cuenta a partir del `src`
// — no pasa por next/image ni por el optimizador de Vercel, que ya está al 75% de su
// cuota gratuita. No se usa ninguna fuente custom tampoco (solo el fallback del
// sistema): entre las dos cosas, el bundle de esta función se mantiene liviano y
// el PNG resultante chico (plano, sin gradientes/sombras pesadas) — importa porque
// WhatsApp en particular suele ignorar preview images muy pesadas.
function spriteSrc(variant: PokemonVariant): string | null {
  return (variant.is_shiny ? variant.pokemon.shiny_sprite_url : null) ?? variant.pokemon.sprite_url ?? null;
}

function Side({
  label,
  color,
  variants,
  openToOffers,
}: {
  label: string;
  color: string;
  variants: PokemonVariant[];
  openToOffers?: boolean;
}) {
  const visible = variants.slice(0, MAX_SPRITES);
  const remaining = variants.length - visible.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', gap: 14 }}>
      <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color, letterSpacing: 2 }}>
        {label.toUpperCase()}
      </div>
      {openToOffers ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 320,
            height: 170,
            borderRadius: 20,
            border: `2px solid ${BORDER}`,
            background: PANEL,
            fontSize: 22,
            color: RED,
            fontWeight: 700,
            textAlign: 'center',
            padding: 16,
          }}
        >
          Open to any offer
        </div>
      ) : visible.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 320,
            height: 170,
            borderRadius: 20,
            border: `2px dashed ${BORDER}`,
            color: MUTED,
            fontSize: 18,
          }}
        >
          Not specified
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', width: 320, gap: 10, justifyContent: 'center' }}>
          {visible.map((variant) => {
            const src = spriteSrc(variant);
            return (
              <div
                key={variant.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 145,
                  height: 150,
                  borderRadius: 16,
                  border: `2px solid ${BORDER}`,
                  background: PANEL,
                  padding: 8,
                }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element -- next/image no corre dentro de ImageResponse/Satori.
                  <img src={src} width={76} height={76} style={{ objectFit: 'contain' }} alt="" />
                ) : (
                  <div style={{ display: 'flex', width: 76, height: 76 }} />
                )}
                <div
                  style={{
                    display: 'flex',
                    fontSize: 15,
                    color: TEXT,
                    fontWeight: 600,
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                >
                  {capitalize(variant.pokemon.name)}
                </div>
                {variant.is_shiny && (
                  <div style={{ display: 'flex', fontSize: 11, color: YELLOW, fontWeight: 700, marginTop: 2 }}>
                    ✦ Shiny
                  </div>
                )}
              </div>
            );
          })}
          {remaining > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 145,
                height: 150,
                borderRadius: 16,
                border: `2px solid ${BORDER}`,
                background: PANEL,
                fontSize: 20,
                color: MUTED,
                fontWeight: 700,
              }}
            >
              +{remaining} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function brandImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: BG,
          color: TEXT,
        }}
      >
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 800 }}>GoTraderz</div>
        <div style={{ display: 'flex', fontSize: 24, color: MUTED, marginTop: 14 }}>
          Pokémon GO Trading Community Board
        </div>
        <div style={{ display: 'flex', fontSize: 14, color: '#5C6773', marginTop: 28 }}>Unofficial fan project</div>
      </div>
    ),
    size
  );
}

export default async function Image({ params }: { params: Promise<{ tradeGroupId: string }> }) {
  const { tradeGroupId } = await params;
  const trade = await fetchPublicTradeGroup(tradeGroupId);

  // Post borrado/completado/editado entre que se compartió el link y que la
  // plataforma (WhatsApp/Discord/...) pide la preview, o un tradeGroupId inválido:
  // imagen genérica de marca en vez de romper la preview entera con un 500.
  if (!trade) return brandImage();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: BG,
          padding: '42px 56px',
          color: TEXT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 800 }}>GoTraderz</div>
          <div style={{ display: 'flex', fontSize: 13, color: '#5C6773' }}>Unofficial fan project</div>
        </div>
        <div style={{ display: 'flex', fontSize: 16, color: MUTED, marginTop: 6 }}>
          {trade.username ? `${trade.username}'s trade` : 'A trade on GoTraderz'}
        </div>
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 36 }}>
          <Side label="Offering" color={BLUE} variants={trade.offering} />
          <div style={{ display: 'flex', fontSize: 36, color: '#5C6773' }}>⇄</div>
          <Side label="Looking for" color={RED} variants={trade.lookingFor} openToOffers={trade.open_to_offers} />
        </div>
      </div>
    ),
    size
  );
}
