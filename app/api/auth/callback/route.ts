/**
 * Google OAuth callback route for AnswerPulse.
 *
 * In Cloudflare Workers / OpenNext environment, we cannot set cookies
 * from API routes. So we relay the code to the client-side callback page
 * which uses the browser Supabase SDK (supports localStorage/cookies)
 * to properly persist the session.
 */
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No authorization code provided')}`);
  }

  // Redirect to client-side callback page where browser SDK handles session
  const clientCallback = new URL('/auth/callback', origin);
  clientCallback.searchParams.set('code', code);
  return NextResponse.redirect(clientCallback.toString());
}
