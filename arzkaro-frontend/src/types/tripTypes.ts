// src/types/tripTypes.ts

// Accent color
export const ACCENT = '#FF785A';

// --- Shared Chat Type Definitions ---
export type Message = { id: string; author: string; text: string; time: string };


// --- Detailed Trip Type Definitions (Mocked) ---
export type TripItineraryDay = {
    day: number;
    title: string;
    details: string;
};

export type DetailedTrip = {
    id: string;
    title: string;
    destination: string;
    image_url: string;
    start_date: string;
    end_date: string;
    estimated_cost: number;
    member_count: number;
    group_size: string;
    age_group: string;
    travel_mode: string;
    stay: string;
    meals_included: string;
    agency: string;
    agent: string;
    notes: string;
    highlights: string[];
    itinerary: TripItineraryDay[];
    inclusions: string[];
    exclusions: string[];
};

// Mock data to replace DETAILED_MOCK_TRIPS
export const DETAILED_MOCK_TRIPS: DetailedTrip[] = [
    {
        id: 'trip-1',
        title: 'Leh-Ladakh Road Trip: The Ultimate Adventure',
        destination: 'Leh-Ladakh, India',
        image_url: 'https://via.placeholder.com/1200x600?text=Leh+Ladakh+Trip',
        start_date: '2026-06-15',
        end_date: '2026-06-22',
        estimated_cost: 35000,
        member_count: 12,
        group_size: 'Small Group',
        age_group: '20-35 yrs',
        travel_mode: 'SUV/Tempo Traveller',
        stay: 'Guesthouses & Camps',
        meals_included: 'Breakfast & Dinner',
        agency: 'Himalayan Adventures Co.',
        agent: 'Priya Sharma',
        notes: 'Experience the raw beauty of the Himalayas, including Pangong Lake and Khardung La.',
        highlights: ['High Altitude Passes', 'Monastery Visits', 'Pangong Lake Camping', 'Bike Ride Option'],
        itinerary: [
            { day: 1, title: 'Arrival in Leh', details: 'Check-in, rest, and acclimatization day. Evening market visit.' },
            { day: 2, title: 'Sham Valley Exploration', details: 'Visit Magnetic Hill, Indus-Zanskar Confluence, and Pathar Sahib Gurudwara.' },
            { day: 3, title: 'Leh to Nubra Valley', details: 'Drive over Khardung La (Highest Motorable Road). Camel Safari in Hunder Sand Dunes.' },
            { day: 4, title: 'Nubra to Pangong Lake', details: 'Travel via Shyok river route. Sunset and overnight camping by Pangong Lake.' },
        ],
        inclusions: ['Accommodation', 'Transport', 'Meals (B/D)', 'Inner Line Permits'],
        exclusions: ['Flight/Train Tickets', 'Lunch', 'Personal Expenses', 'Medical Insurance'],
    },
    // Add more mock trips as needed
];