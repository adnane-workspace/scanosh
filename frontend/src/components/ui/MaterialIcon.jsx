import { ICON_PATHS } from "./materialIconPaths.js";

const RTL_FLIP = new Set(["arrow_forward", "arrow_back", "chevron_right", "chevron_left"]);

export default function MaterialIcon({ name, className = "", filled = false }) {
  const spec = ICON_PATHS[name];
  const paths = spec ? (filled && spec.filled ? spec.filled : spec.paths) : null;

  if (!paths) {
    return null;
  }

  return (
    <svg
      viewBox="0 -960 960 960"
      className={`material-icon shrink-0 fill-current ${RTL_FLIP.has(name) ? "rtl:rotate-180" : ""} ${className}`}
      aria-hidden="true"
    >
      {paths.map((path, index) => (
        <path key={index} d={path.d} />
      ))}
    </svg>
  );
}
