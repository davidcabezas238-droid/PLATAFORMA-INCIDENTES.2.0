const test = require("node:test");
const assert = require("node:assert/strict");
const { before, after } = require("node:test");
const { once } = require("node:events");
const { randomUUID } = require("node:crypto");
const bcrypt = require("bcryptjs");
const modelo = require("../modelos/usuarios.model");
const app = require("../index");

let servidor;
let baseUrl;
let administrador;
let administradorReserva;
let tokenAdmin;
let usuarioCreado;

before(async () => {
    administrador = await modelo.crear({
        correo: `usuarios.admin.${randomUUID()}@example.invalid`,
        clave: await bcrypt.hash("AdministradorPrueba-2026!", 12),
        rol: "admin",
        activo: true,
    });
    administradorReserva = await modelo.crear({
        correo: `usuarios.reserva.${randomUUID()}@example.invalid`,
        clave: await bcrypt.hash("ReservaSegura-2026!", 12),
        rol: "admin",
        activo: true,
    });
    servidor = app.listen(0, "127.0.0.1");
    await once(servidor, "listening");
    baseUrl = `http://127.0.0.1:${servidor.address().port}`;

    const respuesta = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            correo: administrador.correo,
            clave: "AdministradorPrueba-2026!",
        }),
    });
    assert.equal(respuesta.status, 200);
    tokenAdmin = (await respuesta.json()).token;
});

after(async () => {
    if (servidor) await new Promise((resolve) => servidor.close(resolve));
    if (usuarioCreado) await modelo.eliminar(usuarioCreado.id);
    if (administrador) await modelo.eliminar(administrador.id);
    if (administradorReserva) await modelo.eliminar(administradorReserva.id);
});

function auth(token = tokenAdmin) {
    return { Authorization: `Bearer ${token}` };
}

test("el administrador crea un usuario persistente sin exponer su hash", async () => {
    const correo = `tecnico.${randomUUID()}@example.invalid`;
    const clave = "TecnicoPrueba-2026!";
    const respuesta = await fetch(`${baseUrl}/usuarios`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ correo, clave, rol: "tecnico" }),
    });
    const usuario = await respuesta.json();

    assert.equal(respuesta.status, 201);
    assert.equal(usuario.correo, correo);
    assert.equal(usuario.rol, "tecnico");
    assert.equal("clave" in usuario, false);
    usuarioCreado = await modelo.buscarPorCorreo(correo);
    assert.notEqual(usuarioCreado.clave, clave);
    assert.equal(await bcrypt.compare(clave, usuarioCreado.clave), true);

    const inicio = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo.toUpperCase(), clave }),
    });
    assert.equal(inicio.status, 200);
    const tokenTecnico = (await inicio.json()).token;
    const sesion = await fetch(`${baseUrl}/sesion`, { headers: auth(tokenTecnico) });
    assert.equal(sesion.status, 200);
    assert.equal((await sesion.json()).rol, "tecnico");

    const accesoAdministrativo = await fetch(`${baseUrl}/usuarios`, { headers: auth(tokenTecnico) });
    assert.equal(accesoAdministrativo.status, 403);
});

test("solo administradores pueden crear cuentas y contraseñas débiles se rechazan", async () => {
    const sinAutorizacion = await fetch(`${baseUrl}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            correo: `anonimo.${randomUUID()}@example.invalid`,
            clave: "ClaveFuerte-2026!",
            rol: "tecnico",
        }),
    });
    assert.equal(sinAutorizacion.status, 401);

    const claveDebil = await fetch(`${baseUrl}/usuarios`, {
        method: "POST",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({
            correo: `debil.${randomUUID()}@example.invalid`,
            clave: "123",
            rol: "tecnico",
        }),
    });
    assert.equal(claveDebil.status, 400);
});

test("desactivar una cuenta invalida de inmediato sus tokens", async () => {
    const respuestaDesactivacion = await fetch(`${baseUrl}/usuarios/${usuarioCreado.id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false }),
    });
    assert.equal(respuestaDesactivacion.status, 200);

    const inicio = await fetch(`${baseUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: usuarioCreado.correo, clave: "TecnicoPrueba-2026!" }),
    });
    assert.equal(inicio.status, 401);

    const activacion = await fetch(`${baseUrl}/usuarios/${usuarioCreado.id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ activo: true }),
    });
    assert.equal(activacion.status, 200);
});

test("no se puede eliminar ni degradar al último administrador activo", async () => {
    const eliminarse = await fetch(`${baseUrl}/usuarios/${administrador.id}`, {
        method: "DELETE",
        headers: auth(),
    });
    assert.equal(eliminarse.status, 409);

    const degradarse = await fetch(`${baseUrl}/usuarios/${administrador.id}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ rol: "tecnico" }),
    });
    assert.equal(degradarse.status, 409);
});
