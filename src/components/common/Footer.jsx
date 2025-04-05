import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Facebook, Mail } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-100 border-t">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link to="/" className="text-blue-600 font-bold text-xl">
              Full Picture
            </Link>
            <p className="mt-2 text-sm text-gray-600">
              Get balanced perspectives on today's important events.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Github</span>
                <Github size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Facebook</span>
                <Facebook size={20} />
              </a>
              <a href="mailto:info@fullpicture.app" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Email</span>
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          {/* Navigation columns */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Navigation
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link to="/" className="text-base text-gray-600 hover:text-gray-900">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/search" className="text-base text-gray-600 hover:text-gray-900">
                    Search
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-base text-gray-600 hover:text-gray-900">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Resources
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-base text-gray-600 hover:text-gray-900">
                    Media Bias Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 hover:text-gray-900">
                    Source Directory
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 hover:text-gray-900">
                    Methodology
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                <li>
                  <a href="#" className="text-base text-gray-600 hover:text-gray-900">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 hover:text-gray-900">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-600 hover:text-gray-900">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center sm:text-left">
          <p className="text-sm text-gray-600">
            &copy; {currentYear} Full Picture. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;