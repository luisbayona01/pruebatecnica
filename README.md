# LinkHub

**Plataforma SaaS para gestionar, organizar y descubrir sitios web.**

LinkHub nace de una prueba técnica de PHP sencilla —«guardar una lista de sitios
web con categorías»— y la convierte en una aplicación profesional con
arquitectura limpia, autenticación JWT multi-usuario, testing, documentación de
API y despliegue con Docker.

---

## 1. Qué hace

- **Sitios**: crear, editar, consultar, eliminar, listar, buscar, filtrar por
  categoría, ordenar y marcar/desmarcar favorito. Cada URL se abre en pestaña
  nueva (`target="_blank" rel="noopener noreferrer"`).
- **Categorías**: crear, listar (con número de sitios) y eliminar. Regla de
  negocio crítica: **no se puede eliminar una categoría con sitios** → HTTP 409.
- **Favoritos**: toggle instantáneo y vista filtrada.
- **Dashboard**: total de sitios, categorías, favoritos, categoría principal y
  sitios recientes, con gráfico de «sitios por categoría».
- **Búsqueda global** (nombre, URL, descripción) + filtros + ordenación +
  paginación, todo resuelto en el backend.
- **Autenticación JWT**: registro, login, `me`, logout, refresh. **Cada usuario
  ve únicamente sus propios datos** (multi-tenancy).
- **Import/export** CSV y JSON, con reporte de errores por fila.
- **Preview de URL**: extrae título/descripción/favicon y sugiere categoría, con
  fallback silencioso (nunca rompe el guardado).
- **Actividad reciente** (auditoría simple con Observers).
- **Swagger/OpenAPI** documentando toda la API.
- **SQL avanzado**: triggers y stored procedure de MySQL.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Laravel 12 (PHP 8.2+) |
| Autenticación | JWT (`php-open-source-saver/jwt-auth`) |
| Frontend | Angular 18 + TypeScript + Tailwind CSS |
| Base de datos | MySQL 8 (con triggers y stored procedure) |
| Testing backend | Pest (PHPUnit) |
| Testing E2E | Playwright |
| Documentación API | l5-swagger / OpenAPI 3 |
| Infraestructura | Docker + Docker Compose + Nginx |

> Detalle de decisiones en [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md).

---

## 3. Estructura del proyecto

```
linkhubpruebatecnica/
├── backend/                    # Laravel 12 (API REST)
│   ├── app/
│   │   ├── Http/Controllers/Api/     # Auth, Website, Category, Dashboard, Import/Export
│   │   ├── Http/Requests/            # Form Request (validación server-side)
│   │   ├── Http/Resources/           # API Resources (JSON consistente)
│   │   ├── Models/                   # Eloquent + scopes (visibleTo, search…)
│   │   ├── Observers/                # auditoría (Activity)
│   │   ├── Policies/                 # WebsitePolicy, CategoryPolicy
│   │   └── Services/                 # lógica de negocio (Website, Category, Dashboard, Import/Export, UrlMetadata)
│   ├── database/
│   │   ├── migrations/               # esquema + triggers + stored procedure
│   │   ├── seeders/                  # datos demo (usuario demo)
│   │   └── factories/
│   ├── config/                       # cors.php, jwt.php, l5-swagger.php, auth.php
│   ├── routes/api.php
│   ├── phpunit.xml                   # configuración de tests (MySQL)
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── nginx.conf
├── frontend/                   # Angular 18 (SPA)
│   ├── src/app/
│   │   ├── core/                     # modelos, servicios, interceptors, guards
│   │   ├── shared/                   # componentes reutilizables (modal, cards…)
│   │   ├── layout/                   # sidebar, navbar, toasts
│   │   └── features/                 # auth, dashboard, websites, favorites, categories
│   ├── e2e/                          # tests Playwright
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── TECHNICAL_DECISIONS.md
└── README.md
```

---

## 4. Requisitos previos

### Opción A — Con Docker (recomendada)

- Docker 20+ y Docker Compose v2

No necesitas PHP, Composer, Node ni MySQL instalados en tu máquina: todo corre
en contenedores.

### Opción B — Sin Docker

- **PHP** >= 8.2 con extensiones `pdo_mysql`, `mbstring`, `openssl`, `zip`
- **Composer** 2
- **Node.js** >= 18 y **npm**
- **MySQL** 8

---

## 5. Instalación con Docker

### 5.1 Levantar todo

```bash
git clone <repo> linkhub
cd linkhub
docker compose up -d --build
```

> La primera vez tarda unos minutos (descarga de imágenes, `composer install`,
> `npm install` y build de Angular). El **backend ejecuta migraciones y seeders
> automáticamente** al arrancar gracias a `docker-entrypoint.sh`.

### 5.2 Servicios y puertos

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend (Angular) local** | http://localhost:4201 | SPA con proxy `/api` |
| **Frontend (producción)** | https://frontpruebatecnica.devsoftai.com/login | SPA en producción |
| **API Laravel** | http://localhost:8001 | API REST + Swagger |
| **Swagger UI (local)** | http://localhost:8001/api/documentation | Documentación interactiva (Swagger/OpenAPI) |
| **Swagger UI (producción)** | https://backendpruebatecnica.devsoftai.com/api/documentation | Documentación interactiva en producción |
| **phpMyAdmin** | http://localhost:4202 | Gestión de la BD (user `root` / `root`) |
| MySQL | `localhost:3309` | Base de datos (interna) |

> Los puertos se eligieron para no colisionar con servicios locales típicos
> (3306, 8000, 4200). Puedes cambiarlos en `docker-compose.yml`.

### 5.2.1 ¿Por qué el frontend llama a `/api/...` en su propio dominio?

En producción, el frontend Angular usa una URL relativa para la API:

```typescript
// src/environments/environment.prod.ts
apiUrl: '/api'
```

Como empieza por `/api` (sin dominio), el navegador envía la petición al **mismo
dominio del frontend** (p. ej. `https://frontpruebatecnica.devsoftai.com/api/auth/login`).
Ese Nginx del frontend actúa de **proxy** y reenvía la petición internamente al
backend (`proxy_pass http://backend-nginx:80` en `frontend/nginx.conf`).

```
Navegador → frontpruebatecnica.devsoftai.com/api/auth/login
                 ↓ (proxy de Nginx)
           Backend Laravel procesa /api/auth/login
```

Ventajas:
- **Sin CORS**: el navegador solo habla con un único origen (el frontend).
- **Backend oculto**: la URL real del backend no queda expuesta al usuario.
- **Una sola URL pública**: todo pasa por el frontend.

> Por eso, al inspeccionar el *Network* del navegador, las peticiones de la API
> aparecen bajo el dominio del frontend y no bajo `backendpruebatecnica...`. Es
> comportamiento esperado, no un error.

#### Dónde está configurado el proxy

El proxy se define en dos archivos Nginx (uno por cada capa del despliegue con
Docker):

| Archivo | Qué hace |
|---------|----------|
| `frontend/nginx.conf` | Recibe `/api/` y lo reenvía al backend con `proxy_pass http://backend-nginx:80` |
| `backend/nginx.conf`  | Recibe la petición PHP y la pasa a PHP-FPM con `fastcgi_pass backend:9000` |

Flujo completo (dos saltos internos entre contenedores):

```
Navegador → frontend/nginx.conf (/api/) → proxy a backend-nginx
                                              ↓
                                          backend/nginx.conf → PHP-FPM → Laravel
```

> **Nota:** estos `nginx.conf` son los que usan los contenedores Docker (local).
> La configuración del servidor de producción (`devsoftai`) vive fuera del
> repositorio: en el Nginx/reverse proxy del propio servidor. Aquí el repositorio
> solo define cómo se comunican los contenedores entre sí.

### 5.3 Comandos útiles

```bash
docker compose ps                # estado de los contenedores
docker compose logs -f backend   # logs en vivo del backend
docker compose down              # detener (conserva datos MySQL)
docker compose down -v           # detener y borrar datos (empieza limpio)
docker compose up -d --build     # reconstruir tras cambios
```

### 5.4 Credenciales de demo

- **Email**: `demo@linkhub.test`
- **Password**: `password`

Este usuario ya trae 6 categorías y 13 sitios de ejemplo tras el seed.

---

## 6. Instalación sin Docker

### 6.1 Base de datos

Crea las bases de datos en MySQL 8:

```sql
CREATE DATABASE linkhub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE linkhub_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 6.2 Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env            # edita DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
php artisan key:generate
php artisan jwt:secret           # genera JWT_SECRET
php artisan migrate --seed       # crea tablas + datos demo (incluye triggers y SP)
php artisan serve --port=8000    # API en http://localhost:8000
```

### 6.3 Frontend (Angular)

```bash
cd frontend
npm install
npm start                        # SPA en http://localhost:4200
```

> Si el backend corre en un puerto distinto a `8000`, edita
> `src/environments/environment.ts` y ajusta `apiUrl`.

### 6.4 Generar documentación Swagger (solo si cambias anotaciones)

```bash
cd backend
php artisan l5-swagger:generate
```

---

## 7. Migraciones y seeders

```bash
php artisan migrate               # aplicar migraciones
php artisan migrate:fresh --seed  # resetear y sembrar desde cero
php artisan db:seed               # solo seeders (idempotentes)
```

Los seeders crean:

- Usuario `demo@linkhub.test` (`password`).
- 6 categorías: Tecnología, Desarrollo, Educación, Noticias, Entretenimiento, Compras.
- 13 sitios reales de ejemplo (GitHub, Laravel, MDN, BBC, YouTube, etc.).

---

## 8. Testing

### Backend (Pest)

```bash
cd backend
php artisan test                  # 45 tests / 135 aserciones
```

Cubre: validación de URL, regla 409 (no borrar categoría en uso), búsqueda,
filtros, ordenación, paginación, autenticación JWT, aislamiento por usuario,
triggers y stored procedure.

### Frontend (E2E con Playwright)

Requiere el stack corriendo (Docker o manual):

```bash
cd frontend
npx playwright install chromium   # solo la primera vez
npx playwright test               # 4 tests E2E (login, dashboard, sitios, categorías)
```

---

## 9. API REST

Base: `http://localhost:8001/api` (Docker) o `http://localhost:8000/api` (manual).

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registrar usuario (devuelve token JWT) |
| POST | `/auth/login` | Iniciar sesión |
| POST | `/auth/logout` | Cerrar sesión |
| POST | `/auth/refresh` | Refrescar token |
| GET | `/auth/me` | Usuario autenticado |

### Sitios (protegidos con JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/websites` | Listar (búsqueda, filtros, orden, paginación) |
| POST | `/websites` | Crear |
| GET | `/websites/{id}` | Consultar |
| PUT | `/websites/{id}` | Actualizar |
| PATCH | `/websites/{id}/favorite` | Alternar favorito |
| DELETE | `/websites/{id}` | Eliminar |
| POST | `/websites/preview-url` | Metadata de una URL |
| POST | `/websites/import` | Importar CSV/JSON |
| GET | `/websites/export/{csv\|json}` | Exportar |

### Categorías (protegidas con JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/categories` | Listar (con `websites_count`) |
| POST | `/categories` | Crear |
| DELETE | `/categories/{id}` | Eliminar (409 si tiene sitios) |

### Dashboard

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/dashboard/statistics` | Estadísticas (stored procedure, aislado por usuario) |

### Autenticación en las peticiones

```http
Authorization: Bearer <token>
Accept: application/json
```

### Parámetros de listado (`GET /websites`)

```
search       → texto (nombre, url, descripción)
category_id  → filtrar por categoría
is_favorite  → 1|0
sort         → name | created_at | category_id
dir          → asc | desc
page         → número de página
per_page     → registros por página (máx. 100)
```

### Ejemplo de regla de negocio (409)

```json
{
  "message": "No se puede eliminar la categoría porque tiene sitios asociados."
}
```

---

## 10. Cómo sustentar la prueba técnica

### 10.1 Guion breve (30–60 segundos)

> «Transformé una prueba de CRUD en un producto SaaS funcional: Laravel 12 como
> API REST, Angular 18 como SPA, MySQL como base de datos. Cumplí todos los
> requisitos originales y añadí valor: autenticación JWT multi-usuario, búsqueda
> y filtros en el backend, favoritos, dashboard con estadísticas, import/export,
> preview de URL, Swagger, y —lo más destacable para el perfil— **triggers y
> stored procedures de MySQL** demostrando competencia SQL. Todo con 45 tests
> de backend y 4 tests E2E, y desplegable con `docker compose up -d`.”

### 10.2 Puntos fuertes a defender

1. **Arquitectura limpia** — `Controller → Form Request → Service → Model`.
   La lógica de negocio vive en servicios (`CategoryService` con la regla 409),
   no en los controladores.

2. **Regla de negocio a tres niveles** — la restricción de «no borrar categorías
   en uso» está protegida en: servicio (409), constraint de BD
   (`ON DELETE RESTRICT`) y tests. Habla de este triple refuerzo.

3. **Competencia SQL real (triggers + stored procedure)** — clave para el cargo:
   - **Triggers** mantienen `categories.websites_count` desnormalizado (por qué:
     lecturas de alta frecuencia sin `COUNT(*)`).
   - **Stored procedure** `GetDashboardStats(user_id)` resuelve las estadísticas
     en un solo viaje a la BD, aislado por usuario.

4. **Multi-tenancy** — cada usuario ve solo lo suyo. Muéstralo rápido: inicia
   sesión con `demo` (ve 13 sitios) y registra uno nuevo (ve 0).

5. **Seguridad** — JWT, mass-assignment protection, validación server-side
   (nunca solo el frontend), `rel="noopener noreferrer"`, CORS restringido,
   configuración por `.env`.

6. **Testing real** — 45 tests backend + 4 E2E Playwright. Ejecuta
   `php artisan test` en vivo para que lo vean.

7. **Demo visual** — abre el front, entra con `demo@linkhub.test` / `password`,
   navega por dashboard/sitios/categorías, marca un favorito, intenta borrar una
   categoría con sitios (verás el 409).

### 10.3 Rutas de demo sugeridas

1. Dashboard → ver estadísticas y gráfico.
2. Sitios → buscar «github», filtrar por categoría, marcar favorito, editar.
3. Categorías → intentar eliminar «Desarrollo» (tiene 3 sitios) → mensaje 409.
4. Exportar a CSV/JSON → descargar la colección.
5. Swagger → `http://localhost:8001/api/documentation`.
6. phpMyAdmin → `http://localhost:4202`, ver los triggers y el procedure.

### 10.4 Posibles preguntas y respuestas

| Pregunta | Respuesta |
|----------|-----------|
| ¿Por qué JWT y no Sanctum? | JWT es stateless y encaja con una SPA + API desacoplada; evita sesiones en servidor. |
| ¿Por qué triggers? | Mantienen un contador desnormalizado para lecturas frecuentes sin costo de `COUNT(*)`. |
| ¿Por qué un stored procedure? | Agrupa las agregaciones del dashboard en un solo viaje a la BD. |
| ¿Cómo garantizas que no se borre una categoría en uso? | Servicio (409) + FK `ON DELETE RESTRICT` + test. |
| ¿Cómo aislás datos entre usuarios? | Scopes `visibleTo(user_id)` + políticas (403 a datos ajenos). |
| ¿Qué harías con más tiempo? | Rate limiting más fino, cola de importación, tests de componentes Angular, CI/CD. |

---

## 11. Decisiones técnicas

Consulta [`TECHNICAL_DECISIONS.md`](./TECHNICAL_DECISIONS.md) para:
- Justificación de triggers, stored procedures e índices.
- Elección de `ON DELETE RESTRICT`.
- Evaluación (y descarte) de Python.
- **Mapping against job requirements** (relación competencia → parte del proyecto).

---

## 12. Posibles mejoras futuras

- Rate limiting por usuario y por IP.
- Cola de importación (para archivos grandes).
- Tests unitarios de componentes y servicios Angular.
- CI/CD (GitHub Actions) ejecutando Pest + Playwright.
- Recuperación de contraseña por email.