import React from 'react';
import { CalendarDays, Clock, Share2 } from 'lucide-react';

const EventHeader = ({ title, date, image }) => {
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get relative time (e.g. "2 days ago")
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diffTime = Math.abs(now - eventDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
      return formatDate(dateString);
    }
  };
  
  return (
    <div className="relative">
      {/* Background image */}
      <div className="h-64 bg-gray-300 relative overflow-hidden">
        {image ? (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-blue-100"></div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
      </div>
      
      {/* Content */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative -mt-24 bg-white rounded-t-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          
          <div className="flex flex-wrap items-center text-sm text-gray-600 mb-4">
            <div className="flex items-center mr-6">
              <CalendarDays size={16} className="mr-1" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center">
              <Clock size={16} className="mr-1" />
              <span>{getRelativeTime(date)}</span>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              className="flex items-center text-gray-500 hover:text-blue-600 text-sm"
            >
              <Share2 size={16} className="mr-1" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventHeader;