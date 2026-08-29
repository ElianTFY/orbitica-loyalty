import { useState, useCallback, useEffect } from 'react';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

let listeners: Array<(items: ToastItem[]) => void> = [];
let toasts: ToastItem[] = [];

export function toast(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string) {
  const id = Math.random().toString(36).substring(2, 9);
  const item: ToastItem = { id, type, message, title };
  toasts = [...toasts, item];
  listeners.forEach((fn) => fn(toasts));

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((fn) => fn(toasts));
  }, 4000);
}

export function useToast() {
  const [current, setCurrent] = useState<ToastItem[]>(toasts);

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => setCurrent(newToasts);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((fn) => fn !== listener);
    };
  }, []);

  return {
    toasts: current,
    toast,
    success: (msg: string, title?: string) => toast(msg, 'success', title),
    error: (msg: string, title?: string) => toast(msg, 'error', title),
    info: (msg: string, title?: string) => toast(msg, 'info', title),
    warning: (msg: string, title?: string) => toast(msg, 'warning', title),
  };
}
