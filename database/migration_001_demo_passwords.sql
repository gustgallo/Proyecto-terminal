-- PRODISA 3.0
-- Solo para instalaciones que ya importaron las semillas antiguas de la API Node.
-- Restablece las cuentas DEMO a la contraseña temporal: Admin123!
-- Cambiar estas contraseñas después de validar la instalación.

SET NAMES utf8mb4;

UPDATE users
SET password_hash = '$2y$10$IJxCzIz21pxqoG2Qpv2m9uZ445U2CkQhixsTwfID553fBTCIC3aBS'
WHERE email IN (
    'admin@prodisa.com.mx',
    'rrhh@prodisa.com.mx',
    'produccion@prodisa.com.mx',
    'mesacontrol@prodisa.com.mx',
    'empleado@prodisa.com.mx'
);
