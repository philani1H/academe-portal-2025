import React, { useState, useEffect } from 'react';

const BecomeTutor = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    experience: "",
    message: "",
  });

  useEffect(() => {
    // Load Forms.app script
    const script = document.createElement('script');
    script.src = 'https://forms.app/static/embed.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialize Forms.app
      new (window as any).formsapp('6798e6f5f155c70002152541', 'popup', {
        'overlay': 'rgba(30,58,138,0.5)', // Matches bg-blue-900
        'button': {
          'color': '#1e3a8a', // Dark blue theme
          'text': 'Submit Application'
        },
        'width': '800px',
        'height': '600px',
        'openingAnimation': {
          'entrance': 'animate_fadeIn',
          'exit': 'animate_fadeOut'
        }
      }, 'https://jhztw5li.forms.app');
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-blue-50 shadow-lg rounded-lg">
      {/* Logo Image */}
      <div className="mb-6 flex justify-center">
        <img 
          src="https://i.imgur.com/mrQ0rDu.png" 
          alt="Logo" 
          className="h-16"
        />
      </div>

      <h1 className="text-2xl font-bold text-blue-900 text-center">Become a Tutor</h1>
      <p className="text-gray-700 text-center mt-2">
        Fill out the form below to apply to become a tutor. Our team will review your application and get back to you.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-gray-900 font-medium">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium">Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium">Subject(s) to Tutor</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium">Teaching Experience</label>
          <input
            type="text"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>
        <div>
          <label className="block text-gray-900 font-medium">Additional Information</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-lg bg-white"
          />
        </div>

        <button
          formsappId="6798e6f5f155c70002152541"
          className="w-full bg-blue-900 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit Application
        </button>
      </div>
    </div>
  );
};

export default BecomeTutor;
