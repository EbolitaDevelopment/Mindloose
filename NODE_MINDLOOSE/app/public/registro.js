//Se obtienen los elementos del id veriregistro desde el front y despues manda un fetch post a una funcion en el controlador
document.getElementById("veriregistro").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const res = await fetch("http://localhost:4000/api/registro",{
    method:"POST",
    headers:{
      "Content-Type" : "application/json"
    },
    body: JSON.stringify({
      email: e.target.email.value,
      name: e.target.name.value,
      apellidop: e.target.apellidop.value,
      apellidom: e.target.apellidom.value,
      password: e.target.password.value,
      password2: e.target.password2.value,
    })
  });
  const resJson = await res.json();
  if(resJson.redirect){
    window.location.href = resJson.redirect;
  }
})