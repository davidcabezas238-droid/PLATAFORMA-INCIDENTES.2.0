require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

if (!process.env.DATABASE_URL) {
    throw new Error("Define DATABASE_URL antes de ejecutar el benchmark");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
const prisma = new PrismaClient({
    adapter: new PrismaMariaDb({
        host: databaseUrl.hostname,
        port: Number(databaseUrl.port || 3306),
        user: databaseUrl.username,
        password: databaseUrl.password,
        database: databaseUrl.pathname.replace("/", ""),
    }),
});
const select = {
    id: true,
    titulo: true,
    descripcion: true,
    prioridad: true,
    estado: true,
    archivoNombre: true,
    archivoMime: true,
};

async function medir(consulta) {
    const duraciones = [];
    for (let intento = 0; intento < 12; intento += 1) {
        const inicio = performance.now();
        await consulta();
        if (intento >= 2) duraciones.push(performance.now() - inicio);
    }
    duraciones.sort((a, b) => a - b);
    return {
        medianaMs: Number(duraciones[Math.floor(duraciones.length / 2)].toFixed(2)),
        p95Ms: Number(duraciones[Math.ceil(duraciones.length * 0.95) - 1].toFixed(2)),
    };
}

async function main() {
    const todos = await prisma.incidente.findMany({ orderBy: { id: "asc" }, select });
    const antes = await medir(() => prisma.incidente.findMany({ orderBy: { id: "asc" }, select }));
    const despues = await medir(async () => Promise.all([
        prisma.incidente.findMany({
            orderBy: { id: "asc" },
            skip: 0,
            take: 25,
            select,
        }),
        prisma.incidente.count(),
        prisma.incidente.groupBy({ by: ["estado"], _count: { _all: true } }),
    ]));

    console.log(JSON.stringify({
        registros: todos.length,
        pagina: Math.min(todos.length, 25),
        antes,
        despues,
        nota: todos.length < 100 ? "Muestra pequeña: repite en staging con datos representativos." : undefined,
    }, null, 2));
}

main()
    .catch((error) => {
        console.error(`No se pudo medir la consulta: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
