import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Subjects from "@/components/Subjects";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import SocialShare from "@/components/SocialShare";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

const Index = () => {
  const [trendKeywords, setTrendKeywords] = useState<string[]>([]);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        const data = await apiFetch<{ keywords: string[] }>('/trends');
        if (data && data.keywords) {
          setTrendKeywords(data.keywords);
        }
      } catch (e) {
        // Silent fail for SEO enhancement
        console.error("Failed to fetch trends", e);
      }
    };
    fetchTrends();
  }, []);

  return (
    <div className="min-h-screen">
      <SEO 
        title="Home - Excellence Academia | Expert Tutoring & University Applications"
        description="Achieve academic excellence with our expert tutoring, matric rewrite support, and university application assistance. Join Excellence Academia today."
        keywords={[
          ...trendKeywords,
          "tutoring south africa", 
          "matric rewrite", 
          "university application", 
          "online tutors", 
          "grade 12 tutoring", 
          "maths tutor", 
          "science tutor",
          "unisa application",
          "uj application",
          "wits application"
        ]}
        schema={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Excellence Academia",
          "url": "https://www.excellenceakademie.co.za",
          "logo": "https://www.excellenceakademie.co.za/logo.png",
          "sameAs": [
            "https://facebook.com/excellenceacademia",
            "https://twitter.com/excellenceacademia"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+27-12-345-6789",
            "contactType": "customer service",
            "areaServed": "ZA"
          }
        }}
      />
      <Navigation />
      <Hero />

      <div className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
        <SocialShare className="max-w-2xl mx-auto shadow-2xl bg-white/90 backdrop-blur-lg border-blue-100" />
      </div>

      <Features />
      <Subjects />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;