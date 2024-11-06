/* Reset de márgenes y padding */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Estilo del botón de menú (ícono de hamburguesa) */
.menu-toggle {
  position: fixed;
  top: 20px;
  left: 20px;
  background-color: #333;
  color: white;
  font-size: 30px;
  border: none;
  padding: 10px 15px;
  cursor: pointer;
  z-index: 1000; /* Asegura que esté encima del menú */
}

.menu-toggle:hover {
  background-color: #444;
}

/* Barra de navegación (inicialmente oculta y desplazada hacia la izquierda) */
.navbar {
  position: fixed;
  top: 0;
  left: -250px; /* El menú comienza fuera de la vista a la izquierda */
  width: 250px; /* Ancho del menú */
  height: 100vh; /* Alto completo de la pantalla */
  background-color: #333;
  transition: left 0.3s ease; /* Animación de deslizamiento */
  z-index: 999; /* Asegura que esté encima de otros elementos */
}

/* Cuando el menú está abierto, se desliza hacia la derecha (dentro de la vista) */
.navbar.open {
  left: 0; /* El menú se mueve a la posición 0, es decir, completamente visible */
}

/* Estilo de los enlaces de navegación */
.nav-links {
  list-style: none;
  padding: 20px 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Alinea los elementos a la izquierda */
}

.nav-links li {
  margin: 15px 0;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 20px;
  padding: 10px;
  transition: color 0.3s ease;
}

.nav-links a:hover {
  color: #f39c12;
}

