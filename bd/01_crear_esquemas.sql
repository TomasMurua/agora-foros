-- =====================================================================
-- Agora Foros - Script 01: esquemas de la base de datos
-- Cada microservicio tiene su propio esquema (usuario) en Oracle:
--   USUARIOS_MS -> microservicio ms-usuarios
--   FORO_MS     -> microservicio ms-foro
--   MODERACION_MS -> microservicio ms-moderacion
-- Ejecutar conectado a la PDB (FREEPDB1) como SYSTEM.
-- El script se puede volver a ejecutar: borra los esquemas si ya existen.
-- =====================================================================
SET DEFINE OFF

BEGIN
  FOR u IN (SELECT username FROM all_users WHERE username IN ('USUARIOS_MS', 'FORO_MS', 'MODERACION_MS')) LOOP
    EXECUTE IMMEDIATE 'DROP USER ' || u.username || ' CASCADE';
  END LOOP;
END;
/

CREATE USER USUARIOS_MS IDENTIFIED BY "Usuarios_Ms2026"
  DEFAULT TABLESPACE USERS
  QUOTA UNLIMITED ON USERS;

GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO USUARIOS_MS;

CREATE USER FORO_MS IDENTIFIED BY "Foro_Ms2026"
  DEFAULT TABLESPACE USERS
  QUOTA UNLIMITED ON USERS;

GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO FORO_MS;

CREATE USER MODERACION_MS IDENTIFIED BY "Moderacion_Ms2026"
  DEFAULT TABLESPACE USERS
  QUOTA UNLIMITED ON USERS;

GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO MODERACION_MS;
