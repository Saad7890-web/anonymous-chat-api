# Anonymous Chat API

A production-style anonymous real-time chat backend. No accounts, no passwords — just pick a username and start talking.

Built with **NestJS**, **PostgreSQL**, **Drizzle ORM**, **Redis**, and **Socket.io**.

---

## Features

- **Username-only auth** — no registration or passwords required
- **Room management** — create, list, read, and delete chat rooms
- **Persistent messages** — cursor-based pagination for efficient history loading
- **Session storage** — Redis-backed, TTL-configurable sessions
- **Active user tracking** — live presence counts via Redis (no DB queries)
- **Real-time messaging** — Socket.io gateway with room presence events
- **Horizontal scaling** — Redis pub/sub fan-out decouples broadcasting from REST

---

## Requirements

- Node.js 22+
- Docker & Docker Compose
- npm

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Saad7890-web/anonymous-chat-api.git
cd anonymous-chat-api
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if needed (see [Environment Variables](#environment-variables) below).

### 3. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 4. Install dependencies

```bash
npm install
```

### 5. Run database migrations

```bash
npm run migration:push
```

### 6. Start the development server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1`.

---

## Environment Variables

| Variable              | Description                                       |
| --------------------- | ------------------------------------------------- |
| `NODE_ENV`            | Runtime environment (`development`, `production`) |
| `PORT`                | HTTP server port                                  |
| `DATABASE_URL`        | PostgreSQL connection string                      |
| `REDIS_URL`           | Redis connection string                           |
| `SESSION_TTL_SECONDS` | How long a session token remains valid            |
| `APP_PREFIX`          | Global route prefix (default: `api/v1`)           |
| `CORS_ORIGIN`         | Allowed CORS origin(s)                            |

---

## API Reference

All responses follow a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "...", "message": "..." } }
```

### Authentication

All routes except `POST /login` require a Bearer token:

```
Authorization: Bearer <sessionToken>
```

---

### `POST /login`

Exchange a username for a session token.

```json
// Request
{ "username": "ali_123" }
```

---

### `GET /rooms`

List all available rooms.

---

### `POST /rooms`

Create a new room.

```json
// Request
{ "name": "general" }
```

---

### `GET /rooms/:id`

Get a room by ID.

---

### `DELETE /rooms/:id`

Delete a room. Only the room's creator can delete it.

---

### `GET /rooms/:id/messages`

Fetch paginated message history.

| Query param | Default | Max   | Description                      |
| ----------- | ------- | ----- | -------------------------------- |
| `limit`     | `50`    | `100` | Number of messages to return     |
| `before`    | —       | —     | Message ID cursor for pagination |

---

### `POST /rooms/:id/messages`

Send a message to a room.

```json
// Request
{ "content": "hello everyone" }
```

---

### `GET /health`

Readiness check endpoint.

---

## WebSocket

Connect to the chat gateway:

```
ws://localhost:3000/chat?token=<sessionToken>&roomId=<roomId>
```

### Server → Client events

| Event              | Description                                |
| ------------------ | ------------------------------------------ |
| `room:joined`      | Emitted to you upon successful connection  |
| `room:user_joined` | Broadcast when another user joins the room |
| `message:new`      | Broadcast when a new message is sent       |
| `room:user_left`   | Broadcast when a user leaves the room      |
| `room:deleted`     | Broadcast when the room is deleted         |

### Client → Server events

| Event        | Description                       |
| ------------ | --------------------------------- |
| `room:leave` | Explicitly leave the current room |

---

## Quick Test

**Login**

```bash
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ali_123"}'
```

**Create a room**

```bash
curl -X POST http://localhost:3000/api/v1/rooms \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"general"}'
```

**Send a message**

```bash
curl -X POST http://localhost:3000/api/v1/rooms/<roomId>/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content":"hello"}'
```

**Health check**

```bash
curl http://localhost:3000/api/v1/health
```

---

## Project Structure

```
src/
├── auth/         # Login and session handling
├── rooms/        # Room lifecycle (CRUD)
├── messages/     # Message persistence and pagination
├── websocket/    # Socket.io gateway
├── redis/        # Redis client and helpers
├── database/     # Drizzle schema and database provider
├── health/       # Readiness endpoint
└── common/       # Shared decorators, filters, interceptors, pipes, and utilities
```

---

## Architecture Notes

- **Message broadcasting** goes through Redis pub/sub — REST controllers never push directly to sockets. This keeps the API stateless and safe to run across multiple instances.
- **Active user counts** are read from Redis, not the database, so presence queries stay fast regardless of message volume.
- **Sessions** are stored in Redis with a configurable TTL — no database round-trips on every authenticated request.
