import { createServerClient } from '@supabase/ssr';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { SerializeOptions as CookieSerializeOptions } from 'cookie';

/**
 * Create a Supabase client for Pages API routes.
 * Pages API routes can't use `cookies()` from next/headers,
 * so we manually parse and set cookies.
 */
export function createPagesServerClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies: { name: string; value: string }[] = [];
          const cookieHeader = req.headers.cookie;
          if (cookieHeader) {
            cookieHeader.split(';').forEach(cookie => {
              const [name, ...rest] = cookie.split('=');
              if (name && rest.length > 0) {
                cookies.push({
                  name: name.trim(),
                  value: rest.join('=').trim(),
                });
              }
            });
          }
          return cookies;
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieSerializeOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookieString = `${name}=${value}`;
            if (options) {
              if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
              if (options.path) cookieString += `; Path=${options.path}`;
              if (options.domain) cookieString += `; Domain=${options.domain}`;
              if (options.httpOnly) cookieString += '; HttpOnly';
              if (options.secure) cookieString += '; Secure';
              if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
            }
            res.setHeader('Set-Cookie', cookieString);
          });
        },
      },
    }
  );
}
