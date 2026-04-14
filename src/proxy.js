import { NextResponse } from 'next/server';

// Lightweight in-memory rate limiting map.
// Note: In a distributed Vercel Edge environment, this map won't share state completely globally,
// but it is an extremely efficient deterrent for rapidly spamming endpoints from a single region/IP.
const rateLimitMap = new Map();

export default function proxy(request) {
  // Try to grab IP from Vercel/Next headers, fallback if missing
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  // Rate Limit Configuration: 50 requests per minute
  const limit = 50; 
  const windowMs = 60 * 1000;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const data = rateLimitMap.get(ip);
    if (now > data.resetTime) {
      // Time window expired, reset the counter
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      if (data.count >= limit) {
        // Rate limit exceeded
        return new NextResponse(
          JSON.stringify({ 
            error: 'Too Many Requests', 
            message: 'You have exceeded the request limit. Please try again later.' 
          }), 
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((data.resetTime - now) / 1000).toString()
            } 
          }
        );
      }
      // Increment request count
      data.count++;
      rateLimitMap.set(ip, data);
    }
  }

  // Periodic passive garbage collection to clear expired IPs and prevent memory leaks
  if (Math.random() < 0.05) { // 5% chance to trigger cleanup per request
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply this middleware to everything EXCEPT standard static Next.js assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
