import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import type { Event } from '../../src/types';
import { useEvents, useFeaturedEvents } from '../../src/hooks/use-events';

// New Components
import CategoryDetail from '../../src/components/CategoryDetail';
import TripsDetail, { DUMMY_TRIPS } from '../../src/components/TripsDetail';
import SearchModal from '../../src/components/SearchModal';

// Centralized icon map for category icons
// Pre-load icons with spaces in filenames to avoid require() issues
const BoardGameIcon = require('../../assets/categoriesicons/Board Game.png');
const HousePartyIcon = require('../../assets/categoriesicons/House Party.png');
const DJNightIcon = require('../../assets/categoriesicons/DJ Night.png');

const CATEGORY_ICONS: Record<string, any> = {
  Music: require('../../assets/categoriesicons/Music.png'),
  Comedy: DJNightIcon,
  Sports: require('../../assets/categoriesicons/Sports.png'),
  Cultural: require('../../assets/categoriesicons/Cultural.png'),
  Dance: require('../../assets/categoriesicons/Dance.png'),
  Theatre: require('../../assets/categoriesicons/Cultural.png'),
  Art: require('../../assets/categoriesicons/Art.png'),
  Gaming: require('../../assets/categoriesicons/Gaming.png'),
  'E-Games': require('../../assets/categoriesicons/Gaming.png'),
  'Board Games': BoardGameIcon,
  Entertainment: require('../../assets/categoriesicons/Play.png'),
  Outdoors: require('../../assets/categoriesicons/Outdoors.png'),
  Getaway: require('../../assets/categoriesicons/Camping.png'),
  Hiking: require('../../assets/categoriesicons/Hiking.png'),
  Running: require('../../assets/categoriesicons/Walking.png'),
  Nightlife: require('../../assets/categoriesicons/Nightlife.png'),
  Parties: HousePartyIcon,
  Clubs: DJNightIcon,
  Cafes: require('../../assets/categoriesicons/Nightout.png'),
  Movies: require('../../assets/categoriesicons/Play.png'),
  Wellness: require('../../assets/categoriesicons/Wellness.png'),
  Yoga: require('../../assets/categoriesicons/Yoga.png'),
  Retreat: require('../../assets/categoriesicons/Meditation.png'),
  Rehab: require('../../assets/categoriesicons/Wellness.png'),
};

// Category structure with subcategories
interface CategoryTag {
  id: string;
  label: string;
  icon: any; // Using require() for local images
  subcategories?: { id: string; label: string; icon: any }[];
}

const CATEGORIES = [
  {
    id: 'events',
    label: 'For You',
    icon: 'sparkles-outline',
  },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: 'compass-outline',
  },
  {
    id: 'trips',
    label: 'Trips',
    icon: 'airplane-outline',
  },
];

const FEATURED_EXPERIENCES = [
  // Cultural - Music
  {
    id: 'exp1',
    title: 'Live Jazz Night',
    image:
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 1200,
    rating: 4.8,
    location: 'Indiranagar',
    location_name: 'Indiranagar',
    description: 'Experience the magic of live jazz music with talented musicians.',
    type: 'experience',
    category: 'Music',
    tags: ['Music', 'Cultural', 'Live Performance'],
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
  },
  // Cultural - Dance
  {
    id: 'exp2',
    title: 'Salsa Dance Workshop',
    image:
      'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 800,
    rating: 4.9,
    location: 'Koramangala',
    location_name: 'Koramangala',
    description: 'Learn salsa dancing from professional instructors in a fun environment.',
    type: 'experience',
    category: 'Dance',
    tags: ['Dance', 'Cultural', 'Workshop'],
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
  // Cultural - Theatre
  {
    id: 'exp3',
    title: 'Shakespeare Play Night',
    image:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 600,
    rating: 4.7,
    location: 'MG Road',
    location_name: 'MG Road',
    description: 'Watch a classic Shakespeare play performed by renowned theatre artists.',
    type: 'experience',
    category: 'Theatre',
    tags: ['Theatre', 'Cultural', 'Drama'],
    start_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
  },
  // Cultural - Art
  {
    id: 'exp4',
    title: 'Pottery Workshop',
    image:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 1200,
    rating: 4.8,
    location: 'Whitefield',
    location_name: 'Whitefield',
    description:
      'Learn the art of pottery making with expert instructors. Create your own masterpiece!',
    type: 'experience',
    category: 'Art',
    tags: ['Art', 'Cultural', 'Workshop'],
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
  },
  // Games - Sports
  {
    id: 'exp5',
    title: 'Sunday Football Match',
    image:
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 300,
    rating: 4.6,
    location: 'HSR Layout',
    location_name: 'HSR Layout',
    description: 'Join us for a friendly football match every Sunday morning.',
    type: 'experience',
    category: 'Sports',
    tags: ['Sports', 'Games', 'Football'],
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
  // Games - E-Games
  {
    id: 'exp6',
    title: 'Gaming Tournament - PUBG',
    image:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 500,
    rating: 4.9,
    location: 'Marathahalli',
    location_name: 'Marathahalli',
    description: 'Compete in an exciting PUBG tournament with amazing prizes!',
    type: 'experience',
    category: 'E-Games',
    tags: ['E-Games', 'Games', 'Gaming'],
    start_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
  },
  // Games - Board Games
  {
    id: 'exp7',
    title: 'Board Game Cafe Night',
    image:
      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 400,
    rating: 4.5,
    location: 'Jayanagar',
    location_name: 'Jayanagar',
    description: 'Enjoy classic and modern board games with friends in a cozy cafe.',
    type: 'experience',
    category: 'Board Games',
    tags: ['Board Games', 'Games', 'Social'],
    start_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
  },
  // Entertainment
  {
    id: 'exp8',
    title: 'Stand-up Comedy Night',
    image:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 499,
    rating: 4.5,
    location: 'Koramangala',
    location_name: 'Koramangala',
    description: 'An evening of laughter with some of the best comedians in town!',
    type: 'experience',
    category: 'Entertainment',
    tags: ['Entertainment', 'Comedy'],
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
  // Outdoors - Hiking
  {
    id: 'exp9',
    title: 'Nandi Hills Sunrise Trek',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 800,
    rating: 4.8,
    location: 'Nandi Hills',
    location_name: 'Nandi Hills',
    description: 'Experience a breathtaking sunrise trek at Nandi Hills.',
    type: 'experience',
    category: 'Hiking',
    tags: ['Hiking', 'Outdoors', 'Trek'],
    start_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
  },
  // Outdoors - Running
  {
    id: 'exp10',
    title: 'Morning Run Club',
    image:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 0,
    rating: 4.7,
    location: 'Cubbon Park',
    location_name: 'Cubbon Park',
    description: 'Join our morning running club at Cubbon Park. Free for all!',
    type: 'experience',
    category: 'Running',
    tags: ['Running', 'Outdoors', 'Fitness'],
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
  },
  // Nightlife - Parties
  {
    id: 'exp11',
    title: 'Weekend House Party',
    image:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 1500,
    rating: 4.9,
    location: 'Indiranagar',
    location_name: 'Indiranagar',
    description: 'Dance the night away at the hottest house party in town!',
    type: 'experience',
    category: 'Parties',
    tags: ['Parties', 'Nightlife', 'Dance'],
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
  },
  // Nightlife - Clubs
  {
    id: 'exp12',
    title: 'DJ Night at SkyBar',
    image:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 2000,
    rating: 4.8,
    location: 'UB City',
    location_name: 'UB City',
    description: 'Experience world-class DJs spinning at the best rooftop club.',
    type: 'experience',
    category: 'Clubs',
    tags: ['Clubs', 'Nightlife', 'DJ'],
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
  },
  // Nightlife - Cafes
  {
    id: 'exp13',
    title: 'Late Night Coffee & Music',
    image:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 300,
    rating: 4.6,
    location: 'Church Street',
    location_name: 'Church Street',
    description: 'Enjoy coffee and live acoustic music at our cozy cafe.',
    type: 'experience',
    category: 'Cafes',
    tags: ['Cafes', 'Nightlife', 'Music'],
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
  },
  // Nightlife - Movies
  {
    id: 'exp14',
    title: 'Open Air Cinema Night',
    image:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 500,
    rating: 4.7,
    location: 'JP Nagar',
    location_name: 'JP Nagar',
    description: 'Watch classic movies under the stars at our open-air cinema.',
    type: 'experience',
    category: 'Movies',
    tags: ['Movies', 'Nightlife', 'Entertainment'],
    start_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
  },
  // Wellness - Yoga
  {
    id: 'exp15',
    title: 'Sunrise Yoga Session',
    image:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 500,
    rating: 4.9,
    location: 'Ulsoor Lake',
    location_name: 'Ulsoor Lake',
    description: 'Start your day with peaceful yoga by the lake.',
    type: 'experience',
    category: 'Yoga',
    tags: ['Yoga', 'Wellness', 'Fitness'],
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
  // Wellness - Retreat
  {
    id: 'exp16',
    title: 'Weekend Wellness Retreat',
    image:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    cover_image_url:
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 5000,
    rating: 4.8,
    location: 'Coorg',
    location_name: 'Coorg',
    description: 'Rejuvenate your mind and body at our wellness retreat in Coorg.',
    type: 'experience',
    category: 'Retreat',
    tags: ['Retreat', 'Wellness', 'Meditation'],
    start_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Category structure with subcategories
interface CategoryTag {
  id: string;
  label: string;
  icon: any; // Using require() for local images
  subcategories?: { id: string; label: string; icon: any }[];
}

const CATEGORY_TAGS_BY_TYPE: Record<string, CategoryTag[]> = {
  events: [
    {
      id: 'all',
      label: 'All',
      icon: CATEGORY_ICONS.Play, // Using Play icon for "All"
    },
    {
      id: 'Music',
      label: 'Music',
      icon: CATEGORY_ICONS.Music,
    },
    {
      id: 'Comedy',
      label: 'Comedy',
      icon: CATEGORY_ICONS.Comedy,
    },
    {
      id: 'Sports',
      label: 'Sports',
      icon: CATEGORY_ICONS.Sports,
    },
  ],
  experiences: [
    {
      id: 'all',
      label: 'All',
      icon: CATEGORY_ICONS.Play, // Using Play icon for "All"
    },
    {
      id: 'Cultural',
      label: 'Cultural',
      icon: CATEGORY_ICONS.Cultural,
      subcategories: [
        { id: 'Music', label: 'Music', icon: CATEGORY_ICONS.Music },
        { id: 'Dance', label: 'Dance', icon: CATEGORY_ICONS.Dance },
        { id: 'Theatre', label: 'Theatre', icon: CATEGORY_ICONS.Theatre },
        { id: 'Art', label: 'Art', icon: CATEGORY_ICONS.Art },
      ],
    },
    {
      id: 'Games',
      label: 'Games',
      icon: CATEGORY_ICONS.Gaming,
      subcategories: [
        { id: 'Sports', label: 'Sports', icon: CATEGORY_ICONS.Sports },
        { id: 'E-Games', label: 'E-Games', icon: CATEGORY_ICONS['E-Games'] },
        { id: 'Board Games', label: 'Board Games', icon: CATEGORY_ICONS['Board Games'] },
      ],
    },
    {
      id: 'Entertainment',
      label: 'Entertainment',
      icon: CATEGORY_ICONS.Entertainment,
    },
    {
      id: 'Outdoors',
      label: 'Outdoors',
      icon: CATEGORY_ICONS.Outdoors,
      subcategories: [
        { id: 'Getaway', label: 'Getaway', icon: CATEGORY_ICONS.Getaway },
        { id: 'Hiking', label: 'Hiking', icon: CATEGORY_ICONS.Hiking },
        { id: 'Running', label: 'Running', icon: CATEGORY_ICONS.Running },
      ],
    },
    {
      id: 'Nightlife',
      label: 'Nightlife',
      icon: CATEGORY_ICONS.Nightlife,
      subcategories: [
        { id: 'Parties', label: 'Parties', icon: CATEGORY_ICONS.Parties },
        { id: 'Clubs', label: 'Clubs', icon: CATEGORY_ICONS.Clubs },
        { id: 'Cafes', label: 'Cafes', icon: CATEGORY_ICONS.Cafes },
        { id: 'Movies', label: 'Movies', icon: CATEGORY_ICONS.Movies },
      ],
    },
    {
      id: 'Wellness',
      label: 'Wellness',
      icon: CATEGORY_ICONS.Wellness,
      subcategories: [
        { id: 'Yoga', label: 'Yoga', icon: CATEGORY_ICONS.Yoga },
        { id: 'Retreat', label: 'Retreat', icon: CATEGORY_ICONS.Retreat },
        { id: 'Rehab', label: 'Rehab', icon: CATEGORY_ICONS.Rehab },
      ],
    },
  ],
  trips: [], // Trips handled by TripsDetail component directly
};

export default function ExploreTab() {
  const router = useRouter();
  const [searchModalVisible, setSearchModalVisible] = useState(false);

  // State for active view - now inline on same page, default to 'events' (For You)
  const [activeView, setActiveView] = useState<string | null>('events');
  const [selectedTag, setSelectedTag] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('All Locations');

  const { events, loading, refresh } = useEvents();
  const { events: featuredExperiences } = useFeaturedEvents(5, 'experience');
  const { events: featuredTrips } = useFeaturedEvents(5, 'trip');

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  // Combine real events with mock data
  const allEvents = [...events, ...FEATURED_EXPERIENCES] as Event[];

  // Filter logic with comprehensive keyword search
  const filteredEvents = allEvents.filter((event: Event) => {
    // Keyword search - searches across multiple fields
    if (searchQuery) {
      const query = searchQuery.toLowerCase();

      // Search in title
      const titleMatch = event.title.toLowerCase().includes(query);

      // Search in description
      const descMatch = event.description?.toLowerCase().includes(query) || false;
      const shortDescMatch = event.short_description?.toLowerCase().includes(query) || false;

      // Search in category
      const categoryMatch = event.category?.toLowerCase().includes(query) || false;

      // Search in tags
      const tagsMatch = event.tags.some((tag) => tag.toLowerCase().includes(query));

      // Search in location fields
      const locationNameMatch = event.location_name?.toLowerCase().includes(query) || false;
      const locationAddressMatch = event.location_address?.toLowerCase().includes(query) || false;
      const departureLocationMatch =
        event.departure_location?.toLowerCase().includes(query) || false;

      // If none of the fields match, filter out
      if (
        !titleMatch &&
        !descMatch &&
        !shortDescMatch &&
        !categoryMatch &&
        !tagsMatch &&
        !locationNameMatch &&
        !locationAddressMatch &&
        !departureLocationMatch
      ) {
        return false;
      }
    }

    // Location filter
    if (searchLocation && searchLocation !== 'All Locations') {
      const locationLower = searchLocation.toLowerCase();

      // For trips, check departure_location
      if (event.type === 'trip') {
        const tripLocationMatch =
          event.departure_location?.toLowerCase().includes(locationLower) || false;
        if (!tripLocationMatch) return false;
      }
      // For experiences/events, check location_name
      else {
        const eventLocationMatch =
          event.location_name?.toLowerCase().includes(locationLower) || false;
        if (!eventLocationMatch) return false;
      }
    }

    // Type mapping
    const typeMap: Record<string, string> = {
      events: 'event',
      experiences: 'experience',
      trips: 'trip',
    };

    if (activeView) {
      const eventType = typeMap[activeView];
      if (eventType && event.type !== eventType) return false;
    }

    // Category filtering with subcategory support
    if (activeView !== 'trips' && selectedTag !== 'all') {
      // Find the selected category configuration
      const categoryTags = CATEGORY_TAGS_BY_TYPE[activeView] || [];
      const selectedCategory = categoryTags.find((cat) => cat.id === selectedTag);

      // If category has subcategories, match against any subcategory
      if (selectedCategory?.subcategories && selectedCategory.subcategories.length > 0) {
        const subcategoryIds = selectedCategory.subcategories.map((sub) => sub.id);
        const matchesSubcategory =
          event.category &&
          subcategoryIds.some((subId) => subId.toLowerCase() === event.category?.toLowerCase());
        const matchesMainCategory = event.category?.toLowerCase() === selectedTag.toLowerCase();
        const matchesInTags =
          event.tags &&
          event.tags.some((tag) =>
            subcategoryIds.some((subId) => subId.toLowerCase() === tag.toLowerCase())
          );

        if (!matchesSubcategory && !matchesMainCategory && !matchesInTags) {
          return false;
        }
      } else {
        // No subcategories, use exact match
        if (event.category !== selectedTag) {
          return false;
        }
      }
    }

    return true;
  });

  const handleCategoryPress = (categoryId: string) => {
    if (categoryId === 'trips') {
      // For trips, navigate to the trips category view (not inline)
      setActiveView('trips');
      setSelectedTag('trips'); // Set to 'trips' to show full page view
    } else if (activeView === categoryId) {
      // If clicking the same category (except trips), toggle back to 'events' (For You)
      setActiveView('events');
      setSelectedTag('all');
    } else {
      // Otherwise, switch to the new category
      setActiveView(categoryId);
      setSelectedTag('all');
    }
  };

  const handleSearch = (location: string, query: string, _radius: number) => {
    setSearchLocation(location);
    setSearchQuery(query);
    // TODO: Use radius for nearby search filtering
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Logo - Hide when a specific category (not 'all') is selected */}
      {selectedTag === 'all' && (
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/arz.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      )}

      {/* Search Bar Header */}
      <View style={styles.headerContainer}>
        {/* Back button - Show when a specific category is selected */}
        {selectedTag !== 'all' && (
          <Pressable
            onPress={() => {
              setSelectedTag('all');
              // Also reset to 'events' view when going back
              if (activeView === 'trips') {
                setActiveView('events');
              }
            }}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
        )}

        <Pressable style={styles.searchBar} onPress={() => setSearchModalVisible(true)}>
          <Ionicons name="search" size={20} color={Colors.text} />
          <Text style={styles.searchPlaceholder} numberOfLines={1}>
            {searchQuery
              ? `${searchQuery}${searchLocation !== 'All Locations' ? ` • ${searchLocation}` : ''}`
              : 'Search events, activities...'}
          </Text>
        </Pressable>

        {selectedTag === 'all' && (
          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.text} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.mainContent}>
          {/* 1. Horizontal Circular Categories - Show only when 'all' is selected */}
          {selectedTag === 'all' && (
            <View style={styles.categoriesRow}>
              {CATEGORIES.map((cat) => {
                const isActive = activeView === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={styles.categoryCircleContainer}
                    onPress={() => handleCategoryPress(cat.id)}
                  >
                    <View style={[styles.categoryCircle, isActive && styles.categoryCircleActive]}>
                      <Ionicons
                        name={cat.icon as any}
                        size={32}
                        color={isActive ? '#fff' : Colors.primary}
                      />
                    </View>
                    <Text style={[styles.categoryLabel, isActive && styles.categoryLabelActive]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 2. Show categories and events inline when Experiences is clicked */}
          {activeView === 'experiences' && (
            <View>
              <CategoryDetail
                type="experiences"
                tags={CATEGORY_TAGS_BY_TYPE['experiences'] || []}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                events={filteredEvents}
                onEventPress={(id) => router.push(`/events/${id}`)}
                showInline={selectedTag === 'all'}
              />
            </View>
          )}

          {/* 3. Show trips detail as full page when Trips is clicked */}
          {activeView === 'trips' && selectedTag === 'trips' && (
            <View>
              <TripsDetail
                events={filteredEvents}
                onTripPress={(id) => router.push(`/events/${id}`)}
              />
            </View>
          )}

          {/* 4. Show featured sections when For You is selected with 'all' tag */}
          {activeView === 'events' && selectedTag === 'all' && (
            <>
              {/* Top Experiences Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Top Experiences</Text>
                  <Pressable onPress={() => handleCategoryPress('experiences')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {(featuredExperiences.length > 0
                    ? featuredExperiences
                    : FEATURED_EXPERIENCES
                  ).map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.horizontalCard}
                      onPress={() => router.push(`/events/${item.id}`)}
                    >
                      <Image
                        source={{
                          uri:
                            (item as any).image ||
                            (item as any).cover_image_url ||
                            'https://via.placeholder.com/150',
                        }}
                        style={styles.horizontalCardImage}
                      />
                      <View style={styles.horizontalCardContent}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.cardRow}>
                          <Text style={styles.cardLocation}>
                            {(item as any).location || (item as any).location_name || ''}
                          </Text>
                          <Text style={styles.cardRating}>★ {(item as any).rating || '4.5'}</Text>
                        </View>
                        <Text style={styles.cardPrice}>
                          {(item as any).price
                            ? typeof (item as any).price === 'string'
                              ? (item as any).price
                              : `₹${(item as any).price}`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Popular Trips Section */}
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionTitle}>Popular Trips</Text>
                  <Pressable onPress={() => handleCategoryPress('trips')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </Pressable>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {(featuredTrips.length > 0 ? featuredTrips : DUMMY_TRIPS).map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.horizontalCard}
                      onPress={() => router.push(`/events/${item.id}`)}
                    >
                      <Image
                        source={{
                          uri:
                            (item as any).image ||
                            (item as any).cover_image_url ||
                            'https://via.placeholder.com/150',
                        }}
                        style={styles.horizontalCardImage}
                      />
                      <View style={styles.horizontalCardContent}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.cardRow}>
                          <Text style={styles.cardLocation}>
                            {(item as any).location || (item as any).location_name || ''}
                          </Text>
                          <Text style={styles.cardRating}>★ {(item as any).rating || '4.5'}</Text>
                        </View>
                        <Text style={styles.cardPrice}>
                          {(item as any).price
                            ? typeof (item as any).price === 'string'
                              ? (item as any).price
                              : `₹${(item as any).price}`
                            : ''}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* 5. Show events detail when a specific category is selected within For You */}
          {activeView === 'events' && selectedTag !== 'all' && (
            <View>
              <CategoryDetail
                type="events"
                tags={CATEGORY_TAGS_BY_TYPE['events'] || []}
                selectedTag={selectedTag}
                onSelectTag={setSelectedTag}
                events={filteredEvents}
                onEventPress={(id) => router.push(`/events/${id}`)}
                showInline={false}
              />
            </View>
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Search Modal */}
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        onSearch={handleSearch}
        searchContext={
          activeView === 'trips' ? 'trips' : activeView === 'experiences' ? 'experiences' : 'all'
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  logo: {
    width: 120,
    height: 48,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    padding: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  notificationButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  mainContent: {
    paddingBottom: Spacing.xl,
  },
  // Categories (Circles)
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute evenly
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  categoryCircleContainer: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // White background
    borderWidth: 1, // Optional: add a subtle border or keep clean
    borderColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, // Softer shadow
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryCircleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  categoryLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  // Featured Sections
  sectionContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  horizontalCard: {
    width: 220,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  horizontalCardImage: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surfaceSecondary,
  },
  horizontalCardContent: {
    padding: Spacing.sm,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLocation: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardRating: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
});
