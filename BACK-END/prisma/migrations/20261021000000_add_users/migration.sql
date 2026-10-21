CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "correo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'tecnico',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");
