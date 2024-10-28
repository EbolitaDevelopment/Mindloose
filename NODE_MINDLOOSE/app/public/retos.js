//Se crea funcion que primero llama los retos desde el archivo mysql y despues establece las
//constantes acorde a los valores establecidos y regresa una cadena 
async function obtenerRetos() {
    const response = await fetch("http://localhost:4000/api/retos");
    if (!response.ok) {
        alert("Hubo un error en la consulta de los retos");
        return [];
    }
    const reto = await response.json();
    const reto1 = reto.descripcion;
    const reto2 = reto1.split("'");
    return reto2;
}
//Se crea una funcion que evalua si el dato se encuentra entre 1-7
function nums1(evt) {
    let keynum = evt.keyCode || evt.which;
    if (keynum >= 49 && keynum <= 55) { 
        return true;
    } else {
        alert("Dato fuera de norma, no es del uno al siete");
        return false;
    }
}
//Se crea una funcion asyncrona donde crea una cookie para que los retos se actualicen semanalmente,
//Despues evalua si el array esta completo y despues establece los ids de los retos como los valores obtenidos de obtener retos
async function mostrarRetos() {
    
    const cookie = getCookie('retos');
    
    let retos = cookie ? JSON.parse(cookie) : null;
    console.log(retos)
    const now = new Date().getTime();
    const expiryTime = 7 * 24 * 60 * 60 * 1000;
    if (!retos || now - retos.timestamp > expiryTime) {
        const retoArray = await obtenerRetos();
        console.log(retoArray)
        retos = { data: retoArray, timestamp: now ,expire: now + expiryTime};
        setCookie('retos', JSON.stringify(retos), 7); 
    }
    if (retos.data.length > 0) {
        const contenido = document.getElementById('content');
        if (retos.data[1] === undefined){retos.data[1]='Solo te faltan los otros para completar el nivel'} 
        if (retos.data[3] === undefined){retos.data[3]='Solo te faltan los otros para completar el nivel'} 
        if (retos.data[5] === undefined){retos.data[5]='Solo te faltan los otros para completar el nivel'} 
        if (retos.data[7] === undefined){retos.data[7]='Solo te faltan los otros para completar el nivel'} 
        if (retos.data[9] === undefined){retos.data[9]='Solo te faltan los otros para completar el nivel'} 
        if (retos.data[11] === undefined){retos.data[11]='Solo te faltan los otros para completar el nivel'} 
        if (retos.data[13] === undefined){retos.data[13]='Solo te faltan los otros para completar el nivel'} 
        document.getElementById("reto1").innerHTML = retos.data[1];
        document.getElementById("reto2").innerHTML = retos.data[3];
        document.getElementById("reto3").innerHTML = retos.data[5];
        document.getElementById("reto4").innerHTML = retos.data[7];
        document.getElementById("reto5").innerHTML = retos.data[9];
        document.getElementById("reto6").innerHTML = retos.data[11];
        document.getElementById("reto7").innerHTML = retos.data[13];
        contenido.classList.add('active');
    } else {
        console.error("No hay suficientes retos");
    }
}
//Se ejecuta en automatico la funcion mostrar retos
document.addEventListener('DOMContentLoaded', mostrarRetos);

//Se crea una funcion asincrona obteniendo un elemento del front (los retos completados)
//Después de eso establece que si la fecha concuerda con la de las cookies 
document.getElementById("uProgreso").addEventListener("submit", async (e) => {
    e.preventDefault();

    let x = confirm("Seguro que quieres insertar ese valor?")
    if(!x){return;}
    
    const cookie = getCookie('retos');
    if (!cookie) {
        alert("No se encontró la cookie de retos.");
        return;
    }
    
    const retos = JSON.parse(cookie);
    const now = new Date().getTime();
    
    if (now < retos.timestamp + (7 * 24 * 60 * 60 * 1000)) { 
        const res = await fetch("http://localhost:4000/api/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                valor: e.target.soypro.value
            })
        });
        
        if (res.ok) {
            const uProgreso = document.getElementById('Progreso');
            uProgreso.classList.add('inactive');
            try{
                const response = await fetch("http://localhost:4000/api/comentarios");
                const responseJSON = await response.json();

                if((responseJSON.body2).length > 0 && (responseJSON.body).length > 0){
                const respuesta = responseJSON.body+","+responseJSON.body2
                alert(respuesta)
            }
                else{
                    alert("No se pudieron concretar la consulta de los consejos")
                }
            }catch{alert("Hubo un problema al extraer los datos")}
        }
        
        const resJson = await res.json();
        
        if (resJson.redirect) {
            window.location.href = resJson.redirect;
        }
    } else {
        alert("El tiempo para actualizar tu progreso ha expirado.");
    }
});

function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
