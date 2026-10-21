const usuariosModelo = require("../modelos/usuarios.model");

async function inicializarAdmin() {
    const creado = await usuariosModelo.inicializarAdministrador();
    console.info(JSON.stringify({
        evento: creado ? "initial_admin_created" : "initial_admin_already_present",
    }));
}

module.exports = inicializarAdmin;
