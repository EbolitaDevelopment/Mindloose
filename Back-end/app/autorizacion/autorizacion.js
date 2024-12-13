//Se importan las clases jsonwebtoken y dotenv de nodemodules
const dotenv = require('dotenv');
const jsonwebtoken = require('jsonwebtoken');

//Se agarran las encriptaciones del .env
dotenv.config();

//La funcion decodifica la cookie para agarrar al usuario y despues usa un fetch para hacer los movimientos desde la clase mysql
function verificar(req,res){
  try {
    let cookie_ = req.body.cookie;
    if (!cookie_) {
      return res.status(400).send({status:'error', message: 'no se encontro la cookie',authorized :false});
    }
    let decodificada = jsonwebtoken.verify(cookie_, process.env.JWT_SECRET);
    const x = fetch("http://localhost:4000/api/verificar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },body: JSON.stringify({decodificada})})   
    if(!x){return res.status(400).send({status:'error', message: 'error con la base',authorized :false});}
    return res.status(202).send({status:'ok', message: 'la autorizacion es correcta',authorized :true});}
 catch{return res.status(400).send({status:'error', message: 'error con los procesos' ,authorized :false});}
}
module.exports = verificar;