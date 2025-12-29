import React from 'react';
import { Link } from 'react-router-dom';
import landingImage from '../assets/landing-hero.png';

const LandingPage = () => {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 flex items-center justify-center px-4 max-h-[45vh] md:p-8 md:pb-4 md:max-h-none">
        <img
          src={landingImage}
          alt="Grocery shopping illustration"
          className="max-w-full h-auto w-full max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-md object-contain"
        />
      </div>
      <div className="bg-white p-4 pb-8 md:p-8 rounded-t-3xl shadow-lg flex-shrink-0">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">
          Create a Shopping List Right from Your Phone
        </h1>
        <p className="text-gray-600 text-center mb-4 md:mb-8 text-sm md:text-base">
          Now You Can Use Your Voice to Create a Shopping List
        </p>
        <Link
          to="/app"
          className="flex items-center justify-center w-20 h-20 sm:w-16 sm:h-16 md:w-16 md:h-16 bg-yellow-400 rounded-full mx-auto shadow-lg hover:shadow-xl transition-shadow active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 sm:h-8 sm:w-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;