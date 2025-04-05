// This is a mock service for demonstration purposes
// In a real app, this would connect to a backend API

// Helper functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates API fetch operations with random delays
 * @param {Function} dataFn - Function that returns the data to be fetched
 * @param {number} minDelay - Minimum delay in ms
 * @param {number} maxDelay - Maximum delay in ms
 * @param {number} errorRate - Probability of error (0-1)
 * @returns {Promise<Object>} - The fetched data or error
 */
const simulateFetch = async (dataFn, minDelay = 300, maxDelay = 1200, errorRate = 0.1) => {
  const delayTime = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  await delay(delayTime);
  
  // Simulate random errors
  if (Math.random() < errorRate) {
    throw new Error('Network error occurred. Please try again.');
  }
  
  return dataFn();
};

// Mock data for events
const mockEvents = [
  {
    id: '1',
    title: 'Infrastructure Bill Debate',
    date: '2025-03-28',
    image: '/api/placeholder/800/400',
    summary: 'The proposed infrastructure bill has sparked heated debate across the political spectrum, with discussions centered around funding, priorities, and long-term economic impact.',
    keyFacts: [
      'The bill proposes $1.2 trillion in infrastructure spending',
      'Includes funding for roads, bridges, public transport, and broadband',
      'Debates center around tax implications and deficit concerns',
      'Some provisions address climate change mitigation'
    ],
    timeline: [
      { date: '2025-01-15', event: 'Bill first introduced in Congress' },
      { date: '2025-02-10', event: 'House committee hearings begin' },
      { date: '2025-03-05', event: 'Senate proposes amendments' },
      { date: '2025-03-25', event: 'Final debate scheduled' }
    ],
    stakeholders: [
      { name: 'Construction Industry', interest: 'Would benefit from increased projects' },
      { name: 'Taxpayers', interest: 'Concerned about potential tax increases' },
      { name: 'Environmental Groups', interest: 'Focused on climate provisions' },
      { name: 'State Governments', interest: 'Implementation and matching funds' }
    ],
    perspectives: [
      {
        id: '101',
        bias: 'conservative',
        title: 'Fiscal Responsibility Concerns',
        summary: 'Conservative analysts argue the infrastructure bill represents excessive government spending that will increase the national debt and potentially lead to higher taxes. They question whether all included projects represent essential infrastructure.',
        keyPoints: [
          'Bill adds significantly to national debt',
          'Many projects could be handled by private sector',
          'Tax increases could slow economic growth',
          'State-level decision making would be more efficient'
        ],
        evidence: 'Previous infrastructure initiatives have often exceeded budgets and timelines. The Congressional Budget Office analysis suggests potential long-term fiscal impacts not fully addressed in the current proposal.',
        sources: [
          { name: 'Wall Street Journal Analysis', url: '#' },
          { name: 'Heritage Foundation Report', url: '#' },
          { name: 'Congressional Budget Office Projections', url: '#' }
        ]
      },
      {
        id: '102',
        bias: 'liberal',
        title: 'Investing in America\'s Future',
        summary: 'Progressive perspectives emphasize the critical need for infrastructure investment after decades of neglect. They highlight job creation, economic stimulus, and the importance of addressing climate change through infrastructure modernization.',
        keyPoints: [
          'Critical infrastructure has been underfunded for decades',
          'Will create millions of good-paying jobs',
          'Addresses climate change through green initiatives',
          'Improves economic competitiveness globally'
        ],
        evidence: 'The American Society of Civil Engineers has given U.S. infrastructure a C- grade in its most recent report card. Studies show that infrastructure investment has one of the highest economic multipliers for government spending.',
        sources: [
          { name: 'American Society of Civil Engineers Report', url: '#' },
          { name: 'Economic Policy Institute Analysis', url: '#' },
          { name: 'Brookings Institution Study', url: '#' }
        ]
      },
      {
        id: '103',
        bias: 'centrist',
        title: 'Balanced Approach to Infrastructure Needs',
        summary: 'Centrist analysts acknowledge the need for infrastructure investment while raising questions about specific priorities, funding mechanisms, and implementation challenges. They focus on practical considerations and bipartisan solutions.',
        keyPoints: [
          'Infrastructure investment is necessary but should be targeted',
          'Concerns about project selection and political influence',
          'Public-private partnerships could reduce fiscal impact',
          'Implementation and oversight will be critical to success'
        ],
        evidence: 'Historical analysis of infrastructure spending shows mixed results, with success largely dependent on project selection criteria and implementation oversight. International comparisons suggest effective models that combine public funding with private sector involvement.',
        sources: [
          { name: 'Committee for a Responsible Federal Budget', url: '#' },
          { name: 'Bipartisan Policy Center Analysis', url: '#' },
          { name: 'Congressional Research Service Report', url: '#' }
        ]
      },
      {
        id: '104',
        bias: 'international',
        title: 'Global Perspective on American Infrastructure',
        summary: 'International observers note that the U.S. has fallen behind many developed nations in infrastructure quality and investment. The bill is seen as potentially restoring American leadership but faces implementation challenges.',
        keyPoints: [
          'U.S. infrastructure quality ranks below many developed nations',
          'Investment could restore competitiveness in global markets',
          'International investors watching closely for opportunities',
          'Climate provisions align with global infrastructure trends'
        ],
        evidence: 'The World Economic Forum\'s Global Competitiveness Report ranks U.S. infrastructure 13th globally, behind Singapore, Switzerland, Japan, and several European countries. International case studies demonstrate how targeted infrastructure investment has boosted economic productivity.',
        sources: [
          { name: 'World Economic Forum Report', url: '#' },
          { name: 'The Economist Analysis', url: '#' },
          { name: 'OECD Infrastructure Investment Comparison', url: '#' }
        ]
      }
    ],
    impacts: [
      {
        id: '201',
        category: 'economic',
        timeframe: 'short',
        title: 'Job Creation and Economic Stimulus',
        description: 'The bill is expected to create 1.5 million new jobs in its first year of implementation, primarily in construction, engineering, and manufacturing sectors. This would provide an immediate stimulus to the economy as projects break ground.',
        probability: 85,
        severity: 'high',
        stakeholders: [
          'Construction workers',
          'Engineering firms',
          'Manufacturing sector',
          'Local businesses',
          'Job seekers'
        ],
        mitigatingFactors: [
          'Labor shortages in skilled trades could limit job creation',
          'Material shortages may delay project starts',
          'Regulatory approvals could slow implementation'
        ],
        expertAnalysis: 'Economic models predict a significant multiplier effect from infrastructure spending. For every $1 billion in infrastructure investment, approximately 13,000 direct and indirect jobs are created. The geographic distribution of these jobs will depend on project allocation.',
        alternativeScenarios: [
          'Accelerated implementation could front-load economic benefits but increase inflation risks',
          'Phased implementation might reduce immediate impact but lead to more sustainable long-term growth',
          'Focus on shovel-ready projects could speed job creation but miss strategic opportunities'
        ]
      },
      {
        id: '202',
        category: 'economic',
        timeframe: 'medium',
        title: 'Productivity Improvements and Supply Chain Resilience',
        description: 'Improved transportation infrastructure is expected to reduce logistics costs and delivery times, enhancing overall economic productivity. Broadband investments would expand digital economy opportunities in underserved areas.',
        probability: 70,
        severity: 'medium',
        stakeholders: [
          'Transportation companies',
          'Manufacturers',
          'Rural communities',
          'E-commerce businesses',
          'Technology sector'
        ],
        mitigatingFactors: [
          'Benefits depend on effective project selection and execution',
          'Some productivity gains may take years to materialize',
          'Technology changes could affect long-term impact of some investments'
        ],
        expertAnalysis: 'Research suggests that a 10% improvement in infrastructure quality can increase business productivity by 1-2%. Critical bottlenecks in ports, railways, and internet connectivity currently hamper U.S. economic competitiveness.',
        alternativeScenarios: [
          'Focusing on digital infrastructure could yield faster productivity gains than traditional projects',
          'International trade developments might alter the value of certain transportation improvements',
          'Private sector investment could accelerate or complement public infrastructure development'
        ]
      },
      {
        id: '203',
        category: 'social',
        timeframe: 'short',
        title: 'Community Disruption During Construction',
        description: 'Large-scale infrastructure projects will cause temporary disruptions to communities including noise, traffic congestion, and business access issues. These impacts will be unevenly distributed and could affect vulnerable communities disproportionately.',
        probability: 90,
        severity: 'medium',
        stakeholders: [
          'Local residents',
          'Small businesses',
          'Schools and hospitals',
          'Public transit users',
          'Emergency services'
        ],
        mitigatingFactors: [
          'Phased construction planning can minimize disruptions',
          'Community engagement in project planning can address concerns',
          'Temporary assistance programs for affected businesses',
          'Clear communication about timelines and alternative routes'
        ],
        expertAnalysis: 'Studies of previous infrastructure initiatives show that community acceptance is highest when residents are engaged early in the planning process and when local economic benefits are clearly communicated. Temporary business revenue losses average 15-25% during major construction phases.',
        alternativeScenarios: [
          'Night construction could reduce daytime disruptions but create noise issues',
          'Modular construction techniques might reduce on-site construction time',
          'Comprehensive community benefits agreements could improve perception of disruptions'
        ]
      },
      {
        id: '204',
        category: 'social',
        timeframe: 'long',
        title: 'Equity and Access Improvements',
        description: 'Infrastructure investments targeting historically underserved communities could reduce disparities in access to transportation, internet, and economic opportunities. However, implementation decisions will determine whether equity goals are achieved.',
        probability: 60,
        severity: 'high',
        stakeholders: [
          'Low-income communities',
          'Rural populations',
          'Communities of color',
          'People with disabilities',
          'Education and workforce development organizations'
        ],
        mitigatingFactors: [
          'Project selection criteria will influence equity outcomes',
          'Community input is essential for addressing actual needs',
          'Complementary policies may be needed to maximize benefits',
          'Ongoing maintenance funding is crucial for sustained impact'
        ],
        expertAnalysis: 'Research on infrastructure equity shows that intentional planning and community engagement are essential. Previous programs have sometimes reinforced rather than reduced disparities when equity was not an explicit consideration in project selection and design.',
        alternativeScenarios: [
          'Community ownership models could enhance long-term benefits in underserved areas',
          'Technology changes might create new forms of infrastructure inequality',
          'Local implementation capacity challenges could affect equity outcomes'
        ]
      },
      {
        id: '205',
        category: 'global',
        timeframe: 'medium',
        title: 'International Competitiveness and Trade Impacts',
        description: 'Modernized ports, airports, and digital infrastructure would improve U.S. export capabilities and potentially attract global business investment. This could strengthen the U.S. position in international trade and technology leadership.',
        probability: 75,
        severity: 'medium',
        stakeholders: [
          'Exporters and importers',
          'International investors',
          'Port cities and communities',
          'Technology companies',
          'Trade-dependent industries'
        ],
        mitigatingFactors: [
          'Global economic conditions will influence overall trade volumes',
          'Competitor nations are also investing in infrastructure',
          'Trade policy decisions could affect infrastructure utilization',
          'Technology standards alignment is critical for digital infrastructure'
        ],
        expertAnalysis: 'World Economic Forum analysis indicates that infrastructure quality significantly influences foreign direct investment decisions. U.S. infrastructure quality rankings have declined relative to competitor nations over the past two decades, affecting export efficiency.',
        alternativeScenarios: [
          'Focused investment in key trade gateways could yield disproportionate benefits',
          'Alignment with trading partners on infrastructure standards could enhance effects',
          'Climate-related disruptions could affect long-term infrastructure effectiveness'
        ]
      },
      {
        id: '206',
        category: 'risks',
        timeframe: 'short',
        title: 'Inflation and Material Shortages',
        description: 'Rapid infrastructure spending could exacerbate current inflation pressures and material shortages. Construction costs have already risen significantly, potentially reducing the purchasing power of allocated funds.',
        probability: 80,
        severity: 'high',
        stakeholders: [
          'Construction industry',
          'Material suppliers',
          'Taxpayers',
          'Federal Reserve',
          'Other construction sectors'
        ],
        mitigatingFactors: [
          'Phased implementation could reduce inflationary pressure',
          'Supply chain improvements might alleviate material shortages',
          'Prioritization of projects could optimize resource allocation',
          'International sourcing could supplement domestic materials'
        ],
        expertAnalysis: 'Economic models suggest that infrastructure spending of this magnitude could add 0.3-0.5 percentage points to inflation in the short term. Material prices for steel, lumber, and cement have already seen 15-30% increases over the past year, which could affect project feasibility.',
        alternativeScenarios: [
          'Monetary policy adjustments could offset some inflationary effects',
          'Delays in implementation might allow supply chains to stabilize',
          'Innovation in materials and methods could reduce resource requirements'
        ]
      }
    ],
    sources: [
      { name: 'Congressional Budget Office', url: '#', bias: 'neutral', trustScore: 'high' },
      { name: 'Wall Street Journal', url: '#', bias: 'center-right', trustScore: 'medium-high' },
      { name: 'New York Times', url: '#', bias: 'center-left', trustScore: 'medium-high' },
      { name: 'American Society of Civil Engineers', url: '#', bias: 'pro-infrastructure', trustScore: 'medium' },
      { name: 'Brookings Institution', url: '#', bias: 'center-left', trustScore: 'medium-high' },
      { name: 'Heritage Foundation', url: '#', bias: 'conservative', trustScore: 'medium' },
      { name: 'Economic Policy Institute', url: '#', bias: 'progressive', trustScore: 'medium' },
      { name: 'World Economic Forum', url: '#', bias: 'international', trustScore: 'medium-high' }
    ]
  },
  // More mock events would be added here
  {
    id: '2',
    title: 'Stock Market Fluctuations',
    date: '2025-04-01',
    image: '/api/placeholder/800/400',
    summary: 'Recent stock market volatility has raised concerns about economic stability and investment strategies, with experts divided on the underlying causes and potential long-term implications.',
    // Other fields would be populated similarly to the first event
  },
  {
    id: '3',
    title: 'International Trade Agreement',
    date: '2025-03-25',
    image: '/api/placeholder/800/400',
    summary: 'A new multinational trade agreement is being negotiated that could reshape global commerce patterns, with significant implications for various industries, workers, and consumers.',
    // Other fields would be populated similarly to the first event
  }
];

// Event service API functions
const eventService = {
  /**
   * Get a list of all events
   * @returns {Promise<Array>} - List of events
   */
  getAllEvents: async () => {
    return simulateFetch(() => mockEvents.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      image: event.image,
      summary: event.summary
    })));
  },
  
  /**
   * Get featured or trending events
   * @param {number} limit - Maximum number of events to return
   * @returns {Promise<Array>} - List of featured events
   */
  getFeaturedEvents: async (limit = 3) => {
    return simulateFetch(() => mockEvents
      .slice(0, limit)
      .map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        image: event.image,
        summary: event.summary
      }))
    );
  },
  
  /**
   * Get a single event by ID
   * @param {string} id - Event ID
   * @returns {Promise<Object>} - Event data
   */
  getEventById: async (id) => {
    return simulateFetch(() => {
      const event = mockEvents.find(event => event.id === id);
      if (!event) {
        throw new Error(`Event with ID ${id} not found`);
      }
      return event;
    });
  },
  
  /**
   * Search for events
   * @param {string} query - Search query
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} - Search results
   */
  searchEvents: async (query, filters = {}) => {
    return simulateFetch(() => {
      // Simple search implementation - would be more complex in a real app
      const searchTerms = query.toLowerCase().split(' ');
      
      return mockEvents
        .filter(event => {
          // Match any of the search terms in title or summary
          return searchTerms.some(term => 
            event.title.toLowerCase().includes(term) || 
            event.summary.toLowerCase().includes(term)
          );
        })
        .map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          image: event.image,
          summary: event.summary
        }));
    });
  },
  
  /**
   * Get perspectives for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} - List of perspectives
   */
  getPerspectives: async (eventId) => {
    return simulateFetch(() => {
      const event = mockEvents.find(event => event.id === eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      return event.perspectives || [];
    });
  },
  
  /**
   * Get impacts for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} - List of impacts
   */
  getImpacts: async (eventId) => {
    return simulateFetch(() => {
      const event = mockEvents.find(event => event.id === eventId);
      if (!event) {
        throw new Error(`Event with ID ${eventId} not found`);
      }
      return event.impacts || [];
    });
  }
};

export default eventService;