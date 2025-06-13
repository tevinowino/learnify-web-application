
"use client"; // Add this directive

import React from 'react'; // Ensure React is imported
import { School, Layers, Brain, ClipboardCheck, Users, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const features = [
  {
    icon: <School className="h-10 w-10 text-primary" />,
    title: 'School Onboarding & Management',
    description: "Whether you’re starting fresh or switching to digital, Learnify helps you get your school up and running in no time. Easily manage users, track progress, and streamline communication with just a few clicks.",
  },
  {
    icon: <Layers className="h-10 w-10 text-primary" />,
    title: 'Seamless Learning Experience',
    description: "From managing classes and subjects to creating assignments, Learnify simplifies teaching workflows. Teachers can upload materials, assign tasks, and provide feedback – all in one place.",
  },
  {
    icon: <Brain className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Student Insights',
    description: "Our AI assistant, Akili, helps students study smarter by providing personalized learning resources and answering questions. This helps your students excel – whether in class or remotely.",
  },
  {
    icon: <ClipboardCheck className="h-10 w-10 text-primary" />,
    title: 'Real-Time Results & Feedback',
    description: "Say goodbye to paper exams and manual grading. Teachers input results directly, and students and parents can access real-time exam results and feedback from any device.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: 'Boost Parent-Teacher Communication',
    description: "Give parents real-time visibility into their child’s performance and attendance. Strengthen the parent-teacher partnership and enhance student success.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Our Features</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features That Make You a Pioneer in School Management</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="flex flex-col card-shadow hover:bg-muted/50 transition-colors">
              <CardHeader className="flex-row items-start gap-4 space-y-0">
                <div className="p-2 bg-primary/10 rounded-full">
                  {React.cloneElement(feature.icon, { className: "h-8 w-8 text-primary" })}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 button-shadow">
            <Link href="/about"> {/* Assuming /about page will have more detailed features */}
              See All Features <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

