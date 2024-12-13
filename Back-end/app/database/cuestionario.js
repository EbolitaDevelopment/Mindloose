const dotenv = require('dotenv');
const jsonwebtoken = require('jsonwebtoken');
const { pool} = require('./mysql');
dotenv.config();


async function cuestionario(req, res) {
  const cookie_ = req.body.cookie;
  const connection = await pool.getConnection();

  if (!cookie_) {
    return res.status(402).json({ 
      status: "error", 
      message: "No se encontró la cookie JWT" 
    });
  }

  let decodificada;
  try {
    // Verify JWT token
    decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(403).json({
      status: "error",
      message: "Token JWT inválido o expirado",
      redirect: "/Procesoincompleto"
    });
  }

  // Defensive check to ensure user is extracted from token
  const usuario = decodificada?.user;
  if (!usuario) {
    return res.status(403).json({
      status: "error",
      message: "Token JWT inválido",
      redirect: "/Procesoincompleto"
    });
  }

  const nivel = parseInt(req.body.nivel);
  const suma = parseInt(req.body.suma);

  try {
    // Iniciar transacción
    await connection.beginTransaction();

    // Actualizar el progreso del usuario
    const [insertResult] = await connection.query(
      `UPDATE progreso SET progreso = ?, nivel = ? WHERE mail = ?`,
      [suma, nivel, usuario]
    );

    if (insertResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(400).json({
        status: "error",
        message: "Error al inicializar el progreso"
      });
    }

    // Confirmar la transacción
    await connection.commit();

    // Respuesta exitosa
    return res.status(201).json({
      status: "ok",
      message: "El progreso ha sido inicializado",
      redirect: "/procesocompleto"
    });

  } catch (error) {
    // Revertir la transacción en caso de error
    await connection.rollback();
    return res.status(500).json({ 
      status: "error", 
      message: "Error en el servidor" 
    });
  } finally {
    connection.release();
  }
}
module.exports = {
  cuestionario
};  