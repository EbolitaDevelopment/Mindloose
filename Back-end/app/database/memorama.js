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

// Función memorama
async function memorama(req, res) {
  const { tipo } = req.body;
  const { cookie } = req.body;

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
    const [rows] = await connection.query('SELECT descripcion, nombre FROM juegos WHERE conjunto = ?', [tipo]);

    if (rows.length === 0) {
      return res.status(400).json({ status: "error", message: "No se encontraron juegos" });
    }

    return res.status(201).json({
      status: "ok",
      message: "Todo bien",
      body: rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: "Error en el servidor" });
  } finally {
    connection.release();
  }
}


module.exports = { memorama };