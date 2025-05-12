'use server';

import { resend } from '@/lib/resend';
import type { CreateEmailOptions, CreateEmailRequestOptions } from 'resend/build/src/emails/interfaces';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string; 
  reply_to?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; data?: any }> {
  const fromEmail = options.from || process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    console.error('RESEND_FROM_EMAIL is not configured.');
    return { success: false, error: 'Sender email not configured.' };
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn('Resend API key not set, simulating email success.');
    // Simulate success in dev if API key is missing to avoid blocking UI tests
    if (process.env.NODE_ENV === 'development') {
        console.log(`Simulated email sent to ${options.to} with subject "${options.subject}"`);
        return { success: true, data: { id: 'simulated_email_id' } };
    }
    return { success: false, error: 'Resend API key not configured.' };
  }

  try {
    const emailData: CreateEmailOptions = {
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      reply_to: options.reply_to,
    };
    
    const { data, error } = await resend.emails.send(emailData as CreateEmailRequestOptions);

    if (error) {
      console.error('Resend API Error:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (e: any) {
    console.error('Error sending email:', e);
    return { success: false, error: e.message || 'Failed to send email.' };
  }
}
