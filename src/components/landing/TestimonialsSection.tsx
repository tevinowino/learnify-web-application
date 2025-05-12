import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Jane Doe, Headmistress',
    school: 'Greenfield Academy',
    avatar: 'https://picsum.photos/seed/jane/100/100',
    aiHint: "person headmistress",
    quote: "Since switching to Learnify, our administrative workload has been cut by 50%. Our teachers now have more time to focus on student engagement, and our parents are thrilled with the improved communication.",
  },
  {
    name: 'John Smith, School Administrator',
    school: 'Bright Futures School', // Changed school for variety
    avatar: 'https://picsum.photos/seed/john-admin/100/100',
    aiHint: "person administrator",
    quote: 'Learnify helped us move our school into the digital age. We now have a clear overview of our students\' progress, and our teachers can manage their classrooms with ease.',
  },
  {
    name: 'Mary Johnson, Parent',
    school: 'Student at Bright Futures School',
    avatar: 'https://picsum.photos/seed/mary/100/100',
    aiHint: "person parent",
    quote: 'As a parent, I love how Learnify lets me track my child’s progress in real-time. It’s reassuring to know exactly what’s happening in my child’s education.',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm text-primary">Testimonials</div>
          <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Join Schools Who Have Already Transformed Their Education with Learnify</h2>
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
                    <p className="text-xs text-muted-foreground">{testimonial.school}</p>
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
