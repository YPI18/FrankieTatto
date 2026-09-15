# Frankie Tattoo API

API REST en ASP.NET Core 8 + Entity Framework Core + PostgreSQL para la tienda
Frankie Tattoo (tatuajes, piercings y smoke shop): catálogo/inventario, citas,
clientes y pedidos, con login y JWT.

## Requisitos

- .NET 8 SDK → https://dotnet.microsoft.com/download
- PostgreSQL 14+ → https://www.postgresql.org/download/
  - O usar Docker: `docker run --name frankie-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=FrankieTattooDb -p 5432:5432 -d postgres:16`

## 1. Configurar la cadena de conexión

Editá `appsettings.json` y poné tu servidor/usuario/contraseña reales en `ConnectionStrings:DefaultConnection`.
También cambiá `Jwt:Key` por una clave larga y secreta propia (no uses la de ejemplo en producción).

## 2. Restaurar paquetes

```bash
dotnet restore
```

## 3. Crear la base de datos (migraciones)

La primera vez, instalá la herramienta de EF Core (si no la tenés global):

```bash
dotnet tool install --global dotnet-ef
```

Después generá y aplicá la primera migración:

```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

Esto crea todas las tablas (productos, categorías, inventario, citas, clientes,
empleados, pedidos, usuarios y roles de Identity).

⚠️ Si te saltás este paso, la API igual va a arrancar (ahora avisa por consola
en vez de caerse), pero cualquier endpoint que toque la base va a fallar hasta
que corras `dotnet ef database update`.

## 4. Correr la API

```bash
dotnet run
```

Se abre Swagger automáticamente en `https://localhost:5081/swagger` (o
`http://localhost:5080/swagger`), donde podés probar todos los endpoints.

## 5. Crear tu primer usuario Admin

Los roles disponibles son `Admin`, `Employee` y `Customer`. Al registrarse por
`/api/auth/register`, todo usuario nuevo entra como `Customer`. Para tener un
Admin:

1. Registrate normalmente desde `/api/auth/register`.
2. Con pgAdmin (o `psql`), abrí la tabla `AspNetUserRoles` y `AspNetRoles`, y
   agregá manualmente una fila que vincule tu usuario con el rol `Admin`
   (buscá el `Id` del rol Admin en `AspNetRoles` y el `Id` de tu usuario en
   `AspNetUsers`).
3. Volvé a hacer login: el nuevo token ya va a incluir el rol Admin.

## Estructura del proyecto

```
Controllers/   → Endpoints HTTP (Auth, Products, Categories, Appointments, Customers, Employees, Orders)
Models/        → Entidades de EF Core (tablas)
DTOs/          → Objetos que entran/salen del API (no exponen las entidades directo)
Data/          → AppDbContext (configuración de EF Core)
Services/      → TokenService (JWT), RoleSeeder
Enums/         → ServiceType, AppointmentStatus, OrderStatus, StockMovementType
```

## Resumen de endpoints principales

| Método | Ruta | Quién puede |
|---|---|---|
| POST | `/api/auth/register` | Público |
| POST | `/api/auth/login` | Público |
| GET | `/api/products?type=Tattoo` | Público |
| GET | `/api/products/{id}` | Público |
| POST | `/api/products` | Público |
| PUT | `/api/products/{id}` | Admin, Employee |
| DELETE | `/api/products/{id}` | Admin, Employee |
| POST | `/api/products/{id}/adjust-stock` | Admin, Employee |
| GET | `/api/products/low-stock` | Admin, Employee |
| GET/POST/PUT/DELETE | `/api/categories` | Público (lectura) / Admin, Employee (escritura) |
| GET/POST/PUT/DELETE | `/api/appointments` | Admin, Employee (POST: cualquier usuario logueado) |
| PATCH | `/api/appointments/{id}/status` | Admin, Employee |
| GET/POST/PUT/DELETE | `/api/customers` | Admin, Employee |
| GET/POST/PUT/DELETE | `/api/employees` | Admin, Employee (escritura solo Admin) |
| GET/POST/DELETE | `/api/orders` | Admin, Employee (POST: cualquier usuario logueado) |
| PATCH | `/api/orders/{id}/status` | Admin, Employee |

## Panel de administración (vista HTML)

Además de Swagger, el proyecto trae un panel simple en `wwwroot/` que ahora se
sirve directo en `https://localhost:5081/` (la raíz de la API). Permite hacer
login y CRUD completo (crear, ver, editar, borrar) sobre categorías,
productos, clientes, empleados, citas y pedidos, desde el navegador, sin
Postman ni Swagger.

Es un panel interno para vos (dueño/empleados), no la tienda pública. El
frontend de cara al cliente seguiría siendo un proyecto aparte (como el de
Netlify mencionado en `Cors:AllowedOrigins`).

## Conectar con el frontend (Netlify)

En `appsettings.json`, agregá la URL real de tu sitio de Netlify a
`Cors:AllowedOrigins` para que el navegador permita las peticiones desde ahí.

## Publicar en Azure

1. Creá un **Azure Database for PostgreSQL - Flexible Server** (tier Burstable para empezar).
2. Creá un **Azure App Service** (plan Free o B1) con runtime .NET 8.
3. Configurá la cadena de conexión real como variable de entorno /
   Application Setting en el App Service (`ConnectionStrings__DefaultConnection`).
4. Deploy desde Visual Studio, `dotnet publish`, o GitHub Actions.
