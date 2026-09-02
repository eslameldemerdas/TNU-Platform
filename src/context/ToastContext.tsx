import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastContainer, ToastMessage } from "../components/common/Toast";

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (
    type: "success" | "error" | "warning" | "info",
    title: string,
    description?: string,
  ) => void;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: "success" | "error" | "warning" | "info", title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, type, title, description };

      setToasts((prev) => {
        // Prevent toast flooding (cap at 4 active toasts)
        const list = [...prev, newToast];
        if (list.length > 4) list.shift();
        return list;
      });

      // Auto dismiss in 4.5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast],
  );

  const success = useCallback(
    (title: string, description?: string) => addToast("success", title, description),
    [addToast],
  );
  const error = useCallback(
    (title: string, description?: string) => addToast("error", title, description),
    [addToast],
  );
  const warning = useCallback(
    (title: string, description?: string) => addToast("warning", title, description),
    [addToast],
  );
  const info = useCallback(
    (title: string, description?: string) => addToast("info", title, description),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside provider
    return {
      toasts: [],
      addToast: () => {},
      removeToast: () => {},
      success: (title: string) => console.log("[Toast Success]", title),
      error: (title: string) => console.error("[Toast Error]", title),
      warning: (title: string) => console.warn("[Toast Warning]", title),
      info: (title: string) => console.info("[Toast Info]", title),
    };
  }
  return context;
}
