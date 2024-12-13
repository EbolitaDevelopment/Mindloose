const jsonwebtoken = require('jsonwebtoken');
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

// Función progreso
async function progreso(req, res) {
  const cookie = req.body.token;

  if (!cookie) {
    return res.status(402).json({ status: "error", message: "No se encontró la cookie JWT" });
  }

  let decodificada;
  try {
    decodificada = jsonwebtoken.verify(cookie, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(403).json({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
  }

  const user = decodificada.user;
  const connection = await pool.getConnection();

  try {
    const [progress] = await connection.query('SELECT progreso, nivel FROM progreso WHERE mail = ?', [user]);

    if (progress.length === 0) {
      return res.status(400).json({ status: "error", message: "No se encontró progreso para el usuario" });
    }

    return res.status(201).json({
      status: "ok",
      body: progress[0].progreso,
      body2: progress[0].nivel
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: "error", message: "Error al obtener el progreso" });
  } finally {
    connection.release();
  }
}
module.exports = {
  progreso
};