import React from 'react';
import { ExternalLink, AlertCircle, Check } from 'lucide-react';

const FurtherReading = ({ sources }) => {
  // Get bias label with appropriate color
  const getBiasLabel = (bias) => {
    switch (bias) {
      case 'conservative':
        return { label: 'Conservative Leaning', color: 'bg-red-100 text-red-800' };
      case 'center-right':
        return { label: 'Center-Right', color: 'bg-orange-100 text-orange-800' };
      case 'center-left':
        return { label: 'Center-Left', color: 'bg-blue-100 text-blue-800' };
      case 'progressive':
        return { label: 'Progressive Leaning', color: 'bg-indigo-100 text-indigo-800' };
      case 'neutral':
        return { label: 'Neutral', color: 'bg-gray-100 text-gray-800' };
      case 'international':
        return { label: 'International Perspective', color: 'bg-green-100 text-green-800' };
      case 'pro-infrastructure':
        return { label: 'Pro-Infrastructure', color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Unknown Bias', color: 'bg-gray-100 text-gray-800' };
    }
  };
  
  // Get trust score label with appropriate icon
  const getTrustScore = (score) => {
    switch (score) {
      case 'high':
        return { label: 'High Credibility', icon: <Check size={16} className="text-green-500" /> };
      case 'medium-high':
        return { label: 'Medium-High Credibility', icon: <Check size={16} className="text-green-500" /> };
      case 'medium':
        return { label: 'Medium Credibility', icon: <AlertCircle size={16} className="text-yellow-500" /> };
      case 'medium-low':
        return { label: 'Medium-Low Credibility', icon: <AlertCircle size={16} className="text-orange-500" /> };
      case 'low':
        return { label: 'Low Credibility', icon: <AlertCircle size={16} className="text-red-500" /> };
      default:
        return { label: 'Unverified', icon: <AlertCircle size={16} className="text-gray-500" /> };
    }
  };
  
  return (
    <div>
      {/* No sources message */}
      {(!sources || sources.length === 0) && (
        <div className="p-6 bg-gray-50 rounded-lg border text-center">
          <p className="text-gray-500">
            No sources available for this event yet.
          </p>
        </div>
      )}
      
      {/* Sources list */}
      {sources && sources.length > 0 && (
        <div className="space-y-4">
          {sources.map((source, index) => {
            const biasInfo = getBiasLabel(source.bias);
            const trustInfo = getTrustScore(source.trustScore);
            
            return (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                  <h3 className="font-medium text-lg">{source.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${biasInfo.color}`}>
                      {biasInfo.label}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full flex items-center">
                      {trustInfo.icon}
                      <span className="ml-1">{trustInfo.label}</span>
                    </span>
                  </div>
                </div>
                
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline mt-2"
                >
                  <span>View Source</span>
                  <ExternalLink size={14} className="ml-1" />
                </a>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-50 border rounded-lg">
        <h3 className="font-medium mb-2">Understanding Source Credibility</h3>
        <p className="text-sm text-gray-600 mb-4">
          We evaluate sources based on factual accuracy, transparency, and journalistic standards.
          All sources have some degree of bias, which we attempt to identify to provide context.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Bias Indicators</h4>
            <ul className="text-xs space-y-1">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-red-100 rounded-full mr-2"></span>
                <span>Conservative Leaning</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-blue-100 rounded-full mr-2"></span>
                <span>Progressive Leaning</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-gray-100 rounded-full mr-2"></span>
                <span>Neutral/Centrist</span>
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-100 rounded-full mr-2"></span>
                <span>International Perspective</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-2">Credibility Score</h4>
            <ul className="text-xs space-y-1">
              <li className="flex items-center">
                <Check size={14} className="text-green-500 mr-2" />
                <span>High/Medium-High: Reliable, fact-checked</span>
              </li>
              <li className="flex items-center">
                <AlertCircle size={14} className="text-yellow-500 mr-2" />
                <span>Medium: Generally reliable with caveats</span>
              </li>
              <li className="flex items-center">
                <AlertCircle size={14} className="text-red-500 mr-2" />
                <span>Low: Exercise caution, may contain errors</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FurtherReading;