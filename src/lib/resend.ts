import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  console.warn(
    'RESEND_API_KEY is not set. Email sending will not work. Please set it in your .env file.'
  );
}

export const resend = new Resend(process.env.RESEND_API_KEY);
