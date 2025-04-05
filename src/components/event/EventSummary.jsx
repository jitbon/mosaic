import React from 'react';
import { CalendarDays, Users, Clock } from 'lucide-react';

const EventSummary = ({ summary, keyFacts, timeline, stakeholders }) => {
  return (
    <div className="space-y-8">
      {/* Main summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-2xl font-bold mb-4">Event Summary</h2>
        <p className="text-gray-700 whitespace-pre-line">{summary}</p>
      </div>
      
      {/* Key facts */}
      {keyFacts && keyFacts.length > 0 && (
        <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100">
          <h3 className="font-bold text-lg mb-3">Key Facts</h3>
          <ul className="space-y-2">
            {keyFacts.map((fact, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-block w-6 h-6 rounded-full bg-blue-100 flex-shrink-0 text-center leading-6 mr-2">
                  {index + 1}
                </span>
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-blue-600" />
            Timeline of Events
          </h3>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute top-0 left-4 bottom-0 w-0.5 bg-gray-200"></div>
            
            <ul className="space-y-6 pl-12 relative">
              {timeline.map((item, index) => (
                <li key={index} className="relative">
                  {/* Circle marker */}
                  <div className="absolute left-[-32px] mt-1 w-4 h-4 rounded-full bg-blue-600"></div>
                  
                  <div>
                    <div className="flex items-center text-sm text-gray-500 mb-1">
                      <CalendarDays size={14} className="mr-1" />
                      <span>{item.date}</span>
                    </div>
                    <p className="font-medium">{item.event}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {/* Stakeholders */}
      {stakeholders && stakeholders.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <Users size={20} className="mr-2 text-blue-600" />
            Key Stakeholders
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {stakeholders.map((stakeholder, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-1">{stakeholder.name}</h4>
                <p className="text-sm text-gray-600">{stakeholder.interest}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSummary;