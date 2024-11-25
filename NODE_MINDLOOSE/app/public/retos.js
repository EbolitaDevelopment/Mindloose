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
    
    let retos = null;
const cookie = getCookie('retos');
if (cookie) {
    try {
        retos = JSON.parse(cookie);
    } catch (e) {
        console.error('Error parsing cookie:', e);
    }
}
    const now = new Date().getTime();
    const expiryTime = 7 * 24 * 60 * 60 * 1000;
    if (!retos || now - retos.timestamp > expiryTime) {
        const retoArray = await obtenerRetos();
        retos = { data: retoArray, timestamp: now ,expire: now + expiryTime};
        setCookie('retos', JSON.stringify(retos), 7); 
    }
    let numero = 0;
    if (retos.data.length > 0) {
        let contenedor = document.getElementById("retos")
        for (let i = 1; i < retos.data.length; i += 2) { 
            numero = numero+1;
            let valor = 0
            if (retos.data[i] === null) {
                retos.data[i] = 'Solo te faltan los otros para completar el nivel';

                valor = 1;
            }
            
            let reto = document.createElement("p");
            reto.id = `r${numero}`;
            reto.style.fontSize = "17px"; 
            reto.textContent = `RETO ${numero} -> `+retos.data[i];
            
            let check = document.createElement("input");
            check.id = `reto${numero}`;
            if(valor === 1){
            reto.className = `realizado${numero}`;
            check.style.display="none";
                        }
            check.type = "checkbox";
            check.style.marginLeft = "10px"; 
            reto.appendChild(check);  
            contenedor.appendChild(reto);  
        }
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

    let x = 0;
    let r = "";
    let userConfirmed = confirm("¿Seguro que quieres insertar ese valor?");
    if (!userConfirmed) return;

    for (let i = 1; i <= 7; i++) {
        const retoChecked = e.target[`reto${i}`].checked;
        const estado = document.getElementsByClassName(`realizado${i}`);
        
        if (estado.length === 0 && retoChecked) {
            x += 1;
            const retoText = document.getElementById(`r${i}`).textContent.split("-> ")[1];
            r += retoText + "*";
            document.getElementById(`r${i}`).innerHTML = "Reto completado";
        }
    }

    if (x === 0) return;

    try {
        const res = await fetch("http://localhost:4000/api/update", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                retos: r,
                valor: x,
            }),
        });

        if (res.ok) {
            const cookie = getCookie('retos');
            let retos = null;
if (cookie) {    
    try {
        retos = JSON.parse(cookie);
    } catch (e) {
        console.error('Error parsing cookie:', e);
    }
}
            if (retos && retos.data) {
                r = r.split("*");
                for (let i = 1; i < retos.data.length; i += 2) {
                    for (let j = 0; j < x; j++) {
                        if (retos.data[i] === r[j]) {
                            retos.data[i] = undefined;
                            console.log(`El reto ${retos.data[i]} ha sido eliminado`);
                        }
                    }
                }

                // Eliminar la cookie existente y establecer la nueva
                document.cookie = 'retos=; path=/ ; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                setCookie('retos', JSON.stringify(retos), 7);
            }

            // Obtener la respuesta del servidor
            const resJson = await res.json();

            if (resJson.redirect) {
                window.location.href = resJson.redirect;
            }
        }
    } catch (error) {
        alert("Error al actualizar los datos: " + error.message);
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
