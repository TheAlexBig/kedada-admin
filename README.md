# Kedada Admin

Standalone admin panel for managing Kedada events.

## Configuration

```bash
cp .env.example .env
```

`VITE_API_BASE_URL` must point to the backend:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Development

```bash
npm install
npm run dev
```

Main routes:

- `/login`
- `/register`
- `/admin`
- `/admin/events`
- `/admin/events/new`
- `/admin/events/:id`
- `/admin/events/:id/edit`
- `/admin/events/:eventId/schedules`

## Backend

The source-of-truth API is `/home/alex/Documents/kedada-api`.

- Events: `/api/v1/events`
- Event types: `/api/v1/categories`
- URLs / links: `/api/v1/urls`
- Authentication: `/api/v1/auth/login` and `/api/v1/auth/register`

Write requests use `Authorization: Bearer <token>`, and the backend derives
`ownerId` from the authenticated session.

Event create/edit uploads JPEG, PNG, WEBP, or GIF images (up to 5 MB) through
`POST /api/v1/media`. The event stores the returned media UUID in `thumbnail`;
previews and published views use the API-provided signed read URL.
