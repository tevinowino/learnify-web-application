
'use server';

import { z } from 'zod';
import { sendEmail } from '@/actions/emailActions';

const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  email: z.string().email('Invalid email address.'),
  subject: z.string().min(1, 'Subject is required.'),
  message: z.string().min(10, 'Message must be at least 10 characters long.'),
});

export type ContactFormState = {
  message: string;
  fields?: Record<string, string>;
  issues?: string[];
  success?: boolean;
};

export async function submitContactForm(
  prevState: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const validatedFields = contactFormSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      fields: Object.fromEntries(formData.entries()) as Record<string, string>,
      issues: validatedFields.error.issues.map((issue) => issue.message),
      success: false,
    };
  }

  const { firstName, lastName, email, subject, message } = validatedFields.data;

  const contactTemplateId = process.env.NEXT_PUBLIC_EMAILJS_CONTACT_TEMPLATE_ID;
  const adminEmail = 'learnifyke@gmail.com';

  if (!contactTemplateId) {
    return {
        message: 'Contact form email template is not configured.',
        fields: validatedFields.data,
        success: false,
    };
  }

  const templateParams = {
    from_name: `${firstName} ${lastName}`,
    from_email: email, // This could be used as 'reply_to' in your EmailJS template
    contact_subject: subject, // Use a distinct name if 'subject' is generic
    contact_message: message, // Use a distinct name if 'message' is generic
    to_email: adminEmail, // EmailJS template should be configured to send to this, or use a {{to_email}} param
    // Add any other params your EmailJS contact template expects
  };

  const emailResult = await sendEmail({
    templateId: contactTemplateId,
    templateParams: templateParams,
  });

  if (emailResult.success) {
    return { message: 'Thank you for your message! We will get back to you soon.', success: true };
  } else {
    return {
      message: `Failed to send message: ${emailResult.error || 'Unknown error.'}`,
      fields: validatedFields.data,
      success: false,
    };
  }
}
