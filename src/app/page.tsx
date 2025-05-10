import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import AboutSection from '@/components/landing/AboutSection';
// import PricingSection from '@/components/landing/PricingSection'; // Removed
import ContactUsSection from '@/components/landing/ContactUsSection';
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksSection />
      <AboutSection />
      {/* <PricingSection /> */} {/* Removed */}
      <TestimonialsSection />
      <ContactUsSection />
      <Footer />
    </>
  );
}
