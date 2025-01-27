const Subjects = () => {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Popular Subjects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1509228468518-180dd4864904" alt="Mathematics" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="font-semibold text-xl mb-2">Mathematics</h3>
              <p className="text-gray-600 mb-4">From algebra to calculus, master any math topic.</p>
              <a href="#" className="text-blue-900 font-semibold hover:text-blue-700">Find a tutor →</a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1532094349884-543bc11b234d" alt="Sciences" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="font-semibold text-xl mb-2">Sciences</h3>
              <p className="text-gray-600 mb-4">Physics, chemistry, and biology tutoring.</p>
              <a href="#" className="text-blue-900 font-semibold hover:text-blue-700">Find a tutor →</a>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <img src="https://images.unsplash.com/photo-1457369804613-52c61a468e7d" alt="Languages" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="font-semibold text-xl mb-2">Languages</h3>
              <p className="text-gray-600 mb-4">English, Spanish, French, and more.</p>
              <a href="#" className="text-blue-900 font-semibold hover:text-blue-700">Find a tutor →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subjects;