//Se importan las clases de las librerias de nodejs
const mysql = require('mysql2/promise');
const mysql2 = require('mysql2');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const jsonwebtoken = require('jsonwebtoken');
//Se extraen las claves del documento .env
dotenv.config();
//Se crea la conexion con la base sql con un metodo de la clase mysql2
const pool = mysql.createPool({
    host: process.env.HOST,
    database: process.env.DATABASE,
    user: process.env.USER_SECRET,
    password: process.env.PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
const connection = mysql2.createConnection({
   host: process.env.HOST,
   database: process.env.DATABASE,
   user: process.env.USER_SECRET,
   password: process.env.PASSWORD
})
async function registrar(req, x) {
    const email = req.body.email;
    const name = req.body.name;
    const apellidop = req.body.apellidop;
    const apellidom = req.body.apellidom;
    const password = req.body.hashPassword;

    let rows = [];
    const nuevoUsuario = ("'" + email + "'," + " '" + name + "'," + " '" + apellidop + "'," + " '" + apellidom + "'," + "'" + password + "'");

    try {
        // Verifica si el usuario ya existe
        rows = await connection.promise().query('SELECT * FROM usuario WHERE mail = ?', [email]);

        // Si el arreglo `rows` está vacío, significa que no hay un usuario con ese correo
        if (rows[0].length === 0) {  // Verificar que el resultado no esté vacío
            try {
                // Inserta el nuevo usuario en la base de datos
                rows = await connection.promise().query(`INSERT INTO usuario values (${nuevoUsuario})`);

                // Verifica que la inserción fue exitosa
                if (rows.affectedRows === 0) {
                    return x.status(401).json({ status: "error", message: "Datos inválidos" });
                } else {
                    // Inserta el progreso del usuario
                    try {
                        await connection.promise().query(`INSERT INTO progreso values ('${email}', 0, 0, 0)`);
                    } catch {
                        return x.status(402).json({ status: "error", message: "Error al insertar progreso" });
                    }
                    return x.status(201).json({ status: "ok", message: "Registrado con éxito" });
                }
            } catch {
                return x.status(403).json({ status: "error", message: "Error al insertar usuario" });
            }
        } else {
            return x.status(403).json({ status: "error", message: "El usuario ya existe" });
        }
    } catch (error) {
        // Manejo de errores en la consulta de la base de datos
        console.error(error);
        return x.status(500).json({ status: "error", message: "Error en la consulta a la base de datos" });
    }
}

async function login(req, response) {
   const email = req.body.email;
   const password = req.body.password;


   try {
       const [rows] = await connection.promise().query('SELECT contra FROM usuario WHERE mail = ?', [email]);


       if (rows.length === 0) {
           return response.status(401).send({ status: "error", message: "Usuario no encontrado" });
       }
       const contraseñaCorrecta = await bcryptjs.compare(password, rows[0].contra);
       console.log(contraseñaCorrecta)
       if (!contraseñaCorrecta) {
           return response.status(402).send({ status: "error", message: "Contraseña incorrecta" });
       }


       return response.status(200).send({ status: "ok", message: "Contraseña correcta" });
   } catch  {
       console.error("Error");
       return response.status(500).send({ status: "error", message: "Error en el servidor" });
   }
}


async function cuestionario(req, res) {

    let cookie_ = req.body.cookie;
        if (!cookie_) {
        return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
        }
        let decodificada;
        try {
        decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
        } catch (error) {
        return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
        }
        const usuario = decodificada.user;
   const nivel = parseInt(req.body.nivel);
   const suma = parseInt(req.body.suma);


   try {
       const insertResult = await connection.promise().query(`UPDATE progreso SET progreso = ${suma}, nivel=${nivel} WHERE mail = '${usuario}';`,);
       if (insertResult.affectedRows === 0) {
           return res.status(400).send({ status: "error", message: "Error al inicializar el progreso" });
       }
       res.status(201).send({ status: "ok", message: "El progreso ha sido inicializado", redirect: "/procesocompleto" });
   } catch {
       try {
           await connection.promise().query('DELETE FROM usuario WHERE mail = ?', [usuario]);


       } catch {
           return res.status(400).send({ status: "error", message: "Error al inicializar el progreso" });
       }
       res.status(401).send({ status: "error", message: "Error al inicializar el progreso" });
   }
}
async function update(req, res) {
    let retos = req.body.retos;
    retos = retos.split("*");  
    let valor = parseInt(req.body.valor);
    
    try {
        let cookie_ = req.body.cookie;
        if (!cookie_) {
        return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
        }
        let decodificada;
        try {
        decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
        } catch (error) {
        return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
        }
        const user = decodificada.user;
        const resultado = await progreso1(user);  

        if (resultado.length === 0) {
            return res.status(400).send({ status: "error", message: "No se encontraron resultados." });
        }
        const progresof = resultado.progreso + valor;
        let nivel;
        if (progresof >= 0 && progresof < 30) { nivel = 1; }
        else if (progresof >= 30 && progresof < 60) { nivel = 2; }
        else if (progresof >= 60 && progresof < 90) { nivel = 3; }
        else if (progresof >= 90 && progresof < 115) { nivel = 4; }
        else if (progresof >= 115 && progresof < 125) { nivel = 5; }
        else if (progresof === 125) { return; } 

        let [insertResult] = await connection.promise().query(
            `UPDATE progreso SET progreso = ?, nivel = ? WHERE mail = ?`, 
            [progresof, nivel, user]
        );

        if (insertResult.affectedRows === 0) {
            return res.status(400).send({ status: "error", message: "Error al actualizar el progreso" });
        }

        let nReto;
        for (let i = 0; i < valor; i++) {
            insertResult = await connection.promise().query(
                `SELECT nReto FROM retos WHERE descripción = '${retos[i]}'`
            );
            if (insertResult[0][0] == []) {
                return res.status(403).send({ status: "error", message: "Datos invalidos" });
            }

            nReto = insertResult[0][0].nReto;

            insertResult = await connection.promise().query(
                `INSERT INTO retosCompletados VALUES (?, ?)`, 
                [nReto, user]
            );

            if (insertResult.affectedRows === 0) {
                return res.status(405).send({ status: "error", message: "Error al completar el reto" });
            }
        }

        return res.status(201).send({ status: "ok", message: "El progreso ha sido actualizado" });

    } catch (error) {
        console.error(error);  
        return res.status(402).send({ status: "error", message: "Error al actualizar el progreso" });
    }
}

async function verificar(req, res) {
  
   const email = req.body.decodificada.user;
   
   try {
    const [result] = await connection.promise().query('SELECT mail FROM usuario WHERE mail = ?', [email]);
    console.log(result[0])
       if (result.length === 0 || email !== result[0].mail) {
           return res.status(400).send({ status: "error", message: "Los campos son incorrectos" });
       }
           return res.status(202).send({ status: "ok", message: "Los campos son correctos" });
      
   } catch { return res.status(400).send({ status: "error", message: "Los campos son incorrectos" }); }
}
async function cambiarcontrasena(req, res) {
   const usuario = req.body.email;
   const password = req.body.hashPassword;
   try {
       const result = await connection.promise().query(`UPDATE usuario
   SET contra='${password}' WHERE mail = '${usuario}';`);
       console.log(result[0].affectedRows);
       if (result.affectedRows === 0) {
           return false, res.status(400).send({ status: "error", message: "Error en el servidor" });
       }
       return res.status(200).send({ status: "ok", message: "Contraseña cambiada" });
   } catch { return res.status(500).send({ status: "error", message: "Error en el servidor" }); }
}
async function progreso(req, res) {
    let cookie_ = req.body.token;
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   console.log(decodificada.user)
   const user = decodificada.user;
   try {
       const [progress] = await connection.promise().query(`SELECT progreso, nivel FROM progreso WHERE mail like '${user}';`);
       if (progress.length === 0) {
           console.log("No se encontró progreso para el usuario:", user);
           return res.status(400).send({ status: "Error" });
       } else {
           console.log("Progreso encontrado:", progress[0].progreso);
           return res.status(201).send({ status: "ok", body: progress[0].progreso, body2: progress[0].nivel });
       }
   } catch {
       console.error("Error al obtener el progreso");
       return res.status(400).send({ status: "Error" });


   }
}
async function progreso1(user) {
   try {
       const [progress] = await connection.promise().query(`SELECT progreso, nivel FROM progreso WHERE mail like '${user}';`);
       if (progress.length === 0) {
           console.log("No se encontró progreso para el usuario:", user);
           return false;
       } else {
           console.log("Progreso encontrado:", progress[0].progreso);
           return {
                progreso: progress[0].progreso,
               nivel: progress[0].nivel,
           };
       }
   } catch {
       console.error("Error al obtener el progreso");
       return false;


   }
}
async function retos(req, res) {
   try {
    let cookie_ = req.body.cookie;
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   const user = decodificada.user; 
       const resultado = await progreso1(user);
       if (resultado.length === 0) {
           return res.status(420).send({ status: "error" });
       }
       const nivel = resultado.nivel;
       var coeficiente = 0, coeficiente2 = 30;


       if (nivel === 1) {
           coeficiente = 0,
               coeficiente2 = 30
       }
       else
           if (nivel === 2) {
               coeficiente = 30,
                   coeficiente2 = 60
           }
           else
               if (nivel === 3) {
                   coeficiente = 60,
                       coeficiente2 = 90
               }
               else
                   if (nivel === 4) {
                       coeficiente = 90,
                           coeficiente2 = 115
                   }
                   else
                       if (nivel === 5) {
                           coeficiente = 115,
                               coeficiente2 = 125
                       }
                       else {
                           return res.status(401).send({ status: "error", message: "el nivel no coincide" });
                       }


       var comprobar = false; var nReto; var allRetos = ''; var retos1; var retos; var Iretos; var i = 0; var o = 0;
       let array = [];let tupu=0;
       try {
           do {
               const [checar] = await connection.promise().query('SELECT id FROM retosCompletados WHERE mail = ?', [user]);
               nReto = verReto(coeficiente, coeficiente2);
               comprobar = checar.some(reto => reto.id === nReto);
                if (array.includes(nReto)||comprobar === true) {
                   i = i
                   o = o + 1
                  
               }
               if (comprobar === false) {
                    tupu = tupu+1
                    array[tupu]= nReto ;
                   [retos] = await connection.promise().query(`SELECT descripción FROM retos WHERE nReto = ${nReto}`);
                   if (retos.length === 0) {
                       return res.status(403).send({ status: "error" });
                   }
                   retos1 = retos[0].descripción;
                   allRetos = allRetos + "'" + retos1 + "'"
                   i = i + 1
               }
               
           } while (i < 7 && o<29)
       }
       catch (error) {
           return res.status(409).send({ status: "error", message: "Error querying database" });
       }
       res.status(201).send({ status: "ok", descripcion: allRetos });
   } catch { return res.status(408).send({ status: "Error" }); }
}
function verReto(min, max) {
   const nReto = Math.floor(Math.random() * (max - min) + min);
   return nReto;
}
async function datos(req, response) {
    try {
        let cookie_ = req.body.cookie;
        console.log(cookie_)
        if (!cookie_) {
          return response.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
        }
        let decodificada;
        try {
          decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
        } catch (error) {
          return response.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
        }
       console.log(decodificada.user)
       const user = decodificada.user;
   try {
       const [result] = await connection.promise().query(`SELECT mail,nombre,apellidopat,apellidomat FROM usuario WHERE mail = '${user}';`);


       if (result.length === 0) {
           return response.status(400).send({ status: "error", message: "no se logro obtener la informacion" });
       } else {
           console.log(result[0].mail, result[0].nombre, result[0].apellidopat, result[0].apellidomat)
           return response.status(202).send({
               status: "ok", message: "info obtenida",
               body: result[0]
           });


       }
   } catch {
       return response.status(400).send({ status: "error", message: "Los campos son incorrectos" });
   }}catch(error){
            return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
        }


}
async function memorama(req,response){
    const mtipo=req.body.tipo;
    
   try {
    let cookie_ = req.body.cookie;
    console.log(cookie_)
    if (!cookie_) {
      return response.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
    } catch (error) {
      return response.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   console.log(decodificada.user)
   const user = decodificada.user;
   let rows = await connection.promise().query(`SELECT descripcion , nombre FROM juegos WHERE conjunto = ?`,[mtipo]);
   if (rows.length === 0) {
           return res.status(400).send({ status: "error", message: "Usuario no encontrado" });
       }
       return response.status(201).send({status:"ok", message: "Todo bien", body: rows[0]})
      
   } catch  {
       return response.status(500).send({ status: "error", message: "Error en el servidor" });
   }
}   

module.exports = {
   registrar,
   login,
   cuestionario,
   verificar,
   cambiarcontrasena,
   progreso,
   retos,
   update, 
   datos,
   memorama,
   pool
}




