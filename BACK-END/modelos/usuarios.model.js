const prisma = require("./prisma");

const usuarioPublico = {
    id: true,
    correo: true,
    rol: true,
    activo: true,
    createdAt: true,
};

async function buscarPorCorreo(correo) {
    return prisma.usuario.findUnique({ where: { correo } });
}

async function buscarPorId(id) {
    return prisma.usuario.findUnique({ where: { id } });
}

async function listar() {
    return prisma.usuario.findMany({
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: usuarioPublico,
    });
}

async function contarAdministradoresActivos(tx = prisma) {
    return tx.usuario.count({ where: { rol: "admin", activo: true } });
}

async function crear(datos) {
    return prisma.usuario.create({
        data: datos,
        select: usuarioPublico,
    });
}

async function actualizar(id, cambios) {
    return prisma.$transaction(async (tx) => {
        const actual = await tx.usuario.findUnique({ where: { id } });
        if (!actual) return null;

        const dejaDeSerAdminActivo = actual.rol === "admin" && actual.activo
            && (cambios.rol === "tecnico" || cambios.activo === false);
        if (dejaDeSerAdminActivo && await contarAdministradoresActivos(tx) <= 1) {
            const error = new Error("Debe permanecer al menos un administrador activo");
            error.statusCode = 409;
            throw error;
        }

        return tx.usuario.update({
            where: { id },
            data: cambios,
            select: usuarioPublico,
        });
    }, { isolationLevel: "Serializable" });
}

async function eliminar(id) {
    return prisma.$transaction(async (tx) => {
        const actual = await tx.usuario.findUnique({ where: { id } });
        if (!actual) return false;

        if (actual.rol === "admin" && actual.activo && await contarAdministradoresActivos(tx) <= 1) {
            const error = new Error("No se puede eliminar el último administrador activo");
            error.statusCode = 409;
            throw error;
        }

        await tx.usuario.delete({ where: { id } });
        return true;
    }, { isolationLevel: "Serializable" });
}

async function verificarConexion() {
    await prisma.$queryRaw`SELECT 1`;
}

async function inicializarAdministrador() {
    const correo = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
    const clave = process.env.INITIAL_ADMIN_PASSWORD;
    if (Boolean(correo) !== Boolean(clave)) {
        throw new Error("INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD deben configurarse juntos");
    }

    const administradores = await contarAdministradoresActivos();
    if (administradores > 0) return false;
    if (!correo || !clave) {
        throw new Error("No hay administradores activos. Configura INITIAL_ADMIN_EMAIL y INITIAL_ADMIN_PASSWORD para crear el primero");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        throw new Error("INITIAL_ADMIN_EMAIL no es una dirección válida");
    }
    if (Array.from(clave).length < 12 || Array.from(clave).length > 128) {
        throw new Error("INITIAL_ADMIN_PASSWORD debe tener entre 12 y 128 caracteres");
    }

    const bcrypt = require("bcryptjs");
    const existente = await buscarPorCorreo(correo);
    if (existente) {
        throw new Error("INITIAL_ADMIN_EMAIL ya existe pero no es un administrador activo");
    }

    await crear({
        correo,
        clave: await bcrypt.hash(clave, 12),
        rol: "admin",
        activo: true,
    });
    return true;
}

async function desconectar() {
    await prisma.$disconnect();
}

module.exports = {
    buscarPorCorreo,
    buscarPorId,
    listar,
    contarAdministradoresActivos,
    crear,
    actualizar,
    eliminar,
    verificarConexion,
    inicializarAdministrador,
    desconectar,
};
