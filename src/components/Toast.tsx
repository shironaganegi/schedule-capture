import type { ToastState } from '../hooks/useToast';

interface Props {
  toast: ToastState;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: Props) {
  if (!toast.visible) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-message">{toast.message}</span>
      {toast.actionLabel && toast.onAction && (
        <button
          type="button"
          className="toast-action"
          onClick={() => {
            toast.onAction?.();
            onDismiss();
          }}
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  );
}
