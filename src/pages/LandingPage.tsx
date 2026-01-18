import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between py-12 px-6 relative overflow-hidden">
      
      {/* Top Section */}
      <div className="flex flex-col items-center w-full max-w-md mx-auto z-10">
        <h1 className="text-5xl font-bold text-primary mb-2 tracking-tight">SousChefy</h1>
        <p className="text-gray-500 text-sm font-medium tracking-wide uppercase text-[0.8rem]">
          Your all-in-one kitchen assistant
        </p>
      </div>

      {/* Hero Image Section */}
      <div className="flex-1 flex items-center justify-center w-full my-4 relative">
        <div className="relative w-full max-w-sm">
            <img 
              src="/landing.png" 
              alt="SousChefy Landing" 
              className="w-full h-auto object-contain"
            />
        </div>
      </div>

      {/* Bottom Content */}
      <div className="w-full max-w-md mx-auto text-center space-y-6 z-10">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-gray-900 leading-tight">
            Shop smarter, cook better
          </h2>
          <p className="text-gray-500 text-base leading-relaxed px-4">
            Create smart shopping lists, discover delicious recipes, and get step-by-step cooking instructions—all in one place.
          </p>
        </div>

        <button 
          onClick={() => navigate('/register')}
          className="w-full bg-primary hover:bg-primary/90 text-white text-lg font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform active:scale-95"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
