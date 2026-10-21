import { solicitar } from "./api.js";

const feedback = document.querySelector("#feedback");
const userPanel = document.querySelector("#userPanel");
const userRegistry = document.querySelector("#userRegistry");
const userForm = document.querySelector("#userForm");
const userRows = document.querySelector("#userRows");
const createButton = document.querySelector("#createUserButton");

function mostrarMensaje(texto, tipo = "success") {
  feedback.textContent = texto;
  feedback.className = `feedback feedback-${tipo}`;
  feedback.hidden = !texto;
}

function crearCelda(texto) {
  const elemento = document.createElement("td");
  elemento.textContent = texto;
  return elemento;
}

function crearFila(usuario) {
  const fila = document.createElement("tr");
  fila.dataset.userId = usuario.id;
  fila.dataset.active = String(usuario.activo);
  fila.dataset.role = usuario.rol;
  fila.dataset.email = usuario.correo;
  fila.append(crearCelda(usuario.correo));

  const rolCelda = document.createElement("td");
  const rol = document.createElement("select");
  rol.setAttribute("aria-label", `Rol de ${usuario.correo}`);
  for (const [valor, texto] of [["tecnico", "Técnico"], ["admin", "Administrador"]]) {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = texto;
    opcion.selected = usuario.rol === valor;
    rol.append(opcion);
  }
  rolCelda.append(rol);
  fila.append(rolCelda, crearCelda(usuario.activo ? "Activo" : "Desactivado"));

  const acciones = document.createElement("td");
  const grupo = document.createElement("div");
  grupo.className = "row-actions";
  const actualizar = document.createElement("button");
  actualizar.className = "text-button";
  actualizar.type = "button";
  actualizar.dataset.action = "update";
  actualizar.textContent = "Guardar rol";
  grupo.append(actualizar);

  const activar = document.createElement("button");
  activar.className = "text-button";
  activar.type = "button";
  activar.dataset.action = "toggle";
  activar.textContent = usuario.activo ? "Desactivar" : "Activar";
  grupo.append(activar);

  const eliminar = document.createElement("button");
  eliminar.className = "text-button text-danger";
  eliminar.type = "button";
  eliminar.dataset.action = "delete";
  eliminar.textContent = "Eliminar";
  grupo.append(eliminar);
  acciones.append(grupo);
  fila.append(acciones);
  return fila;
}

async function cargarUsuarios() {
  const usuarios = await solicitar("/usuarios");
  userRows.replaceChildren(...usuarios.map(crearFila));
  document.querySelector("#userCount").textContent = `${usuarios.length} ${usuarios.length === 1 ? "cuenta" : "cuentas"}`;
}

async function iniciar() {
  if (!sessionStorage.getItem("token")) {
    window.location.replace("./login.html");
    return;
  }
  try {
    const usuario = await solicitar("/sesion");
    if (usuario.rol !== "admin") {
      mostrarMensaje("Solo un administrador puede gestionar cuentas.", "error");
      return;
    }
    userPanel.hidden = false;
    userRegistry.hidden = false;
    await cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, "error");
    if (error.message.startsWith("Error 401")) {
      sessionStorage.removeItem("token");
      window.location.replace("./login.html");
    }
  }
}

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  createButton.disabled = true;
  const datos = Object.fromEntries(new FormData(userForm));
  try {
    await solicitar("/usuarios", { method: "POST", body: JSON.stringify(datos) });
    userForm.reset();
    mostrarMensaje("Usuario registrado.");
    await cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  } finally {
    createButton.disabled = false;
  }
});

userRows.addEventListener("click", async (event) => {
  const boton = event.target.closest("button[data-action]");
  if (!boton) return;

  const fila = boton.closest("tr");
  const id = encodeURIComponent(fila.dataset.userId);
  const correo = fila.dataset.email;
  try {
    if (boton.dataset.action === "update") {
      const rol = fila.querySelector("select").value;
      await solicitar(`/usuarios/${id}`, { method: "PATCH", body: JSON.stringify({ rol }) });
      mostrarMensaje(`Rol de ${correo} actualizado.`);
    } else if (boton.dataset.action === "toggle") {
      const activo = fila.dataset.active !== "true";
      await solicitar(`/usuarios/${id}`, { method: "PATCH", body: JSON.stringify({ activo }) });
      mostrarMensaje(activo ? `Cuenta de ${correo} activada.` : `Cuenta de ${correo} desactivada.`);
    } else if (boton.dataset.action === "delete" && window.confirm(`¿Eliminar la cuenta ${correo}?`)) {
      await solicitar(`/usuarios/${id}`, { method: "DELETE" });
      mostrarMensaje(`Cuenta de ${correo} eliminada.`);
    }
    await cargarUsuarios();
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
});

document.querySelector("#refreshUsersButton").addEventListener("click", async () => {
  try {
    await cargarUsuarios();
    mostrarMensaje("Lista actualizada.");
  } catch (error) {
    mostrarMensaje(error.message, "error");
  }
});

iniciar();
