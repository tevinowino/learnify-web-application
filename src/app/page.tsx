
import HeroSection from '@/components/landing/HeroSection';
import WhyLearnifySection from '@/components/landing/WhyLearnifySection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WhySetApartSection from '@/components/landing/WhySetApartSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactUsSection from '@/components/landing/ContactUsSection';
import Footer from '@/components/landing/Footer';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://learnify-app.example.com';

export const metadata: Metadata = {
  title: `${siteConfig.name} - AI-Powered Educational Platform for Modern Schools`,
  description: "Discover Learnify, the all-in-one AI-enhanced platform for school administration, personalized student learning, teacher assistance, and parent engagement. Streamline operations and boost educational outcomes.",
  keywords: [
    "AI education platform",
    "school management system",
    "personalized learning AI",
    "K-12 edtech",
    "AI tutor for students",
    "teacher AI assistant",
    "Learnify app",
    "online school platform",
    "digital classroom tools",
    "education administration"
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: `${siteConfig.name} - AI-Powered Educational Platform`,
    description: "Transform your school with Learnify: AI-driven tools for administration, teaching, learning, and parent communication.",
    url: `${APP_URL}/`,
    images: [
      {
        url: `${APP_URL}/og-home.png`, // Specific OG image for homepage
        width: 1200,
        height: 630,
        alt: `Homepage of ${siteConfig.name}`,
      },
    ],
  },
  twitter: {
    title: `${siteConfig.name} - Modernizing Education with AI`,
    description: "Learnify offers a comprehensive AI platform for schools. Simplify management, empower teachers, and personalize student learning paths.",
    images: [`${APP_URL}/twitter-home.png`], // Specific Twitter image for homepage
  },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyLearnifySection />
      <FeaturesSection />
      <WhySetApartSection />
      <TestimonialsSection />
      <ContactUsSection />
      <Footer />
    </>
  );
}
