const express = require("express");
const controlador = require("../controllers/usuarios.controller");
const requiereRol = require("../middleware/requiereRol");
const verificarToken = require("../middleware/verificar_token");

const router = express.Router();

router.use(verificarToken, requiereRol("admin"));
router.get("/", controlador.listar);
router.post("/", controlador.crear);
router.patch("/:id", controlador.actualizar);
router.delete("/:id", controlador.eliminar);

module.exports = router;
