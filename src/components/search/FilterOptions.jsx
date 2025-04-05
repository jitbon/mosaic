import React from 'react';
import { Filter, Calendar, Tag, TrendingUp } from 'lucide-react';

const FilterOptions = ({ filters, onFilterChange }) => {
  // Handler for changing filter options
  const handleChange = (filterName, value) => {
    onFilterChange({ [filterName]: value });
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border sticky top-4">
      <div className="mb-4 flex items-center">
        <Filter size={18} className="text-gray-500 mr-2" />
        <h2 className="text-lg font-medium">Filters</h2>
      </div>
      
      {/* Timeframe filter */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Calendar size={16} className="text-gray-500 mr-2" />
          <h3 className="text-sm font-medium">Timeframe</h3>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="timeframe"
              value="all"
              checked={filters.timeframe === 'all'}
              onChange={() => handleChange('timeframe', 'all')}
              className="mr-2"
            />
            <span className="text-sm">All Time</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="timeframe"
              value="week"
              checked={filters.timeframe === 'week'}
              onChange={() => handleChange('timeframe', 'week')}
              className="mr-2"
            />
            <span className="text-sm">Past Week</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="timeframe"
              value="month"
              checked={filters.timeframe === 'month'}
              onChange={() => handleChange('timeframe', 'month')}
              className="mr-2"
            />
            <span className="text-sm">Past Month</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="timeframe"
              value="year"
              checked={filters.timeframe === 'year'}
              onChange={() => handleChange('timeframe', 'year')}
              className="mr-2"
            />
            <span className="text-sm">Past Year</span>
          </label>
        </div>
      </div>
      
      {/* Event type filter */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Tag size={16} className="text-gray-500 mr-2" />
          <h3 className="text-sm font-medium">Event Type</h3>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="eventType"
              value="all"
              checked={filters.eventType === 'all'}
              onChange={() => handleChange('eventType', 'all')}
              className="mr-2"
            />
            <span className="text-sm">All Types</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="eventType"
              value="political"
              checked={filters.eventType === 'political'}
              onChange={() => handleChange('eventType', 'political')}
              className="mr-2"
            />
            <span className="text-sm">Political</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="eventType"
              value="economic"
              checked={filters.eventType === 'economic'}
              onChange={() => handleChange('eventType', 'economic')}
              className="mr-2"
            />
            <span className="text-sm">Economic</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="eventType"
              value="social"
              checked={filters.eventType === 'social'}
              onChange={() => handleChange('eventType', 'social')}
              className="mr-2"
            />
            <span className="text-sm">Social</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="eventType"
              value="international"
              checked={filters.eventType === 'international'}
              onChange={() => handleChange('eventType', 'international')}
              className="mr-2"
            />
            <span className="text-sm">International</span>
          </label>
        </div>
      </div>
      
      {/* Sort options */}
      <div>
        <div className="flex items-center mb-2">
          <TrendingUp size={16} className="text-gray-500 mr-2" />
          <h3 className="text-sm font-medium">Sort By</h3>
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="sortBy"
              value="relevance"
              checked={filters.sortBy === 'relevance'}
              onChange={() => handleChange('sortBy', 'relevance')}
              className="mr-2"
            />
            <span className="text-sm">Relevance</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="sortBy"
              value="date"
              checked={filters.sortBy === 'date'}
              onChange={() => handleChange('sortBy', 'date')}
              className="mr-2"
            />
            <span className="text-sm">Most Recent</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="sortBy"
              value="perspectives"
              checked={filters.sortBy === 'perspectives'}
              onChange={() => handleChange('sortBy', 'perspectives')}
              className="mr-2"
            />
            <span className="text-sm">Most Perspectives</span>
          </label>
        </div>
      </div>
      
      {/* Reset button */}
      <button
        onClick={() => onFilterChange({
          timeframe: 'all',
          eventType: 'all',
          sortBy: 'relevance'
        })}
        className="w-full mt-6 p-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default FilterOptions;