import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = searchParams.get('next') ?? '/';
  const email = searchParams.get('email');

  if (token_hash && type && email) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error && user) {
      try {
        const actionUrl = `${new URL(request.url).origin}/api/auth/callback?token_hash=${token_hash}&type=${type}&next=${next}`;

        await sendEmail('confirm-email', email, actionUrl);

        const redirectTo = new URL(request.url);
        redirectTo.pathname = '/';
        redirectTo.searchParams.set('message', 'Verification email sent. Please check your inbox.');
        return NextResponse.redirect(redirectTo);
      } catch (e) {
        // continue to error page
      }
    }
  }

  // return the user to an error page with some instructions
  const redirectTo = new URL(request.url);
  redirectTo.pathname = '/auth/auth-code-error';
  return NextResponse.redirect(redirectTo);
}
