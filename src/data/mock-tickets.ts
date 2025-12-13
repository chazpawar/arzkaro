import type { TicketWithDetails } from '../types';

/**
 * Mock Tickets Data for UI Development
 * This file contains hardcoded tickets for testing the UI without database connection
 */

const generateId = () => {
  return `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateBookingId = () => {
  return `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateDate = (daysFromNow: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

// Mock event data that matches tickets
const mockEvents = [
  {
    id: 'event-1',
    title: 'Mumbai Music Festival 2025',
    cover_image_url:
      'https://marketplace.canva.com/EAGPCwbGzbU/2/0/1131w/canva-school-is-cool-retro-groovy-positive-quote-illustrated-colorful-poster-k2DDIEC4h3c.jpg',
    start_date: generateDate(15, 18),
    end_date: generateDate(17, 22),
    location_name: 'Mumbai Grounds',
    location_address: 'Bandra Kurla Complex, Mumbai, Maharashtra',
    host: {
      id: 'host-1',
      full_name: 'Mumbai Events Co.',
    },
  },
  {
    id: 'event-2',
    title: 'Tech Startup Summit',
    cover_image_url:
      'https://d1csarkz8obe9u.cloudfront.net/themedlandingpages/tlp_hero_cool-posters-e2b967a0744ce61fa470e8619dc67ea3.jpg?ts%20=%201754367941',
    start_date: generateDate(20, 9),
    end_date: generateDate(20, 18),
    location_name: 'Convention Center',
    location_address: 'Andheri East, Mumbai, Maharashtra',
    host: {
      id: 'host-2',
      full_name: 'Tech Events India',
    },
  },
  {
    id: 'event-3',
    title: 'Sunrise Hot Air Balloon Ride',
    cover_image_url:
      'https://images-cdn.ubuy.co.in/6466130ce3259873f74b6b58-surfing-poster-hawaii-aloha-paradise.jpg',
    start_date: generateDate(5, 6),
    end_date: generateDate(5, 9),
    location_name: 'Jaipur Balloon Park',
    location_address: 'Amber Road, Jaipur, Rajasthan',
    host: {
      id: 'host-3',
      full_name: 'Adventure Tours',
    },
  },
  {
    id: 'event-4',
    title: 'Photography Walk - Old Delhi',
    cover_image_url:
      'https://img.freepik.com/free-photo/revolution-still-life-design_23-2149061100.jpg?semt=ais_hybrid&w=740&q=80',
    start_date: generateDate(25, 8),
    end_date: generateDate(25, 12),
    location_name: 'Chandni Chowk',
    location_address: 'Old Delhi, Delhi',
    host: {
      id: 'host-4',
      full_name: 'Delhi Photography Club',
    },
  },
  {
    id: 'event-5',
    title: 'Wine Tasting Experience',
    cover_image_url:
      'https://ih1.redbubble.net/image.672935128.9185/flat,750x,075,f-pad,750x1000,f8f8f8.u2.jpg',
    start_date: generateDate(30, 19),
    end_date: generateDate(30, 22),
    location_name: 'Vineyard Lounge',
    location_address: 'Pune, Maharashtra',
    host: {
      id: 'host-5',
      full_name: 'Wine Connoisseurs',
    },
  },
  {
    id: 'event-6',
    title: 'Yoga & Wellness Retreat',
    cover_image_url:
      'https://media.istockphoto.com/id/1366748354/vector/people-silhouettes-doing-yoga-poses-vector-paper-cut-illustration-yoga-class-studio-poster.jpg?s=612x612&w=0&k=20&c=MusBKL6FR93MfiYUP7IZXbP9HcGs6FYVoXqn-QQGfr0=',
    start_date: generateDate(-5, 8), // Past event
    end_date: generateDate(-5, 12),
    location_name: 'Peace Garden',
    location_address: 'Goa, India',
    host: {
      id: 'host-6',
      full_name: 'Wellness Center',
    },
  },
  {
    id: 'event-7',
    title: 'Comedy Night Special',
    cover_image_url: 'https://i.pinimg.com/474x/48/59/01/485901f83486b55c952c40b3f44f1b95.jpg',
    start_date: generateDate(-10, 20), // Past event
    end_date: generateDate(-10, 23),
    location_name: 'Comedy Club',
    location_address: 'Mumbai, Maharashtra',
    host: {
      id: 'host-7',
      full_name: 'Laugh Factory',
    },
  },
];

export const mockTickets: TicketWithDetails[] = [
  // ============================================
  // VALID TICKETS (Upcoming Events)
  // ============================================
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-1',
    ticket_type_id: 'ticket-type-1',
    status: 'valid',
    checked_in_at: null,
    checked_in_by: null,
    created_at: generateDate(-10),
    event: mockEvents[0],
    ticket_type: {
      id: 'ticket-type-1',
      name: 'General Admission',
      description: 'Standard entry ticket',
    },
    booking: {
      id: generateBookingId(),
      quantity: 2,
      total_amount: 3000,
    },
  },
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-2',
    ticket_type_id: 'ticket-type-2',
    status: 'valid',
    checked_in_at: null,
    checked_in_by: null,
    created_at: generateDate(-8),
    event: mockEvents[1],
    ticket_type: {
      id: 'ticket-type-2',
      name: 'VIP Pass',
      description: 'VIP access with networking session',
    },
    booking: {
      id: generateBookingId(),
      quantity: 1,
      total_amount: 5000,
    },
  },
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-3',
    ticket_type_id: 'ticket-type-3',
    status: 'valid',
    checked_in_at: null,
    checked_in_by: null,
    created_at: generateDate(-5),
    event: mockEvents[2],
    ticket_type: {
      id: 'ticket-type-3',
      name: 'Early Bird',
      description: 'Early morning balloon ride',
    },
    booking: {
      id: generateBookingId(),
      quantity: 2,
      total_amount: 9000,
    },
  },
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-4',
    ticket_type_id: 'ticket-type-4',
    status: 'valid',
    checked_in_at: null,
    checked_in_by: null,
    created_at: generateDate(-3),
    event: mockEvents[3],
    ticket_type: {
      id: 'ticket-type-4',
      name: 'Photography Walk',
      description: 'Guided photography tour',
    },
    booking: {
      id: generateBookingId(),
      quantity: 1,
      total_amount: 1200,
    },
  },
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-5',
    ticket_type_id: 'ticket-type-5',
    status: 'valid',
    checked_in_at: null,
    checked_in_by: null,
    created_at: generateDate(-2),
    event: mockEvents[4],
    ticket_type: {
      id: 'ticket-type-5',
      name: 'Premium Tasting',
      description: 'Premium wine selection with snacks',
    },
    booking: {
      id: generateBookingId(),
      quantity: 2,
      total_amount: 4500,
    },
  },

  // ============================================
  // USED TICKETS (Past Events - Checked In)
  // ============================================
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-6',
    ticket_type_id: 'ticket-type-6',
    status: 'used',
    checked_in_at: generateDate(-5, 9),
    checked_in_by: 'host-6',
    created_at: generateDate(-15),
    event: mockEvents[5],
    ticket_type: {
      id: 'ticket-type-6',
      name: 'Full Day Pass',
      description: 'Complete wellness experience',
    },
    booking: {
      id: generateBookingId(),
      quantity: 1,
      total_amount: 2500,
    },
  },
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-7',
    ticket_type_id: 'ticket-type-7',
    status: 'used',
    checked_in_at: generateDate(-10, 20),
    checked_in_by: 'host-7',
    created_at: generateDate(-20),
    event: mockEvents[6],
    ticket_type: {
      id: 'ticket-type-7',
      name: 'Standard Ticket',
      description: 'Regular entry',
    },
    booking: {
      id: generateBookingId(),
      quantity: 2,
      total_amount: 1000,
    },
  },

  // ============================================
  // EXPIRED TICKETS (Past Events - Not Used)
  // ============================================
  {
    id: generateId(),
    booking_id: generateBookingId(),
    user_id: 'user-1',
    event_id: 'event-6',
    ticket_type_id: 'ticket-type-6',
    status: 'expired',
    checked_in_at: null,
    checked_in_by: null,
    created_at: generateDate(-20),
    event: mockEvents[5],
    ticket_type: {
      id: 'ticket-type-6',
      name: 'Full Day Pass',
      description: 'Complete wellness experience',
    },
    booking: {
      id: generateBookingId(),
      quantity: 1,
      total_amount: 2500,
    },
  },
];
