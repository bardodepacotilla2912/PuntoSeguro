// Contenido de los popups del mapa.
// Se construyen con document.createElement / innerHTML y addEventListener,
// igual que createPopupContent de la práctica.

import { validateName, validateDescription, validatePhone, validateSchedule } from "./validations";

// Formulario que se usa para registrar y para editar un punto
const FORM_HTML = `
  <label>Nombre <input name="name" maxlength="100" /></label>
  <label>Descripción <textarea name="description" rows="2" maxlength="250"></textarea></label>
  <label>Categoría <select name="category"></select></label>
  <label>Estado
    <select name="status">
      <option value="activo">Activo</option>
      <option value="inactivo">Inactivo</option>
    </select>
  </label>
  <label>Teléfono <input name="phone" type="tel" maxlength="12" placeholder="477 123 4567" /></label>
  <label>Horario <input name="schedule" maxlength="20" placeholder="24 horas u 08:00 - 22:00" /></label>
  <p class="popup-coords"></p>
  <p class="message error" hidden></p>
`;

// Llena el <select> de categorías
function fillCategories(select, categories, selectedId) {
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    option.selected = category.id === selectedId;
    select.appendChild(option);
  });
}

// Lee los valores del formulario
function readForm(form) {
  return {
    name: form.name.value.trim(),
    description: form.description.value.trim(),
    category: form.category.value,
    status: form.status.value,
    phone: form.phone.value.trim(),
    schedule: form.schedule.value.trim()
  };
}

// Revisa los campos del punto; teléfono y horario son opcionales
function validatePointForm(data) {
  return (
    validateName(data.name, 3) ||
    validateDescription(data.description) ||
    (data.phone !== "" ? validatePhone(data.phone) : "") ||
    (data.schedule !== "" ? validateSchedule(data.schedule) : "")
  );
}

function showError(form, message) {
  const box = form.querySelector(".message");
  box.textContent = message;
  box.hidden = false;
}

// ---------- Popup para registrar un punto nuevo (clic en el mapa) ----------
export function createNewPointForm(latlng, categories, onSave, onCancel) {
  const form = document.createElement("form");
  form.className = "popup";

  form.innerHTML = `
    <h3>Nuevo punto de ayuda</h3>
    ${FORM_HTML}
    <div class="popup-actions">
      <button type="button" class="btn btn-light" data-action="cancel">Cancelar</button>
      <button type="submit" class="btn btn-primary">Guardar</button>
    </div>
  `;

  fillCategories(form.category, categories, categories[0].id);
  form.querySelector(".popup-coords").textContent =
    `Coordenadas: ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = readForm(form);
    const error = validatePointForm(data);

    if (error) {
      showError(form, error);
      return;
    }

    try {
      await onSave({
        ...data,
        latitude: latlng.lat,
        longitude: latlng.lng
      });
    } catch (error) {
      showError(form, error.message);
    }
  });

  form.querySelector('[data-action="cancel"]').addEventListener("click", onCancel);

  return form;
}

// ---------- Popup de un punto existente: ver, editar y eliminar ----------
export function createPointPopup(point, categories, marker, onUpdate, onDelete) {
  const container = document.createElement("div");
  container.className = "popup";

  const [longitude, latitude] = point.location.coordinates;

  function showInfo() {
    container.innerHTML = `
      <h3></h3>
      <p class="popup-category"></p>
      <p class="popup-text"></p>
      <p><strong>Estado:</strong> <span data-field="status"></span></p>
      <p><strong>Teléfono:</strong> <span data-field="phone"></span></p>
      <p><strong>Horario:</strong> <span data-field="schedule"></span></p>
      <p class="popup-coords"></p>
      <div class="popup-actions">
        <button type="button" class="btn btn-light" data-action="edit">Editar</button>
        <button type="button" class="btn btn-danger" data-action="delete">Eliminar</button>
      </div>
    `;

    // textContent para que el texto de la base de datos no se interprete como HTML
    container.querySelector("h3").textContent = point.name;
    container.querySelector(".popup-category").textContent = point.category.name;
    container.querySelector(".popup-text").textContent = point.description;
    container.querySelector('[data-field="status"]').textContent = point.status;
    container.querySelector('[data-field="phone"]').textContent = point.phone || "—";
    container.querySelector('[data-field="schedule"]').textContent = point.schedule || "—";
    container.querySelector(".popup-coords").textContent =
      `Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    container.querySelector('[data-action="edit"]').addEventListener("click", (event) => {
      // Evita que Leaflet tome este clic como un clic en el mapa
      event.stopPropagation();
      showForm();
    });

    container.querySelector('[data-action="delete"]').addEventListener("click", () => {
      onDelete(point);
    });
  }

  function showForm() {
    container.innerHTML = `
      <form>
        <h3>Editar punto</h3>
        ${FORM_HTML}
        <div class="popup-actions">
          <button type="button" class="btn btn-light" data-action="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>
    `;

    const form = container.querySelector("form");

    form.name.value = point.name;
    form.description.value = point.description;
    form.status.value = point.status;
    form.phone.value = point.phone;
    form.schedule.value = point.schedule;
    fillCategories(form.category, categories, point.category.id);
    form.querySelector(".popup-coords").textContent =
      `Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = readForm(form);
      const error = validatePointForm(data);

      if (error) {
        showError(form, error);
        return;
      }

      try {
        await onUpdate(point.id, data);
      } catch (error) {
        showError(form, error.message);
      }
    });

    form.querySelector('[data-action="cancel"]').addEventListener("click", (event) => {
      event.stopPropagation();
      showInfo();
      marker.getPopup().update();
    });

    // El popup cambia de tamaño: se vuelve a acomodar
    marker.getPopup().update();
  }

  showInfo();

  return container;
}
