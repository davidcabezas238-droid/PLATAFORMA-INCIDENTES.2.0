require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const http = require("node:http");
const verificarToken = require("./middleware/verificar_token");
const requiereRol = require("./middleware/requiereRol");
const autenticacionRouter = require("./routers/autenticacion.routes");
const incidentesRouter = require("./routers/incidentes.routes");

const app = express();

app.use(compression({ threshold: 512 }));
app.use(express.json());

app.use(cors({ origin: ["http://127.0.0.1:5500", "http://localhost:5173", "http://127.0.0.1:5173"] }));

app.get("/healthz", (req, res) => res.status(200).json({ status: "ok" }));
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
// Solo un usuario con token válido Y rol "admin" puede llegar aquí. 
app.delete("/usuarios/:id", verificarToken, requiereRol("admin"), (req, res) => {
  res.json({ mensaje: `Usuario ${req.params.id} eliminado (simulado)` });
});
app.use("/incidentes", verificarToken, incidentesRouter);
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const certificatePath = path.join(__dirname, "certs", "localhost.pfx");

    if (!process.env.JWT_SECRET) {
        console.error("Falta JWT_SECRET en la configuración del entorno");
        process.exitCode = 1;
    } else if (process.env.NODE_ENV === "production" || process.env.HTTPS === "false") {
        const server = http.createServer(app);
        server.listen(port, () => console.log(`Backend HTTP en puerto ${port}`));
    } else if (!fs.existsSync(certificatePath)) {
        console.error("Falta BACK-END/certs/localhost.pfx. Consulta BACK-END/SEGURIDAD.md para crear el certificado local.");
        process.exitCode = 1;
    } else {
        const server = https.createServer({
            pfx: fs.readFileSync(certificatePath),
            passphrase: process.env.JWT_SECRET,
        }, app);
        server.listen(port, () => console.log(`Backend HTTPS en https://localhost:${port}`));
    }
}

module.exports = app;