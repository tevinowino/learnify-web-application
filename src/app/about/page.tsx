"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, Target, Heart, Code, UserCircle } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { motion } from 'framer-motion';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

// export const metadata: Metadata = {
//   title: `About ${siteConfig.name} | AI-Driven Personalized Learning Platform`,
//   description: `Explore how ${siteConfig.name} is transforming classrooms with AI-powered, personalized learning. Meet the team, discover our mission, and see how we're shaping the future of EdTech.`,
//   keywords: [
//     "Learnify",
//     "AI education platform",
//     "adaptive learning",
//     "personalized classroom",
//     "AI-driven education",
//     "EdTech Kenya",
//     "future of learning",
//     "AI tools for schools",
//     "about Learnify"
//   ],
//   alternates: {
//     canonical: `${APP_URL}/about`,
//   },
//   openGraph: {
//     title: `About ${siteConfig.name} | Learnify's Mission, Vision & Team`,
//     description: "Learnify is on a mission to reshape education through personalized AI. Discover our values, vision, and the team building smarter classrooms.",
//     url: `${APP_URL}/about`,
//     images: [
//       {
//         url: `${APP_URL}/og-about.png`,
//         width: 1200,
//         height: 630,
//         alt: `About Learnify - AI Learning Platform`,
//       },
//     ],
//   },
//   twitter: {
//     title: `Discover Learnify | Our Story & AI Vision for Education`,
//     description: `Learnify combines artificial intelligence with pedagogy to empower students and educators. Dive into our mission and values.`,
//     images: [`${APP_URL}/twitter-about.png`],
//   },
// };

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function AboutPage() {
  return (
    <div className="container mx-auto pt-32 pb-20 px-4 md:px-6 min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="max-w-5xl mx-auto space-y-16"
      >
        <motion.div variants={fadeIn} className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            About Learnify
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Shaping the Future of Education with AI-Powered Personalized Learning
          </p>
        </motion.div>

        <motion.section variants={fadeIn} className="text-center max-w-3xl mx-auto">
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            At Learnify, we’re creating adaptive learning environments powered by artificial intelligence. Our goal is to empower every learner through personalized education and give educators modern tools to engage students meaningfully.
          </p>
        </motion.section>

        <motion.div variants={staggerChildren} className="grid md:grid-cols-2 gap-8">
          <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm border">
            <Users className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To make intelligent, personalized education available to everyone — inspiring lifelong curiosity, academic growth, and a deep love for learning.
            </p>
          </motion.div>

          <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-gradient-to-br from-accent/5 to-primary/5 backdrop-blur-sm border">
            <Zap className="h-10 w-10 text-accent mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              A world where learning adapts to individuals, empowering each student to thrive and each educator to spark transformation.
            </p>
          </motion.div>
        </motion.div>

        <motion.section variants={fadeIn} className="rounded-2xl bg-gradient-to-br from-background to-muted/50 p-8 border">
          <h2 className="text-2xl font-semibold mb-8 text-center">Meet the Visionary Behind Learnify</h2>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative w-48 h-48 md:w-64 md:h-64"
            >
              <Image
                src="/profile-photo.jpg"
                alt="Tevin Owino - Fullstack Software Engineer and Founder of Learnify"
                fill
                className="rounded-2xl object-cover shadow-xl"
              />
            </motion.div>
            <div className="flex-1 space-y-4">
              <h3 className="text-2xl font-semibold">Tevin Owino</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tevin is the founding engineer behind Learnify. With deep expertise in fullstack development and a passion for educational transformation, he's building a platform where AI and learning go hand in hand. His mission: turn classrooms into smart, adaptive ecosystems for growth.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section variants={fadeIn}>
          <h2 className="text-2xl font-semibold mb-8 text-center">Our Core Values</h2>
          <motion.div variants={staggerChildren} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "Innovation", icon: <Code />, description: "We build boldly with new technologies that challenge traditional education norms." },
              { title: "Personalization", icon: <UserCircle />, description: "Every learner is unique. Our tools adapt to individual needs and pace." },
              { title: "Collaboration", icon: <Users />, description: "We unite students, teachers, and institutions to work better together." },
              { title: "Accessibility", icon: <Target />, description: "Our platform is built to be intuitive, inclusive, and globally accessible." },
              { title: "Creativity", icon: <Zap />, description: "We encourage experimentation and outside-the-box thinking in everything we do." },
              { title: "Passion", icon: <Heart className="text-destructive" />, description: "We’re driven by a deep love for learning and a belief in its power to change lives." },
            ].map((value, index) => (
              <motion.div
                key={index}
                variants={fadeIn}
                whileHover={{ scale: 1.03 }}
                className="p-6 rounded-xl bg-muted/50 border hover:border-primary/50 transition-colors"
              >
                <div className="mb-4">{value.icon}</div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        <motion.section variants={fadeIn} className="text-center">
          <p className="text-xl text-muted-foreground">
            Ready to be part of the education revolution? Join us and help shape the future of AI-powered learning.
          </p>
        </motion.section>
      </motion.div>
    </div>
  );
}
