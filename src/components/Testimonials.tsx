const Testimonials = () => {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Student Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-yellow-400 mb-4">
              ★★★★★
            </div>
            <p className="text-gray-600 mb-4">"My grades improved significantly after just a few sessions. The tutors are knowledgeable and patient."</p>
            <div className="font-semibold">Sarah M.</div>
            <div className="text-sm text-gray-500">Mathematics Student</div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-yellow-400 mb-4">
              ★★★★★
            </div>
            <p className="text-gray-600 mb-4">"The flexible scheduling made it easy to fit tutoring into my busy schedule. Great experience!"</p>
            <div className="font-semibold">James R.</div>
            <div className="text-sm text-gray-500">Physics Student</div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-yellow-400 mb-4">
              ★★★★★
            </div>
            <p className="text-gray-600 mb-4">"Excellence Academia helped me prepare for my exams. The tutors are professional and supportive."</p>
            <div className="font-semibold">Emily W.</div>
            <div className="text-sm text-gray-500">Language Student</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonials;