import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BarChart2, AlertCircle } from 'lucide-react';

const ImpactCard = ({ impact, categoryIcon }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get the appropriate colors based on impact category
  const getCategoryColors = (category) => {
    switch (category) {
      case 'economic':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-500'
        };
      case 'social':
        return {
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-800',
          iconColor: 'text-purple-500'
        };
      case 'global':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          iconColor: 'text-green-500'
        };
      case 'risks':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-500'
        };
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          iconColor: 'text-gray-500'
        };
    }
  };
  
  // Get the probability label and color
  const getProbabilityInfo = (probability) => {
    if (probability >= 80) {
      return { label: 'Very Likely', color: 'text-red-600' };
    } else if (probability >= 60) {
      return { label: 'Likely', color: 'text-orange-600' };
    } else if (probability >= 40) {
      return { label: 'Possible', color: 'text-yellow-600' };
    } else if (probability >= 20) {
      return { label: 'Unlikely', color: 'text-blue-600' };
    } else {
      return { label: 'Very Unlikely', color: 'text-gray-600' };
    }
  };
  
  // Get the severity label and color
  const getSeverityInfo = (severity) => {
    switch (severity) {
      case 'high':
        return { label: 'High Impact', color: 'text-red-600' };
      case 'medium':
        return { label: 'Medium Impact', color: 'text-orange-600' };
      case 'low':
        return { label: 'Low Impact', color: 'text-blue-600' };
      default:
        return { label: 'Unknown Impact', color: 'text-gray-600' };
    }
  };
  
  const categoryColors = getCategoryColors(impact.category);
  const probabilityInfo = getProbabilityInfo(impact.probability);
  const severityInfo = getSeverityInfo(impact.severity);
  
  return (
    <div className={`border rounded-lg shadow-sm ${categoryColors.bgColor} ${categoryColors.borderColor}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 ${categoryColors.iconColor} bg-white`}>
              {categoryIcon}
            </div>
            <div>
              <h3 className="text-xl font-bold">{impact.title}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`inline-flex items-center text-sm ${probabilityInfo.color}`}>
                  <BarChart2 size={14} className="mr-1" />
                  {probabilityInfo.label}
                </span>
                <span className={`inline-flex items-center text-sm ${severityInfo.color}`}>
                  <AlertCircle size={14} className="mr-1" />
                  {severityInfo.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full hover:bg-gray-200"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>
        
        <div className={`${isExpanded ? '' : 'line-clamp-3'} mt-2`}>
          <p className="text-gray-700">
            {impact.description}
          </p>
        </div>
        
        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-blue-600 text-sm mt-2 hover:underline"
          >
            Read more
          </button>
        )}
      </div>
      
      {isExpanded && (
        <div className="border-t p-4">
          <h4 className="font-medium mb-2">Stakeholders Affected</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            {impact.stakeholders.map((stakeholder, index) => (
              <span 
                key={index}
                className="bg-white px-2 py-1 text-sm rounded-full border"
              >
                {stakeholder}
              </span>
            ))}
          </div>
          
          <h4 className="font-medium mb-2">Mitigating Factors</h4>
          <ul className="list-disc pl-5 space-y-1 mb-4">
            {impact.mitigatingFactors.map((factor, index) => (
              <li key={index} className="text-gray-700">{factor}</li>
            ))}
          </ul>
          
          <h4 className="font-medium mb-2">Expert Analysis</h4>
          <p className="text-gray-700 mb-4">{impact.expertAnalysis}</p>
          
          <div className="bg-white p-3 rounded-lg border">
            <h4 className="font-medium mb-2">Alternative Scenarios</h4>
            <ul className="space-y-2">
              {impact.alternativeScenarios.map((scenario, index) => (
                <li key={index} className="flex items-start">
                  <span className="inline-block w-6 h-6 rounded-full bg-gray-200 flex-shrink-0 text-center mr-2">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{scenario}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactCard;