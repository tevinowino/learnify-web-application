import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Sarah L., Student',
    avatar: 'https://picsum.photos/seed/sarah/100/100',
    aiHint: "person student",
    quote: "Learnify's personalized path helped me focus on my weak areas. My grades have improved so much!",
  },
  {
    name: 'Mr. John B., Teacher',
    avatar: 'https://picsum.photos/seed/john/100/100',
    aiHint: "person teacher",
    quote: 'The platform is intuitive for uploading materials, and the AI summaries are a great starting point for lesson planning.',
  },
  {
    name: 'Principal Ava C., Admin',
    avatar: 'https://picsum.photos/seed/ava/100/100',
    aiHint: "person admin",
    quote: 'Managing users and tracking school-wide progress has never been easier. Learnify is a game-changer for our school.',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Testimonials</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Loved by Students & Educators</h2>
          <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Hear what our users have to say about their experience with Learnify.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="card-shadow">
              <CardContent className="p-6 space-y-4">
                <Quote className="h-8 w-8 text-primary/50" />
                <p className="text-muted-foreground italic">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint={testimonial.aiHint} />
                    <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
