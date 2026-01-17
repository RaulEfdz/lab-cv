import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ConfirmEmailTemplate from '@/lib/resend/templates/confirm-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();
  const supabase = await createClient();

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: Math.random().toString(36).substring(2), // dummy password
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      disableEmailSignup: true, // Disable Supabase default email
    },
  });

  if (signUpError) {
    return NextResponse.json({ error: signUpError.message }, { status: 400 });
  }

  const { data: magicLinkData, error: magicLinkError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (magicLinkError) {
    return NextResponse.json({ error: magicLinkError.message }, { status: 400 });
  }

  const actionUrl = magicLinkData.data.redirectTo ?? ''; // Fallback to empty string if redirectTo is null

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Confirma tu cuenta en CV Lab',
      html: render(ConfirmEmailTemplate({ actionUrl })),
    });
  } catch (error) {
    console.error('Error sending custom verification email:', error);
    return NextResponse.json(
      { error: 'Failed to send custom verification email' },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: 'Verification email sent' });
}