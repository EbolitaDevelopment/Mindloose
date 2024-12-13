const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const { pool} = require('./mysql');
const winston = require('winston'); 
dotenv.config();

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  ]
});

async function registrar(req, res) {
  const { email, name, apellidop, apellidom, hashPassword } = req.body;


  const connection = await pool.getConnection();

  try {
    // Iniciar transacción
    await connection.beginTransaction();

    // Verificar si el usuario ya existe
    const [existingUsers] = await connection.query(
      'SELECT * FROM usuario WHERE mail = ?', 
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(409).json({ 
        status: 'error', 
        message: 'El usuario ya existe' 
      });
    }

    // Encriptar la contraseña
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(hashPassword, salt);

    // Insertar el usuario
    const [userResult] = await connection.query(
      'INSERT INTO usuario (mail, name, apellidop, apellidom, password) VALUES (?, ?, ?, ?, ?)',
      [email, name, apellidop, apellidom, hashedPassword]
    );

    // Insertar progreso del usuario
    await connection.query(
      'INSERT INTO progreso (mail, progreso1, progreso2, progreso3) VALUES (?, 0, 0, 0)',
      [email]
    );

    // Confirmar la transacción
    await connection.commit();

    return res.status(201).json({ 
      status: 'ok', 
      message: 'Registrado con éxito' 
    });

  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    
    logger.error('Error en el registro:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Error en el registro' 
    });
  } finally {
    connection.release();
  }
}



module.exports = { registrar };
