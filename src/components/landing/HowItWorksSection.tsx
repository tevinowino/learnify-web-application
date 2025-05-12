import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wrench, Lightbulb, Zap, BarChartHorizontalBig, Link as LinkIcon } from 'lucide-react'; // Added LinkIcon
import { Button } from '@/components/ui/button'; // Added Button

const problemsAndSolutions = [
  {
    problemIcon: <Wrench className="h-8 w-8 text-destructive mb-2" />,
    problemTitle: "Manual admin tasks take up too much of your time.",
    solutionIcon: <Lightbulb className="h-8 w-8 text-primary mb-2" />,
    solution: "Learnify automates attendance tracking, grading, exam result management, and class management, saving you hours every week.",
  },
  {
    problemIcon: <Wrench className="h-8 w-8 text-destructive mb-2" />,
    problemTitle: "Your teachers are overwhelmed with lesson planning, grading, and tracking progress.",
    solutionIcon: <Lightbulb className="h-8 w-8 text-primary mb-2" />,
    solution: "With AI-powered tools, Learnify makes lesson planning and grading easier. Teachers can focus on what truly matters: student engagement and learning outcomes.",
  },
  {
    problemIcon: <Zap className="h-8 w-8 text-destructive mb-2" />, // Changed icon for variety
    problemTitle: "You’re still using outdated systems for managing school activities.",
    solutionIcon: <Lightbulb className="h-8 w-8 text-primary mb-2" />,
    solution: "Join the digital education revolution with Learnify’s comprehensive school management platform, designed for forward-thinking school leaders like you.",
  },
  {
    problemIcon: <BarChartHorizontalBig className="h-8 w-8 text-destructive mb-2" />,
    problemTitle: "You’re unsure how to improve student performance or manage student data effectively.",
    solutionIcon: <Lightbulb className="h-8 w-8 text-primary mb-2" />,
    solution: "Learnify’s AI integration provides real-time insights into student performance, allowing for data-driven decisions that improve learning outcomes.",
  },
];

export default function WhyLearnifySection() {
  return (
    <section id="why-learnify" className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Why Learnify?</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Here’s How Learnify Solves Your Biggest Challenges</h2>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 pt-12">
          {problemsAndSolutions.map((item, index) => (
            <Card key={index} className="text-left card-shadow transform hover:scale-105 transition-transform duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {item.problemIcon}
                  <CardTitle className="text-lg">{item.problemTitle}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-3">
                  {item.solutionIcon}
                  <p className="text-sm text-muted-foreground">{item.solution}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground button-shadow">
            <a href="#contact"> {/* Assuming contact section has id="contact" for demo request */}
              See How Learnify Can Transform Your School <LinkIcon className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
