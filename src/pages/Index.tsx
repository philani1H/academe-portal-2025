import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Subjects from "@/components/Subjects";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <Features />
      <Subjects />
      <Testimonials />
      <Pricing />
    </div>
  );
};

export default Index;