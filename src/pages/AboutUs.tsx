import React from 'react';
import Navigation from '@/components/Navigation';
import AboutUs from '@/components/AboutUs';
import Footer from '@/components/Footer';

const AboutUsPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <AboutUs />
      <Footer />
    </div>
  );
};

export default AboutUsPage;