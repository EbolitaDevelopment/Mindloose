const dotenv = require('dotenv');
const { pool} = require('./mysql');
const jsonwebtoken = require('jsonwebtoken');
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
async function datos(req, res) {
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
    const [result] = await connection.query('SELECT mail, nombre, apellidopat, apellidomat FROM usuario WHERE mail = ?', [user]);

    if (result.length === 0) {
      return res.status(400).json({ status: "error", message: "No se logró obtener la información" });
    }

    return res.status(202).json({
      status: "ok",
      message: "Información obtenida",
      body: result[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: "error", message: "Los campos son incorrectos" });
  } finally {
    connection.release();
  }
}
module.exports = { datos };