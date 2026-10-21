require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const http = require("node:http");
const { randomUUID } = require("node:crypto");
const verificarToken = require("./middleware/verificar_token");
const autenticacionRouter = require("./routers/autenticacion.routes");
const usuariosRouter = require("./routers/usuarios.routes");
const incidentesRouter = require("./routers/incidentes.routes");
const usuariosModelo = require("./modelos/usuarios.model");
const inicializarAdmin = require("./services/inicializarAdmin");

const app = express();

app.use(compression({ threshold: 512 }));
app.use((req, res, next) => {
    const inicio = performance.now();
    req.id = randomUUID();
    res.on("finish", () => console.info(JSON.stringify({
        evento: "http_request",
        requestId: req.id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs: Number((performance.now() - inicio).toFixed(2)),
    })));
    next();
});
app.use(express.json());

app.use(cors({ origin: ["http://127.0.0.1:5500", "http://localhost:5173", "http://127.0.0.1:5173"] }));

app.get("/healthz", async (req, res) => {
    try {
        await usuariosModelo.verificarConexion();
        return res.status(200).json({ status: "ok" });
    } catch (error) {
        console.error(JSON.stringify({ evento: "health_check_failed", requestId: req.id, error: error.message }));
        return res.status(503).json({ status: "unavailable" });
    }
});
app.get("/favicon.ico", (req, res) => res.redirect(302, "/favicon.svg"));
app.use(express.static(path.join(__dirname, "../FRON_END")));

 function contieneEtiquetasospechosas(texto) {
    return /<[^>]*>/.test(texto);
 }
 
app.post("/comentarios", verificarToken, (req, res) => {
     if (!req.body || typeof req.body !== "object" || Array.isArray(req.body) || typeof req.body.texto !== "string") {
         return res.status(400).json({ error: "texto debe ser una cadena" });
     }

     const texto = req.body.texto
         // eslint-disable-next-line no-control-regex -- elimina caracteres de control del comentario
         .replace(/[\u0000-\u001F\u007F]/g, " ")
         .replace(/\s+/g, " ")
         .trim();

     if (texto.length < 3 || texto.length > 1000) {
         return res.status(400).json({ error: "El comentario debe tener entre 3 y 1000 caracteres" });
     }

     if (contieneEtiquetasospechosas(texto)) {
         return res.status(400).json({ error: "El comentario contiene etiquetas HTML" });
    }

    res.status(201).json({ mensaje: "Comentario guardado (simulado)", texto: texto.trim() });   
});
 
app.use(autenticacionRouter);
app.use("/usuarios", usuariosRouter);
app.use("/incidentes", verificarToken, incidentesRouter);
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use((error, req, res, next) => {
    console.error(JSON.stringify({
        evento: "http_error",
        requestId: req.id,
        method: req.method,
        path: req.path,
        error: error.message,
    }));
    if (res.headersSent) return next(error);
    return res.status(error.statusCode || 500).json({
        error: error.statusCode ? error.message : "Error interno del servidor",
        requestId: req.id,
    });
});
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const certificatePath = path.join(__dirname, "certs", "localhost.pfx");

    if (!process.env.JWT_SECRET) {
        console.error("Falta JWT_SECRET en la configuración del entorno");
        process.exitCode = 1;
    } else if (process.env.NODE_ENV === "production" || process.env.HTTPS === "false") {
        inicializarAdmin().then(() => {
            const server = http.createServer(app);
            server.listen(port, () => console.info(JSON.stringify({ evento: "server_started", protocol: "http", port })));
        }).catch((error) => {
            console.error("No se pudo inicializar la aplicación", error);
            usuariosModelo.desconectar().finally(() => {
                process.exitCode = 1;
            });
        });
    } else if (!fs.existsSync(certificatePath)) {
        console.error("Falta BACK-END/certs/localhost.pfx. Consulta BACK-END/SEGURIDAD.md para crear el certificado local.");
        process.exitCode = 1;
    } else {
        inicializarAdmin().then(() => {
            const server = https.createServer({
                pfx: fs.readFileSync(certificatePath),
                passphrase: process.env.JWT_SECRET,
            }, app);
            server.listen(port, () => console.info(JSON.stringify({ evento: "server_started", protocol: "https", port })));
        }).catch((error) => {
            console.error("No se pudo inicializar la aplicación", error);
            usuariosModelo.desconectar().finally(() => {
                process.exitCode = 1;
            });
        });
    }
}

module.exports = app;