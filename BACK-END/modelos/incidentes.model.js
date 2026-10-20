const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
require("dotenv").config();

if (!process.env.DATABASE_URL) {
    throw new Error("Define DATABASE_URL antes de iniciar la aplicación");
}

const databaseUrlString = process.env.DATABASE_URL || "mysql://root:docker123!@localhost:3306/incidentesdeseguridad_db";
const databaseUrl = new URL(databaseUrlString);
if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL debe ser una URI de PostgreSQL");
}

const adapter = new PrismaPg({
    connectionString: databaseUrl.href,
    max: Number(process.env.DATABASE_POOL_SIZE || 5),
});

const prisma = new PrismaClient({ adapter });

function normalizarBusqueda(valor) {
    return String(valor ?? "").trim().toLowerCase();
}

async function listar(filtros = {}) {
    const termino = normalizarBusqueda(filtros.q);
    const prioridad = normalizarBusqueda(filtros.prioridad);
    const estado = normalizarBusqueda(filtros.estado);
    const page = Number(filtros.page ?? 1);
    const pageSize = Number(filtros.pageSize ?? 25);
    const condiciones = [];

    if (termino) {
        condiciones.push({
            OR: [
                { titulo: { contains: termino, mode: "insensitive" } },
                { descripcion: { contains: termino, mode: "insensitive" } },
                { prioridad: { contains: termino, mode: "insensitive" } },
                { estado: { contains: termino, mode: "insensitive" } },
            ],
        });
    }
    if (prioridad) condiciones.push({ prioridad: { equals: prioridad, mode: "insensitive" } });
    if (estado) condiciones.push({ estado: { equals: estado, mode: "insensitive" } });

    const where = condiciones.length ? { AND: condiciones } : undefined;
    const [items, total, gruposPorEstado] = await Promise.all([
        prisma.incidente.findMany({
            where,
            orderBy: { id: "asc" },
            skip: (page - 1) * pageSize,
            take: pageSize,
            select: {
                id: true,
                titulo: true,
                descripcion: true,
                prioridad: true,
                estado: true,
                archivoNombre: true,
                archivoMime: true,
            },
        }),
        prisma.incidente.count({ where }),
        prisma.incidente.groupBy({
            by: ["estado"],
            where,
            _count: { _all: true },
        }),
    ]);
    const cantidades = new Map(gruposPorEstado.map((grupo) => [grupo.estado, grupo._count._all]));

    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        resumen: {
            total,
            registrados: cantidades.get("Registrado") || 0,
            enRevision: cantidades.get("En revisión") || 0,
            resueltos: cantidades.get("Resuelto") || 0,
        },
    };
}

async function buscarPorId(id) {
    return prisma.incidente.findUnique({
        where: { id: Number(id) },
    });
}

async function crear(datos) {
    return prisma.incidente.create({
        data: {
            titulo: datos.titulo ?? datos.tipo,
            descripcion: datos.descripcion ?? null,
            prioridad: datos.prioridad,
            estado: datos.estado,
            archivoRuta: datos.archivoRuta ?? null,
            archivoNombre: datos.archivoNombre ?? null,
            archivoMime: datos.archivoMime ?? null,
        },
        select: {
            id: true,
            titulo: true,
            descripcion: true,
            prioridad: true,
            estado: true,
            archivoNombre: true,
            archivoMime: true,
        },
    });
}

async function actualizar(id, datos) {
    const incidenteActual = await buscarPorId(id);
    if (!incidenteActual) return null;

    return prisma.incidente.update({
        where: { id: Number(id) },
        data: {
            titulo: datos.titulo ?? incidenteActual.titulo,
            descripcion: datos.descripcion ?? incidenteActual.descripcion,
            prioridad: datos.prioridad ?? incidenteActual.prioridad,
            estado: datos.estado ?? incidenteActual.estado,
        },
    });
}

async function eliminar(id) {
    try {
        await prisma.incidente.delete({
            where: { id: Number(id) },
        });
        return true;
    } catch (error) {
        if (error?.code === "P2025") {
            return false;
        }
        throw error;
    }
}

module.exports = { listar, buscarPorId, crear, actualizar, eliminar };