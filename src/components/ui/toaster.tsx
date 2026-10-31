"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, Check, Info } from "lucide-react";

type ToastTone = "info" | "error" | "success";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS = {
  info: Info,
  error: AlertTriangle,
  success: Check,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = nextId.current;
    nextId.current += 1;
    setItems((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 4_500);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const Icon = ICONS[item.tone];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.22 }}
                className={`pointer-events-auto flex max-w-md items-start gap-3 border px-4 py-3 text-sm shadow-[0_20px_60px_rgba(0,0,0,0.55)] ${
                  item.tone === "error"
                    ? "border-red-900/70 bg-[#1d0e0d] text-[#e8c8bd]"
                    : item.tone === "success"
                      ? "border-[#5f6848]/70 bg-[#13160f] text-[#d8dfbd]"
                      : "border-[#b8ab8e]/30 bg-[#151311] text-[#ded3ba]"
                }`}
              >
                <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{item.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}
