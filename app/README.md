# Spring Boot + PostgreSQL + Docker

This project exposes a simple REST API for `users` and includes Swagger UI.

## Stack
- Java 17
- Spring Boot 4.0.3
- Spring Data JPA
- PostgreSQL
- Docker + Docker Compose

## Project layout
- Spring Boot module: `app/`
- Dockerfile: `../Dockerfile` (relative to this README)
- Compose file: `../docker-compose.yml`
- Seed SQL: `../docker/postgres/init.sql`

## Run with Docker Compose
Run these commands from repository root:

```bash
cd C:\prakhar\java-work\app
```

1. Build the jar:
```bash
docker run --rm -v C:\prakhar\java-work\app:/workspace -w /workspace/app maven:3.9.9-eclipse-temurin-17 mvn -DskipTests clean package
```

2. Start services:
```bash
docker compose up -d --build
```

3. Verify containers:
```bash
docker compose ps
```

## URLs
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Users API: `http://localhost:8080/users`
- PostgreSQL: `localhost:5432` (`postgres/admin`, db `postgres`)

## Seed data
On first startup, Postgres runs `docker/postgres/init.sql` and inserts:
- Alice
- Bob
- Charlie

If the volume already exists, seed scripts are not re-applied.
To re-seed from scratch:

```bash
docker compose down -v
docker compose up -d --build
```

## Test API quickly
Create a user:

```bash
curl -X POST http://localhost:8080/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Prakhar\"}"
```

List users:

```bash
curl http://localhost:8080/users
```

## Stop services
```bash
docker compose down
```