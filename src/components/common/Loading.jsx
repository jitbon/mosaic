import React from 'react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

export default Loading;