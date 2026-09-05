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

  for (let i = 8; i < SIZE - 8; i += 1) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0;
    matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  for (let y = 16; y <= 20; y += 1) {
    for (let x = 16; x <= 20; x += 1) {
      const edge = x === 16 || y === 16 || x === 20 || y === 20;
      const center = x === 18 && y === 18;
      matrix[y][x] = edge || center ? 1 : 0;
    }
  }

  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (matrix[y][x]) continue;
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

export default function HeroQrMark({ className = '', density = 'hero' }) {
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

  const cell = density === 'hero' ? 10 : 8;
  const pad = density === 'hero' ? 20 : 16;
  const dim = SIZE * cell + pad * 2;
  const gap = density === 'hero' ? 1.6 : 1.2;

  return (
    <svg
      viewBox={`0 0 ${dim} ${dim}`}
      className={`h-full w-full text-[#778da9] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`qrFade-${reactId}`} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#415a77" stopOpacity="0.08" />
          <stop offset="55%" stopColor="#778da9" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#778da9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`qrScan-${reactId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#415a77" stopOpacity="0" />
          <stop offset="50%" stopColor="#415a77" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#415a77" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width={dim} height={dim} fill={`url(#qrFade-${reactId})`} />

      {MATRIX.map((row, y) =>
        row.map((on, x) => {
          if (!on) return null;
          const isFinder =
            (x < 7 && y < 7) || (x >= SIZE - 7 && y < 7) || (x < 7 && y >= SIZE - 7);
          const pulse = !reduceMotion && (x + y + tick) % 11 === 0;
          const base = isFinder ? 0.55 : 0.22 + ((x * 3 + y * 5) % 5) * 0.05;
          const opacity = pulse ? 0.62 : base;
          return (
            <rect
              key={`${x}-${y}`}
              x={pad + x * cell}
              y={pad + y * cell}
              width={cell - gap}
              height={cell - gap}
              rx={density === 'hero' ? 2 : 1}
              fill="currentColor"
              opacity={opacity}
              className={pulse ? 'transition-opacity duration-500' : undefined}
            />
          );
        }),
      )}

      {!reduceMotion ? (
        <rect x={pad} width={SIZE * cell} height="14" fill={`url(#qrScan-${reactId})`}>
          <animate attributeName="y" values={`${pad};${pad + SIZE * cell - 14};${pad}`} dur="3.6s" repeatCount="indefinite" />
        </rect>
      ) : null}

      <rect
        x={pad - 8}
        y={pad - 8}
        width={SIZE * cell + 16}
        height={SIZE * cell + 16}
        rx="14"
        fill="none"
        stroke="#778da9"
        strokeWidth="1.5"
        opacity="0.22"
      />
    </svg>
  );
}
