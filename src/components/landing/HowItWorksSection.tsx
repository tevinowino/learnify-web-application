import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, UploadCloud, BarChartHorizontalBig, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="h-10 w-10 text-primary" />,
    title: 'Sign Up & Choose Role',
    description: 'Admins, Teachers, and Students can easily sign up and get started on their respective learning journeys.',
  },
  {
    icon: <UploadCloud className="h-10 w-10 text-primary" />,
    title: 'Upload Learning Materials',
    description: 'Teachers can upload course content, which our AI uses to understand the curriculum and student needs.',
  },
  {
    icon: <Sparkles className="h-10 w-10 text-primary" />,
    title: 'AI-Powered Path Generation',
    description: 'Our intelligent system analyzes student performance and teacher content to create personalized learning paths.',
  },
  {
    icon: <BarChartHorizontalBig className="h-10 w-10 text-primary" />,
    title: 'Track Progress & Succeed',
    description: 'Students follow their custom paths and track their progress, ensuring they master concepts effectively.',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">How It Works</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">A Smarter Way to Learn</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Learnify simplifies the learning process with a clear, step-by-step approach powered by AI.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-2 xl:grid-cols-4 pt-12">
          {steps.map((step, index) => (
            <Card key={index} className="text-left card-shadow transform hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {step.icon}
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
