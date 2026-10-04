import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastMessage {
  id: number;
  text: string;
}

const TOAST_DURATION_MS = 2000;

interface UseToastReturn {
  toast: ToastMessage | null;
  showToast: (text: string) => void;
}

export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((text: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), text });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  return { toast, showToast };
}
