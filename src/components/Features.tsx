const Features = () => {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-blue-900 mb-4">
              <i className="fas fa-chalkboard-teacher text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Tutors</h3>
            <p className="text-gray-600">Learn from experienced and qualified tutors in your field.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-blue-900 mb-4">
              <i className="fas fa-clock text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Flexible Schedule</h3>
            <p className="text-gray-600">Book sessions at times that work best for you.</p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-blue-900 mb-4">
              <i className="fas fa-laptop text-3xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Online Learning</h3>
            <p className="text-gray-600">Learn from anywhere with our virtual classroom.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Features;