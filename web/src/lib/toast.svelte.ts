export type ToastKind = 'success' | 'error' | 'info';
export type ToastMessage = { id: number; message: string; kind: ToastKind };
let messages = $state<ToastMessage[]>([]);
let sequence = 0;
export const toasts = {
  get messages() { return messages; },
  dismiss(id: number) { messages = messages.filter((item) => item.id !== id); },
  show(message: string, kind: ToastKind = 'info', duration = 6000) {
    const id = ++sequence;
    messages = [...messages.slice(-3), { id, message, kind }];
    if (typeof window !== 'undefined' && duration > 0) window.setTimeout(() => this.dismiss(id), duration);
    return id;
  }
};
