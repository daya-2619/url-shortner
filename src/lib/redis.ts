import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

// Create a singleton instance to prevent multiple connections in dev
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(process.env.REDIS_URL);

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;
