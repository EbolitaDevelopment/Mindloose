const bcryptjs = require('bcryptjs');
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

async function login(req, res) {
  const { email, password } = req.body;
  const connection = await pool.getConnection();

  try {
    // Iniciar transacción 
    await connection.beginTransaction();

    // Consultar si el usuario existe
    const [rows] = await connection.query(
      'SELECT contra FROM usuario WHERE mail = ?', 
      [email]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(401).json({ 
        status: "error", 
        message: "Usuario no encontrado" 
      });
    }

    // Comparar la contraseña proporcionada con la almacenada en la base de datos
    const contraseñaCorrecta = await bcryptjs.compare(password, rows[0].contra);
    if (!contraseñaCorrecta) {
      await connection.rollback();
      return res.status(402).json({ 
        status: "error", 
        message: "Contraseña incorrecta" 
      });
    }

    // Confirmar la transacción
    await connection.commit();

    return res.status(200).json({ 
      status: "ok", 
      message: "Contraseña correcta" 
    });

  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    
    logger.error('Error en el login:', error);
    return res.status(500).json({ 
      status: "error", 
      message: "Error en el servidor" 
    });
  } finally {
    connection.release();
  }
}
module.exports = { login };