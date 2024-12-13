const dotenv = require('dotenv');
const { pool} = require('./mysql');
dotenv.config();

async function verificar(req, res) {
  const { user } = req.body;
  const connection = await pool.getConnection();

  try {
    const result = await connection.query('SELECT mail FROM usuario WHERE mail = ?', [user]);

    if (result.length!==0 && user === result[0].mail) {
      return res.status(202).json({ status: 'ok', message: 'Los campos son correctos' });
    } else {
      return res.status(400).json({ status: 'error', message: 'Los campos son incorrectos' });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ status: 'error', message: 'Los campos son incorrectos' });
  } finally {
    connection.release();
  }
}
  module.exports = {
    verificar
  };