const fs = require("node:fs/promises");
const path = require("node:path");

const driver = process.env.STORAGE_DRIVER || (process.env.NODE_ENV === "production" ? "supabase" : "local");
const directorioAdjuntos = process.env.UPLOADS_DIR || path.join(__dirname, "../uploads");
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "evidencias-incidentes";
let supabase;

if (driver === "supabase") {
    const { createClient } = require("@supabase/supabase-js");
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error("STORAGE_DRIVER=supabase requiere SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
    }
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
} else if (driver !== "local") {
    throw new Error(`STORAGE_DRIVER no compatible: ${driver}`);
}

async function guardarAdjunto(ruta, contenido, mime) {
    if (driver === "supabase") {
        const { error } = await supabase.storage.from(bucket).upload(ruta, contenido, {
            contentType: mime,
            upsert: false,
        });
        if (error) throw error;
        return;
    }

    await fs.mkdir(directorioAdjuntos, { recursive: true });
    await fs.writeFile(path.join(directorioAdjuntos, path.basename(ruta)), contenido, { flag: "wx" });
}

async function leerAdjunto(ruta) {
    if (driver === "supabase") {
        const { data, error } = await supabase.storage.from(bucket).download(ruta);
        if (error) throw error;
        return Buffer.from(await data.arrayBuffer());
    }

    return fs.readFile(path.join(directorioAdjuntos, path.basename(ruta)));
}

async function eliminarAdjunto(ruta) {
    if (driver === "supabase") {
        const { error } = await supabase.storage.from(bucket).remove([ruta]);
        if (error) throw error;
        return;
    }

    try {
        await fs.unlink(path.join(directorioAdjuntos, path.basename(ruta)));
    } catch (error) {
        if (error.code !== "ENOENT") throw error;
    }
}

module.exports = { guardarAdjunto, leerAdjunto, eliminarAdjunto };
