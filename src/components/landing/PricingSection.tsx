import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Basic Student',
    price: 'Free',
    description: 'For individual students to explore personalized learning.',
    features: [
      'Access to AI Learning Paths',
      'Basic Progress Tracking',
      'Join Classes via Code',
      'Submit Assignments',
    ],
    cta: 'Sign Up for Free',
    href: '/auth/signup?role=student'
  },
  {
    name: 'Teacher Pro',
    price: '$10',
    priceSuffix: '/month',
    description: 'For educators to manage classes and create content.',
    features: [
      'All Student Features',
      'Class Management',
      'Material Uploads',
      'Assignment Creation & Grading',
      'Attendance Tracking (Coming Soon)',
    ],
    cta: 'Get Started',
    href: '/auth/signup?role=teacher'
  },
  {
    name: 'School & Admin',
    price: 'Contact Us',
    description: 'Comprehensive solutions for schools and districts.',
    features: [
      'All Teacher Pro Features',
      'School-wide User Management',
      'Admin Dashboard & Analytics',
      'Exam Mode & Results Management (Coming Soon)',
      'Priority Support',
    ],
    cta: 'Request a Demo',
    href: '#contact'
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/30">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Pricing</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Choose the plan that fits your needs. Get started for free or unlock powerful features for your school.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3 lg:gap-8">
          {pricingTiers.map((tier) => (
            <Card key={tier.name} className="flex flex-col card-shadow hover:border-primary transition-colors">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="text-4xl font-bold">
                  {tier.price}
                  {tier.priceSuffix && <span className="text-sm font-normal text-muted-foreground">{tier.priceSuffix}</span>}
                </div>
                <ul className="space-y-2">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button asChild className={`w-full button-shadow ${tier.name === 'Teacher Pro' ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : 'bg-primary hover:bg-primary/90'}`}>
                  <Link href={tier.href}>{tier.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
