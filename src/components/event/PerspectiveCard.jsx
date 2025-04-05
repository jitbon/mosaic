import React from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const PerspectiveCard = ({ perspective, isExpanded, onToggleExpand }) => {
  // Get the appropriate color based on perspective bias
  const getBiasColor = (bias) => {
    switch (bias) {
      case 'conservative':
        return 'border-red-200 bg-red-50';
      case 'liberal':
        return 'border-blue-200 bg-blue-50';
      case 'centrist':
        return 'border-purple-200 bg-purple-50';
      case 'international':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };
  
  // Get the bias label
  const getBiasLabel = (bias) => {
    switch (bias) {
      case 'conservative':
        return 'Conservative Perspective';
      case 'liberal':
        return 'Liberal Perspective';
      case 'centrist':
        return 'Centrist Analysis';
      case 'international':
        return 'International Viewpoint';
      default:
        return 'Perspective';
    }
  };
  
  const biasColor = getBiasColor(perspective.bias);
  const biasLabel = getBiasLabel(perspective.bias);
  
  return (
    <div className={`border rounded-lg shadow-sm ${biasColor}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="inline-block px-2 py-1 text-xs rounded-full bg-white border mb-2">
              {biasLabel}
            </span>
            <h3 className="text-xl font-bold">{perspective.title}</h3>
          </div>
          <button
            onClick={onToggleExpand}
            className="p-1 rounded-full hover:bg-gray-200"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        
        <div className={`${isExpanded ? '' : 'line-clamp-3'}`}>
          <p className="text-gray-700">
            {perspective.summary}
          </p>
        </div>
        
        {!isExpanded && (
          <button
            onClick={onToggleExpand}
            className="text-blue-600 text-sm mt-2 hover:underline"
          >
            Read more
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t p-4">
          <h4 className="font-medium mb-2">Key Points</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            {perspective.keyPoints.map((point, index) => (
              <li key={index} className="text-gray-700">{point}</li>
            ))}
          </ul>
          
          <h4 className="font-medium mb-2">Supporting Evidence</h4>
          <p className="text-gray-700 mb-4">{perspective.evidence}</p>
          
          <h4 className="font-medium mb-2">Sources</h4>
          <div className="space-y-2">
            {perspective.sources.map((source, index) => (
              <a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:underline"
              >
                {source.name} <ExternalLink size={14} className="ml-1" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerspectiveCard;