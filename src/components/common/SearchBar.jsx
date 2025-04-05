import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchBar = ({ 
  initialValue = '', 
  onSearch, 
  placeholder = 'Search...', 
  buttonText = 'Search',
  fullWidth = false
}) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className={`flex items-center gap-2 ${fullWidth ? 'w-full' : ''}`}
    >
      <div className={`relative flex-grow ${fullWidth ? 'w-full' : ''}`}>
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          className="w-full bg-white border border-gray-300 text-gray-900 text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-3"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-base px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default SearchBar;