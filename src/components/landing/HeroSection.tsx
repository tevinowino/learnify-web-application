import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen py-16 overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20 backdrop-blur-sm">
      <div className="absolute inset-0 w-full h-full bg-grid-pattern opacity-5"></div>
      <div className="container relative px-4 md:px-8 mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 lg:gap-12">
          <div className="max-w-4xl space-y-6 text-center animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm mb-4">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl xl:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary animate-gradient">
              Unlock the Future of Education – Revolutionize Your School’s Operations Today
            </h1>
            <p className="max-w-3xl mx-auto text-base md:text-lg text-muted-foreground/90 leading-relaxed">
              Transform the way your school manages students, teachers, and administration – with AI-powered tools designed to save time, improve outcomes, and prepare students for tomorrow’s world.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center items-center w-full max-w-xl">
            <Button 
              asChild 
              size="lg" 
              className="w-full min-[400px]:w-auto px-8 py-5 text-base font-medium transition-all duration-300 transform hover:scale-105 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl hover:shadow-accent/25"
            >
              <Link href="#contact" aria-label="Request a free demo for our AI-powered platform">
                Request a Free Demo <ArrowRight className="ml-2 h-5 w-5 animate-bounce-x" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="w-full min-[400px]:w-auto px-8 py-5 text-base font-medium transition-all duration-300 transform hover:scale-105 border-2 hover:bg-primary/5 shadow-xl"
            >
              <Link href="/auth/signup">
                Get Started Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
