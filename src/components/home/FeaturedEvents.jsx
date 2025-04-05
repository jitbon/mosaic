import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import eventService from '../../services/eventService';

const FeaturedEvents = ({ title, description }) => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        setIsLoading(true);
        const featuredEvents = await eventService.getFeaturedEvents(3);
        setEvents(featuredEvents);
      } catch (err) {
        setError('Failed to load featured events');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFeaturedEvents();
  }, []);
  
  // Format date function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <section className="py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {description && <p className="text-gray-600">{description}</p>}
        </div>
        <Link 
          to="/search" 
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
        >
          View all <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-lg shadow-sm p-4 h-64 animate-pulse">
              <div className="bg-gray-200 h-24 rounded-md mb-4"></div>
              <div className="bg-gray-200 h-4 rounded-md w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-4 rounded-md w-1/2 mb-4"></div>
              <div className="bg-gray-200 h-4 rounded-md w-full"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map(event => (
            <Link
              key={event.id}
              to={`/event/${event.id}`}
              className="border rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gray-200 relative">
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
              <div className="p-4">
                <div className="text-sm text-gray-500 mb-2">{formatDate(event.date)}</div>
                <h3 className="font-bold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-600 line-clamp-2">{event.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedEvents;