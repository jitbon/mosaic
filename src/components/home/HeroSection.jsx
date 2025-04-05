// src/components/home/HeroSection.jsx
import React from 'react';

const HeroSection = ({ title, subtitle, description }) => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">{title}</h1>
        <p className="text-xl font-medium mb-6">{subtitle}</p>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">
          {description}
        </p>
      </div>
    </div>
  );
};

export default HeroSection;

