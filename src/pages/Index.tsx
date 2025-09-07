import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HeroEnhanced from "@/components/HeroEnhanced";
import Features from "@/components/Features";
import FeaturesEnhanced from "@/components/FeaturesEnhanced";
import Subjects from "@/components/Subjects";
import Testimonials from "@/components/Testimonials";
import TestimonialsEnhanced from "@/components/TestimonialsEnhanced";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroEnhanced />
      <FeaturesEnhanced />
      <Subjects />
      <TestimonialsEnhanced />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;