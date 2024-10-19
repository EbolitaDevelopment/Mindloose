//Se hace una funcion para obtener el progreso y progreso1 y nivel y regresa un objeto con r.completados, r.pendientes, nivel, progreso
async function obtenerDatosDesdeDB() {
    try {
        const response = await fetch('http://localhost:4000/api/progreso');
        if (!response.ok) {
            throw new Error('Error al obtener el progreso desde la base de datos');
        }
        const progreso = await response.json();
        const progreso1 = progreso.body;
        const nivel = progreso.body2;
        return {
            retosCompletados: progreso1,
            retosPendientes: 125 - progreso1,
            nivel: nivel,
            progreso: progreso1
        };
    } catch (error) {
        console.error('Error al obtener los datos desde la base de datos:', error);
        return {
            retosCompletados: 0,
            retosPendientes: 125
        };
    }
}
//Se crea una funcion asyncrona mostrar y establece los valores del id nivel y retos con los obtenidos por la funcion obtenerdatosdesdeDB
async function mostrar(){
    try {
        const data = await obtenerDatosDesdeDB(); 
        document.getElementById("nivel").innerHTML = data.nivel;
        document.getElementById("retos").innerHTML = data.progreso;
    } catch { 
        console.error('Error al obtener los datos:');
    }
}
//Se crea una funcion asyncrona que actualiza una grafica de la libreria añadida myDonutChart con los valores de la funcion obtenerdatosdesdeDB
async function actualizarGrafica() {
    try {
        const data = await obtenerDatosDesdeDB(); 
        myDonutChart.data.datasets[0].data = [data.retosCompletados, data.retosPendientes];
        myDonutChart.update();
    } catch { 
        console.error('Error al obtener los datos:');
    }
}
//Se pone en la ventana una grafica con propiedades  acordes a los valores de actualizar grafica
window.onload = async function () {
    var ctx = document.getElementById('myDonutChart').getContext('2d');

    myDonutChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Retos Completados', 'Retos Pendientes'],
            datasets: [{
                label: 'Retos',
                data: [0, 125], 
                backgroundColor: [
                    '#008DDA',
                    '#ACE2E1'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false
        }
    });

    await actualizarGrafica();
};
//Se ejecuta la funcion mostrar y el DOMContentLoaded
document.addEventListener('DOMContentLoaded', mostrar);

