import { Users, Zap, Target } from 'lucide-react';

export default function AboutSection() {
  return (
    <section id="about" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">About Us</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Empowering Education Through AI</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Learnify is dedicated to revolutionizing the learning experience. We believe in the power of personalized education to unlock every student's full potential and to provide educators with the tools they need to succeed.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
          <div className="grid gap-1 text-center p-6 rounded-lg card-shadow hover:bg-muted/50 transition-colors">
            <Users className="h-10 w-10 mx-auto text-primary mb-2" />
            <h3 className="text-xl font-bold">Our Mission</h3>
            <p className="text-sm text-muted-foreground">
              To make personalized learning accessible and effective for everyone, fostering a love for knowledge and continuous growth.
            </p>
          </div>
          <div className="grid gap-1 text-center p-6 rounded-lg card-shadow hover:bg-muted/50 transition-colors">
            <Zap className="h-10 w-10 mx-auto text-accent mb-2" />
            <h3 className="text-xl font-bold">Our Vision</h3>
            <p className="text-sm text-muted-foreground">
              A world where education adapts to the individual, empowering learners to achieve their dreams and educators to inspire.
            </p>
          </div>
          <div className="grid gap-1 text-center p-6 rounded-lg card-shadow hover:bg-muted/50 transition-colors">
            <Target className="h-10 w-10 mx-auto text-primary mb-2" />
            <h3 className="text-xl font-bold">Our Values</h3>
            <p className="text-sm text-muted-foreground">
              Innovation, Personalization, Collaboration, Accessibility, and a Passion for Learning.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
