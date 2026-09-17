export default function SectionHeader({ title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight text-on-surface">{title}</h2>
      {action}
    </div>
  );
}
