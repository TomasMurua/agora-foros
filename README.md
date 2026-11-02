# Ágora Foros

Backend de un foro en línea. Son dos microservicios en Spring Boot 3.5 que guardan sus datos en Oracle. Con ellos una
persona se registra, inicia sesión, busca temas, los lee, publica y comenta. Los moderadores y administradores pueden
cerrar temas y borrar lo que no corresponde.

Todavía no tiene frontend, así que todas las pruebas se hacen con Postman.

## Cómo está armado

```
                 Postman / Frontend
                   |            |
          :8081    v            v    :8082
        +---------------+   +---------------+
        |  ms-usuarios  |   |    ms-foro    |
        | usuarios,     |   | categorías,   |
        | roles, login  |   | temas y       |
        | (emite JWT)   |   | comentarios   |
        +-------+-------+   +-------+-------+
                |   token JWT (HS256)   |
                v                       v
        +---------------------------------------+
        |   Oracle Database (PDB FREEPDB1)       |
        |   esquema USUARIOS_MS | esquema FORO_MS |
        +---------------------------------------+
```

`ms-usuarios` corre en el puerto 8081 y maneja usuarios, roles e inicio de sesión. Cuando alguien entra con su usuario
y contraseña, el servicio le devuelve un token JWT firmado con su id, su nombre de usuario y su rol.

`ms-foro` corre en el puerto 8082 y maneja categorías, temas y comentarios. No consulta a `ms-usuarios`. Lee el token
que llega en cada solicitud y con eso sabe quién publica y qué rol tiene. Lo preferí a una llamada entre servicios
porque así `ms-foro` sigue atendiendo a quien ya inició sesión aunque `ms-usuarios` esté caído. El costo es que un
token vale hasta que expira, dos horas después del login, aunque un administrador bloquee la cuenta entre medio.

Cada servicio tiene su propio esquema en Oracle, `USUARIOS_MS` y `FORO_MS`, y ninguno lee las tablas del otro. Por eso
`TEMAS.USUARIO_ID` no tiene llave foránea hacia `USUARIOS`.

Los dos siguen el mismo orden de paquetes, `controller`, `service`, `repository` y `model`. Las solicitudes entran como
DTOs con anotaciones de `jakarta.validation`. Un `@RestControllerAdvice` convierte cualquier error en el JSON que aparece
más abajo. Las respuestas traen enlaces HATEOAS y cada operación queda registrada en el log con SLF4J.

## Roles

| Rol | Qué puede hacer |
|-----|-----------------|
| `USUARIO` | Publica temas y comentarios. Edita o borra solo lo suyo, incluida su cuenta. |
| `MODERADOR` | Lo mismo que un USUARIO. Además cierra temas, borra temas y comentarios de cualquiera y ve la lista de usuarios. |
| `ADMIN` | Lo mismo que un MODERADOR. Además cambia roles, bloquea y elimina cuentas, y administra roles y categorías. |

## Categorías

El foro parte con cinco: Tecnología y Programación, Videojuegos, Cine y Series, Deportes y Música. Un ADMIN puede
crear más.

## Requisitos

- JDK 21
- Docker, para correr Oracle Database Free. También sirve otra base Oracle.
- Postman

## Cómo levantarlo

1. Levanta la base de datos.

   ```bash
   docker compose up -d
   ```

   La primera vez el contenedor ejecuta los tres scripts de `bd/`, que crean los esquemas, las tablas y los datos de
   prueba. Tarda cerca de un minuto. Si usas otra base Oracle, ejecuta esos mismos scripts en orden, conectado como
   SYSTEM.

   Para revisar los datos con SQL Developer, conéctate a `localhost`, puerto `1521`, servicio `FREEPDB1`. Los usuarios
   son `USUARIOS_MS` con clave `Usuarios_Ms2026` y `FORO_MS` con clave `Foro_Ms2026`.

   `docker compose down` borra el contenedor y con él los datos. El siguiente `up` parte de cero.

2. Levanta cada microservicio en su propia terminal.

   ```bash
   cd ms-usuarios && ./mvnw spring-boot:run
   cd ms-foro && ./mvnw spring-boot:run
   ```

   Las variables `DB_URL`, `DB_USER` y `DB_PASSWORD` cambian la conexión. `JWT_SECRET` es la clave que firma los
   tokens y tiene que ser la misma en los dos servicios. Si no la defines, usan una clave de desarrollo y lo avisan en
   el log.

3. Importa `postman/Agora-Foros.postman_collection.json` en Postman y ejecuta primero la carpeta Autenticación. Cada
   login guarda su token en una variable de la colección y el resto de las solicitudes lo usa. La colección también
   corre completa en el Collection Runner. Tiene 63 solicitudes y cada una revisa el código de respuesta.

4. Los tests unitarios se corren con `./mvnw test` dentro de cada microservicio.

## Usuarios de prueba

| Usuario | Correo | Contraseña | Rol |
|---------|--------|------------|-----|
| admin | admin@agoraforos.cl | Admin2026! | ADMIN |
| moderador | moderador@agoraforos.cl | Moder2026! | MODERADOR |
| camila.diaz | camila.diaz@correo.cl | Usuario2026! | USUARIO |
| matias.soto | matias.soto@correo.cl | Usuario2026! | USUARIO |
| fernanda.lagos | fernanda.lagos@correo.cl | Usuario2026! | USUARIO |

## Endpoints

Donde la columna Acceso dice "Con sesión" o nombra un rol, hay que mandar el header `Authorization: Bearer <token>`
con el token del login.

### ms-usuarios, `http://localhost:8081`

| Método | Ruta | Qué hace | Acceso |
|--------|------|----------|--------|
| POST | `/api/auth/login` | Inicia sesión con nombre de usuario o correo y devuelve el token | Público |
| POST | `/api/usuarios` | Registra un usuario. Un ADMIN con sesión puede indicar `rolId` | Público |
| GET | `/api/usuarios?rol=` | Lista usuarios. El filtro por rol es opcional | ADMIN, MODERADOR |
| GET | `/api/usuarios/me` | Devuelve la cuenta que inició sesión | Con sesión |
| GET | `/api/usuarios/{id}` | Devuelve un usuario | La propia cuenta, ADMIN, MODERADOR |
| PUT | `/api/usuarios/{id}` | Modifica datos. Solo un ADMIN cambia `rolId` y `activo` | La propia cuenta, ADMIN |
| DELETE | `/api/usuarios/{id}` | Elimina la cuenta | La propia cuenta, ADMIN |
| GET | `/api/roles`, `/api/roles/{id}` | Lista los roles o devuelve uno | Público |
| POST, PUT, DELETE | `/api/roles`, `/api/roles/{id}` | Crea, modifica o elimina roles | ADMIN |

### ms-foro, `http://localhost:8082`

| Método | Ruta | Qué hace | Acceso |
|--------|------|----------|--------|
| GET | `/api/categorias`, `/api/categorias/{id}` | Lista las categorías o devuelve una | Público |
| GET | `/api/categorias/{id}/temas` | Lista los temas de una categoría | Público |
| POST, PUT, DELETE | `/api/categorias`, `/api/categorias/{id}` | Crea, modifica o elimina categorías | ADMIN |
| GET | `/api/temas?q=&categoriaId=&autor=&estado=` | Busca temas. Todos los filtros son opcionales | Público |
| GET | `/api/temas/populares?limite=5` | Lista los temas más vistos | Público |
| GET | `/api/temas/{id}` | Devuelve un tema y le suma una visita | Público |
| POST | `/api/temas` | Publica un tema | Con sesión |
| PUT | `/api/temas/{id}` | El autor cambia título, contenido o categoría. Autor, MODERADOR o ADMIN lo abren o cierran | Con sesión |
| DELETE | `/api/temas/{id}` | Elimina el tema junto con sus comentarios | Autor, MODERADOR, ADMIN |
| GET | `/api/temas/{id}/comentarios` | Lista los comentarios de un tema | Público |
| POST | `/api/temas/{id}/comentarios` | Comenta un tema abierto | Con sesión |
| GET | `/api/comentarios/{id}` | Devuelve un comentario | Público |
| PUT | `/api/comentarios/{id}` | Edita el comentario | Autor |
| DELETE | `/api/comentarios/{id}` | Elimina el comentario | Autor, MODERADOR, ADMIN |

### Errores

Todos los errores vuelven en JSON con esta forma:

```json
{
  "timestamp": "2026-11-02T10:36:16.872554",
  "status": 400,
  "error": "Bad Request",
  "mensaje": "La solicitud tiene datos inválidos",
  "ruta": "/api/usuarios",
  "detalles": { "correo": "El correo no tiene un formato válido" }
}
```

| Código | Cuándo aparece |
|--------|----------------|
| 400 | Faltan datos o vienen con un formato inválido |
| 401 | No hay token, el token no sirve o la contraseña no coincide |
| 403 | El rol no tiene permiso o la cuenta está bloqueada |
| 404 | El recurso no existe |
| 409 | Nombre o correo repetido, comentario en un tema cerrado o categoría que todavía tiene temas |

## Estructura del repositorio

```
agora-foros/
├── bd/                 scripts de Oracle con esquemas, tablas y datos
├── docker/initdb/      carga los scripts al crear el contenedor
├── docker-compose.yml  Oracle Database Free
├── ms-usuarios/        microservicio de usuarios, roles y login
├── ms-foro/            microservicio de categorías, temas y comentarios
└── postman/            colección de Postman
```

## Autor

Tomas Murua Peixoto
