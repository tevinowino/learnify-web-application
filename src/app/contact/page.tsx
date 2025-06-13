
'use client';

import React, { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mail, MessageSquare, Send, Phone, MapPin, Loader2 } from 'lucide-react';
import { submitContactForm, type ContactFormState } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Metadata } from 'next'; // Cannot define metadata directly in client component
import { siteConfig } from '@/config/site';

// Metadata needs to be exported from server components or page.tsx if it's a server component
// For client components, you typically set metadata in the nearest server component parent (e.g., layout.tsx or a server page.tsx)
// Or, if this page itself was a Server Component, we could do:
/*
export const metadata: Metadata = {
  title: `Contact ${siteConfig.name} | Support and Inquiries`,
  description: `Get in touch with the ${siteConfig.name} team. Ask questions about our AI education platform, request a demo, or get support. We're here to help!`,
  keywords: ["contact Learnify", "Learnify support", "education platform inquiry", "AI school software demo", "edtech contact"],
  alternates: {
    canonical: '/contact',
  },
};
*/

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full button-shadow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      Send Message
    </Button>
  );
}

export default function ContactPage() {
  const { toast } = useToast();
  const initialState: ContactFormState = { message: '', success: false };
  const [state, formAction] = useFormState(submitContactForm, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        formRef.current?.reset(); 
      } else {
        toast({
          title: 'Error',
          description: state.message + (state.issues ? ` Issues: ${state.issues.join(', ')}` : ''),
          variant: 'destructive',
        });
      }
    }
  }, [state, toast]);

  // Dynamic title setting for client components (if needed, though layout.tsx handles general title)
  useEffect(() => {
    document.title = `Contact ${siteConfig.name} | Support and Inquiries`;
  }, []);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-4xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight">Contact Us</CardTitle>
          <CardDescription className="text-xl text-muted-foreground mt-2">
            We&apos;d love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-foreground">Get in Touch Directly</h3>
              <p className="text-muted-foreground">
                Feel free to reach out to us via email or phone. We aim to respond to all inquiries within 24 business hours.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <Mail className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:learnifyke@gmail.com" className="text-muted-foreground hover:text-primary">
                      learnifyke@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <Phone className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <span className="text-muted-foreground">+254794830280</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
                  <MapPin className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-medium">Address</p>
                    <span className="text-muted-foreground">123 Learning Lane, Education City, EC 12345</span>
                  </div>
                </div>
              </div>
            </div>
            
            <form ref={formRef} action={formAction} className="space-y-6 bg-card p-6 sm:p-8 rounded-lg border">
              <h3 className="text-2xl font-semibold text-foreground">Send Us a Message</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" name="firstName" placeholder="Enter your first name" required defaultValue={state.fields?.firstName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" name="lastName" placeholder="Enter your last name" required defaultValue={state.fields?.lastName} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Enter your email" required defaultValue={state.fields?.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" placeholder="What is your message about?" required defaultValue={state.fields?.subject} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" placeholder="Enter your message" rows={5} required defaultValue={state.fields?.message} />
              </div>
              <SubmitButton />
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
