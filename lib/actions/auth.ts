/**
 * Server Actions for AnswerPulse authentication.
 * Used by Server Components (login/register pages) to handle auth flows.
 */
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Sign in with Google OAuth.
 * Called from the login page "Sign in with Google" button.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${APP_URL}/api/auth/callback`,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }

  redirect('/login?error=Google OAuth failed');
}

/**
 * Sign up with Google OAuth.
 * Called from the register page "Sign up with Google" button.
 * (Same as sign in — Supabase handles new user creation automatically.)
 */
export async function signUpWithGoogle() {
  // Same flow as sign in — Supabase creates the user if they don't exist
  await signInWithGoogle();
}

/**
 * Sign out.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
