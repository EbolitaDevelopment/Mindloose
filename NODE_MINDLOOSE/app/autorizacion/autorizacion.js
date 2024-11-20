//Se importan las clases jsonwebtoken y dotenv de nodemodules
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

//Se agarran las encriptaciones del .env
dotenv.config();
//La funcion usa la funcion verificar para ver si esta loggeado o no
async function loggeado( req, res, next){
    const loggeado=verificar(req);
    if(loggeado){ return next();}
    return res.redirect("/admin")
}
//La funcion usa la funcion verificar para ver si esta loggeado o no
async function nologgeado(req,res,next){
  const loggeado=verificar(req);
    if(!loggeado){ return next();}
    return res.redirect("/presentacion")
}
//La funcion decodifica la cookie para agarrar al usuario y despues usa un fetch para hacer los movimientos desde la clase mysql
function verificar(req){
  try {
    let cookie_ = req.headers.cookie;
    let clave = "jwt=";
    
    if (!cookie_) {
      return false;
    }

    if (!cookie_.startsWith("jwt=")) {
      clave = " jwt=";
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith(clave))
    if (!cookie_JTW) {
      return false;
    }
    cookie_JTW = cookie_JTW.slice(clave.length);
    let decodificada;
    try {
      decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
    } catch (error) {
      return false;
    }
    const x = fetch("http://localhost:4000/api/verificar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },body: JSON.stringify({decodificada})})   
    if(!x){return false;}return true;}
 catch{return false;}
//Se exportan las funciones 
}
export const methods = {
    loggeado,
    nologgeado
}   