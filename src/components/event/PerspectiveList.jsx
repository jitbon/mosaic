import React, { useState } from 'react';
import PerspectiveCard from './PerspectiveCard';
import { Filter } from 'lucide-react';

const PerspectiveList = ({ perspectives }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filteredPerspectives = perspectives?.filter(perspective => {
    if (activeFilter === 'all') return true;
    return perspective.bias === activeFilter;
  }) || [];
  
  return (
    <div>
      {/* Filters */}
      {perspectives && perspectives.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border flex flex-wrap items-center gap-2">
          <div className="flex items-center mr-2">
            <Filter size={16} className="text-gray-500 mr-1" />
            <span className="text-sm text-gray-700">Filter:</span>
          </div>
          
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeFilter === 'all' 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-white border text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          
          <button
            onClick={() => setActiveFilter('conservative')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeFilter === 'conservative' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-white border text-gray-600 hover:bg-gray-100'
            }`}
          >
            Conservative
          </button>
          
          <button
            onClick={() => setActiveFilter('liberal')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeFilter === 'liberal' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-white border text-gray-600 hover:bg-gray-100'
            }`}
          >
            Liberal
          </button>
          
          <button
            onClick={() => setActiveFilter('centrist')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeFilter === 'centrist' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-white border text-gray-600 hover:bg-gray-100'
            }`}
          >
            Centrist
          </button>
          
          <button
            onClick={() => setActiveFilter('international')}
            className={`px-3 py-1 text-xs rounded-full ${
              activeFilter === 'international' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-white border text-gray-600 hover:bg-gray-100'
            }`}
          >
            International
          </button>
        </div>
      )}
      
      {/* No perspectives message */}
      {(!perspectives || perspectives.length === 0) && (
        <div className="p-6 bg-gray-50 rounded-lg border text-center">
          <p className="text-gray-500">
            No perspectives available for this event yet.
          </p>
        </div>
      )}
      
      {/* Filtered perspectives list */}
      {filteredPerspectives.length === 0 && perspectives?.length > 0 && (
        <div className="p-6 bg-gray-50 rounded-lg border text-center">
          <p className="text-gray-500">
            No perspectives match your selected filter.
          </p>
        </div>
      )}
      
      {filteredPerspectives.length > 0 && (
        <div className="space-y-4">
          {filteredPerspectives.map(perspective => (
            <PerspectiveCard
              key={perspective.id}
              perspective={perspective}
              isExpanded={false}
              onToggleExpand={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PerspectiveList;