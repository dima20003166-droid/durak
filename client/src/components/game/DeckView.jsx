import React from "react";

/**
 * Realistic Durak deck with clearly visible trump card (Tailwind-only).
 * Props:
 *   - remaining: number
 *   - trump: { rank: string, suit: "spade"|"club"|"heart"|"diamond" }
 *   - size?: number
 *   - reveal?: number (0..1)
 *   - showBadge?: boolean
 *   - onDraw?: () => void
 */
const SUITS = {
  spade:   { color: "#0f172a", label: "♠" },
  club:    { color: "#0f172a", label: "♣" },
  heart:   { color: "#b91c1c", label: "♥" },
  diamond: { color: "#b91c1c", label: "♦" },
};

function SuitGlyph({ suit = "spade", className = "" }) {
  const c = SUITS[suit] || SUITS.spade;
  return (
    <span className={`inline-block align-middle leading-none ${className}`} style={{ color: c.color }}>
      {c.label}
    </span>
  );
}

function CardBack({ className = "" }) {
  return (
    <div
      className={
        "relative rounded-xl border border-slate-700 shadow-[0_8px_24px_rgba(2,6,23,0.35)] overflow-hidden " +
        className
      }
      style={{
        backgroundColor: "#0b1220",
        backgroundImage: `radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)`,
        backgroundSize: "8px 8px",
      }}
      aria-label="Back of card"
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl opacity-70"
        style={{
          background:
            "linear-gradient(55deg, rgba(255,255,255,0.00) 20%, rgba(255,255,255,0.12) 40%, rgba(255,255,255,0.00) 55%)",
          transform: "translate3d(0,0,0)",
          animation: "sheen 5s linear infinite",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-3 opacity-50"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(250,250,250,0.8) 0 1px, rgba(210,210,210,0.5) 1px 2px)",
        }}
      />
      <style>{`
        @keyframes sheen {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

function CardFace({ rank = "A", suit = "spade", className = "" }) {
  const color = (SUITS[suit] || SUITS.spade).color;
  return (
    <div
      className={
        "relative bg-white rounded-xl border border-slate-300 shadow-[0_8px_24px_rgba(2,6,23,0.18)] overflow-hidden " +
        className
      }
      role="img"
      aria-label={`Card ${rank} of ${suit}`}
    >
      <div className="absolute top-1.5 left-1.5 text-[min(14px,3.7vw)] leading-none select-none" style={{ color }}>
        <div className="font-semibold tracking-tight">{rank}</div>
        <div className="-mt-0.5"><SuitGlyph suit={suit} /></div>
      </div>
      <div
        className="absolute bottom-1.5 right-1.5 text-[min(14px,3.7vw)] leading-none rotate-180 select-none"
        style={{ color }}
      >
        <div className="font-semibold tracking-tight">{rank}</div>
        <div className="-mt-0.5"><SuitGlyph suit={suit} /></div>
      </div>
      <div className="absolute inset-0 grid place-items-center select-none" style={{ color }}>
        <SuitGlyph suit={suit} className="text-[min(56px,14vw)] opacity-80" />
      </div>
    </div>
  );
}

function DeckStack({
  remaining = 18,
  trump = { rank: "A", suit: "spade" },
  size = 92,
  reveal = 0.42,
  showBadge = true,
  onDraw,
}) {
  const height = Math.round(size * 1.45);
  const visible = Math.min(remaining, 14);
  const angles = [0.6, -0.4, 0.3, -0.2, 0.5, -0.55, 0.2, -0.15, 0.35, -0.25, 0.15, -0.1, 0.1, -0.05];

  return (
    <div className="relative select-none" style={{ width: size, height }}>
      <div
        className="absolute left-0 bottom-0 origin-bottom-left will-change-transform"
        style={{
          width: size,
          height,
          transform: `translate(${Math.round(size * (reveal * 0.35))}px, ${Math.round(height * (reveal * -0.05))}px) rotate(-10deg)`
        }}
      >
        <CardFace rank={trump.rank} suit={trump.suit} className="w-full h-full" />
      </div>

      <button
        type="button"
        onClick={onDraw}
        className="absolute inset-0 group outline-none"
        title={onDraw ? "Взяти карту з колоди" : undefined}
      >
        {Array.from({ length: remaining > 0 ? visible : 0 }, (_, i) => {
          const idx = i;
          const t = idx / Math.max(1, visible - 1);
          const y = Math.round(t * 10);
          const scale = 1 - t * 0.03;
          const angle = angles[idx % angles.length];
          const z = idx;
          return (
            <div
              key={idx}
              className="absolute left-0 bottom-0 origin-bottom will-change-transform transition-transform duration-200 group-active:translate-y-0.5"
              style={{
                width: size,
                height,
                transform: `translateY(-${y}px) scale(${scale}) rotate(${angle}deg)`,
                zIndex: z,
              }}
            >
              <CardBack className="w-full h-full" />
            </div>
          );
        })}
      </button>

      {remaining > visible && (
        <div className="absolute -top-2 -right-2 bg-slate-900 text-white text-[12px] leading-none px-2 py-1 rounded-full shadow-lg border border-slate-700">
          × {remaining}
        </div>
      )}

      {showBadge && (
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full border text-[11px] leading-none shadow-md backdrop-blur-sm"
          style={{
            color: (SUITS[trump.suit] || SUITS.spade).color,
            background: "rgba(255,255,255,0.85)",
            borderColor: "rgba(0,0,0,0.15)",
          }}
        >
          Козырь <span className="ml-1 align-middle"><SuitGlyph suit={trump.suit} /></span>
        </div>
      )}
    </div>
  );
}

export function DeckView(props) {
  return (
    <div className="[perspective:1200px]" style={{ pointerEvents: props.onDraw ? "auto" : "none" }}>
      <div className="[transform-style:preserve-3d] [transform:rotateX(8deg)]">
        <DeckStack {...props} />
      </div>
    </div>
  );
}

export default DeckView;
