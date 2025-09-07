import React from 'react';
import Navigation from '@/components/Navigation';
import BecomeTutor from '@/components/BecomeTutor';
import Footer from '@/components/Footer';

const BecomeTutorPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">
        <BecomeTutor />
      </div>
      <Footer />
    </div>
  );
};

export default BecomeTutorPage;