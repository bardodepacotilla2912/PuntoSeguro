import { reactive } from "vue";

// Mensajes de éxito / error visibles en la esquina de la pantalla
const toasts = reactive([]);
let nextId = 1;

function push(type, message, timeout = 4500) {
  const id = nextId++;
  toasts.push({ id, type, message });

  setTimeout(() => dismiss(id), timeout);
}

function dismiss(id) {
  const index = toasts.findIndex((toast) => toast.id === id);
  if (index !== -1) toasts.splice(index, 1);
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (message) => push("success", message),
    error: (message) => push("error", message, 7000),
    info: (message) => push("info", message)
  };
}
