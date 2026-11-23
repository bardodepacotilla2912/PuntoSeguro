import L from "leaflet";
import { escapeHtml, formatCoord, formatDate, POINT_STATUS_LABELS } from "./format";

/*
 * Contenido HTML de los popups del mapa.
 * Los popups de Leaflet no son componentes de Vue, por eso se construyen con DOM
 * y se conectan los botones con addEventListener.
 */

// Formulario compartido para crear y editar un punto
function pointFormHtml(values, categories) {
  const categoryOptions = categories
    .map((c) => `<option value="${c.id}" ${c.id === values.category ? "selected" : ""}>${escapeHtml(c.icon)} ${escapeHtml(c.name)}</option>`)
    .join("");

  const statusOptions = Object.entries(POINT_STATUS_LABELS)
    .map(([value, label]) => `<option value="${value}" ${value === values.status ? "selected" : ""}>${label}</option>`)
    .join("");

  return `
    <label>Nombre *
      <input name="name" required maxlength="100" value="${escapeHtml(values.name)}" placeholder="Ej. Módulo de seguridad Centro" />
    </label>
    <label>Descripción *
      <textarea name="description" required maxlength="300" rows="2" placeholder="¿Qué ayuda ofrece este punto?">${escapeHtml(values.description)}</textarea>
    </label>
    <div class="popup-row">
      <label>Categoría *
        <select name="category" required>
          <option value="">Selecciona…</option>
          ${categoryOptions}
        </select>
      </label>
      <label>Estado
        <select name="status">${statusOptions}</select>
      </label>
    </div>
    <div class="popup-row">
      <label>Teléfono
        <input name="phone" maxlength="30" value="${escapeHtml(values.phone)}" placeholder="477 000 0000" />
      </label>
      <label>Horario
        <input name="schedule" maxlength="60" value="${escapeHtml(values.schedule)}" placeholder="24 horas" />
      </label>
    </div>
    <p class="popup-coords">📍 ${formatCoord(values.latitude)}, ${formatCoord(values.longitude)}</p>
    <p class="popup-error" hidden></p>
  `;
}

// Los botones del popup detienen el clic para que Leaflet no lo tome como
// un clic en el mapa (al cambiar el contenido el botón deja de existir en el DOM)
function onClick(element, handler) {
  element.addEventListener("click", (event) => {
    L.DomEvent.stop(event);
    handler(event);
  });
}

function readForm(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => (data[key] = String(data[key]).trim()));
  return data;
}

// Validación rápida en el navegador (el backend vuelve a validar todo)
function validateForm(data) {
  if (data.name.length < 3) return "El nombre debe tener al menos 3 caracteres.";
  if (data.description.length < 5) return "La descripción debe tener al menos 5 caracteres.";
  if (!data.category) return "Selecciona una categoría.";
  return null;
}

function showError(container, message) {
  const box = container.querySelector(".popup-error");
  box.textContent = message;
  box.hidden = !message;
}

function setBusy(form, busy) {
  form.querySelectorAll("button, input, select, textarea").forEach((el) => (el.disabled = busy));
}

/* ---------- Popup para registrar un punto nuevo (clic en el mapa) ---------- */
export function newPointPopup({ latlng, categories, onSave, onCancel }) {
  const container = L.DomUtil.create("div", "ps-popup");
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);

  container.innerHTML = `
    <h3 class="popup-title">Nuevo punto de ayuda</h3>
    <form class="popup-form">
      ${pointFormHtml({ name: "", description: "", category: "", status: "activo", phone: "", schedule: "", latitude: latlng.lat, longitude: latlng.lng }, categories)}
      <div class="popup-actions">
        <button type="button" class="btn btn-ghost" data-action="cancel">Cancelar</button>
        <button type="submit" class="btn btn-primary">Guardar punto</button>
      </div>
    </form>
  `;

  const form = container.querySelector("form");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = readForm(form);
    const error = validateForm(data);
    if (error) return showError(container, error);

    showError(container, "");
    setBusy(form, true);

    try {
      await onSave({ ...data, latitude: latlng.lat, longitude: latlng.lng });
    } catch (err) {
      showError(container, err.fullMessage || err.message);
      setBusy(form, false);
    }
  });

  onClick(container.querySelector('[data-action="cancel"]'), onCancel);

  return container;
}

/* ---------- Popup de un punto existente (ver / editar / eliminar) ---------- */
export function pointPopup({ point, categories, onUpdate, onDelete, onResize = () => {} }) {
  const container = L.DomUtil.create("div", "ps-popup");
  L.DomEvent.disableClickPropagation(container);
  L.DomEvent.disableScrollPropagation(container);

  const [lng, lat] = point.location.coordinates;

  function renderView() {
    const category = point.category || {};
    const phone = point.phone
      ? `<a href="tel:${escapeHtml(point.phone.replace(/\s/g, ""))}">${escapeHtml(point.phone)}</a>`
      : "—";

    container.innerHTML = `
      <div class="popup-head">
        <span class="popup-icon" style="--marker-color:${escapeHtml(category.color)}">${escapeHtml(category.icon)}</span>
        <div>
          <h3 class="popup-title">${escapeHtml(point.name)}</h3>
          <span class="badge" style="--badge-color:${escapeHtml(category.color)}">${escapeHtml(category.name)}</span>
          <span class="badge badge-status is-${escapeHtml(point.status)}">${POINT_STATUS_LABELS[point.status] || point.status}</span>
        </div>
      </div>
      <p class="popup-desc">${escapeHtml(point.description)}</p>
      <dl class="popup-info">
        <dt>Teléfono</dt><dd>${phone}</dd>
        <dt>Horario</dt><dd>${escapeHtml(point.schedule || "—")}</dd>
        <dt>Coordenadas</dt><dd>${formatCoord(lat)}, ${formatCoord(lng)}</dd>
        <dt>Registró</dt><dd>${escapeHtml(point.createdBy?.name || "—")}</dd>
        <dt>Actualizado</dt><dd>${formatDate(point.updatedAt)}</dd>
      </dl>
      <div class="popup-actions">
        <button type="button" class="btn btn-danger-ghost" data-action="delete">Eliminar</button>
        <button type="button" class="btn btn-primary" data-action="edit">Editar</button>
      </div>
    `;

    onClick(container.querySelector('[data-action="edit"]'), renderEdit);
    onClick(container.querySelector('[data-action="delete"]'), () => onDelete(point));
    onResize();
  }

  function renderEdit() {
    container.innerHTML = `
      <h3 class="popup-title">Editar punto</h3>
      <form class="popup-form">
        ${pointFormHtml({
          name: point.name,
          description: point.description,
          category: point.category?.id,
          status: point.status,
          phone: point.phone,
          schedule: point.schedule,
          latitude: lat,
          longitude: lng
        }, categories)}
        <div class="popup-actions">
          <button type="button" class="btn btn-ghost" data-action="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary">Guardar cambios</button>
        </div>
      </form>
    `;

    const form = container.querySelector("form");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = readForm(form);
      const error = validateForm(data);
      if (error) return showError(container, error);

      showError(container, "");
      setBusy(form, true);

      try {
        await onUpdate(point.id, data);
      } catch (err) {
        showError(container, err.fullMessage || err.message);
        setBusy(form, false);
      }
    });

    onClick(container.querySelector('[data-action="cancel"]'), renderView);
    onResize();
  }

  renderView();
  return container;
}

/* ---------- Popup de una zona ---------- */
export function zonePopup({ zone, onFilter, onDelete, onAddPoint }) {
  const container = L.DomUtil.create("div", "ps-popup");
  L.DomEvent.disableClickPropagation(container);

  container.innerHTML = `
    <div class="popup-head">
      <span class="zone-swatch" style="background:${escapeHtml(zone.color)}"></span>
      <h3 class="popup-title">${escapeHtml(zone.name)}</h3>
    </div>
    ${zone.description ? `<p class="popup-desc">${escapeHtml(zone.description)}</p>` : ""}
    <p class="popup-desc"><strong>${zone.pointsInside ?? 0}</strong> puntos de ayuda dentro de la zona.</p>
    <button type="button" class="btn btn-ghost btn-block" data-action="add">📍 Registrar un punto aquí</button>
    <div class="popup-actions">
      <button type="button" class="btn btn-danger-ghost" data-action="delete">Eliminar zona</button>
      <button type="button" class="btn btn-primary" data-action="filter">Ver sus puntos</button>
    </div>
  `;

  onClick(container.querySelector('[data-action="add"]'), () => onAddPoint());
  onClick(container.querySelector('[data-action="filter"]'), () => onFilter(zone));
  onClick(container.querySelector('[data-action="delete"]'), () => onDelete(zone));

  return container;
}
