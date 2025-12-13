import type { EventGroup, DMConversation } from '../types/chat.types';

/**
 * Mock Chats Data for UI Development
 * This file contains hardcoded chat conversations for testing the UI without database connection
 */

const generateDate = (daysAgo: number, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

// Mock Event Groups (Group Chats)
export const mockEventGroups: EventGroup[] = [
  {
    id: 'group-1',
    event_id: 'event-1',
    name: 'Mumbai Music Festival 2025',
    description: 'Group chat for Mumbai Music Festival attendees',
    created_at: generateDate(15),
    event: {
      id: 'event-1',
      title: 'Mumbai Music Festival 2025',
      cover_image_url:
        'https://marketplace.canva.com/EAGPCwbGzbU/2/0/1131w/canva-school-is-cool-retro-groovy-positive-quote-illustrated-colorful-poster-k2DDIEC4h3c.jpg',
    },
    member_count: 1247,
    unread_count: 3,
    last_message: {
      id: 'msg-1',
      group_id: 'group-1',
      user_id: 'user-2',
      content: 'Hey! Who else is excited for the festival? 🎵',
      message_type: 'text',
      is_deleted: false,
      created_at: generateDate(0, 14),
      user: {
        id: 'user-2',
        full_name: 'Priya Sharma',
        avatar_url: null,
      },
    },
  },
  {
    id: 'group-2',
    event_id: 'event-2',
    name: 'Tech Startup Summit',
    description: 'Network with entrepreneurs and investors',
    created_at: generateDate(12),
    event: {
      id: 'event-2',
      title: 'Tech Startup Summit',
      cover_image_url:
        'https://d1csarkz8obe9u.cloudfront.net/themedlandingpages/tlp_hero_cool-posters-e2b967a0744ce61fa470e8619dc67ea3.jpg?ts%20=%201754367941',
    },
    member_count: 342,
    unread_count: 0,
    last_message: {
      id: 'msg-2',
      group_id: 'group-2',
      user_id: 'user-3',
      content: 'Looking forward to the networking session!',
      message_type: 'text',
      is_deleted: false,
      created_at: generateDate(1, 16),
      user: {
        id: 'user-3',
        full_name: 'Rahul Mehta',
        avatar_url: null,
      },
    },
  },
  {
    id: 'group-3',
    event_id: 'event-3',
    name: 'Sunrise Hot Air Balloon Ride',
    description: 'Share your balloon ride experience',
    created_at: generateDate(8),
    event: {
      id: 'event-3',
      title: 'Sunrise Hot Air Balloon Ride',
      cover_image_url:
        'https://images-cdn.ubuy.co.in/6466130ce3259873f74b6b58-surfing-poster-hawaii-aloha-paradise.jpg',
    },
    member_count: 20,
    unread_count: 1,
    last_message: {
      id: 'msg-3',
      group_id: 'group-3',
      user_id: 'user-4',
      content: 'What time should we arrive?',
      message_type: 'text',
      is_deleted: false,
      created_at: generateDate(0, 8),
      user: {
        id: 'user-4',
        full_name: 'Anjali Patel',
        avatar_url: null,
      },
    },
  },
  {
    id: 'group-4',
    event_id: 'event-4',
    name: 'Photography Walk - Old Delhi',
    description: 'Photography enthusiasts group',
    created_at: generateDate(5),
    event: {
      id: 'event-4',
      title: 'Photography Walk - Old Delhi',
      cover_image_url:
        'https://img.freepik.com/free-photo/revolution-still-life-design_23-2149061100.jpg?semt=ais_hybrid&w=740&q=80',
    },
    member_count: 15,
    unread_count: 0,
    last_message: {
      id: 'msg-4',
      group_id: 'group-4',
      user_id: 'user-5',
      content: "Don't forget to bring your cameras! 📸",
      message_type: 'text',
      is_deleted: false,
      created_at: generateDate(2, 10),
      user: {
        id: 'user-5',
        full_name: 'Vikram Singh',
        avatar_url: null,
      },
    },
  },
  {
    id: 'group-5',
    event_id: 'event-5',
    name: 'Wine Tasting Experience',
    description: 'Wine connoisseurs discussion',
    created_at: generateDate(3),
    event: {
      id: 'event-5',
      title: 'Wine Tasting Experience',
      cover_image_url:
        'https://ih1.redbubble.net/image.672935128.9185/flat,750x,075,f-pad,750x1000,f8f8f8.u2.jpg',
    },
    member_count: 30,
    unread_count: 5,
    last_message: {
      id: 'msg-5',
      group_id: 'group-5',
      user_id: 'user-6',
      content: "Can't wait to try the premium selection! 🍷",
      message_type: 'text',
      is_deleted: false,
      created_at: generateDate(0, 19),
      user: {
        id: 'user-6',
        full_name: 'Sneha Reddy',
        avatar_url: null,
      },
    },
  },
];

// Mock Direct Message Conversations
export const mockDMConversations: DMConversation[] = [
  {
    id: 'dm-1',
    user_id_1: 'user-1',
    user_id_2: 'user-7',
    created_at: generateDate(10),
    updated_at: generateDate(0, 15),
    other_user: {
      id: 'user-7',
      full_name: 'Amit Kumar',
      avatar_url: null,
    },
    unread_count: 2,
    last_message: {
      id: 'dmsg-1',
      conversation_id: 'dm-1',
      sender_id: 'user-7',
      content: 'Hey! Are you going to the music festival too?',
      message_type: 'text',
      is_read: false,
      is_deleted: false,
      created_at: generateDate(0, 15),
      sender: {
        id: 'user-7',
        full_name: 'Amit Kumar',
        avatar_url: null,
      },
    },
  },
  {
    id: 'dm-2',
    user_id_1: 'user-1',
    user_id_2: 'user-8',
    created_at: generateDate(7),
    updated_at: generateDate(1, 12),
    other_user: {
      id: 'user-8',
      full_name: 'Kavita Desai',
      avatar_url: null,
    },
    unread_count: 0,
    last_message: {
      id: 'dmsg-2',
      conversation_id: 'dm-2',
      sender_id: 'user-1',
      content: 'Thanks for the info! See you there.',
      message_type: 'text',
      is_read: true,
      is_deleted: false,
      created_at: generateDate(1, 12),
      sender: {
        id: 'user-1',
        full_name: 'You',
        avatar_url: null,
      },
    },
  },
  {
    id: 'dm-3',
    user_id_1: 'user-1',
    user_id_2: 'user-9',
    created_at: generateDate(5),
    updated_at: generateDate(0, 9),
    other_user: {
      id: 'user-9',
      full_name: 'Rajesh Nair',
      avatar_url: null,
    },
    unread_count: 1,
    last_message: {
      id: 'dmsg-3',
      conversation_id: 'dm-3',
      sender_id: 'user-9',
      content: 'The photography walk was amazing! 📷',
      message_type: 'text',
      is_read: false,
      is_deleted: false,
      created_at: generateDate(0, 9),
      sender: {
        id: 'user-9',
        full_name: 'Rajesh Nair',
        avatar_url: null,
      },
    },
  },
];
