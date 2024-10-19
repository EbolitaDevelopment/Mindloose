//Se obtiene el elemento del id cuenta y se añade una funcion asincrona en la que se hace una 
//fetch que llama a una funcion en el back mandando los valores de cuenta
document.getElementById("cuenta").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const res = await fetch("http://localhost:4000/api/cambiar",{
    method:"POST",
    headers:{
      "Content-Type" : "application/json"
    },
    body: JSON.stringify({
      password: e.target.password.value,
      password2: e.target.password2.value,
      password3: e.target.password3.value
    })
  });
  const resJson = await res.json();
  if(resJson.redirect){
    window.location.href = resJson.redirect;
  }
})
//Se hace una funcion asincrona llamando datos de la base con un fetch y despues los muestra en el html
async function mostrarDatos() {
  const response = await fetch('http://localhost:4000/api/datos'); 
  if (!response.ok) {
    alert("No se lograron extraer los datos correctamente");
    return;
  }
  
  try {
    const response1 = await response.json();
    
    const usuario = response1.body.mail; 
    const nombre = response1.body.nombre; 
    const aPaterno = response1.body.apellidopat; 
    const aMaterno = response1.body.apellidomat; 
    
    document.getElementById("mail").innerHTML = usuario;
    document.getElementById("nombre").innerHTML = nombre;
    document.getElementById("paterno").innerHTML = aPaterno;
    document.getElementById("materno").innerHTML = aMaterno;
  } catch (error) {
    console.error("Error parsing JSON or updating the DOM:", error);
  }
}
//Aqui se ejecuta la funcion
document.addEventListener('DOMContentLoaded', mostrarDatos);
