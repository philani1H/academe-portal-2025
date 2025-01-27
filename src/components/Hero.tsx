import { Button } from "./ui/button";

const Hero = () => {
  return (
    <div className="relative bg-blue-900 h-96">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-blue-700 opacity-90"></div>
      <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">
        <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
          Expert Tutoring for Every Student
        </h1>
        <p className="mt-6 text-xl text-blue-100 max-w-3xl">
          Connect with experienced tutors and achieve academic excellence
        </p>
        <div className="mt-10 space-x-4">
          <Button variant="default" className="bg-white text-blue-900 hover:bg-blue-50">
            Find a Tutor
          </Button>
          <Button variant="outline" className="text-white border-white hover:bg-blue-800">
            Become a Tutor
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Hero;