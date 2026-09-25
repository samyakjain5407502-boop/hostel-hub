'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

export interface Toast {
  id: string;
  title: string;
  body?: string;
  tone: 'success' | 'info' | 'warning' | 'reward';
}

interface ToastCtx {
  push: (t: Omit<Toast, 'id'>) => void;
}
const Ctx = React.createContext<ToastCtx>({ push: () => {} });

const ICONS = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  reward: CheckCircle2
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const idRef = React.useRef(0);

  function push(t: Omit<Toast, 'id'>) {
    const id = 'toast-' + ++idRef.current;
    setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
  }
  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  React.useEffect(() => {
    if (!toasts.length) return;
    const timer = setTimeout(() => setToasts((prev) => prev.slice(1)), 4200);
    return () => clearTimeout(timer);
  }, [toasts]);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div
        aria-live="polite"
        role="region"
        data-toast-stack=""
        className="fixed bottom-4 right-4 z-[120] flex w-[min(92vw,360px)] flex-col gap-2.5"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.tone];
            const toneCls =
              t.tone === 'success' || t.tone === 'reward'
                ? 'text-success-600'
                : t.tone === 'warning'
                ? 'text-amber-500'
                : 'text-brand-600';
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 30 }}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 rounded-2xl border p-3.5 shadow-soft backdrop-blur',
                  t.tone === 'reward'
                    ? 'border-transparent bg-gradient-to-br from-success-600 to-emerald-700 text-white'
                    : 'border-slate-200 bg-white/95'
                )}
              >
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', t.tone === 'reward' ? 'text-white' : toneCls)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-sm font-semibold', t.tone === 'reward' ? 'text-white' : 'text-slate-900')}>{t.title}</p>
                  {t.body && <p className={cn('mt-0.5 text-xs', t.tone === 'reward' ? 'text-emerald-100' : 'text-slate-500')}>{t.body}</p>}
                </div>
                <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-md p-0.5 text-current opacity-70 hover:opacity-100" aria-label="Dismiss">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return React.useContext(Ctx);
}