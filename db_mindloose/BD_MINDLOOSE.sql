#SE CREA LA BASE DE DATOS
CREATE database if not exists db_mindloose;
#SE USA LA BASE DE DATOS
USE db_mindloose;
#SE CREAN LAS TABLAS CON LLAVES PRIMARIAS Y FORANEAS
CREATE table if not exists usuario(
mail VARCHAR(100),
nombre VARCHAR(20),
apellidopat VARCHAR(20),
apellidomat VARCHAR(20),
contra VARCHAR(200),
PRIMARY KEY (mail));
#EN ESTA TABLA SE ALMACENA LA INFORMACIÓN PERSONAL DEL USUARIO
CREATE table if not exists nivel(
nivel INTEGER NOT NULL,
intervalos CHAR(10),
PRIMARY KEY (nivel));
#EN ESTA TABLA SE ALMACENA Y MODIFICA EL PROGRESO QUE VA A REALIZANDO EL USUARIO
CREATE table if not exists progreso(
mail CHAR(100),
progreso INTEGER NOT NULL,
nivel INTEGER NOT NULL,
PRIMARY KEY (mail),
FOREIGN KEY(mail)
REFERENCES usuario(mail),
FOREIGN KEY(nivel)
REFERENCES nivel(nivel));
#EN ESTA TABLA SE ALMACENA Y MODIFICA EL PROGRESO QUE VA A REALIZANDO EL USUARIO
CREATE table if not exists retosCompletados(
id INTEGER NOT NULL,
mail CHAR(100),
FOREIGN KEY(mail)
REFERENCES usuario(mail));
#EN ESTA TABLA SE ALMACENAN LOS RETOS QUE VA COMPLETANDO EL USUARIO
CREATE table if not exists retos(
nReto INTEGER NOT NULL,
nivel INTEGER NOT NULL,
descripción TEXT(400),
PRIMARY KEY (nReto),
FOREIGN KEY(nivel)
REFERENCES nivel(nivel));
#EN ESTA TABLA SE ALMACENAN LOS RETOS QUE SE MOSTRARAN AL USUARIO
CREATE table if not exists comentarios(
id INTEGER NOT NULL,
comentarios CHAR(50),
sugerencias CHAR(50),
nivel INTEGER NOT NULL,
PRIMARY KEY (id),
FOREIGN KEY (nivel)
REFERENCES nivel(nivel));
#EN ESTA TABLA SE MUESTRA LOS COMENTARIOS Y SUGERENCIAS PARA EL USUARIO


DELIMITER $$
CREATE PROCEDURE registro_usuarios(IN mail VARCHAR(40), nombre VARCHAR(20), apellidos VARCHAR(30), contra VARCHAR(25))
BEGIN
	INSERT INTO usuario
    VALUES (mail,nombre,apellidos,contra);
END $$
DELIMITER ;
#ESTE ES UN PROCEDIMENTO INTERNO PARA QUE EL ADMINISTRADOR INGRESE UN USUARIO
DELIMITER $$
CREATE PROCEDURE consultar_progreso(IN mail VARCHAR(40))
BEGIN
	SELECT progreso FROM progreso, nivel WHERE mail=(mail);
END $$
DELIMITER ;
#ESTE PROCEDIMIENTO ES PARA QUE EL ADMINISTRADOR CONSULTE EL PROGRESO y nivel DE LOS USUARIOS

SELECT nReto FROM retos WHERE descripción = 'En la ducha trata de NO pensar en nada, simplementa bañate';
DELETE FROM retosCompletados WHERE mail = 'ejemplo@gmail.com';
UPDATE progreso SET progreso = 0, nivel = 1 WHERE mail = 'ejemplo@gmail.com';
