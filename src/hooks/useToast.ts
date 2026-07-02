import { useCallback, useRef, useState } from 'react';

export interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  visible: boolean;
}

interface ShowOptions {
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

const DEFAULT_DURATION_MS = 6000;
const HIDDEN: ToastState = { message: '', visible: false };

export function useToast() {
  const [toast, setToast] = useState<ToastState>(HIDDEN);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setToast(HIDDEN);
  }, []);

  const show = useCallback((message: string, opts: ShowOptions = {}) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, actionLabel: opts.actionLabel, onAction: opts.onAction, visible: true });
    timer.current = setTimeout(() => setToast(HIDDEN), opts.duration ?? DEFAULT_DURATION_MS);
  }, []);

  return { toast, show, dismiss };
}
