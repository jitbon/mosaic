import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Filter, ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PerspectiveCard from '../components/event/PerspectiveCard';
import Loading from '../components/common/Loading';
import { useEvent } from '../hooks/useEvent';
import { usePerspectives } from '../hooks/usePerspectives';

const Perspectives = () => {
  const { eventId } = useParams();
  const [filterType, setFilterType] = useState('all');
  const [expandedPerspective, setExpandedPerspective] = useState(null);
  
  // Custom hooks to fetch event and perspective data
  const { event, isLoading: eventLoading } = useEvent(eventId);
  const { 
    perspectives, 
    isLoading: perspectivesLoading, 
    error 
  } = usePerspectives(eventId);
  
  // Get perspectives based on filter
  const filteredPerspectives = perspectives.filter(perspective => {
    if (filterType === 'all') return true;
    return perspective.bias === filterType;
  });
  
  const handleExpand = (id) => {
    setExpandedPerspective(id === expandedPerspective ? null : id);
  };
  
  const isLoading = eventLoading || perspectivesLoading;
  
  if (isLoading) {
    return <Loading message="Loading perspectives..." />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Error Loading Perspectives</h2>
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
            <h1 className="text-3xl font-bold mb-2">Different Perspectives</h1>
            <p className="text-gray-600">
              See how this event is being covered across the political spectrum and internationally.
            </p>
          </div>
          
          {/* Filters */}
          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Filter size={18} className="text-gray-500 mr-2" />
              <span className="text-gray-700 font-medium mr-4">Filter by perspective:</span>
              <div className="flex space-x-2 overflow-x-auto">
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterType === 'all' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterType === 'conservative' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('conservative')}
                >
                  Conservative
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterType === 'liberal' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('liberal')}
                >
                  Liberal
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterType === 'centrist' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('centrist')}
                >
                  Centrist
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterType === 'international' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setFilterType('international')}
                >
                  International
                </button>
              </div>
            </div>
          </div>
          
          {/* Perspectives List */}
          <div className="space-y-6">
            {filteredPerspectives.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
                <h3 className="text-xl font-medium mb-2">No perspectives match the selected filter</h3>
                <p className="text-gray-600">
                  Try selecting a different filter or check back later as more analysis becomes available.
                </p>
              </div>
            ) : (
              filteredPerspectives.map(perspective => (
                <PerspectiveCard
                  key={perspective.id}
                  perspective={perspective}
                  isExpanded={perspective.id === expandedPerspective}
                  onToggleExpand={() => handleExpand(perspective.id)}
                />
              ))
            )}
          </div>
          
          {/* Comparison Tool */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Compare Perspectives</h2>
            <p className="text-gray-600 mb-4">
              Select two or more perspectives above to see a side-by-side comparison of how they differ on key aspects of this event.
            </p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              disabled={true}
            >
              Compare Selected
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Select at least two perspectives to enable comparison
            </p>
          </div>
          
          {/* Feedback section */}
          <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Was this analysis helpful?</h2>
            <p className="text-gray-600 mb-4">
              Your feedback helps us improve our perspective coverage.
            </p>
            <div className="flex space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <ThumbsUp size={18} />
                <span>Yes, this was helpful</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <ThumbsDown size={18} />
                <span>No, needs improvement</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 ml-auto">
                <Share2 size={18} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Perspectives;