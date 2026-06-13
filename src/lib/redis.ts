import Redis from 'ioredis';

// Create a singleton instance helper
const globalForRedis = global as unknown as { redis: Redis };

let redisInstance: Redis | null = null;

function getRedisInstance(): Redis {
  if (redisInstance) return redisInstance;
  if (globalForRedis.redis) {
    redisInstance = globalForRedis.redis;
    return redisInstance;
  }
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not defined");
  }
  redisInstance = new Redis(process.env.REDIS_URL);
  if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redisInstance;
  }
  return redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(target, prop, receiver) {
    const instance = getRedisInstance();
    const value = Reflect.get(instance, prop);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
  set(target, prop, value, receiver) {
    const instance = getRedisInstance();
    return Reflect.set(instance, prop, value);
  }
});
