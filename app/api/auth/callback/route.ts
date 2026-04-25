/**
 * Google OAuth callback route for AnswerPulse.
 *
 * Cloudflare Workers compatible — uses native Supabase client
 * instead of @supabase/ssr to avoid 0B compilation issues with @opennextjs/cloudflare.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No authorization code provided')}`);
  }

  try {
    // Create Supabase client directly (no SSR wrapper for Cloudflare compatibility)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Exchange PKCE code for session
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[OAuth callback] Error exchanging code:', error);
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
    }

    if (!sessionData?.session) {
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('No session created. Please try again.')}`);
    }

    // Redirect to the intended destination
    return NextResponse.redirect(`${origin}${next}`);

  } catch (error) {
    console.error('[OAuth callback] Unexpected error:', error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`);
  }
}

// Edge runtime for Cloudflare Workers compatibility
export const runtime = 'edge';
