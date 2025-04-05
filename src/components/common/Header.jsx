import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User } from 'lucide-react';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActivePath = (path) => {
    return location.pathname === path ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600';
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main nav */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <span className="text-blue-600 font-bold text-xl">Full Picture</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:ml-6 md:flex md:space-x-6">
              <Link to="/" className={`px-2 py-1 text-sm font-medium ${isActivePath('/')}`}>
                Home
              </Link>
              <Link to="/search" className={`px-2 py-1 text-sm font-medium ${isActivePath('/search')}`}>
                Search
              </Link>
              <Link to="/about" className={`px-2 py-1 text-sm font-medium ${isActivePath('/about')}`}>
                About
              </Link>
            </nav>
          </div>
          
          {/* Right navigation */}
          <div className="flex items-center">
            <Link to="/search" className="text-gray-500 hover:text-blue-600 p-2 mr-2">
              <Search size={20} />
            </Link>
            <button className="text-gray-500 hover:text-blue-600 p-2">
              <User size={20} />
            </button>
            
            {/* Mobile menu button */}
            <div className="md:hidden ml-2">
              <button 
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={toggleMobileMenu}
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 hover:text-blue-600"
              onClick={toggleMobileMenu}
            >
              Home
            </Link>
            <Link 
              to="/search" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 hover:text-blue-600"
              onClick={toggleMobileMenu}
            >
              Search
            </Link>
            <Link 
              to="/about" 
              className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-100 hover:text-blue-600"
              onClick={toggleMobileMenu}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
