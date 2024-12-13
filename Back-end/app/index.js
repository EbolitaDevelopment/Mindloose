const { registrar, login, cuestionario, verificar, cambiarcontrasena, progreso, retos,
update,  datos, memorama } = require("./database/mysql.js");
const autorizacion = require("./autorizacion/autorizacion.js");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const EventEmitter = require('events');
EventEmitter.defaultMaxListeners = 20;
const path = require("path");
const { registro, isesion, cambiar } = require("./controllers/authentication.controller.js");

//SERVER: se establece una constante de la clase importada express
const app = express();
//se establece que el puerto sea 4000
app.set("port", 4000);
//Cuando el puerto se conecte envia un mensaje a la terminal
app.listen(app.get("port"));
console.log("Servidor corriente en un puerto"+ app.get("port"));

app.use(cors({
  origin: 'http://localhost:3000', // Your frontend's URL
  methods: ['GET', 'POST', 'OPTIONS','PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
 // m
//CONFIGURACION
//Se usa la lubreria mirgan para establecer el ip
app.use(morgan('dev'))
app.use(cors({
    origin: ["http://127.0.0.1:5501","http://127.0.0.1:5500"]
}))
//La app usa el metodo json de la clase express
app.use(express.json())

//RUTITAS:Se establecen los ruteos a todas las páginas y archivos js

app.post("/api/progreso", progreso)
app.post("/api/retos", retos)
app.post("/api/datos", datos)
app.post("/api/registro" , registro)
app.post("/api/isesion" , isesion)
app.post("/api/cuestionario", cuestionario)
app.post("/api/verificar",verificar)
app.post("/api/registrar" ,registrar)
app.post("/api/inicioSesion",login)
app.post("/api/cambiar",cambiar)
app.post("/api/cambiarcontrasena",cambiarcontrasena)
app.post("/api/update",update)
app.post("/api/autorizacion", autorizacion)
app.post("/api/memorama", memorama)


//pkill node sirve para reiniciar todo :D
//npm i bcrypt cookie-parser cors dotenv express jsonwebtoken mysql2 morgan nodemon
//ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'n0m3l0';