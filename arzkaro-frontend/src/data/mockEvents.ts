// src/data/mockEvents.ts

import { Event } from '../pages/EventDetailPage';

// Update the Event type to explicitly allow an array of artist names
export type MockEventItem = Omit<Event, 'artist_name'> & { 
  artist_name: string | string[]; // Now supports a single string OR an array of strings
  member_count?: number;
  genre?: string;
  is_online?: boolean;
  banner_image_url?: string;
};

// --- MOCK ARTISTS (For EventsPage & Artist Profiles) ---
// Note: The structure for MOCK_ARTISTS remains the same as before.
export const MOCK_ARTISTS = [
  { name: 'Shivam', image_url: '/shivam1.jpeg' }, 
  { name: 'Niyam', image_url: '/niyam1.jpeg' }, 
 
];

// --- MOCK EVENTS (FOR EVENTS PAGE LISTING & DETAIL LOOKUP) ---
export const ALL_MOCK_EVENTS: MockEventItem[] = [
  {
    id: 'evt-9',
    title: 'Shivam Performing Live',
    artist_name: 'Shivam', // Single artist remains a string
    city: 'Gurgoan',
    venue: 'Venue to be announced',
    event_date: new Date("2025-12-30T00:00:00.000Z").toISOString(),
    image_url: '/shivamposter.jpeg', // Listing Poster
    banner_image_url: '/shivambanner.jpeg', // Detail Page Banner (for the ARZ style page)
    ticket_price: 999,
    member_count: 9,
    genre: 'acoustic',
    description: "Get ready for an unforgettable night as Shivam brings his soulful voice, raw emotion, and high-energy performance to the stage. Venue will be announced soon — stay tuned for the reveal. One thing’s guaranteed: it’s going to be a night full of music, memories, and pure vibes.",
    includes: ["Concert Entry (General Admission)", "Exclusive Merch Discount Voucher (10%)", "Full Group Chat Access"],
    notes: ["Venue will be announced 2 weeks prior to the event date.", "A valid government-issued ID is mandatory for entry.", "Tickets are non-transferable and non-refundable."],
    contact: 'support@shivamevents.com',
  },
  {
    id: 'evt-10',
    title: 'Post Malone Listening Party',
    artist_name: 'Niyam',
    city: 'Gurgoan',
    venue: 'Venue to be announced',
    event_date: new Date("2025-12-03T00:00:00Z").toISOString(),
    image_url: '/malone.png', // Listing Poster
    banner_image_url: '/banner.jpg', // Detail Page Banner (This is the one for the screenshot you shared)
    ticket_price: 599,
    member_count: 16,
    genre: 'rock',
description: "Post Malone fans, this one's for you, Delhi! 🎤 \
Join us for the ultimate Post Malone Listening Party — featuring a live band performing his biggest hits from *Beerbongs & Bentleys* to *Hollywood’s Bleeding* and beyond. \
\
This isn’t just another gig — it’s a night for every Delhi Posty fan to come together, sing their hearts out, and vibe like we’re at his actual concert. \
\
Expect electrifying live performances, amazing food, and drinks flowing all night. \
When the band wraps up, the party keeps going with a high-energy DJ set spinning Posty’s best tracks and hip-hop bangers. \
\
No rules. No filters. Just pure, carefree energy. \
For four unforgettable hours, we’ll all feel like rockstars. \
Let’s get loud, weird, and unapologetically us. 🤘",


    includes: ["Standing Access Ticket", "Event Poster (Digital)", "Group Chat Access"],
    notes: ["Venue details expected to be released 7 days before the show.", "No professional cameras allowed.", "Late entry will be permitted until 9:00 PM."],
    contact: 'info@arzevents.net',
  },
  // {
  //   id: 'evt-11',
  //   title: 'Hip to the Hop',
  //   // CRUCIAL CHANGE: artist_name is now an array for multi-act shows
  //   artist_name: ['Kinshu', 'Rajat', 'Raahi', 'Gauntlet'], 
  //   city: 'Bengaluru',
  //   venue: 'Concrete Jungle',
  //   event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
  //   image_url: '/mock3.jpg', // Listing Poster
  //   banner_image_url: '/banner.jpg', // Detail Page Banner
  //   ticket_price: 799,
  //   member_count: 450,
  //   genre: 'hiphop',
  //   description: "Welcome to a night built for pure hip-hop culture. Hip to the Hop brings together some of the most exciting names in the scene — Kinshu, Rajat, Raahi, and Gauntlet — all on one stage.",
  //   includes: ["General Entry", "Access to all 4 acts", "Group Chat Access"],
  //   notes: ["Show starts promptly at 8 PM.", "Wear comfortable shoes - standing room only.", "Venue has limited capacity, book early."],
  //   contact: 'contact@hophop.in',
  // },
  // {
  //   id: 'evt-12',
  //   title: 'Post Malone Listening Party',
  //   // CRUCIAL CHANGE: artist_name is now an array for multi-act shows
  //   artist_name: ['Niyam', 'DJ Maverick'],
  //   city: 'Hyderabad',
  //   venue: 'The Vibe Lounge',
  //   event_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 12).toISOString(),
  //   image_url: '/mock4.jpg', // Listing Poster
  //   banner_image_url: '/banner.jpg', // Detail Page Banner
  //   ticket_price: 550,
  //   member_count: 310,
  //   genre: 'pop',
  //   description: "Calling all Posty fans. We’re hosting an exclusive Post Malone Listening Party featuring curated sets and fan-favourite tracks played by Niyam and DJ Maverick.",
  //   includes: ["Entry to The Vibe Lounge", "Complimentary non-alcoholic drink", "Exclusive DJ set"],
  //   notes: ["Strictly 21+ event.", "Dress code: Casual chic.", "Doors open at 6:30 PM."],
  //   contact: 'vibelounge@party.com',
  // },
];