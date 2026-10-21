const bcrypt = require("bcryptjs");
const modelo = require("../modelos/usuarios.model");

const rolesValidos = new Set(["admin", "tecnico"]);
const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizarCorreo(valor) {
    return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

async function listar(req, res) {
    res.json(await modelo.listar());
}

async function crear(req, res) {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ error: "Envía un JSON con correo, contraseña y rol" });
    }

    const correo = normalizarCorreo(req.body.correo);
    const clave = req.body.clave;
    const rol = req.body.rol ?? "tecnico";
    if (!correoValido.test(correo) || correo.length > 254) {
        return res.status(400).json({ error: "Ingresa un correo electrónico válido" });
    }
    if (typeof clave !== "string" || Array.from(clave).length < 12 || Array.from(clave).length > 128) {
        return res.status(400).json({ error: "La contraseña debe tener entre 12 y 128 caracteres" });
    }
    if (!rolesValidos.has(rol)) {
        return res.status(400).json({ error: "El rol debe ser admin o tecnico" });
    }

    try {
        const usuario = await modelo.crear({
            correo,
            clave: await bcrypt.hash(clave, 12),
            rol,
            activo: true,
        });
        return res.status(201).json(usuario);
    } catch (error) {
        if (error?.code === "P2002") {
            return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
        }
        throw error;
    }
}

async function actualizar(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: "El identificador de usuario no es válido" });
    }
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ error: "Envía los cambios de usuario en formato JSON" });
    }

    const cambios = {};
    if (Object.hasOwn(req.body, "rol")) {
        if (!rolesValidos.has(req.body.rol)) {
            return res.status(400).json({ error: "El rol debe ser admin o tecnico" });
        }
        cambios.rol = req.body.rol;
    }
    if (Object.hasOwn(req.body, "activo")) {
        if (typeof req.body.activo !== "boolean") {
            return res.status(400).json({ error: "activo debe ser booleano" });
        }
        cambios.activo = req.body.activo;
    }
    if (Object.keys(cambios).length === 0) {
        return res.status(400).json({ error: "Indica un rol o estado válido para actualizar" });
    }
    if (id === req.usuario.id && (cambios.rol === "tecnico" || cambios.activo === false)) {
        return res.status(409).json({ error: "No puedes desactivar o quitarte tu propio rol de administrador" });
    }

    try {
        const usuario = await modelo.actualizar(id, cambios);
        if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
        return res.json(usuario);
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
        throw error;
    }
}

async function eliminar(req, res) {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: "El identificador de usuario no es válido" });
    }
    if (id === req.usuario.id) {
        return res.status(409).json({ error: "No puedes eliminar tu propia cuenta" });
    }

    try {
        const eliminado = await modelo.eliminar(id);
        if (!eliminado) return res.status(404).json({ error: "Usuario no encontrado" });
        return res.status(204).send();
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
        throw error;
    }
}

module.exports = { listar, crear, actualizar, eliminar };
