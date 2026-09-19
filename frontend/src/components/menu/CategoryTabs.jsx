import { useEffect, useRef } from 'react';

function TabRail({ items, activeId, onSelect }) {
  const activeRef = useRef(null);

  useEffect(() => {
    const node = activeRef.current;

    if (!node || typeof node.scrollIntoView !== 'function') {
      return;
    }

    node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeId]);

  if (!items?.length) {
    return null;
  }

  return (
    <div
      className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:px-6 sm:py-3 lg:px-8 [&::-webkit-scrollbar]:hidden"
      role="tablist"
    >
      {items.map((item) => {
        const active = String(item.id) === String(activeId);

        return (
          <button
            key={item.id}
            ref={active ? activeRef : null}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item)}
            className={`max-w-[80vw] shrink-0 truncate rounded-full px-3 py-1.5 text-[13px] transition-all duration-200 sm:max-w-none sm:px-4 sm:py-2 sm:text-sm ${
              active
                ? 'bg-[var(--menu-tab-active-bg)] font-semibold text-[var(--menu-tab-active-text)] shadow-[0_6px_14px_rgba(13,27,42,0.16)]'
                : 'bg-[var(--menu-chrome-pill-bg)] font-medium text-[var(--menu-tab-inactive-text)] ring-1 ring-[var(--menu-chrome-pill-ring)] hover:text-on-surface'
            }`}
          >
            {item.name}
          </button>
        );
      })}
    </div>
  );
}

export default function CategoryTabs({ items, activeId, onSelect }) {
  if (!items?.length) {
    return null;
  }

  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 border-b border-[var(--menu-chrome-border)] bg-[var(--menu-chrome-bg)] backdrop-blur-2xl transition-colors duration-500 sm:top-[calc(4.5rem+env(safe-area-inset-top))]">
      <TabRail items={items} activeId={activeId} onSelect={onSelect} />
    </div>
  );
}
