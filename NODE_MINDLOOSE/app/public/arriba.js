//Se obtiene el elemento con id "cecion" y se añade un evento en el que si se selecciona  funciona como boton y se realiza
//una funcion asincrona en la que se establece la cookie como una fecha que definitivamente ya expiro y finalmente establece 
//una constante que ejecuta una funcion establecida en el ruteo como api/cerrar
document.getElementById("cecion").addEventListener("submit", async (e) => {
  e.preventDefault();
  document.cookie = 'jwt=; path=/ ; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'retos=; path=/ ; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  const x = await fetch("http://localhost:4000/api/cerrar");
});
//Se establece una funcion asincrona en la que constantemente se actualize los botones de arriba acorde a  si el usuario esta loggeado o no
document.addEventListener('DOMContentLoaded', async function() {
  const loggeado = await fetch("http://localhost:4000/api/arriba");
  if (loggeado.ok) {
    const x1 = document.getElementById('hoña1');
    x1.classList.add("active");
    const x2 = document.getElementById('hoña');
    x2.classList.add("inactive");
  }
  else{
    const x1 = document.getElementById('hoña1');
    x1.classList.add("inactive");
    const x2 = document.getElementById('hoña');
    x2.classList.add("active");
  }
});