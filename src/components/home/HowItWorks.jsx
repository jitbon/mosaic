import React from 'react';
import { Search, Layers, BarChart2, Users } from 'lucide-react';

const HowItWorks = ({ title, description }) => {
  const steps = [
    {
      icon: <Search size={24} className="text-blue-600" />,
      title: "Search for Events",
      description: "Find topics and events you want to understand better."
    },
    {
      icon: <Layers size={24} className="text-blue-600" />,
      title: "See Multiple Perspectives",
      description: "View different viewpoints from across the political spectrum."
    },
    {
      icon: <BarChart2 size={24} className="text-blue-600" />,
      title: "Understand Impacts",
      description: "Explore potential economic, social, and global effects."
    },
    {
      icon: <Users size={24} className="text-blue-600" />,
      title: "Form Your Opinion",
      description: "Make your own informed decisions based on comprehensive information."
    }
  ];
  
  return (
    <section className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-gray-600 mt-2">{description}</p>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <div key={index} className="border rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-50 rounded-full">
                {step.icon}
              </div>
            </div>
            <h3 className="font-bold mb-2">{step.title}</h3>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;