'use client'  
  
  import Link from 'next/link';
  import { Button } from '@/components/ui/button';
  import { ArrowRight, Sparkles } from 'lucide-react';
  import Image from 'next/image';
  import { motion } from 'framer-motion';

  export default function HeroSection() {
    return (
      <section className="relative w-full min-h-screen pb-16 overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20 backdrop-blur-sm flex items-center pt-28">
        <div className="absolute inset-0 w-full h-full bg-grid-pattern opacity-5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/30 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/30 rounded-full blur-[100px]"></div>
        <div className="container relative px-4 md:px-8 mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6 text-center lg:text-left"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm mb-4"
              >
                <Sparkles className="w-4 h-4 mr-2 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Learning Platform</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-extrabold tracking-tight sm:text-4xl xl:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-secondary animate-gradient"
              >
                Unlock the Future of Education – Revolutionize Your School's Operations Today
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="max-w-2xl lg:max-w-none mx-auto lg:mx-0 text-base md:text-lg text-muted-foreground/90 leading-relaxed"
              >
                Transform the way your school manages students, teachers, and administration – with AI-powered tools designed to save time, improve outcomes, and prepare students for tomorrow's world.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col gap-4 min-[400px]:flex-row justify-center lg:justify-start items-center w-full"
              >
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
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hidden lg:flex justify-center items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Image 
                  src="/phone.png"
                  alt="Learnify platform interface showing dashboard and AI features" 
                  width={260} 
                  height={160}
                  priority
                  className="rounded-xl object-cover"
                  data-ai-hint="education technology interface"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }
