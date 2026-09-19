import { useEffect, useId, useRef } from 'react';
import MaterialIcon from './MaterialIcon.jsx';

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmingLabel,
  cancelLabel,
  confirming = false,
  icon = 'delete',
  onCancel,
  onConfirm,
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const confirmingRef = useRef(confirming);

  onCancelRef.current = onCancel;
  confirmingRef.current = confirming;

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previous = document.activeElement;
    cancelRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape' && !confirmingRef.current) {
        event.preventDefault();
        onCancelRef.current();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/45"
        aria-label={cancelLabel}
        disabled={confirming}
        onClick={onCancel}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full rounded-t-2xl bg-surface-container-lowest p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6 sm:pb-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
            <MaterialIcon name={icon} className="text-[22px]" />
          </div>
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold text-on-surface sm:text-xl">
              {title}
            </h2>
            <p id={descriptionId} className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            disabled={confirming}
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-on-surface transition hover:bg-surface-container-high disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-full bg-error px-5 text-sm font-semibold text-on-error transition hover:opacity-90 disabled:opacity-60"
          >
            {confirming ? confirmingLabel || confirmLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
