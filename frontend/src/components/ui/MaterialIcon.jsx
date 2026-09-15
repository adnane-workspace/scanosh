const RTL_FLIP = new Set(['arrow_forward', 'arrow_back', 'chevron_right', 'chevron_left']);

export default function MaterialIcon({ name, className = "", filled = false }) {
  return (
    <span
      className={`material-symbols-outlined font-normal tracking-normal ${RTL_FLIP.has(name) ? 'rtl:rotate-180' : ''} ${className}`}
      style={{
        fontFamily: '"Material Symbols Outlined"',
        fontWeight: 400,
        letterSpacing: 0,
        ...(filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : null),
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
