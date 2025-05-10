import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen py-16 md:py-28 lg:py-36 overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20 backdrop-blur-sm">
      <div className="absolute inset-0 w-full h-full bg-grid-pattern opacity-5"></div>
      <div className="container relative px-4 md:px-8 mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 lg:gap-12">
          <div className="max-w-4xl space-y-6 text-center animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm mb-4">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary animate-gradient">
              Unlock Your Potential with Personalized Learning
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground/90 leading-relaxed">
              Learnify uses AI to create tailored learning paths, helping students of all levels achieve their academic goals through adaptive technology and personalized guidance.
            </p>
          </div>
          <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center items-center w-full max-w-xl">
            <Button 
              asChild 
              size="lg" 
              className="w-full min-[400px]:w-auto px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105 bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl hover:shadow-accent/25"
            >
              <Link href="/auth/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5 animate-bounce-x" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              asChild 
              className="w-full min-[400px]:w-auto px-8 py-6 text-lg font-semibold transition-all duration-300 transform hover:scale-105 border-2 hover:bg-primary/5 shadow-xl"
            >
              <Link href="#how-it-works">
                Learn More
              </Link>
            </Button>
          </div>
          {/* <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background to-transparent"></div> */}
        </div>
      </div>
    </section>
  );
}