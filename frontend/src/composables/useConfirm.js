import { reactive } from "vue";

// Diálogo de confirmación que regresa una promesa (true / false)
const state = reactive({
  open: false,
  title: "",
  message: "",
  confirmText: "Eliminar",
  resolve: null
});

function ask({ title = "¿Estás seguro?", message = "", confirmText = "Eliminar" } = {}) {
  return new Promise((resolve) => {
    Object.assign(state, { open: true, title, message, confirmText, resolve });
  });
}

function answer(value) {
  state.open = false;
  state.resolve?.(value);
  state.resolve = null;
}

export function useConfirm() {
  return { state, ask, answer };
}
