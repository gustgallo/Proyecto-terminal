-- PRODISA / SWGRHP-IG
-- Datos iniciales para MySQL GoogieHost.
-- Ejecutar después de schema.sql, con la base bmosjhel_PRODISA_SWGRHP-IG seleccionada.

SET NAMES utf8mb4;

INSERT IGNORE INTO roles (code, name, user_type, description) VALUES
('ADMIN_GLOBAL', 'Administrador Global', 'GLOBAL_ADMIN', 'Control total de la plataforma y configuraciones'),
('ADMIN_RRHH', 'Administrador RRHH', 'FUNCTIONAL_ADMIN', 'Gestión de personal, horas extras, bonos y solicitudes'),
('PRODUCCION', 'Jefe de Producción / Logística', 'INTERNAL_USER', 'Gestión de proyectos, requisición de materiales y aprobaciones de área'),
('MESA_CONTROL', 'Mesa de Control', 'INTERNAL_USER', 'Monitoreo de proyectos y control documental'),
('EMPLEADO_INTERNO', 'Empleado Interno', 'INTERNAL_USER', 'Consultas, registro de horas extras y solicitudes');

INSERT IGNORE INTO permissions (code, module, description) VALUES
('USERS_MANAGE', 'USUARIOS', 'Crear, modificar y desactivar usuarios'),
('OVERTIME_REQUEST', 'HORAS_EXTRAS', 'Registrar horas extras personales'),
('OVERTIME_APPROVE_AREA', 'HORAS_EXTRAS', 'Aprobación de horas extras nivel Jefe de Área'),
('OVERTIME_APPROVE_RRHH', 'HORAS_EXTRAS', 'Aprobación final de horas extras nivel RRHH'),
('BONUS_MANAGE', 'BONIFICACIONES', 'Asignar y autorizar bonos por proyecto'),
('MATERIALS_REQUISITION', 'MATERIALES', 'Crear requisición de materiales'),
('PROJECTS_MANAGE', 'PROYECTOS', 'Crear y asignar proyectos'),
('CHATBOT_CONFIG', 'CHATBOT_RRHH', 'Gestionar documentos RAG e ingesta de conocimiento');

-- Administrador global: todos los permisos.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'ADMIN_GLOBAL';

-- RRHH.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('USERS_MANAGE', 'OVERTIME_REQUEST', 'OVERTIME_APPROVE_RRHH', 'BONUS_MANAGE', 'CHATBOT_CONFIG')
WHERE r.code = 'ADMIN_RRHH';

-- Producción / Logística.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('OVERTIME_REQUEST', 'OVERTIME_APPROVE_AREA', 'MATERIALS_REQUISITION', 'PROJECTS_MANAGE')
WHERE r.code = 'PRODUCCION';

-- Mesa de Control.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('OVERTIME_REQUEST', 'PROJECTS_MANAGE')
WHERE r.code = 'MESA_CONTROL';

-- Empleado interno.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'OVERTIME_REQUEST'
WHERE r.code = 'EMPLEADO_INTERNO';

-- Usuarios de prueba. Contraseña demo: Admin123! Cambiarla después de validar la instalación.
INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active)
SELECT 'admin@prodisa.com.mx', '$2y$10$IJxCzIz21pxqoG2Qpv2m9uZ445U2CkQhixsTwfID553fBTCIC3aBS', 'Admin', 'Prodisa', '5551234567', r.id, 'ADMINISTRACION', 1
FROM roles r WHERE r.code = 'ADMIN_GLOBAL';

INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active)
SELECT 'rrhh@prodisa.com.mx', '$2y$10$IJxCzIz21pxqoG2Qpv2m9uZ445U2CkQhixsTwfID553fBTCIC3aBS', 'Laura', 'Gómez', '5559876543', r.id, 'RRHH', 1
FROM roles r WHERE r.code = 'ADMIN_RRHH';

INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active)
SELECT 'produccion@prodisa.com.mx', '$2y$10$IJxCzIz21pxqoG2Qpv2m9uZ445U2CkQhixsTwfID553fBTCIC3aBS', 'Carlos', 'Mendoza', '5554567890', r.id, 'PRODUCCION', 1
FROM roles r WHERE r.code = 'PRODUCCION';

INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active)
SELECT 'mesacontrol@prodisa.com.mx', '$2y$10$IJxCzIz21pxqoG2Qpv2m9uZ445U2CkQhixsTwfID553fBTCIC3aBS', 'Sofia', 'Hernández', '5556543210', r.id, 'MESA_DE_CONTROL', 1
FROM roles r WHERE r.code = 'MESA_CONTROL';

INSERT IGNORE INTO users (email, password_hash, first_name, last_name, phone, role_id, department, is_active)
SELECT 'empleado@prodisa.com.mx', '$2y$10$IJxCzIz21pxqoG2Qpv2m9uZ445U2CkQhixsTwfID553fBTCIC3aBS', 'Juan', 'Pérez', '5551112233', r.id, 'PRODUCCION', 1
FROM roles r WHERE r.code = 'EMPLEADO_INTERNO';

INSERT IGNORE INTO projects (code, name, client_name, sector, description, status, start_date, estimated_end_date, created_by)
SELECT 'PRJ-2026-001', 'Imagen Corporativa Sucursales BBVA', 'BBVA México', 'Banca y Servicios Financieros',
       'Fabricación e instalación de tótems y cajas de luz corporativas en 15 sucursales.', 'EN_PROCESO', '2026-01-15', '2026-06-30', u.id
FROM users u WHERE u.email = 'admin@prodisa.com.mx';

INSERT IGNORE INTO projects (code, name, client_name, sector, description, status, start_date, estimated_end_date, created_by)
SELECT 'PRJ-2026-002', 'Señalización Centro Comercial Mitikah', 'Fibra Uno', 'Retail & Shopping',
       'Diseño e instalación de señalización interior, marquesinas y protección civil.', 'INSTALACION', '2026-02-01', '2026-08-15', u.id
FROM users u WHERE u.email = 'admin@prodisa.com.mx';

-- Datos de ejemplo de horas extra, evitando duplicados por usuario/fecha.
INSERT INTO overtime_records
(user_id, project_id, start_date_time, end_date_time, hours_count, approved_hours_count, justification, status, area_boss_notes, rrhh_notes)
SELECT u.id, p.id, '2026-09-01 18:00:00', '2026-09-01 21:00:00', 3.0, 3.0,
       'Montaje nocturno de marquesina BBVA', 'APROBADO',
       'Trabajo verificado en sitio por producción.', 'Autorizado para pago en nómina.'
FROM users u
JOIN projects p ON p.code = 'PRJ-2026-001'
WHERE u.email = 'empleado@prodisa.com.mx'
  AND NOT EXISTS (
    SELECT 1 FROM overtime_records o
    WHERE o.user_id = u.id AND o.start_date_time = '2026-09-01 18:00:00'
  );

INSERT INTO overtime_records
(user_id, project_id, start_date_time, end_date_time, hours_count, approved_hours_count, justification, status, area_boss_notes, rrhh_notes)
SELECT u.id, p.id, '2026-09-03 19:00:00', '2026-09-03 21:30:00', 2.5, 2.0,
       'Ajuste de cableado en cajas de luz Mitikah', 'PENDIENTE_RRHH',
       'Ajustado a 2.0 hrs por Jefe de Producción conforme a avance.', NULL
FROM users u
JOIN projects p ON p.code = 'PRJ-2026-002'
WHERE u.email = 'empleado@prodisa.com.mx'
  AND NOT EXISTS (
    SELECT 1 FROM overtime_records o
    WHERE o.user_id = u.id AND o.start_date_time = '2026-09-03 19:00:00'
  );

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Horas Extras Aprobadas', 'Tus horas extras del 01/Sep (3.0 hrs) fueron autorizadas por RRHH.', 'OVERTIME_APPROVED', 0
FROM users u
WHERE u.email = 'empleado@prodisa.com.mx'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Horas Extras Aprobadas'
  );

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT u.id, 'Horas Extras Modificadas', 'Tus horas extras del 03/Sep fueron ajustadas de 2.5 hrs a 2.0 hrs por Jefe de Producción.', 'OVERTIME_MODIFIED', 0
FROM users u
WHERE u.email = 'empleado@prodisa.com.mx'
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = u.id AND n.title = 'Horas Extras Modificadas'
  );
