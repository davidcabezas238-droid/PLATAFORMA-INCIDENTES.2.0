require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

if (!process.env.DATABASE_URL) {
    throw new Error("Define DATABASE_URL antes de iniciar la aplicación");
}

const databaseUrl = new URL(process.env.DATABASE_URL);
if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
    throw new Error("DATABASE_URL debe ser una URI de PostgreSQL");
}

const adapter = new PrismaPg({
    connectionString: databaseUrl.href,
    max: Number(process.env.DATABASE_POOL_SIZE || 5),
});

module.exports = new PrismaClient({ adapter });
