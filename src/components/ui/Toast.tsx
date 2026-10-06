"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircleIcon, InfoIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
};

type ToastContextValue = {
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ICONS = {
  success: CheckCircleIcon,
  error: WarningCircleIcon,
  info: InfoIcon,
} as const;

const CONTAINER_STYLES: Record<ToastVariant, string> = {
  success: "border-accent-border",
  error: "border-danger-border",
  info: "border-hairline",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-signal-blue",
  error: "text-danger",
  info: "text-deep-cobalt",
};

const DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const reduce = useReducedMotion();

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, variant, title, description }]);
      window.setTimeout(() => remove(id), DURATION_MS);
    },
    [remove],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
      info: (title, description) => show("info", title, description),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,360px)] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={
                  reduce ? false : { opacity: 0, y: 16, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
                transition={{
                  duration: reduce ? 0 : 0.28,
                  ease: [0.16, 1, 0.3, 1],
                }}
                role={toast.variant === "error" ? "alert" : "status"}
                className={`pointer-events-auto flex items-start gap-3 rounded-2xl border bg-paper p-4 shadow-sm-2 ${CONTAINER_STYLES[toast.variant]}`}
              >
                <Icon
                  className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_STYLES[toast.variant]}`}
                  weight="fill"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-ink-navy">
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p className="mt-0.5 text-caption text-slate-gray">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(toast.id)}
                  aria-label="Cerrar notificación"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-gray transition-colors hover:bg-pebble hover:text-ink-navy"
                >
                  <XIcon className="h-3.5 w-3.5" weight="bold" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de un ToastProvider");
  }
  return context;
}
