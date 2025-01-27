import { Button } from "./ui/button";

const Pricing = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Tutoring Packages</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Basic</h3>
            <div className="text-4xl font-bold mb-4">$40<span className="text-lg text-gray-500">/hour</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                One-on-one tutoring
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Flexible scheduling
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Online sessions
              </li>
            </ul>
            <Button className="w-full">Get Started</Button>
          </div>

          <div className="bg-blue-900 text-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Premium</h3>
            <div className="text-4xl font-bold mb-4">$60<span className="text-lg opacity-75">/hour</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <i className="fas fa-check text-green-300 mr-2"></i>
                All Basic features
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-300 mr-2"></i>
                Progress tracking
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-300 mr-2"></i>
                Study materials included
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-300 mr-2"></i>
                24/7 support
              </li>
            </ul>
            <Button variant="outline" className="w-full border-white text-white hover:bg-blue-800">
              Get Started
            </Button>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Group</h3>
            <div className="text-4xl font-bold mb-4">$25<span className="text-lg text-gray-500">/hour</span></div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Small group sessions
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Shared learning
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-500 mr-2"></i>
                Online sessions
              </li>
            </ul>
            <Button className="w-full">Get Started</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;