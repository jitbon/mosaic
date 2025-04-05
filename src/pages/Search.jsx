import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import SearchBar from '../components/common/SearchBar';
import SearchResults from '../components/search/SearchResults';
import FilterOptions from '../components/search/FilterOptions';
import Loading from '../components/common/Loading';
import { useSearch } from '../hooks/useSearch';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState({
    timeframe: 'all',
    eventType: 'all',
    sortBy: 'relevance'
  });
  
  // Custom hook to handle search functionality
  const { results, isLoading, error, performSearch } = useSearch();

  // Effect to perform search when query or filters change
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, filters);
      // Update URL to reflect search state
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all') params.set(key, value);
      });
      navigate({ search: params.toString() }, { replace: true });
    }
  }, [searchQuery, filters, performSearch, navigate]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <SearchBar 
              initialValue={searchQuery}
              onSearch={handleSearch}
              placeholder="Search for events or topics..."
              buttonText="Search"
            />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="lg:col-span-1">
              <FilterOptions 
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Search results */}
            <div className="lg:col-span-3">
              {isLoading ? (
                <Loading message="Searching for events..." />
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">No results found</h3>
                  <p className="text-gray-600">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                      {results.length} {results.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                    </h2>
                    <div className="text-sm text-gray-500">
                      Sorted by: <span className="font-medium">
                        {filters.sortBy === 'date' ? 'Most Recent' : 'Relevance'}
                      </span>
                    </div>
                  </div>
                  <SearchResults results={results} />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Search;