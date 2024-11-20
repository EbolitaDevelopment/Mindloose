//Se importan las clases de las librerias de nodejs
import mysql from 'mysql2';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import jsonwebtoken from 'jsonwebtoken';
import { response } from 'express';
//Se extraen las claves del documento .env
dotenv.config();
//Se crea la conexion con la base sql con un metodo de la clase mysql2
const connection = mysql.createConnection({
   host: process.env.HOST,
   database: process.env.DATABASE,
   user: process.env.USER_SECRET,
   password: process.env.PASSWORD
})
//Se crea una funcion en la que
async function registrar(req, x) {
   const email = req.body.email;
   const name = req.body.name;
   const apellidop = req.body.apellidop;
   const apellidom = req.body.apellidom;
   const password = req.body.hashPassword;
   let rows = [];
   const nuevoUsuario = ("'" + email + "'," + " '" + name + "'," + " '" + apellidop + "'," + " '" + apellidom + "'," + "'" + password + "'")
   try{
      
       rows = await connection.promise().query('SELECT * FROM usuario WHERE mail = ?', [email]);
       if(rows[0] = []){
   try {
       rows = await connection.promise().query(`INSERT INTO usuario values (${nuevoUsuario})`)
      
       if ( rows.affectedRows === 0) {
           return x.status(401).send({ status: "error", message: "datos invalidos"});
       }
       else {
           try { connection.query(`INSERT INTO progreso values ('${email}',0,0)`)
           } catch {
           return x.status(402).send({ status: "error", message: "datos invalidos"})
           }
           return x.status(201).send({ status: "ok", message: "el usuario ya esta registrado" });
       }
   } catch {
       return x.status(403).send({ status: "error", message: "datos invalidos"  }) }}
       else{
           return x.status(403).send({ status: "error", message: "datos invalidos"})
       }
   }catch(error){


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
    let cookie_ = req.headers.cookie;
    let clave = "jwt=";
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    if (!cookie_.startsWith("jwt=")) {
      clave = " jwt=";
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave));
    if (!cookie_JTW) {
      return res.status(402).send({ status: "error", message: "No se encontró el token JWT en las cookies" });
    }
    cookie_JTW = cookie_JTW.slice(clave.length);
    console.log(cookie_JTW);
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
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
       res.status(201).send({ status: "ok", message: "El progreso ha sido inicializado", redirect: "/cuentacreada" });
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
    const retos = req.body.retos;
    retos = retos.split("*");
    const valor = parseInt(req.body.valor);
    for(let i = 0;i < valor; i++){
        
    }
    /*try {
       const resultado = parseInt(await progreso2(req, response));
       if (resultado.length === 0) {
           return res.status(400).send({ status: "error" });
       }
       const progresof = resultado + valor;
       let nivel;


       if (progresof >= 0 && progresof < 30) { nivel = 1 }
       if (progresof >= 30 && progresof < 60) { nivel = 2 }
       if (progresof >= 60 && progresof < 90) { nivel = 3 }
       if (progresof >= 90 && progresof < 115) { nivel = 4 }
       if (progresof >= 115 && progresof < 125) { nivel = 5 }
       if (progresof === 125) { return; }
       const [insertResult] = await connection.promise().query(`UPDATE progreso SET progreso = ${progresof},
       nivel = ${nivel} WHERE mail = '${user}';`,);
       if (insertResult.affectedRows === 0) {
           console.log(progresof, nivel)
           return res.status(400).send({ status: "error", message: "Error al inicializar el progreso" });
       }


       res.status(201).send({ status: "ok", message: "El progreso ha sido inicializado" });
   } catch {
       res.status(401).send({ status: "error", message: "Error al inicializar el progreso" });
   }*/


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
async function progreso(req, response) {

    let cookie_ = req.headers.cookie;
    let clave = "jwt=";
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    if (!cookie_.startsWith("jwt=")) {
      clave = " jwt=";
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave));
    if (!cookie_JTW) {
      return res.status(402).send({ status: "error", message: "No se encontró el token JWT en las cookies" });
    }
    cookie_JTW = cookie_JTW.slice(clave.length);
    console.log(cookie_JTW);
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   const user = decodificada.user;
   try {
       const [progress] = await connection.promise().query(`SELECT progreso, nivel FROM progreso WHERE mail like '${user}';`);
       if (progress.length === 0) {
           console.log("No se encontró progreso para el usuario:", user);
           return response.status(400).send({ status: "Error" });
       } else {
           console.log("Progreso encontrado:", progress[0].progreso);
           return response.status(201).send({ status: "ok", body: progress[0].progreso, body2: progress[0].nivel });
       }
   } catch {
       console.error("Error al obtener el progreso");
       return response.status(400).send({ status: "Error" });


   }
}
async function progreso2(req, response) {
    let cookie_ = req.headers.cookie;
    let clave = "jwt=";
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    if (!cookie_.startsWith("jwt=")) {
      clave = " jwt=";
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave));
    if (!cookie_JTW) {
      return res.status(402).send({ status: "error", message: "No se encontró el token JWT en las cookies" });
    }
    cookie_JTW = cookie_JTW.slice(clave.length);
    console.log(cookie_JTW);
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   const user = decodificada.user;
   try {
       const [progress] = await connection.promise().query(`SELECT progreso, nivel FROM progreso WHERE mail like '${user}';`);
       if (progress.length === 0) {
           console.log("No se encontró progreso para el usuario:", user);
           return response.status(400).send({ status: "Error" });
       } else {
           console.log("Progreso encontrado:", progress[0].progreso);
           return progress[0].progreso;
       }
   } catch {
       console.error("Error al obtener el progreso");
       return response.status(400).send({ status: "Error" });


   }
}
async function progreso3(req, response){
    let cookie_ = req.headers.cookie;
    let clave = "jwt=";
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    if (!cookie_.startsWith("jwt=")) {
      clave = " jwt=";
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave));
    if (!cookie_JTW) {
      return res.status(402).send({ status: "error", message: "No se encontró el token JWT en las cookies" });
    }
    cookie_JTW = cookie_JTW.slice(clave.length);
    console.log(cookie_JTW);
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   const user = decodificada.user;
   try {
       const [progress] = await connection.promise().query(`SELECT nivel FROM progreso WHERE mail like '${user}';`);
       if (progress.length === 0) {
           console.log("No se encontró progreso para el usuario:", user);
           return response.status(400).send({ status: "Error" });
       } else {
           return progress[0].nivel;
       }
   } catch {
       console.error("Error al obtener el progreso");
       return response.status(400).send({ status: "Error" });


   }
}
async function progreso1(req, response) {


    let cookie_ = req.headers.cookie;
    let clave = "jwt=";
    if (!cookie_) {
      return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
    }
    if (!cookie_.startsWith("jwt=")) {
      clave = " jwt=";
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave));
    if (!cookie_JTW) {
      return res.status(402).send({ status: "error", message: "No se encontró el token JWT en las cookies" });
    }
    cookie_JTW = cookie_JTW.slice(clave.length);
    console.log(cookie_JTW);
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
    }
   const user = decodificada.user;
   try {
       const [progress] = await connection.promise().query(`SELECT progreso, nivel FROM progreso WHERE mail like '${user}';`);
       if (progress.length === 0) {
           console.log("No se encontró progreso para el usuario:", user);
           return false;
       } else {
           console.log("Progreso encontrado:", progress[0].progreso);
           return {
               nivel: progress[0].nivel,
               user: user
           };
       }
   } catch {
       console.error("Error al obtener el progreso");
       return false;


   }
}
async function retos(req, res) {
   try {
      
       const resultado = await progreso1(req, response);
       if (resultado.length === 0) {
           return res.status(420).send({ status: "error" });
       }
       const nivel = resultado.nivel;
       const user = resultado.user;
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
       try {
           do {
               const [checar] = await connection.promise().query('SELECT id FROM retosCompletados WHERE mail = ?', [user]);
               nReto = verReto(coeficiente, coeficiente2);
               comprobar = checar.some(reto => reto.id === nReto);
                  
               if (comprobar === false) {
                   [retos] = await connection.promise().query(`SELECT descripción FROM retos WHERE nReto = ${nReto}`);
                   console.log(nReto)
                   console.log(retos[0])
                   if (retos.length === 0) {
                       return res.status(403).send({ status: "error" });
                   }
                   retos1 = retos[0].descripción;


                   [Iretos] = await connection.promise().query(`INSERT INTO retosCompletados VALUES (?, ?)`, [nReto, user]);
                  
                   if (Iretos.affectedRows === 0) {
                       return res.status(402).send({ status: "error", message: "Error al inicializar el progreso" });
                   }


                   allRetos = allRetos + "'" + retos1 + "'"
                   i = i + 1
               }
               if (comprobar === true) {
                   i = i
                   o = o + 1
                  
               }
           } while (i < 7 && o<29)
       console.log(allRetos)
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
        let cookie_ = req.headers.cookie;
        let clave = "jwt=";
        if (!cookie_) {
          return res.status(402).send({ status: "error", message: "No se encontró la cookie JWT" });
        }
        if (!cookie_.startsWith("jwt=")) {
          clave = " jwt=";
        }
        let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave));
        if (!cookie_JTW) {
          return res.status(402).send({ status: "error", message: "No se encontró el token JWT en las cookies" });
        }
        cookie_JTW = cookie_JTW.slice(clave.length);
        let decodificada;
        try {
          decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
        } catch (error) {
          return res.status(403).send({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
        }
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
async function comentarios(req,response){
   try {


       const nivel = await progreso3(req, response);
       let coeficiente;let coeficiente2;


       if (nivel === 1) {
           coeficiente = 0,
               coeficiente2 = 5
       }
       else
           if (nivel === 2) {
               coeficiente = 6,
                   coeficiente2 = 10
           }
           else
               if (nivel === 3) {
                   coeficiente = 11,
                       coeficiente2 = 15
               }
               else
                   if (nivel === 4) {
                       coeficiente = 15,
                           coeficiente2 = 19
                   }
                   else
                       if (nivel === 5) {
                           coeficiente = 20,
                               coeficiente2 = 24
                       }
                       else {
                           return res.status(401).send({ status: "error", message: "el nivel no coincide" });
                       }


       const ncomentarios = Math.floor(Math.random() * (coeficiente2 - coeficiente) +coeficiente);
      
       const [rows] = await connection.promise().query(`SELECT comentarios, sugerencias FROM comentarios WHERE id = ${ncomentarios} and nivel = ${nivel}`);
       if (rows.length === 0) {
           return res.status(400).send({ status: "error", message: "Usuario no encontrado" });
       }
       return response.status(201).send({status:"ok", message: "Todo bien", body: rows[0].comentarios, body2: rows[0].sugerencias})
      
   } catch  {
       return response.status(500).send({ status: "error", message: "Error en el servidor" });
   }
}   
export const querys = {
   registrar,
   login,
   cuestionario,
   verificar,
   cambiarcontrasena,
   progreso,
   retos,
   update, 
   datos,
   comentarios
}




