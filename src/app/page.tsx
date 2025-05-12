import HeroSection from '@/components/landing/HeroSection';
import WhyLearnifySection from '@/components/landing/HowItWorksSection'; // Renamed from HowItWorksSection
import FeaturesSection from '@/components/landing/AboutSection'; // Renamed from AboutSection
import WhySetApartSection from '@/components/landing/WhySetApartSection'; // New section
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactUsSection from '@/components/landing/ContactUsSection'; // Will include Get Started Today
import Footer from '@/components/landing/Footer';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <WhyLearnifySection />
      <FeaturesSection />
      <WhySetApartSection />
      {/* <TestimonialsSection /> */}
      <ContactUsSection /> {/* This section now includes the "Get Started Today" content */}
      <Footer />
    </>
  );
}
