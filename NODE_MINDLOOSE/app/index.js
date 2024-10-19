import {querys as database} from "./mysql.js";
import { methods as autorizacion } from "./autorizacion/autorizacion.js";
import express from "express";
import morgan from "morgan";
import cors from "cors";
//fix_dirname
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { methods as authentication } from "./controllers/authentication.controller.js";

//SERVER: se establece una constante de la clase importada express
const app = express();
//se establece que el puerto sea 4000
app.set("port", 4000);
//Cuando el puerto se conecte envia un mensaje a la terminal
app.listen(app.get("port"));
console.log("Servidor corriente en un puerto"+ app.get("port"));
//CONFIGURACION
//Se usa la lubreria mirgan para establecer el ip
app.use(morgan('dev'))
app.use(cors({
    origin: ["http://127.0.0.1:5501","http://127.0.0.1:5500"]
}))
//La app usa en metodo static de la clase express y establece el direccionamiento con  la estructura __dirname
app.use(express.static(__dirname+"/public"))
//La app usa el metodo json de la clase express
app.use(express.json())

//RUTITAS:Se establecen los ruteos a todas las páginas y archivos js

app.get("/", (req,res)=> res.sendFile(__dirname+"/paginas/index.html"))
app.get("/arriba", (req,res)=> res.sendFile(__dirname+"/paginas/arriba.html"))
app.get("/contrasenacambiada",autorizacion.loggeado, (req,res)=> res.sendFile(__dirname+"/paginas/contrasenacambiada.html"))
app.get("/Cuentaeliminada",  (req,res)=> res.sendFile(__dirname+"/paginas/Cuentaeliminada.html"))
app.get("/Cuenta",autorizacion.loggeado,  (req,res)=> res.sendFile(__dirname+"/paginas/Cuenta.html"))
app.get("/cuentacreada" ,  (req,res)=> res.sendFile(__dirname+"/paginas/cuentacreada.html"))
app.get("/cuestionario" ,autorizacion.loggeado,  (req,res)=> res.sendFile(__dirname+"/paginas/cuestionario.html"))
app.get("/impactoycanalizacion" , (req,res)=> res.sendFile(__dirname+"/paginas/impactoycanalizacion.html"))
app.get("/isesion" ,autorizacion.nologgeado, (req,res)=> res.sendFile(__dirname+"/paginas/isesion.html"))
app.get("/parteizquierda" , (req,res)=> res.sendFile(__dirname+"/paginas/parteizquierda.html"))
app.get("/politicadeprivacidad" , (req,res)=> res.sendFile(__dirname+"/paginas/politicadeprivacidad.html"))
app.get("/presentacion" , (req,res)=> res.sendFile(__dirname+"/paginas/presentacion.html"))
app.get("/Procesoincompleto" , (req,res)=> res.sendFile(__dirname+"/paginas/Procesoincompleto.html"))
app.get("/progreso" ,autorizacion.loggeado,  (req,res)=> res.sendFile(__dirname+"/paginas/progreso.html"))
app.get("/proposito" , (req,res)=> res.sendFile(__dirname+"/paginas/proposito.html"))
app.get("/registro" , autorizacion.nologgeado,(req,res)=> res.sendFile(__dirname+"/paginas/registro.html"))
app.get("/retos" , autorizacion.loggeado, (req,res)=> res.sendFile(__dirname+"/paginas/retos.html"))
app.get("/sesioniniciada" , (req,res)=> res.sendFile(__dirname+"/paginas/sesioniniciada.html"))
app.get("/terminosycondiciones" , (req,res)=> res.sendFile(__dirname+"/paginas/terminosycondiciones.html"))
app.get("/admin" ,(req,res)=> res.sendFile(__dirname+"/paginas/admin/admin.html"))
app.get("/api/progreso", database.progreso)
app.get("/api/comentarios", database.comentarios)
app.get("/api/retos", database.retos)
app.get("/api/datos", database.datos)
app.post("/api/registro" , authentication.registro)
app.post("/api/isesion" , authentication.isesion)
app.post("/api/cuestionario", database.cuestionario)
app.post("/api/verificar",database.verificar)
app.post("/api/registrar" ,database.registrar)
app.post("/api/inicioSesion",database.login)
app.post("/api/cambiar",authentication.cambiar)
app.post("/api/cambiarcontrasena",database.cambiarcontrasena)
app.post("/api/update",database.update)
app.get("/api/arriba", authentication.verificar)
app.get("/api/cerrar", authentication.cerrar)

//pkill node sirve para reiniciar todo :D
//npm i bcrypt cookie-parser cors dotenv express jsonwebtoken mysql2  
//devDependencies: morgan, nodemon
//ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'n0m3l0';