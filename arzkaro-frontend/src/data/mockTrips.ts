// src/data/mockTrips.ts

// --- Assumed BasicTrip Definition (Defining here to ensure DetailedTrip works) ---
export interface BasicTrip {
  id: string;
  title: string;
  destination: string;
  start_date: string; // ISOString
  end_date: string; // ISOString
  image_url: string;
  estimated_cost: number;
  member_count: number;
  is_private: boolean;
  notes: string;
}

// Extend the basic Trip type with detailed itinerary info
export type DetailedTrip = BasicTrip & {
  ideal_for: string;
  travel_mode: string;
  stay: string;
  meals_included: string;
  departure_city: string;
  agency: 'Wanderers' | 'Travel2World' | 'Neki';
  agent: 'Ankit' | 'Mohit';
  age_group: string;
  group_size: string;
  itinerary: {
    day: number;
    title: string;
    details: string;
  }[];
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
};

// --- NEW DATA SOURCE FOR DESTINATIONS (Used for the row in TripsPage) ---
export const MOCK_DESTINATIONS_DATA = [
  { name: 'Udaipur', image_url: '/udaipur.jpg' },
  { name: 'Shimla', image_url: '/shimla.jpg' },
  { name: 'Jaipur', image_url: '/jaipur.jpg' },
  { name: 'Jaisalmer', image_url: 'jaisalmer.jpg' },
  { name: 'Goa', image_url: '/goa.jpg' },
];

export const DETAILED_MOCK_TRIPS: DetailedTrip[] = [
  // --- Udaipur Trip Details (Based on trip-1 mock data) ---
  {
    id: 'trip-1',
    title: 'Udaipur Group Getaway',
    destination: 'Udaipur',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 32).toISOString(), // Adjusted for 3D/2N
    image_url: '/udaipur.jpg',
    estimated_cost: 35000,
    member_count: 8,
    is_private: false,
    notes: 'Epic 3-day exploration of the City of Lakes. Perfect for solo explorers.',

    // New Detailed Fields
    ideal_for: 'Solo travellers aged 20–35',
    travel_mode: '12-seater AC Traveller',
    stay: '3-star Hotel (Double/Triple Sharing)',
    meals_included: 'Breakfast + Dinner (2B, 2D)',
    departure_city: 'Delhi',
    agency: 'Wanderers',
    agent: 'Ankit',
    age_group: '20–35',
    group_size: '8-12',
    itinerary: [
      {
        day: 1,
        title: 'Departure from Delhi + Welcome to Udaipur',
        details:
          'Assemble at the pickup point in Delhi, meet the trip captain, and board the AC Traveller. Overnight journey to Udaipur with stopovers for tea/snacks. Chill, play games, get to know the group.',
      },
      {
        day: 2,
        title: 'City Palace + Lake Pichola Sunset',
        details:
          'Arrive and check-in at a 3-star hotel followed by breakfast. Explore City Palace, walk around the old city lanes, cafés, and ghats. Visit Lake Pichola for sunset. Group bonding session at the hotel in the evening.',
      },
      {
        day: 3,
        title: 'Sajjangarh Fort + Return to Delhi',
        details:
          'Breakfast at hotel. Depart for Sajjangarh (Monsoon Palace) for panoramic views, then head to Fateh Sagar Lake. Free time for local street food/shopping. Check out and start the return journey to Delhi. Dinner en route.',
      },
    ],
    inclusions: [
      'AC Traveller from Delhi to Udaipur and back',
      'Two breakfasts and two dinners',
      '3-star hotel stay (double/triple sharing)',
      'All sightseeing mentioned in the itinerary',
      'Trip captain',
      'Group games and icebreakers',
    ],
    exclusions: [
      'Lunch on all days',
      'Entry tickets (City Palace, Sajjangarh, etc.)',
      'Personal expenses',
      'Anything not mentioned in inclusions',
    ],
    highlights: [
      'Scenic road trip from Delhi',
      'Lake Pichola sunset',
      'Udaipur old city walks',
      'Sajjangarh Fort views',
      'Make new friends and travel with like-minded people',
    ],
  },

  // --- Shimla Trip Details (New Trip) ---
  {
    id: 'trip-5',
    title: 'Shimla Mall Road & Kufri Adventure',
    destination: 'Shimla',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 50).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 52).toISOString(),
    image_url: '/shimla.jpg',
    estimated_cost: 18000,
    member_count: 10,
    is_private: false,
    notes: 'A perfect weekend escape to the Queen of Hills, covering Shimla and Kufri.',

    // New Detailed Fields
    ideal_for: 'Solo travellers aged 20–35',
    travel_mode: '12-seater AC Traveller',
    stay: '3-star Hotel (Double/Triple Sharing)',
    meals_included: 'Breakfast + Dinner (2B, 2D)',
    departure_city: 'Delhi',
    agency: 'Travel2World',
    agent: 'Mohit',
    age_group: '20–35',
    group_size: '10-12',
    itinerary: [
      {
        day: 1,
        title: 'Departure from Delhi',
        details:
          'Meet at the designated pickup point. Introduction with the trip captain. Board the AC Traveller and start the overnight journey to Shimla with icebreaker games on the bus.',
      },
      {
        day: 2,
        title: 'Mall Road, The Ridge & Lakkar Bazaar',
        details:
          'Arrive in Shimla, check-in, freshen up, and have breakfast. Explore Mall Road, The Ridge, Christ Church, and Lakkar Bazaar. Sunset walk and return to the hotel for dinner and group activities.',
      },
      {
        day: 3,
        title: 'Kufri Adventure Park + Return to Delhi',
        details:
          'Breakfast at hotel. Head to Kufri for the Adventure Park, valley viewpoints, and optional activities. Return to Shimla, check out, and start the return journey to Delhi. Reach Delhi next morning.',
      },
    ],
    inclusions: [
      'AC Traveller (Delhi–Shimla–Delhi)',
      '3-star hotel stay (double/triple sharing)',
      '2 breakfasts + 2 dinners',
      'Visit to Mall Road, Ridge, Lakkar Bazaar, Kufri',
      'Trip captain',
    ],
    exclusions: [
      'Lunch on all days',
      'Entry tickets at Kufri Adventure Park',
      'Horse/Yak rides',
      'Personal expenses',
      'Anything not mentioned in inclusions',
    ],
    highlights: [
      'Overnight road trip from Delhi',
      'Shimla Mall Road & Ridge stroll',
      'Kufri adventure day',
      'Scenic mountain views',
      'Safe, comfortable, and perfect for solo travellers',
    ],
  },

  // --- Jaipur Trip (Based on trip-3 mock data) ---
  {
    id: 'trip-3',
    title: 'Jaipur: Pink City Getaway',
    destination: 'Jaipur',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 9).toISOString(),
    image_url: '/jaipur.jpg',
    estimated_cost: 6000,
    member_count: 25,
    is_private: false,
    notes: 'A quick 3-day, 2-night trip to explore the forts and bazaars of the Pink City.',
    ideal_for: 'Solo travellers aged 20–35',
    travel_mode: '12-seater Tempo Traveller (AC)',
    stay: '3-star hotel (twin/triple sharing)',
    meals_included: 'Breakfast & Dinner (2B, 2D)',
    departure_city: 'Delhi',
    agency: 'Neki',
    agent: 'Ankit',
    age_group: '20–35',
    group_size: '10–12',
    itinerary: [
      {
        day: 1,
        title: 'Old City Walk',
        details:
          'Overnight ride from Delhi. Early check-in, Hawa Mahal (photo stop), City Palace, Jantar Mantar. Evening: Bapu Bazaar stroll, street snacks. Dinner at hotel.',
      },
      {
        day: 2,
        title: 'Forts & Sunset',
        details:
          'Breakfast → Amber Fort & Panna Meena ka Kund. Sunset at Nahargarh viewpoint. Dinner at hotel.',
      },
      {
        day: 3,
        title: 'Café Hop & Return',
        details:
          'Breakfast → free time for cafés/local shopping. Check-out by noon. Depart for Delhi. Late-night arrival.',
      },
    ],
    inclusions: [
      'AC Traveller ex-Delhi',
      '2N in 3-star hotel',
      '2B & 2D',
      'trip lead',
      'music & games',
      'basic first-aid.',
    ],
    exclusions: ['Lunches', 'entry tickets', 'optional activities', 'personal expenses'],
    highlights: [
      'Amber Fort',
      'Hawa Mahal (photo stop)',
      'City Palace',
      'Nahargarh sunset',
      'local bazaars & kachori/lassi tasting.',
    ],
  },
  // Adding other trips with some placeholder details for completeness...
  {
    id: 'trip-6',
    title: 'Jaisalmer: Golden Desert Sojourn',
    destination: 'Jaisalmer',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 123).toISOString(),
    image_url: '/jaisalmer.jpg',
    estimated_cost: 13000,
    member_count: 9,
    is_private: false,
    notes: '4 Days / 3 Nights trip to the Golden City, including a desert camp experience.',
    ideal_for: 'Solo travellers aged 20–35',
    travel_mode: '12-seater Tempo Traveller (AC)',
    stay: '2N 3-star city hotel + 1N comfortable desert camp',
    meals_included: 'Breakfast & Dinner (3B, 3D)',
    departure_city: 'Delhi',
    agency: 'Wanderers',
    agent: 'Mohit',
    age_group: '20–35',
    group_size: '10–12',
    itinerary: [
      {
        day: 1,
        title: 'Old City',
        details:
          'Arrive, breakfast, check-in. Jaisalmer Fort & Patwon ki Haveli. Sunset at Gadisar Lake. Dinner.',
      },
      {
        day: 2,
        title: 'Desert Day',
        details:
          'Breakfast → Kuldhara → Sam/Khuri dunes. Cultural program at camp. Dinner & stargazing.',
      },
      {
        day: 3,
        title: 'Local Markets & Cafés',
        details:
          'Breakfast at camp → return to city hotel. Leisure: rooftop cafés, shopping lanes. Dinner.',
      },
      {
        day: 4,
        title: 'Return to Delhi',
        details: 'Breakfast, check-out, depart. Late-night/early-morning arrival in Delhi.',
      },
    ],
    inclusions: [
      'AC Traveller',
      '2N city hotel + 1N desert camp',
      '3B & 3D',
      'trip lead',
      'first-aid',
    ],
    exclusions: ['Lunches', 'adventure rides', 'entry tickets', 'personal spends'],
    highlights: [
      'Jaisalmer Fort',
      'Patwon ki Haveli',
      'Gadisar Lake',
      'dunes sunset & starry night.',
    ],
  },
  // Add one more trip to make the list 5 elements, but not visible due to slice(0, 4) in TripsPage
  {
    id: 'trip-7',
    title: 'Goa Beach Party',
    destination: 'Goa',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 65).toISOString(),
    image_url: '/goa.jpg',
    estimated_cost: 22000,
    member_count: 15,
    is_private: false,
    notes: '5-day beach vacation covering North and South Goa highlights.',
    ideal_for: 'Party goers aged 25–40',
    travel_mode: 'Flight (not included) + Private Tempo Traveller in Goa',
    stay: '3-star resort (twin/double sharing)',
    meals_included: 'Breakfast (4B)',
    departure_city: 'Self-Travel to Goa',
    agency: 'Travel2World',
    agent: 'Ankit',
    age_group: '25–40',
    group_size: '15–20',
    itinerary: [
      {
        day: 1,
        title: 'Arrival & North Goa',
        details: 'Arrive, check-in, explore Calangute/Baga. Evening: beach shacks and party.',
      },
      {
        day: 2,
        title: 'Water Sports & Forts',
        details: 'Water sports at Baga. Visit Aguada Fort for sunset. Dinner.',
      },
      {
        day: 3,
        title: 'South Goa Day',
        details: 'Visit Palolem Beach, explore local markets. Relaxed evening.',
      },
      {
        day: 4,
        title: 'Leisure Day',
        details: 'Free day for shopping, exploring cafes, or relaxing at the resort pool.',
      },
      { day: 5, title: 'Departure', details: 'Breakfast, check-out, depart for the airport.' },
    ],
    inclusions: ['4N resort stay', '4B', 'local AC transport', 'trip leader'],
    exclusions: ['Flights', 'lunches & dinners', 'entry fees', 'water sports'],
    highlights: ['Calangute Beach', 'Aguada Fort', 'Palolem Beach', 'North Goa party scene.'],
  },
];

// This export is used by App.tsx
export const ALL_MOCK_TRIPS = DETAILED_MOCK_TRIPS;

// This export fixes the latest error in Trips.tsx
export const MOCK_TRIPS_LISTING = DETAILED_MOCK_TRIPS;

// This export fixes the previous error in Trips.tsx
export const MOCK_DESTINATIONS_LIST: string[] = DETAILED_MOCK_TRIPS.map(
  (trip) => trip.destination
).filter((value, index, self) => self.indexOf(value) === index);
