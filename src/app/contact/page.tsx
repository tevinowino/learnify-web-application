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
  import type { Metadata } from 'next';
  import { siteConfig } from '@/config/site';

  function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" className="w-full transition-all duration-200 transform hover:scale-[1.02] button-shadow bg-accent hover:bg-accent/90 text-accent-foreground" disabled={pending}>
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

    useEffect(() => {
      document.title = `Contact ${siteConfig.name} | Support and Inquiries`;
    }, []);

    return (
      <div className="container mx-auto pt-32 pb-20 px-4 md:px-6 min-h-screen bg-background/50">
        <Card className="max-w-4xl mx-auto card-shadow backdrop-blur-sm bg-background/95 border-opacity-50 transition-all duration-300">
          <CardHeader className="text-center space-y-4 pb-8">
            <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Contact Us</CardTitle>
            <CardDescription className="text-xl text-muted-foreground mt-2 max-w-2xl mx-auto leading-relaxed">
              We'd love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <h3 className="text-2xl font-semibold text-foreground">Get in Touch Directly</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Feel free to reach out to us via email or phone. We aim to respond to all inquiries within 24 business hours.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 backdrop-blur-sm">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Email</p>
                      <a href="mailto:learnifyke@gmail.com" className="text-muted-foreground hover:text-primary transition-colors duration-200">
                        learnifyke@gmail.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 backdrop-blur-sm">
                    <Phone className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Phone</p>
                      <span className="text-muted-foreground">+254794830280</span>
                    </div>
                  </div>
                  {/* <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-200 backdrop-blur-sm">
                    <MapPin className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Address</p>
                      <span className="text-muted-foreground">123 Learning Lane, Education City, EC 12345</span>
                    </div>
                  </div> */}
                </div>
              </div>
            
              <form ref={formRef} action={formAction} className="space-y-6 bg-card p-8 rounded-xl border shadow-lg hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-2xl font-semibold text-foreground mb-6">Send Us a Message</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input id="firstName" name="firstName" placeholder="Enter your first name" required defaultValue={state.fields?.firstName} 
                      className="rounded-lg focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input id="lastName" name="lastName" placeholder="Enter your last name" required defaultValue={state.fields?.lastName}
                      className="rounded-lg focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Enter your email" required defaultValue={state.fields?.email}
                    className="rounded-lg focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                  <Input id="subject" name="subject" placeholder="What is your message about?" required defaultValue={state.fields?.subject}
                    className="rounded-lg focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                  <Textarea id="message" name="message" placeholder="Enter your message" rows={5} required defaultValue={state.fields?.message}
                    className="rounded-lg focus:ring-2 focus:ring-primary/20 resize-none" />
                </div>
                <SubmitButton />
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
