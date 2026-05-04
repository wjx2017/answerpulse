/**
 * Google OAuth callback route for AnswerPulse.
 * Handles the PKCE code exchange on the server side so that
 * session cookies are properly set.
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No authorization code provided')}`);
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(`${origin}/`);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Authentication failed';
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);
  }
}
