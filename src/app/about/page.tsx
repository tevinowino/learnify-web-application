
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, Target, Heart, Code, UserCircle } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-4xl mx-auto card-shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-4xl font-bold tracking-tight">About Learnify</CardTitle>
          <p className="text-xl text-muted-foreground mt-2">
            Empowering Education Through Personalized AI
          </p>
        </CardHeader>
        <CardContent className="prose prose-lg max-w-none mx-auto text-muted-foreground space-y-8">
          <section className="text-center">
            <p className="text-lg">
              Learnify is dedicated to revolutionizing the learning experience. We believe in the power of
              personalized education to unlock every student's full potential and to provide educators with
              the tools they need to succeed in a dynamic educational landscape.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">Our Mission <Users className="inline-block h-7 w-7 text-primary mb-1" /></h2>
            <p className="text-center">
              To make personalized learning accessible, engaging, and effective for everyone, fostering a lifelong love for knowledge and continuous growth. We aim to bridge gaps in traditional education by leveraging cutting-edge AI technology.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">Our Vision <Zap className="inline-block h-7 w-7 text-accent mb-1" /></h2>
            <p className="text-center">
              A world where education adapts to the individual, empowering learners to achieve their dreams, educators to inspire with greater impact, and institutions to thrive. We envision a future where learning is not a one-size-fits-all model but a tailored journey for each student.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">Meet Our Founding Software Engineer <Code className="inline-block h-7 w-7 text-primary mb-1" /></h2>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="md:w-1/3 flex justify-center">
                <Image
                  src="https://picsum.photos/seed/tevin/300/300"
                  alt="Tevin Owino"
                  width={200}
                  height={200}
                  className="rounded-full shadow-lg"
                  data-ai-hint="person engineer"
                />
              </div>
              <div className="md:w-2/3 text-center md:text-left">
                <h3 className="text-xl font-semibold text-foreground mb-2">Tevin Owino</h3>
                <p className="text-muted-foreground">
                  Tevin is a passionate and innovative software engineer with a vision for transforming education through technology. With a strong background in AI and full-stack development, Tevin leads the technical development of Learnify, ensuring a robust, scalable, and user-friendly platform. His dedication to creating impactful learning solutions is the driving force behind our cutting-edge features.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4 text-center">Our Values <Target className="inline-block h-7 w-7 text-primary mb-1" /></h2>
            <ul className="list-none p-0 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
              <li className="p-4 rounded-lg bg-muted/50">
                <strong className="text-primary">Innovation:</strong> We continuously explore and implement novel AI solutions to enhance learning.
              </li>
              <li className="p-4 rounded-lg bg-muted/50">
                <strong className="text-primary">Personalization:</strong> We believe every student's learning journey is unique and provide tools for tailored experiences.
              </li>
              <li className="p-4 rounded-lg bg-muted/50">
                <strong className="text-primary">Collaboration:</strong> We foster a community where students, teachers, and admins can work together seamlessly.
              </li>
              <li className="p-4 rounded-lg bg-muted/50">
                <strong className="text-primary">Accessibility:</strong> We strive to make our platform intuitive and available to all learners and educators.
              </li>
              <li className="p-4 rounded-lg bg-muted/50 md:col-span-2">
                <strong className="text-primary">Passion for Learning:</strong> Our core drive is to ignite and sustain a passion for acquiring knowledge. <Heart className="inline-block h-5 w-5 text-destructive ml-1" />
              </li>
            </ul>
          </section>
          
          <section className="text-center">
            <p className="text-lg">
              Join us on this exciting journey to reshape education and create a brighter future for learners everywhere.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
