const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Validate if passwords are equal
function validarContraseñas(valor, valorcito) {
  return valor === valorcito;
}

// Validate email with regular expression
function validarEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(email);
}

// Validate password complexity
function contrasenavalidacion(password) {
  const contrasena = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,12}$/;
  return contrasena.test(password);
}

// User registration
async function registro(req, res) {
  const email = req.body.email;
  const name = req.body.name;
  const apellidop = req.body.apellidop;
  const apellidom = req.body.apellidom;
  const password = req.body.password;
  const password2 = req.body.password2;

  // Validations
  if (!email || !validarEmail(email) || !password || !name || !apellidop || !apellidom || !password2 || !validarContraseñas(password, password2) || !contrasenavalidacion(password)) {
    return res.status(400).json({ status: "error", message: "Los campos son incorrectos", redirect: "/Procesoincompleto" });
  }

  // Hash the password
  const salt = await bcryptjs.genSalt(5);
  const hashPassword = await bcryptjs.hash(password, salt);

  // Register user in the database
  try {
    let consulta = await fetch("http://localhost:4000/api/registrar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, name, apellidop, apellidom, hashPassword })
    });

    if (!consulta.ok) {
      return res.status(400).json({ status: "error", message: "El usuario ya está registrado", redirect: "/Procesoincompleto" });
    }
  } catch (error) {
    return res.status(400).send({ status: "error", message: "Error en el registro", redirect: "/Procesoincompleto" });
  }

  // Create JWT token
  const token = jsonwebtoken.sign({ user: email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

  // Cookie options
  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    path: "/"
  };

  // Respond with JSON containing token and redirect
  return res.json({
    status: "ok",
    message: "Registrado con éxito",
    redirect: "/cuestionario",
    body: {
      clave: "jwt",
      token: token,
    }
  });
}

// User login
async function isesion(req, res) {
  const email = req.body.email;
  const password = req.body.password;

  // Validate inputs
  if (!email || !validarEmail(email) || !password) {
    return res.status(403).json({ status: "error", message: "Los campos son incorrectos", redirect: "/Procesoincompleto" });
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
      return res.status(400).json({ status: "error", message: "la contraseña es incorrecta", redirect:"/Procesoincompleto" });
    }
  } catch (error) {
    return res.status(400).json({ status: "error", message: "error en la consulta a la base", redirect:"/procesoincompleto" });
  }

  // Create JWT token
  const token = jsonwebtoken.sign({ user: email }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

  // Respond with JSON containing token and redirect
  return res.json({
    status: "ok",
    message: "Inicio de sesión con éxito",
    redirect: "/procesocompleto",
    body: {
      clave: "jwt",
      token: token,
    }
  });
}

// Change password
async function cambiar(req, res) { 
  const password = req.body.password;
  const password2 = req.body.password2;
  const password3 = req.body.password3;

  // Get user from JWT cookie
  let cookie_ = req.body.cookie;
  if (!cookie_) {
    return res.status(402).json({ status: "error", message: "No se encontró la cookie JWT" });
  }

  let decodificada;
  try {
    decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(403).json({ status: "error", message: "Token JWT inválido o expirado", redirect: "/Procesoincompleto" });
  }
  const email = decodificada.user;
  
  try {
    // Validate passwords
    if (!validarContraseñas(password2, password3) || !contrasenavalidacion(password2)) {
      return res.status(400).json({status:"error", message:"Colocaste mal las contraseñas", redirect:"/Procesoincompleto"});
    }

    // Verify current password
    try {
      let consulta = await fetch("http://localhost:4000/api/inicioSesion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      if (!consulta.ok) {
        return res.status(400).json({ status: "error", message: "la contraseña es incorrecta", redirect:"/Procesoincompleto" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" });
    }

    // Create new password hash
    const salt = await bcryptjs.genSalt(5);
    const hashPassword = await bcryptjs.hash(password2, salt);

    // Update password in database
    try {
      let consulta = await fetch("http://localhost:4000/api/cambiarcontrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, hashPassword })
      });
      if (!consulta.ok) {
        return res.status(400).json({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" });
      }
    } catch (error) {
      return res.status(400).json({ status: "error", message: "error en la consulta a la base", redirect:"/Procesoincompleto" });
    }

    // Successful password change
    return res.status(202).json({status:"ok", message:"contraseña cambiada", redirect:"/procesocompleto"});
  } catch(error) {
    return res.status(400).json({status:"error", message:"error en consulta de datos", redirect:"/Procesoincompleto"});
  }
}

// Export the functions
module.exports = {
  registro,
  isesion,
  cambiar,
  contrasenavalidacion,
  validarEmail
};