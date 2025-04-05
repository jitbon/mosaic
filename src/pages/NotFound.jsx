import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow flex items-center justify-center">
        <div className="max-w-md w-full px-4 py-8 text-center">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/" className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Return to Home
            </Link>
            <Link to="/search" className="inline-flex items-center justify-center bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
              <Search size={18} className="mr-2" />
              Search for Events
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;