import { Resend } from 'resend';
import * as React from 'react';
import {
  ConfirmEmailTemplate,
  InviteUserTemplate,
  MagicLinkTemplate,
  ChangeEmailTemplate,
  ResetPasswordTemplate,
  ReauthenticationTemplate,
} from './templates';

export const resend = new Resend(process.env.RESEND_API_KEY);

type EmailType = 
  | 'confirm-email'
  | 'invite-user'
  | 'magic-link'
  | 'change-email'
  | 'reset-password'
  | 'reauthentication';

const emailTemplates: Record<EmailType, React.FC<{ actionUrl: string }>> = {
  'confirm-email': ConfirmEmailTemplate,
  'invite-user': InviteUserTemplate,
  'magic-link': MagicLinkTemplate,
  'change-email': ChangeEmailTemplate,
  'reset-password': ResetPasswordTemplate,
  'reauthentication': ReauthenticationTemplate,
};

const emailSubjects: Record<EmailType, string> = {
  'confirm-email': 'Confirma tu cuenta en CV Lab',
  'invite-user': 'Has sido invitado a CV Lab',
  'magic-link': 'Inicia sesión en CV Lab',
  'change-email': 'Confirma tu nueva dirección de correo electrónico',
  'reset-password': 'Restablecer tu contraseña',
  'reauthentication': 'Confirma tu identidad',
};

export async function sendEmail(
  type: EmailType,
  email: string,
  actionUrl: string
) {
  const Template = emailTemplates[type];
  const subject = emailSubjects[type];

  try {
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject,
      react: <Template actionUrl={actionUrl} />,
    });
  } catch (error) {
    console.error(`Error sending ${type} email:`, error);
    throw new Error(`Failed to send ${type} email`);
  }
}
