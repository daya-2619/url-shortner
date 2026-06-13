import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { redis } from '@/lib/redis';

export async function GET(req: Request, { params }: { params: Promise<{ shortUrl: string }> }) {
  const { shortUrl } = await params;

  if (!shortUrl) {
    return NextResponse.next();
  }

  try {
    // 1. Try to get the original URL from Redis cache
    const cacheKey = `mapping:${shortUrl}`;
    let originalUrl = await redis.get(cacheKey);

    if (!originalUrl) {
      // 2. Cache miss -> query the database
      const mapping = await sql`
        SELECT original_url FROM url_mapping WHERE short_url = ${shortUrl}
      `;

      if (mapping.length === 0) {
        return NextResponse.next();
      }

      const dbUrl = mapping[0].original_url;
      if (!dbUrl) {
        return NextResponse.next();
      }
      originalUrl = dbUrl;

      // 3. Set the read-through cache with a TTL (e.g., 24 hours = 86400 seconds)
      await redis.set(cacheKey, dbUrl, 'EX', 86400);
    }

    if (!originalUrl) {
      return NextResponse.next();
    }

    // 4. Increment the analytics counter in Redis
    await redis.incr(`clicks:${shortUrl}`);

    // 5. Redirect the user
    return NextResponse.redirect(originalUrl, 302);
  } catch (error) {
    console.error('Error redirecting from root:', error);
    return NextResponse.next();
  }
}
