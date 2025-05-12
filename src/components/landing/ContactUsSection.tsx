import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Send, Phone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ContactUsSection() {
  return (
    <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        {/* Get Started Today Section */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Get Started</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Ready to Transform Your School?</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Take the first step towards a more efficient, modern, and effective school experience with Learnify. Start with a free trial today and see for yourself how our platform can improve the way you manage your school.
          </p>
          <div className="flex flex-col gap-3 min-[400px]:flex-row">
            <Button asChild size="lg" className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="#contact-form"> {/* Points to the form below */}
                Request a Free Demo
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="button-shadow">
              <Link href="/auth/signup">
                Start Your Free Trial Now
              </Link>
            </Button>
          </div>
        </div>

        {/* Original Contact Us Form Section */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12 pt-12 border-t">
           <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Contact Us</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get in Touch</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Have questions or need support? We're here to help. Reach out to us through the form below or via our contact details.
          </p>
        </div>
        <div id="contact-form" className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Contact Information</h3>
              <p className="text-muted-foreground">Fill out the form or contact us directly:</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <a href="mailto:support@learnifyapp.com" className="text-muted-foreground hover:text-primary">
                  support@learnifyapp.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">(123) 456-7890</span>
              </div>
            </div>
          </div>
          <form className="space-y-6 card-shadow p-6 sm:p-8 rounded-lg border bg-card">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Enter your first name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Enter your last name" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Enter your message" rows={5} />
            </div>
            <Button type="submit" className="w-full button-shadow bg-primary hover:bg-primary/90">
              <Send className="mr-2 h-4 w-4" /> Send Message
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
