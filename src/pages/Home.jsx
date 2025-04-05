import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedEvents from '../components/home/FeaturedEvents';
import HowItWorks from '../components/home/HowItWorks';
import SearchBar from '../components/common/SearchBar';

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <HeroSection 
          title="Get the Full Picture"
          subtitle="See every perspective on today's important events"
          description="Understand complex events through multiple viewpoints, impacts, and comprehensive analysis - beyond the limitations of traditional media."
        />
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">Search for any event or topic</h2>
            <SearchBar 
              placeholder="Try 'Infrastructure Bill', 'Climate Agreement', etc."
              buttonText="Get Perspectives"
              fullWidth={true}
            />
          </div>
          
          <FeaturedEvents 
            title="Today's Important Events" 
            description="See what's happening now with balanced coverage"
          />
          
          <HowItWorks 
            title="How It Works" 
            description="Our approach to delivering balanced news perspectives"
          />
          
          <div className="text-center mt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to see the bigger picture?</h2>
            <p className="mb-6 text-gray-600">
              Start exploring events with multiple perspectives and form your own informed opinion.
            </p>
            <Link 
              to="/search" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Explore Events
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Home;