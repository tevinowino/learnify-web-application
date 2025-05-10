import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
// Removed Image import

export default function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-1 text-center"> {/* Changed to single column and centered text */}
          <div className="flex flex-col justify-center items-center space-y-4"> {/* Added items-center */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                Unlock Your Potential with Personalized Learning
              </h1>
              <p className="max-w-[600px] mx-auto text-muted-foreground md:text-xl"> {/* Added mx-auto for centering */}
                Learnify uses AI to create tailored learning paths, helping students of all levels achieve their academic goals.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center"> {/* Added justify-center */}
              <Button asChild size="lg" className="button-shadow bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/auth/signup">
                  Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="button-shadow">
                <Link href="#how-it-works">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
          {/* Image component removed */}
        </div>
      </div>
    </section>
  );
}
