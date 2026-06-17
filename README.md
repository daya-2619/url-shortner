# Enterprise URL Shortener (Microservices Architecture)

A highly scalable, production-grade URL shortener built with a decoupled, horizontally scaled microservices architecture. 

## 🏗️ System Architecture
- **Frontend**: Next.js 14 (App Router, Edge-ready)
- **Load Balancer**: NGINX (Round-robin traffic distribution)
- **Scalable API Tier**: 3x Python FastAPI Replicas (Uvicorn, async)
- **Key Generation Service (KGS)**: Dedicated FastAPI microservice for pre-generating unique Base62 IDs.
- **Caching & Analytics**: Redis (Read-Through Cache + atomic counters)
- **Database**: NeonDB (Serverless PostgreSQL with connection pooling via psycopg)
- **Orchestration**: Docker & Docker Compose

## ✨ Key Features
- **Distributed Load Balancing**: Traffic is smoothly routed across 3 independent API instances via an internal NGINX proxy.
- **Decoupled ID Generation**: A standalone KGS microservice guarantees collision-free, thread-safe alias generation.
- **High-Performance Caching**: Blazing fast short URL redirection using Redis, reducing database reads by 99%.
- **Asynchronous Analytics**: Background workers asynchronously flush analytics to PostgreSQL without bottlenecking redirect speeds.
- **Security & Memory Safety**: Rate limiting via `slowapi` to prevent DDoS abuse, and automated Redis cache eviction (`allkeys-lru`) during traffic spikes.

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed:
- [Docker Desktop](https://www.docker.com/)

### 2. Environment Setup
Clone the repository and configure your environment variables:
```bash
git clone https://github.com/daya-2619/url-shortner.git
cd url-shortner
cp .env.local .env
```
Inside `.env`, make sure your `DATABASE_URL` is configured to point to your NeonDB PostgreSQL instance.

### 3. Run the Cluster
The entire distributed stack (7 Containers: Frontend, NGINX, 3x APIs, KGS, Redis) is fully containerized. To spin it up locally:

```bash
docker-compose up --build -d
```

### 4. Verify
- Open your browser to [http://localhost:3000](http://localhost:3000)
- Shorten a URL! The Next.js frontend will proxy the request to the NGINX Load Balancer, which will delegate it to an API replica. The replica will then fetch a unique key from the KGS microservice.
