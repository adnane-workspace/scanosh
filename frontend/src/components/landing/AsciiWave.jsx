import { useEffect, useRef } from 'react';

const CHARS = '·∘○◯◌●◉';

export default function AsciiWave({ className = '' }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let time = 0;
    let disposed = false;

    const color = () => {
      const styles = getComputedStyle(document.documentElement);
      return styles.getPropertyValue('--color-on-surface').trim() || '#0d1b2a';
    };

    const toRgba = (hex, alpha) => {
      const raw = hex.replace('#', '');
      if (raw.length < 6) return `rgba(13, 27, 42, ${alpha})`;
      const r = Number.parseInt(raw.slice(0, 2), 16);
      const g = Number.parseInt(raw.slice(2, 4), 16);
      const b = Number.parseInt(raw.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const fill = color();
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const cols = Math.floor(rect.width / 20);
      const rows = Math.floor(rect.height / 20);

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const px = (x + 0.5) * (rect.width / cols);
          const py = (y + 0.5) * (rect.height / rows);

          const wave1 = Math.sin(x * 0.2 + time * 2) * Math.cos(y * 0.15 + time);
          const wave2 = Math.sin((x + y) * 0.1 + time * 1.5);
          const wave3 = Math.cos(x * 0.1 - y * 0.1 + time * 0.8);

          const combined = (wave1 + wave2 + wave3) / 3;
          const normalized = (combined + 1) / 2;

          const charIndex = Math.floor(normalized * (CHARS.length - 1));
          const alpha = 0.1 + normalized * 0.35;

          ctx.fillStyle = toRgba(fill, alpha);
          ctx.fillText(CHARS[charIndex], px, py);
        }
      }
    };

    const render = () => {
      if (disposed) return;
      drawFrame();
      time += 0.03;
      frameRef.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      drawFrame();
    } else {
      render();
    }

    return () => {
      disposed = true;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className={`block h-full w-full ${className}`} aria-hidden="true" />;
}
