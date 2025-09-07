import React from 'react';
import Navigation from '@/components/Navigation';
import Subjects from '@/components/Subjects';
import Footer from '@/components/Footer';

const SubjectsPage = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="pt-20">
        <Subjects />
      </div>
      <Footer />
    </div>
  );
};

export default SubjectsPage;