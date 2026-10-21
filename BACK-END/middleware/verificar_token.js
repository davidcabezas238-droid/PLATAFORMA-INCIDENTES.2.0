const jwt = require("jsonwebtoken");
const usuariosModelo = require("../modelos/usuarios.model");

async function verificarToken(req, res, next) {
    res.set("Cache-Control", "no-store");
    delete req.headers["if-none-match"];
    delete req.headers["if-modified-since"];
    const encabezado = req.headers.authorization;

    if (!encabezado || !encabezado.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token no proporcionado" });
    }

    let payload;
    try {
        payload = jwt.verify(encabezado.slice("Bearer ".length), process.env.JWT_SECRET);
    } catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }

    try {
        const usuario = Number.isInteger(Number(payload.sub))
            ? await usuariosModelo.buscarPorId(Number(payload.sub))
            : null;
        if (!usuario || !usuario.activo) {
            return res.status(401).json({ error: "La cuenta no existe o está desactivada" });
        }
        req.usuario = {
            id: usuario.id,
            correo: usuario.correo,
            rol: usuario.rol,
        };
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = verificarToken;