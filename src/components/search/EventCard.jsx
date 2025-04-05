import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';

const EventCard = ({ event }) => {
  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image section - left side on desktop, top on mobile */}
        <div className="md:w-1/4 h-48 md:h-auto bg-gray-200 relative">
          {event.image ? (
            <img 
              src={event.image} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-blue-100"></div>
          )}
        </div>
        
        {/* Content section - right side on desktop, bottom on mobile */}
        <div className="p-4 md:p-6 md:w-3/4 flex flex-col justify-between">
          <div>
            <div className="text-sm text-gray-500 mb-2 flex items-center">
              <CalendarDays size={14} className="mr-1" />
              <span>{formatDate(event.date)}</span>
            </div>
            
            <h3 className="text-xl font-bold mb-2">{event.title}</h3>
            
            <p className="text-gray-600 mb-4 line-clamp-3">
              {event.summary}
            </p>
          </div>
          
          <div className="flex justify-end">
            <Link
              to={`/event/${event.id}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              View Full Analysis
              <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;