import { useEffect, useId, useState } from 'react';

/** Stable pseudo-QR matrix: finder corners + data modules (visual only). */
const SIZE = 25;

function buildMatrix() {
  const matrix = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  function paintFinder(ox, oy) {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const edge = x === 0 || y === 0 || x === 6 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[oy + y][ox + x] = edge || inner ? 1 : 0;
      }
    }
  }

  paintFinder(0, 0);
  paintFinder(SIZE - 7, 0);
  paintFinder(0, SIZE - 7);

  // Timing patterns
  for (let i = 8; i < SIZE - 8; i += 1) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Alignment-ish block
  for (let y = 16; y <= 20; y += 1) {
    for (let x = 16; x <= 20; x += 1) {
      const edge = x === 16 || y === 16 || x === 20 || y === 20;
      const center = x === 18 && y === 18;
      matrix[y][x] = edge || center ? 1 : 0;
    }
  }

  // Data modules (deterministic pattern — looks QR-like)
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (matrix[y][x]) continue;
      // Keep quiet zones around finders
      const inTopLeft = x < 9 && y < 9;
      const inTopRight = x > SIZE - 10 && y < 9;
      const inBottomLeft = x < 9 && y > SIZE - 10;
      if (inTopLeft || inTopRight || inBottomLeft) continue;
      if (x === 6 || y === 6) continue;

      const n = (x * 17 + y * 31 + x * y) % 7;
      matrix[y][x] = n === 0 || n === 3 || n === 5 ? 1 : 0;
    }
  }

  return matrix;
}

const MATRIX = buildMatrix();

export default function HeroQrMark({ className = '' }) {
  const reactId = useId().replace(/:/g, '');
  const [tick, setTick] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    if (mq.matches) return undefined;

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 900);
    return () => window.clearInterval(interval);
  }, []);

  const cell = 8;
  const pad = 16;
  const dim = SIZE * cell + pad * 2;

  return (
    <svg
      viewBox={`0 0 ${dim} ${dim}`}
      className={`h-full w-full text-on-surface ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`qrFade-${reactId}`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.55" />
          <stop offset="70%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={dim} height={dim} fill={`url(#qrFade-${reactId})`} opacity="0.12" />

      {MATRIX.map((row, y) =>
        row.map((on, x) => {
          if (!on) return null;
          const pulse = !reduceMotion && (x + y + tick) % 11 === 0;
          const opacity = pulse ? 0.95 : 0.28 + ((x * 3 + y * 5) % 5) * 0.08;
          return (
            <rect
              key={`${x}-${y}`}
              x={pad + x * cell}
              y={pad + y * cell}
              width={cell - 1.2}
              height={cell - 1.2}
              rx="1"
              fill="currentColor"
              opacity={opacity}
              className={pulse ? 'transition-opacity duration-500' : undefined}
            />
          );
        }),
      )}

      {/* Soft scan line */}
      {!reduceMotion ? (
        <rect x={pad} width={SIZE * cell} height="10" fill="currentColor" opacity="0.12">
          <animate attributeName="y" values={`${pad};${pad + SIZE * cell - 10};${pad}`} dur="3.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.18;0" dur="3.2s" repeatCount="indefinite" />
        </rect>
      ) : null}

      {/* Outer quiet ring suggestion */}
      <rect
        x={pad - 6}
        y={pad - 6}
        width={SIZE * cell + 12}
        height={SIZE * cell + 12}
        rx="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.18"
      />
    </svg>
  );
}
