-- =====================================================================
-- Agora Foros - Script 01: esquemas de la base de datos
-- Cada microservicio tiene su propio esquema (usuario) en Oracle:
--   USUARIOS_MS -> microservicio ms-usuarios
--   FORO_MS     -> microservicio ms-foro
--   MODERACION_MS -> microservicio ms-moderacion
-- Ejecutar conectado a la PDB (FREEPDB1) como SYSTEM, o en Oracle Cloud como ADMIN.
-- El script se puede volver a ejecutar: borra los esquemas si ya existen.
-- =====================================================================
SET DEFINE OFF

BEGIN
  FOR u IN (SELECT username FROM all_users WHERE username IN ('USUARIOS_MS', 'FORO_MS', 'MODERACION_MS')) LOOP
    EXECUTE IMMEDIATE 'DROP USER ' || u.username || ' CASCADE';
  END LOOP;
END;
/

-- Cada esquema queda en el tablespace por defecto de la base: USERS en Oracle Database Free
-- y DATA en Oracle Cloud (Autonomous Database). Las claves cumplen las reglas de Autonomous:
-- 12 o más caracteres, mayúscula, minúscula, número y sin el nombre del usuario.
DECLARE
  v_ts VARCHAR2(128);
  PROCEDURE crear(p_usuario VARCHAR2, p_clave VARCHAR2) IS
  BEGIN
    EXECUTE IMMEDIATE 'CREATE USER ' || p_usuario || ' IDENTIFIED BY "' || p_clave || '"'
                      || ' DEFAULT TABLESPACE ' || v_ts || ' QUOTA UNLIMITED ON ' || v_ts;
    EXECUTE IMMEDIATE 'GRANT CREATE SESSION, CREATE TABLE, CREATE SEQUENCE, CREATE VIEW TO ' || p_usuario;
  END;
BEGIN
  SELECT property_value INTO v_ts FROM database_properties WHERE property_name = 'DEFAULT_PERMANENT_TABLESPACE';
  crear('USUARIOS_MS', 'AgoraUsr#2026');
  crear('FORO_MS', 'AgoraForo#2026');
  crear('MODERACION_MS', 'AgoraMod#2026');
END;
/
