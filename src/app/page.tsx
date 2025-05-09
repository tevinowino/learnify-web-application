import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <Footer />
    </>
  );
}
