import bcryptjs from "bcryptjs";
import jsonwebtoken from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
//En esta función se evalua que las contraseñas sean iguales
function validarContraseñas(valor, valorcito) {
  if (valor === valorcito) {
    return true;
  } else {
    return false;
  }}
//En esta funcion se valida en email con expresiones regulares y el metodo test incorporado a js
function validarEmail(email) {
    if(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(email)){
    return true;
    }
    return false;
}
function contrasenavalidacion (password) {
  const contrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/;
  if(!contrasena.test(password)){
    return false;
  }
  return true;}

//En esta funcion se hace el registro de los usuarios
async function registro(req, res) {
//Como desde el archivo registro.js se envio un fetch tipo post con este ruteo, se obtienen las variables desde el front
  const email = req.body.email;
  const name = req.body.name;
  const apellidop = req.body.apellidop;
  const apellidom = req.body.apellidom;
  const password = req.body.password;
  const password2 = req.body.password2;

  //Se evaluan las variables con funciones externas
  if (!email ||!validarEmail(email)|| !password || !name || !apellidop || !apellidom || !password2 || !validarContraseñas(password, password2)|| !contrasenavalidacion(password)) {
    return res.status(400).send({ status: "error", message: "los campos son incorrectos" , redirect:"/Procesoincompleto"})
  }
  //Se crea una constante hash  y salt con metodos de la clase byscript para hashear la password
  const salt = await bcryptjs.genSalt(5);
  const hashPassword = await bcryptjs.hash(password, salt);
  
  //Se mandan las variables ya evaluadas a la clase mysql para despues enviarlos a la base a traves de un fetch post
  try{
    let consulta = await fetch("http://localhost:4000/api/registrar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({email, name, apellidop, apellidom, hashPassword })
      })
  
  if (!consulta.ok) {
    return res.status(400).send({ status: "error", message: "el usuario ya esta registrado", redirect:"/Procesoincompleto" })
  }}
  catch(error){
    return res.status(400).send({ status: "error", message: "el usuario ya esta registrado", redirect:"/Procesoincompleto" })

  }
  //Se crea una cookie  con metodos sign Y date con los metodos jsonwebtoken y las encriptaciones del archivo .env
  const token = jsonwebtoken.sign({user: email}, process.env.JWT_SECRET, 
    {expiresIn:process.env.JWT_EXPIRATION})  
  const cookieOption={
    expires: new Date (Date.now() + process.env.JWT_COOKIE_EXPIRES*24*60*60*1000),
    path:"/"
  } 
  //Se regresa la cookie al post de la clase registro y redirecciona a cuestionario
  res.cookie("jwt", token, cookieOption)
  return res.send({status:"ok ", message:"registrado con exito", redirect:"/cuestionario"})
}
//En esta funcion se hace el inicio de sesion de los usuarios
async function isesion(req, res) {
//Como desde el archivo isesion.js se envio un fetch tipo post con este ruteo, se obtienen las variables desde el front
  const email  =req.body.email
  const password = req.body.password;
  //Se evaluan las variables con funciones externas
  if (!email || !validarEmail(email)||!password) {
    return res.status(403).send({ status: "error", message: "Los campos son incorrectos", redirect: "/Procesoincompleto" });
  }
    try {
      let consulta = await fetch("http://localhost:4000/api/inicioSesion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      if (!consulta.ok) {
        return res.status(400).send({ status: "error", message: "la contraseña es incorrecta", redirect:"/Procesoincompleto" })

      }
    } catch (error) {
      return res.status(400).send({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" })
  }
  //Se crea una cookie  con metodos sign Y date con los metodos jsonwebtoken y las encriptaciones del archivo .env
  const token = jsonwebtoken.sign({ user: email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });
  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    path: "/"
  };
//Se regresa la cookie al post de la clase registro y redirecciona a sesion iniciada
  res.cookie("jwt", token, cookieOption);
  return res.status(201).send({ status: "ok", message: "Loggeado con éxito", redirect: "/sesioniniciada" });
}

//En esta funcion se hace el cambio de contraseña de los usuarios
async function cambiar(req,res){  
  //Como desde el archivo cuenta.js se envio un fetch tipo post con este ruteo, se obtienen las variables desde el front
    const password = req.body.password;
    const password2 = req.body.password2;
    const password3 = req.body.password3;
    //Se usa la cookie para obtener el usuario decodificandola
    const cookie_JTW = req.headers.cookie.split(";").find(cookie => cookie.startsWith("jwt=")).slice(4);
    const decodificada=jsonwebtoken.verify(cookie_JTW,  process.env.JWT_SECRET)
    const email = decodificada.user;
    
  try{
  //Valida que las contraseñas sean iguales con el metodo validarContraseñas
  
  if(validarContraseñas(password,password2)||!validarContraseñas(password2,password3)){
  return res.status(400).send({status:"error ",message:"Colocaste mal las contraseñas",redirect:"/Procesoincompleto"});
  }
  try {
    let consulta = await fetch("http://localhost:4000/api/inicioSesion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    if (!consulta.ok) {
      return res.status(400).send({ status: "error", message: "la contraseña es incorrecta", redirect:"/Procesoincompleto" })
    }
  } catch (error) {
    return res.status(400).send({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" })
  }

  //Se crea una nueva salt  y hash
  const salt = await bcryptjs.genSalt(5);
  const hashPassword = await bcryptjs.hash(password2, salt);
  //Se  intenta cambiar la contraseña con un fetch q manda las variables a una clase de mysql
  try {
    let consulta = await fetch("http://localhost:4000/api/cambiarcontrasena", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, hashPassword })
    });
    if (!consulta.ok) {
      return res.status(400).send({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" })
    }
  } catch (error) {
    return res.status(400).send({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" })
  }
  //Acorde al resultado se redirecciona a proceso completo o incompleto
  
  return res.send.status(202).send({status:"ok ", message:"contraseña cambiada",redirect:"/contrasenacambiada"})}
  catch{
  return res.status(400).send({status:"error", message:"error en consulta de datos",redirect:"/Procesoincompleto"})
}
}
//En esta funcion se verifica la identidad del usuario
async function verificar(req,res) {
  try {
    let cookie_ = req.headers.cookie;
    if(cookie_ == undefined){
      return res.status(402).send({ status: "error"});
    }
    let cookie_JTW = cookie_.split(";").find(cookie => cookie.startsWith("jwt=")).slice(4);
    const decodificada = jsonwebtoken.verify(cookie_JTW, process.env.JWT_SECRET);
    const response = await fetch("http://localhost:4000/api/verificar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ decodificada})
    });
//Y dependiendo el resultado te redirecciona a proceso indirecto o no
    if (!response.ok) {
      return res.status(402).send({ status: "error", redirect: "/Procesoincompleto" });
    } else {
      return res.status(202).send({ status: "ok" });
    }
  } catch (error) {
    console.error("Verification failed:", error);
    return res.status(403).send({ status: "error", redirect: "/Procesoincompleto" });
  }
}
//Se exportan las funciones con una constante
export const methods = {
  registro,
  isesion, 
  cambiar,
  verificar
}
