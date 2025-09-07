import React from 'react';
import Navigation from '@/components/Navigation';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';

const PlanPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">
        <Pricing />
      </div>
      <Footer />
    </div>
  );
};

export default PlanPage;