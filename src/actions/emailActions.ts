'use server';

import emailjs from '@emailjs/browser';

interface EmailJsOptions {
  templateId: string;
  templateParams: Record<string, unknown>;
  // to_email must be part of templateParams if dynamic, subject is part of the template
}

export async function sendEmail(options: EmailJsOptions): Promise<{ success: boolean; error?: string; data?: any }> {
  const serviceID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const userID = process.env.NEXT_PUBLIC_EMAILJS_USER_ID; // Public Key

  if (!serviceID || !userID || !options.templateId) {
    const missing = [];
    if (!serviceID) missing.push('EmailJS Service ID');
    if (!userID) missing.push('EmailJS User ID (Public Key)');
    if (!options.templateId) missing.push('EmailJS Template ID');
    
    const errorMessage = `EmailJS configuration is incomplete. Missing: ${missing.join(', ')}.`;
    console.error(errorMessage);

    // Simulate success in dev if API key is missing to avoid blocking UI tests
    if (process.env.NODE_ENV === 'development') {
        console.warn(`EmailJS not fully configured. Simulating email success for template ${options.templateId} with params:`, options.templateParams);
        return { success: true, data: { id: 'simulated_emailjs_id' } };
    }
    return { success: false, error: errorMessage };
  }

  try {
    // Ensure to_email is present in templateParams for notifications if your template expects it
    // For contact forms, to_email will be the admin's email (learnifyke@gmail.com)
    // and from_email will be the user's email, passed in templateParams.
    // EmailJS often uses {{reply_to}} in templates for the user's email.
    
    const response = await emailjs.send(serviceID, options.templateId, options.templateParams as Record<string, string | undefined>, { publicKey: userID });
    
    if (response.status === 200) {
      return { success: true, data: { id: response.text } }; // response.text usually contains "OK" or similar
    } else {
      console.error('EmailJS API Error:', response.status, response.text);
      return { success: false, error: `EmailJS Error: ${response.status} - ${response.text}` };
    }
  } catch (e: any) {
    console.error('Error sending email via EmailJS:', e);
    return { success: false, error: e.message || 'Failed to send email via EmailJS.' };
  }
}
