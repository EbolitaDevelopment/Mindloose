const { pool} = require('./mysql');
const winston = require('winston'); 

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

// Función cambiarcontraseña
async function cambiarcontrasena(req, res) {
  const { email, hashPassword } = req.body;
  const connection = await pool.getConnection();

  try {
    const [result] = await connection.query('UPDATE usuario SET contra = ? WHERE mail = ?', [hashPassword, email]);

    if (result.affectedRows === 0) {
      return res.status(400).json({ status: "error", message: "Error en el servidor" });
    }

    return res.status(200).json({ status: "ok", message: "Contraseña cambiada" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Error en el servidor" });
  } finally {
    connection.release();
  }
}
module.exports = {
  cambiarcontrasena
};