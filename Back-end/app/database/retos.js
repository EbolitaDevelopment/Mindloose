const jsonwebtoken = require('jsonwebtoken');
const dotenv = require('dotenv');
const { pool} = require('./mysql');
dotenv.config();

async function update(req, res) {
  const connection = await pool.getConnection();
  
  // Add early validation for request body
  if (!req.body) {
      return res.status(400).json({ status: "error", message: "Cuerpo de solicitud vacío" });
  }

  const { retos, valor, cookie } = req.body;

  // Validate input parameters
  if (!retos || typeof retos !== 'string') {
      return res.status(402).json({ 
          status: "error", 
          message: "Parámetro de retos inválido o ausente",
          details: "retos debe ser un string no vacío"
      });
  }

  if (!valor || isNaN(parseInt(valor))) {
      return res.status(402).json({ 
          status: "error", 
          message: "Valor inválido",
          details: "valor debe ser un número válido"
      });
  }

  const retosArray = retos.split("*");
  
  // Validate that the split actually created an array with content
  if (retosArray.length === 0) {
      return res.status(402).json({ 
          status: "error", 
          message: "No se encontraron retos válidos",
          details: "El string de retos no contiene elementos separados por *"
      });
  }

  const valorInt = parseInt(valor);

  try {
      // Verificar la cookie JWT
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
      const resultado = await progreso1(user);

      // Validate resultado before accessing its properties
      if (!resultado || resultado.length === 0) {
          return res.status(400).json({ status: "error", message: "No se encontraron resultados" });
      }

      // Safely access progreso, providing a default if undefined
      const progresof = (resultado.progreso || 0) + valorInt;

      let nivel;
      if (progresof >= 0 && progresof < 30) nivel = 1;
      else if (progresof >= 30 && progresof < 60) nivel = 2;
      else if (progresof >= 60 && progresof < 90) nivel = 3;
      else if (progresof >= 90 && progresof < 115) nivel = 4;
      else if (progresof >= 115 && progresof < 125) nivel = 5;
      else if (progresof === 125) return res.status(200).json({ status: "ok", message: "Nivel máximo alcanzado" });

      // Iniciar transacción
      await connection.beginTransaction();

      // Actualizar el progreso
      const updateResult = await connection.query(
          `UPDATE progreso SET progreso = ?, nivel = ? WHERE mail = ?`,
          [progresof, nivel, user]
      );

      if (updateResult.affectedRows === 0 || updateResult.affectedRows === null) {
          await connection.rollback();
          return res.status(400).json({ status: "error", message: "Error al actualizar el progreso" });
      }

      // Validar que valorInt coincida con la longitud de retosArray
      if (valorInt !== retosArray.length) {
          await connection.rollback();
          return res.status(402).json({ 
              status: "error", 
              message: "Discrepancia en el número de retos",
              details: `Valor (${valorInt}) no coincide con número de retos (${retosArray.length})`
          });
      }

      // Insertar retos completados
      for (let i = 0; i < valorInt; i++) {
          const retoResult = await connection.query(
              `SELECT nReto FROM retos WHERE descripción = ?`, [retosArray[i]]
          );

          if (!retoResult || retoResult.length === 0 || retoResult[0].nReto === undefined) {
              await connection.rollback();
              return res.status(403).json({ status: "error", message: "Datos inválidos", details: `Reto no encontrado: ${retosArray[i]}` });
          }

          const nReto = retoResult[0].nReto;
          const insertRetoResult = await connection.query(
              `INSERT INTO retosCompletados (nReto, mail) VALUES (?, ?)`,
              [nReto, user]
          );

          if (insertRetoResult.affectedRows === 0) {
              await connection.rollback();
              return res.status(405).json({ status: "error", message: "Error al completar el reto", details: `Fallo al insertar reto: ${retosArray[i]}` });
          }
      }

      // Confirmar la transacción
      await connection.commit();
      return res.status(201).json({ status: "ok", message: "El progreso ha sido actualizado" });
  } catch (error) {
      console.error('Error en la actualización:', error);
      await connection.rollback();
      return res.status(500).json({ 
          status: "error", 
          message: "Error interno al actualizar el progreso",
          details: error.message 
      });
  } finally {
      connection.release();
  }
}
// Función retos

async function progreso1(user) {
  const connection = await pool.getConnection();
  try {
    // Ensure the query uses a parameterized query with proper LIKE pattern
    const progress = await connection.query(
      'SELECT progreso, nivel FROM progreso WHERE mail = ?',
      [user]
    );

    // Check if progress is undefined or empty
    if (!progress || progress.length === 0) {
      console.log(`No progress found for user: ${user}`);
      return null;
    }

    // Safely access the first result
    const userProgress = progress[0] || {};
    return {
      progreso: userProgress.progreso || 0,
      nivel: userProgress.nivel || 1
    };
  } catch (error) {
    console.error(`Error obtaining progress for user ${user}:`, error);
    return null;
  } finally {
    connection.release();
  }
}

async function retos(req, res) {
  const cookie = req.body.cookie;

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
  
  // Safely handle the result of progreso1
  const resultado = await progreso1(user);

  if (!resultado || resultado === '') {
    return res.status(420).json({ status: "error", message: "No se encontró progreso" });
  }

  const nivel = resultado.nivel;
  let coeficiente = 0, coeficiente2 = 30;

  switch (nivel) {
    case 1:
      coeficiente = 0;
      coeficiente2 = 30;
      break;
    case 2:
      coeficiente = 30;
      coeficiente2 = 60;
      break;
    case 3:
      coeficiente = 60;
      coeficiente2 = 90;
      break;
    case 4:
      coeficiente = 90;
      coeficiente2 = 115;
      break;
    case 5:
      coeficiente = 115;
      coeficiente2 = 125;
      break;
    default:
      return res.status(401).json({ status: "error", message: "El nivel no coincide" });
  }

  let allRetos = '';
  let array = [];
  let tupu = 0;
  const connection = await pool.getConnection();

  try {
    let i = 0, o = 0;
    while (i < 7 && o < 29) {
      const checar = await connection.query('SELECT id FROM retosCompletados WHERE mail = ?', [user]);
      const nReto = verReto(coeficiente, coeficiente2);

      // Ensure checar is an array before using some
      const completedRetoIds = Array.isArray(checar) ? checar.map(r => r.id) : [];

      if (array.includes(nReto) || completedRetoIds.includes(nReto)) {
        o++;
      } else {
        array[tupu] = nReto;
        const retos = await connection.query('SELECT descripción FROM retos WHERE nReto = ?', [nReto]);

        // Ensure retos is an array and has length
        if (!Array.isArray(retos) || retos.length === 0) {
          return res.status(403).json({ status: "error", message: "Error al obtener retos" });
        }

        // Check if the description is empty
        if (!retos[0].descripción || retos[0].descripción.trim() === '') {
          return res.status(403).json({ status: "error", message: "Descripción de reto vacía" });
        }

        allRetos += `'${retos[0].descripción}' `;
        i++;
      }
    }

    return res.status(201).json({ status: "ok", descripcion: allRetos.trim() });

  } catch (error) {
    console.error("Error en la función retos:", error);
    return res.status(409).json({ status: "error", message: "Error al consultar la base de datos" });
  } finally {
    connection.release();
  }
}


// Función verReto
function verReto(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}
module.exports = {
  retos,
  verReto, 
  progreso1, 
  update
};  