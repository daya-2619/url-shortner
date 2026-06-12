import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, HttpUrl
from psycopg_pool import AsyncConnectionPool
from psycopg.rows import dict_row
import redis.asyncio as redis
from dotenv import load_dotenv

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from id_generator import generate_short_id

# Load environment variables from the parent directory's .env.local
load_dotenv(dotenv_path="../.env.local")

DATABASE_URL = os.getenv("DATABASE_URL")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Global connection pools
db_pool = None
redis_client = None

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

async def sync_analytics_background():
    """Background task to sync analytics every 5 minutes"""
    while True:
        await asyncio.sleep(300) # 5 minutes
        try:
            keys = await redis_client.keys("clicks:*")
            if keys:
                synced = 0
                async with db_pool.connection() as conn:
                    async with conn.cursor() as cur:
                        for key in keys:
                            count = await redis_client.get(key)
                            if count:
                                count = int(count)
                                if count > 0:
                                    short_url = key.decode("utf-8").replace("clicks:", "")
                                    await redis_client.decrby(key, count)
                                    await cur.execute(
                                        """
                                        UPDATE analytics
                                        SET click_count = click_count + %s, last_accessed = CURRENT_TIMESTAMP
                                        WHERE short_url = %s
                                        """,
                                        (count, short_url)
                                    )
                                    synced += 1
                    await conn.commit()
                print(f"[Sync] Flushed {synced} URLs to database.")
        except Exception as e:
            print(f"[Sync Error] {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_pool, redis_client
    db_pool = AsyncConnectionPool(conninfo=DATABASE_URL, kwargs={"row_factory": dict_row})
    await db_pool.open()
    redis_client = redis.from_url(REDIS_URL)
    
    # Configure Redis eviction policy for cache resilience
    try:
        await redis_client.config_set("maxmemory-policy", "allkeys-lru")
    except Exception as e:
        print(f"[Redis Config] Could not set maxmemory-policy: {e}")

    # Start the background sync task
    sync_task = asyncio.create_task(sync_analytics_background())
    
    yield
    
    sync_task.cancel()
    await db_pool.close()
    await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

class ShortenRequest(BaseModel):
    longUrl: HttpUrl

@app.post("/api/urls/shorten")
@limiter.limit("10/minute")
async def shorten_url(request: Request, req: ShortenRequest):
    long_url = str(req.longUrl)
    short_id = generate_short_id()
    
    async with db_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                "INSERT INTO url_mapping (short_url, original_url) VALUES (%s, %s)",
                (short_id, long_url)
            )
            await cur.execute(
                "INSERT INTO analytics (short_url, click_count) VALUES (%s, 0)",
                (short_id,)
            )
        await conn.commit()
        
    return {"shortUrl": short_id, "originalUrl": long_url}

@app.get("/{short_url}")
async def redirect_url(short_url: str):
    if short_url.startswith("_next") or short_url == "favicon.ico" or short_url == "api":
        raise HTTPException(status_code=404)
        
    cache_key = f"mapping:{short_url}"
    original_url = await redis_client.get(cache_key)
    
    if original_url:
        original_url = original_url.decode("utf-8")
    else:
        async with db_pool.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    "SELECT original_url FROM url_mapping WHERE short_url = %s", 
                    (short_url,)
                )
                row = await cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="URL not found")
                original_url = row["original_url"]
                await redis_client.setex(cache_key, 86400, original_url)
            
    await redis_client.incr(f"clicks:{short_url}")
    return RedirectResponse(url=original_url, status_code=302)

@app.get("/api/analytics/{short_url}")
async def get_analytics(short_url: str):
    async with db_pool.connection() as conn:
        async with conn.cursor() as cur:
            await cur.execute(
                """
                SELECT u.short_url, u.original_url, u.created_at, a.click_count, a.last_accessed
                FROM url_mapping u
                LEFT JOIN analytics a ON u.short_url = a.short_url
                WHERE u.short_url = %s
                """,
                (short_url,)
            )
            row = await cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Analytics not found")
            
    redis_clicks = await redis_client.get(f"clicks:{short_url}")
    pending_clicks = int(redis_clicks) if redis_clicks else 0
    
    return {
        "short_url": row["short_url"],
        "original_url": row["original_url"],
        "created_at": row["created_at"],
        "click_count": row["click_count"] + pending_clicks,
        "last_accessed": row["last_accessed"]
    }

@app.post("/api/analytics/sync")
async def sync_analytics():
    # Keep the manual endpoint just in case, or for tests
    keys = await redis_client.keys("clicks:*")
    if not keys:
        return {"message": "No analytics to sync"}
        
    synced = 0
    async with db_pool.connection() as conn:
        async with conn.cursor() as cur:
            for key in keys:
                count = await redis_client.get(key)
                if count:
                    count = int(count)
                    if count > 0:
                        short_url = key.decode("utf-8").replace("clicks:", "")
                        await redis_client.decrby(key, count)
                        await cur.execute(
                            """
                            UPDATE analytics
                            SET click_count = click_count + %s, last_accessed = CURRENT_TIMESTAMP
                            WHERE short_url = %s
                            """,
                            (count, short_url)
                        )
                        synced += 1
        await conn.commit()
                    
    return {"message": f"Synced {synced} URLs to the database"}
