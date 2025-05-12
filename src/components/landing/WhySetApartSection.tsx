import { Rocket, Zap, Award, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const points = [
  {
    icon: <Rocket className="h-8 w-8 text-primary" />,
    title: 'Future-Proof Your School',
    description: 'Stay ahead of the curve with a platform that brings advanced AI tools and automation to your school’s daily operations.',
  },
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Increased Efficiency & Productivity',
    description: 'By reducing manual tasks, you give your staff and students more time to focus on what really matters – learning and teaching.',
  },
  {
    icon: <Award className="h-8 w-8 text-primary" />,
    title: 'Your School as a Role Model',
    description: 'By adopting Learnify, you’ll be one of the top digitalized schools in the country, making a significant leap towards modern education standards.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Support for All Users',
    description: 'Admins, teachers, students, and parents can all navigate the platform with ease, thanks to its intuitive and user-friendly design.',
  },
];

export default function WhySetApartSection() {
  return (
    <section id="why-set-apart" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-lg text-primary">Be a Pioneer</div>
          <h2 className="text-2xl font-bold tracking-tighter sm:text-4xl">Your School, Leading the Digital Education Revolution</h2>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-2">
          {points.map((point, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-card card-shadow transition-colors">
              <div className="flex-shrink-0 mt-1">
                {point.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{point.title}</h3>
                <p className="text-sm text-muted-foreground">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
            <Link href="#contact">
              Join the Revolution: Let’s Talk! <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
