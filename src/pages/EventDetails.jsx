import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, Info, ExternalLink, Share2 } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import EventHeader from '../components/event/EventHeader';
import EventSummary from '../components/event/EventSummary';
import PerspectiveList from '../components/event/PerspectiveList';
import ImpactAnalysis from '../components/event/ImpactAnalysis';
import FurtherReading from '../components/event/FurtherReading';
import Loading from '../components/common/Loading';
import { useEvent } from '../hooks/useEvent';

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Custom hook to fetch event data
  const { event, isLoading, error } = useEvent(eventId);
  
  // Handle navigation to specific sections
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Handle navigation to detailed pages
  const navigateToSection = (section) => {
    navigate(`/event/${eventId}/${section}`);
  };
  
  if (isLoading) {
    return <Loading message="Loading event details..." />;
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Error Loading Event</h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <Link 
              to="/search" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Return to Search
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
      
      <main className="flex-grow">
        {event && (
          <>
            <EventHeader 
              title={event.title}
              date={event.date}
              image={event.image}
            />
            
            {/* Navigation tabs */}
            <div className="border-b">
              <div className="max-w-6xl mx-auto px-4">
                <nav className="flex space-x-6 overflow-x-auto">
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'summary' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('summary')}
                  >
                    Summary
                  </button>
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'perspectives' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('perspectives')}
                  >
                    Perspectives
                  </button>
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'impacts' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('impacts')}
                  >
                    Impact Analysis
                  </button>
                  <button
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'sources' 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => handleTabChange('sources')}
                  >
                    Further Reading
                  </button>
                </nav>
              </div>
            </div>
            
            {/* Content sections */}
            <div className="max-w-6xl mx-auto px-4 py-8">
              {activeTab === 'summary' && (
                <EventSummary 
                  summary={event.summary}
                  keyFacts={event.keyFacts}
                  timeline={event.timeline}
                  stakeholders={event.stakeholders}
                />
              )}
              
              {activeTab === 'perspectives' && (
                <div>
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Different Perspectives</h2>
                    <button
                      onClick={() => navigateToSection('perspectives')}
                      className="text-blue-600 flex items-center text-sm"
                    >
                      View Full Analysis <ChevronRight size={16} />
                    </button>
                  </div>
                  
                  <PerspectiveList perspectives={event.perspectives} />
                </div>
              )}
              
              {activeTab === 'impacts' && (
                <div>
                  <div className="mb-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Impact Analysis</h2>
                    <button
                      onClick={() => navigateToSection('impacts')}
                      className="text-blue-600 flex items-center text-sm"
                    >
                      View Detailed Impacts <ChevronRight size={16} />
                    </button>
                  </div>
                  
                  <ImpactAnalysis impacts={event.impacts} />
                </div>
              )}
              
              {activeTab === 'sources' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">Further Reading</h2>
                  <FurtherReading sources={event.sources} />
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
              <button className="bg-white p-3 rounded-full shadow-lg border">
                <Share2 size={20} className="text-gray-700" />
              </button>
              <button className="bg-blue-600 p-3 rounded-full shadow-lg">
                <Info size={20} className="text-white" />
              </button>
            </div>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default EventDetails;