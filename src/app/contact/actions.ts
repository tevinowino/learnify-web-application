
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

  const htmlContent = `
    <p>You have a new contact form submission from Learnify:</p>
    <ul>
      <li><strong>Name:</strong> ${firstName} ${lastName}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Subject:</strong> ${subject}</li>
      <li><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    </ul>
  `;

  const recipientEmail = 'learnifyke@gmail.com'; // Updated recipient email

  const emailResult = await sendEmail({
    to: recipientEmail,
    subject: `Learnify Contact: ${subject}`,
    html: htmlContent,
    reply_to: email, // Set Reply-To to the sender's email
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
