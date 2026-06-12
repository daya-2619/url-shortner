# Next.js + FastAPI URL Shortener

A highly scalable, production-grade URL shortener built with a decoupled architecture. 

## Architecture
- **Frontend**: Next.js (App Router, Edge-ready)
- **Backend API**: Python FastAPI (Uvicorn, async)
- **Caching & Analytics**: Redis (Read-Through Cache + atomic counters)
- **Database**: NeonDB (Serverless PostgreSQL with connection pooling via psycopg)
- **Orchestration**: Docker & Docker Compose

## Features
- Blazing fast short URL redirection using Redis.
- Asynchronous background syncing to flush analytics to PostgreSQL without throttling.
- Dynamic Machine ID assignment for horizontal scaling.
- Rate limiting to prevent API abuse (`slowapi`).
- Automated Redis Cache eviction (`allkeys-lru`) for memory safety.

## Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Docker & Docker Compose](https://www.docker.com/)

### 2. Environment Setup
Clone the repository and configure your environment variables:
```bash
git clone https://github.com/daya-2619/url-shortner.git
cd url-shortner
cp .env.local .env
```
Inside `.env`, make sure your `DATABASE_URL` is configured to point to your NeonDB PostgreSQL instance.

### 3. Run with Docker Compose
The entire stack (Frontend, Backend, and Redis) is containerized. To spin it up locally:

```bash
docker-compose up --build
```

### 4. Verify
- Open your browser to [http://localhost:3000](http://localhost:3000)
- You can shorten URLs via the beautiful UI. The Next.js frontend will automatically proxy the API and short URL requests to the FastAPI backend!
