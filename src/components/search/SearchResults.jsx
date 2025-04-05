import React from 'react';
import { Link } from 'react-router-dom';
import EventCard from './EventCard';

const SearchResults = ({ results }) => {
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results found. Try adjusting your search terms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};

export default SearchResults;