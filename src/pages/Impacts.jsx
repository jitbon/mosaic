import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  Globe, 
  AlertTriangle, 
  Clock,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ImpactCard from '../components/event/ImpactCard';
import Loading from '../components/common/Loading';
import { useEvent } from '../hooks/useEvent';

const Impacts = () => {
  const { eventId } = useParams();
  const [activeCategory, setActiveCategory] = useState('all');
  const [timeframe, setTimeframe] = useState('short');
  
  // Custom hook to fetch event data
  const { event, isLoading, error } = useEvent(eventId);
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };
  
  // Handle timeframe selection
  const handleTimeframeChange = (time) => {
    setTimeframe(time);
  };
  
  // Filter impacts based on selected category and timeframe
  const getFilteredImpacts = () => {
    if (!event?.impacts) return [];
    
    return event.impacts.filter(impact => {
      const categoryMatch = activeCategory === 'all' || impact.category === activeCategory;
      const timeframeMatch = impact.timeframe === timeframe;
      return categoryMatch && timeframeMatch;
    });
  };
  
  const filteredImpacts = event ? getFilteredImpacts() : [];
  
  if (isLoading) {
    return <Loading message="Loading impact analysis..." />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Error Loading Impact Analysis</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <Link 
              to={`/event/${eventId}`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Return to Event
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  // Get impact category icons
  const getCategoryIcon = (category, size = 20) => {
    switch (category) {
      case 'economic':
        return <TrendingUp size={size} />;
      case 'social':
        return <Users size={size} />;
      case 'global':
        return <Globe size={size} />;
      case 'risks':
        return <AlertTriangle size={size} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        {/* Back navigation */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link 
                to={`/event/${eventId}`}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={18} className="mr-2" />
                <span>Back to {event?.title || 'Event'}</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Impact Analysis</h1>
            <p className="text-gray-600">
              Explore the potential effects of this event across different areas and timeframes.
            </p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-medium mb-3">Filter by Category</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm ${
                    activeCategory === 'all' 
                      ? 'bg-gray-100 border-2 border-gray-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCategoryChange('all')}
                >
                  <span className="mb-1">All</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm ${
                    activeCategory === 'economic' 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCategoryChange('economic')}
                >
                  <TrendingUp size={18} className="mb-1 text-blue-500" />
                  <span>Economic</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm ${
                    activeCategory === 'social' 
                      ? 'bg-purple-50 border-2 border-purple-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCategoryChange('social')}
                >
                  <Users size={18} className="mb-1 text-purple-500" />
                  <span>Social</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm ${
                    activeCategory === 'global' 
                      ? 'bg-green-50 border-2 border-green-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCategoryChange('global')}
                >
                  <Globe size={18} className="mb-1 text-green-500" />
                  <span>Global</span>
                </button>
                <button
                  className={`flex flex-col items-center justify-center p-3 rounded-lg text-sm ${
                    activeCategory === 'risks' 
                      ? 'bg-red-50 border-2 border-red-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleCategoryChange('risks')}
                >
                  <AlertTriangle size={18} className="mb-1 text-red-500" />
                  <span>Risks</span>
                </button>
              </div>
            </div>
            
            {/* Timeframe filter */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="font-medium mb-3">Filter by Timeframe</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  className={`flex items-center justify-center p-3 rounded-lg text-sm ${
                    timeframe === 'short' 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTimeframeChange('short')}
                >
                  <Clock size={18} className="mr-2" />
                  <span>Short-term</span>
                </button>
                <button
                  className={`flex items-center justify-center p-3 rounded-lg text-sm ${
                    timeframe === 'medium' 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTimeframeChange('medium')}
                >
                  <Clock size={18} className="mr-2" />
                  <span>Medium-term</span>
                </button>
                <button
                  className={`flex items-center justify-center p-3 rounded-lg text-sm ${
                    timeframe === 'long' 
                      ? 'bg-blue-50 border-2 border-blue-300' 
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleTimeframeChange('long')}
                >
                  <Clock size={18} className="mr-2" />
                  <span>Long-term</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Impact Analysis Content */}
          <div className="space-y-6">
            {filteredImpacts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <h3 className="text-xl font-medium mb-2">No impacts match the selected filters</h3>
                <p className="text-gray-600">
                  Try selecting a different category or timeframe to see more impacts.
                </p>
              </div>
            ) : (
              filteredImpacts.map(impact => (
                <ImpactCard
                  key={impact.id}
                  impact={impact}
                  categoryIcon={getCategoryIcon(impact.category)}
                />
              ))
            )}
          </div>
          
          {/* Executive Summary Report */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FileText size={24} className="text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-bold">Executive Summary Report</h3>
                  <p className="text-gray-600">
                    Download a comprehensive analysis of all potential impacts
                  </p>
                </div>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Impacts;