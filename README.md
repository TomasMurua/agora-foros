# Ágora Foros - Backend

Backend de un sistema de foros en línea construido con microservicios en **Spring Boot 3** y base de datos **Oracle**.
Los usuarios se registran, inician sesión, buscan y leen temas, publican y comentan. Los moderadores y administradores
cuidan el contenido del foro.

## Arquitectura

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

- **ms-usuarios**: CRUD de usuarios y roles, registro e inicio de sesión. Al iniciar sesión entrega un token JWT
  con el id, el nombre de usuario y el rol.
- **ms-foro**: búsqueda, visualización, publicación y comentarios de temas, organizados en categorías. Valida el
  token emitido por ms-usuarios para saber quién hace cada operación.
- Cada microservicio es dueño de su esquema en Oracle (`USUARIOS_MS` y `FORO_MS`).

Cada servicio está organizado en capas: `controller` → `service` → `repository` → `model`, con DTOs validados
(`jakarta.validation`), manejo global de errores (`@RestControllerAdvice`), respuestas HATEOAS, logging con SLF4J y
seguridad con Spring Security (OAuth2 Resource Server + JWT).

## Roles

| Rol | Privilegios |
|-----|-------------|
| `USUARIO` | Publica temas y comentarios. Edita o elimina solo su propio contenido y su cuenta. |
| `MODERADOR` | Lo anterior, y además cierra temas, elimina temas y comentarios de otros usuarios y lista usuarios. |
| `ADMIN` | Todo lo anterior, y además administra usuarios (rol, bloqueo, eliminación), roles y categorías. |

## Categorías del foro

Tecnología y Programación, Videojuegos, Cine y Series, Deportes y Música (se pueden agregar más con el rol ADMIN).

## Requisitos

- Java 21 (JDK)
- Docker (para Oracle Database Free) o una base Oracle propia
- Postman

## Puesta en marcha

1. **Base de datos.** Levanta Oracle Free con los scripts de `bd/` ya cargados:

   ```bash
   docker compose up -d
   ```

   El contenedor crea los esquemas, las tablas y los datos de prueba la primera vez que arranca (tarda alrededor de
   un minuto). Para usar otra base Oracle, ejecuta como SYSTEM, en orden, `bd/01_crear_esquemas.sql`,
   `bd/02_ms_usuarios.sql` y `bd/03_ms_foro.sql`.

   Conexión con SQL Developer: host `localhost`, puerto `1521`, servicio `FREEPDB1`,
   usuario `USUARIOS_MS` / `Usuarios_Ms2026` o `FORO_MS` / `Foro_Ms2026`.

2. **Microservicios** (cada uno en su terminal):

   ```bash
   cd ms-usuarios && ./mvnw spring-boot:run   # http://localhost:8081
   cd ms-foro && ./mvnw spring-boot:run       # http://localhost:8082
   ```

   La conexión se puede cambiar con las variables `DB_URL`, `DB_USER` y `DB_PASSWORD`. La clave de firma de los
   tokens se define con `JWT_SECRET` y debe ser la misma en los dos servicios.

3. **Pruebas con Postman.** Importa `postman/Agora-Foros.postman_collection.json` y ejecuta primero la carpeta
   *Autenticación*: cada login guarda su token en las variables de la colección. También se puede correr completa
   con el Collection Runner.

4. **Tests unitarios:** `./mvnw test` dentro de cada microservicio.

## Usuarios de prueba

| Usuario | Correo | Contraseña | Rol |
|---------|--------|------------|-----|
| admin | admin@agoraforos.cl | Admin2026! | ADMIN |
| moderador | moderador@agoraforos.cl | Moder2026! | MODERADOR |
| camila.diaz | camila.diaz@correo.cl | Usuario2026! | USUARIO |
| matias.soto | matias.soto@correo.cl | Usuario2026! | USUARIO |
| fernanda.lagos | fernanda.lagos@correo.cl | Usuario2026! | USUARIO |

## Endpoints

Las rutas marcadas con 🔒 requieren el header `Authorization: Bearer <token>`.

### ms-usuarios (`http://localhost:8081`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| POST | `/api/auth/login` | Inicio de sesión con usuario o correo; devuelve el token | Público |
| POST | `/api/usuarios` | Registro de usuario (un ADMIN puede indicar `rolId`) | Público |
| GET | `/api/usuarios?rol=` | Lista usuarios, con filtro opcional por rol | 🔒 ADMIN, MODERADOR |
| GET | `/api/usuarios/me` | Datos de la cuenta con sesión iniciada | 🔒 |
| GET | `/api/usuarios/{id}` | Detalle de un usuario | 🔒 propio, ADMIN, MODERADOR |
| PUT | `/api/usuarios/{id}` | Modifica datos; `rolId` y `activo` solo ADMIN | 🔒 propio, ADMIN |
| DELETE | `/api/usuarios/{id}` | Elimina la cuenta | 🔒 propio, ADMIN |
| GET | `/api/roles` · `/api/roles/{id}` | Lista o detalle de roles | Público |
| POST · PUT · DELETE | `/api/roles` · `/api/roles/{id}` | Administración de roles | 🔒 ADMIN |

### ms-foro (`http://localhost:8082`)

| Método | Ruta | Descripción | Acceso |
|--------|------|-------------|--------|
| GET | `/api/categorias` · `/api/categorias/{id}` | Lista o detalle de categorías | Público |
| GET | `/api/categorias/{id}/temas` | Temas de una categoría | Público |
| POST · PUT · DELETE | `/api/categorias` · `/api/categorias/{id}` | Administración de categorías | 🔒 ADMIN |
| GET | `/api/temas?q=&categoriaId=&autor=&estado=` | Búsqueda de temas (filtros opcionales) | Público |
| GET | `/api/temas/populares?limite=5` | Temas más vistos | Público |
| GET | `/api/temas/{id}` | Detalle de un tema (suma una visita) | Público |
| POST | `/api/temas` | Publica un tema | 🔒 |
| PUT | `/api/temas/{id}` | Edita título, contenido o categoría (autor); abre o cierra (autor, MODERADOR, ADMIN) | 🔒 |
| DELETE | `/api/temas/{id}` | Elimina el tema y sus comentarios | 🔒 autor, MODERADOR, ADMIN |
| GET | `/api/temas/{id}/comentarios` | Comentarios de un tema | Público |
| POST | `/api/temas/{id}/comentarios` | Comenta un tema abierto | 🔒 |
| GET | `/api/comentarios/{id}` | Detalle de un comentario | Público |
| PUT | `/api/comentarios/{id}` | Edita el comentario | 🔒 autor |
| DELETE | `/api/comentarios/{id}` | Elimina el comentario | 🔒 autor, MODERADOR, ADMIN |

### Errores

Todos los errores responden en JSON con el mismo formato:

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

Códigos usados: `400` datos inválidos, `401` sin sesión o credenciales incorrectas, `403` sin permisos o cuenta
bloqueada, `404` recurso inexistente, `409` conflicto (duplicados, tema cerrado, categoría con temas).

## Estructura del repositorio

```
agora-foros/
├── bd/                 scripts de Oracle (esquemas, tablas y datos)
├── docker/initdb/      carga de los scripts al crear el contenedor
├── docker-compose.yml  Oracle Database Free
├── ms-usuarios/        microservicio de usuarios, roles y login
├── ms-foro/            microservicio de categorías, temas y comentarios
└── postman/            colección de Postman
```

## Autor

Tomas Murua Peixoto
