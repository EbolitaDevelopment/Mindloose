//Se mandan los datos a la base mediante un fetch post que evalua si esta registrado o no y acorde a eso 
//manda si es proceso completo o incompleto
document.getElementById("FIsesion").addEventListener("submit",async(e)=>{
  e.preventDefault();
  const res = await fetch("http://localhost:4000/api/isesion",{
    method:"POST",
    headers:{
      "Content-Type" : "application/json"
    },
    body: JSON.stringify({
      email: e.target.children.email.value,
      password: e.target.password.value
    })
  });
  const resJson = await res.json();
  if(resJson.redirect){
    window.location.href = resJson.redirect;
  }
})