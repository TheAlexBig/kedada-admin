# Kedada Admin

Panel de administracion standalone para gestionar eventos de Kedada.

## Configuracion

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` debe apuntar al backend:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Desarrollo

```bash
npm install
npm run dev
```

Rutas principales:

- `/login`
- `/register`
- `/admin`
- `/admin/events`
- `/admin/events/new`
- `/admin/events/:id`
- `/admin/events/:id/edit`

## Backend usado

La API fuente de verdad es `/home/alex/Documents/kedada-api`.

- Eventos: `/api/v1/events`
- Tipos de evento: `/api/v1/categories`
- URLs / enlaces: `/api/v1/urls`
- Autenticacion: `/api/v1/auth/login` y `/api/v1/auth/register`

Los writes usan `Authorization: Bearer <token>` y el backend deriva `ownerId`
desde la sesion autenticada.

No hay endpoints de media/imagenes todavia. El campo `thumbnail` queda como UUID
manual hasta que el backend exponga carga o catalogo de imagenes.
