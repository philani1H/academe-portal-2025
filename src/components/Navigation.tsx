import { useState } from "react";
import { Button } from "./ui/button";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <span className="text-2xl font-bold">Excellence Academia</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#" className="hover:text-blue-200">Home</a>
            <a href="#" className="hover:text-blue-200">Subjects</a>
            <a href="#" className="hover:text-blue-200">Tutors</a>
            <a href="#" className="hover:text-blue-200">Testimonials</a>
            <a href="#" className="hover:text-blue-200">Contact</a>
          </div>
          <div className="hidden md:flex space-x-4">
            <Button variant="outline" className="text-white border-white hover:bg-blue-800">
              Become a Tutor
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;