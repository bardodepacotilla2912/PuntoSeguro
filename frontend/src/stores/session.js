import { reactive } from "vue";

// Usuario que inició sesión. Si es null, no hay sesión.
export const session = reactive({
  user: null
});
