CREATE TABLE "Incidente" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "prioridad" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'abierto',
    "archivoRuta" TEXT,
    "archivoNombre" TEXT,
    "archivoMime" TEXT,

    CONSTRAINT "Incidente_pkey" PRIMARY KEY ("id")
);
