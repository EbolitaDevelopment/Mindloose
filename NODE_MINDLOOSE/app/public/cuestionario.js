//Se crea una funcion que evalua si el dato se encuentra entre 1-5
function nums(evt) {

    if (window.evt) {
        keynum = evt.keyCode;
    }
    else {
        keynum = evt.which;
    }
    if (keynum > 48 && keynum < 54) {
        return true;
    }
    else {
        alert("dato fuera de norma no es del uno al cinco");
        return false;
    }
}
//Se crea una funcion que evalua si el dato se encuentra entre 1-7
function nums1(evt) {

    if (window.evt) {
        keynum = evt.keyCode;
    }
    else {
        keynum1 = evt.which;
    }
    if (keynum > 48 && keynum1 < 57) {
        return true;
    }
    else {
        alert("dato fuera de norma no es del uno al siete");
        return false;
    }
}
//Se crea una funcion que llama todos los valores del cuestionario y los suma para obtener un promedio
//Luego manda el nivel y suma a un fetch  y si no hay problemas redirecciona a proceso completo y si no 
//advierte que hubo un error
async function nivel(
    a = parseInt(document.getElementById("a").value),
    b = parseInt(document.getElementById("b").value),
    c = parseInt(document.getElementById("c").value),
    d = parseInt(document.getElementById("d").value),
    e = parseInt(document.getElementById("e").value),
    f = parseInt(document.getElementById("f").value),
    g = parseInt(document.getElementById("g").value),
    h = parseInt(document.getElementById("h").value),
    i = parseInt(document.getElementById("i").value),
    j = parseInt(document.getElementById("j").value),
    k = parseInt(document.getElementById("k").value),
    l = parseInt(document.getElementById("l").value),
    m = parseInt(document.getElementById("m").value),
    n = parseInt(document.getElementById("n").value),
    o = parseInt(document.getElementById("o").value),
    p = parseInt(document.getElementById("p").value),
    q = parseInt(document.getElementById("q").value),
    r = parseInt(document.getElementById("r").value),
    s = parseInt(document.getElementById("s").value),
    t = parseInt(document.getElementById("t").value),
    u = parseInt(document.getElementById("u").value),
    v = parseInt(document.getElementById("v").value),
    w = parseInt(document.getElementById("w").value),
    x = parseInt(document.getElementById("x").value),
    y = parseInt(document.getElementById("y").value),
    z = parseInt(document.getElementById("z").value)) {

    const suma = (a + b + c + d + e + f + g + h + i + j + k + l
        + m + n + o + p + q + r + s + t + u + v + w + x + z + (y * 5))
    console.log(suma)
    const nivel = parseInt(sumar(suma))

    try{
        const res = await fetch("http://localhost:4000/api/cuestionario", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            nivel, suma
        })
    });
    const resJson = await res.json();
    if (resJson.redirect) {
        window.location.href = resJson.redirect;
    }}
    catch(error){
        console.error("Error al obtener el progreso:", error);
        throw error; 
    }
}
//Se usa la funcion suma para evaluar el nivel del usuario acorde a la suma
function sumar(suma, nivel) {
    if (suma > 125) {
        alert("Deberias consultar la sección de impacto y canalización ya que no podemos tratarte")
        return false;
    }
    if (suma >= 0 && suma < 30) {
        return nivel = 1
    } else
        if (suma >= 30 && suma < 60) {
            return nivel = 2
        } else
            if (suma >= 60 && suma < 90) {
                return nivel = 3
            } else
                if (suma >= 90 && suma < 115) {
                    return nivel = 4
                } else
                    if (suma >= 115 && suma < 125) {
                        return nivel = 5
                    }
}