import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Dimensions,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';
import { Fonts } from '../../src/constants/Fonts';
import { Spacing, BorderRadius } from '../../src/constants/Styles';
import LoadingSpinner from '../../src/components/ui/loading-spinner';
import { useEvent } from '../../src/hooks/use-events';

// Icon imports from assets/others
const LocationIcon = require("../../assets/others/location.png");
const DateTimeIcon = require("../../assets/others/dateandtime.png");

// Mock data for demo experiences/trips
const MOCK_EVENTS: Record<string, any> = {
  exp1: {
    id: 'exp1',
    title: 'Live Jazz Night',
    cover_image_url:
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 1200,
    location_name: 'Indiranagar',
    location_address: 'Indiranagar, Bangalore',
    description: 'Experience the magic of live jazz music with talented musicians.',
    type: 'experience',
    category: 'Music',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    max_capacity: 100,
    current_bookings: 75,
    tags: ['Music', 'Cultural', 'Live Performance'],
    host: {
      full_name: 'Aditya Negi',
      avatar_url: 'https://i.pravatar.cc/150?img=12',
      bio: 'Aditya born in Bangalore. Have studied Computer Science, even...',
      reviews: 267,
      rating: 4.9,
      years_hosting: 2,
    },
    host_id: 'mock-host-1',
    currency: 'INR',
    things_to_know: [
      'Live jazz performance by professional musicians',
      'Food and beverages available at venue',
      'Outside food and drinks not allowed',
      'Age limit: 18+ only',
      'Dress code: Smart casual',
    ],
    terms_and_conditions: `• All bookings are subject to availability
• Full payment required at time of booking
• Participants must be 18+ years old
• Valid ID proof required for verification
• Follow all safety guidelines during the event`,
    cancellation_policy: `• 100% refund if cancelled 15+ days before event
• 50% refund if cancelled 7-14 days before event
• No refund if cancelled less than 7 days before event
• Refunds processed within 7-10 business days`,
  },
  exp2: {
    id: 'exp2',
    title: 'Salsa Dance Workshop',
    cover_image_url:
      'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 800,
    location_name: 'Koramangala',
    location_address: 'Koramangala, Bangalore',
    description: 'Learn salsa dancing from professional instructors in a fun environment.',
    type: 'experience',
    category: 'Dance',
    start_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    max_capacity: 40,
    current_bookings: 28,
    tags: ['Dance', 'Cultural', 'Workshop'],
    host: {
      full_name: 'Dance Academy',
      avatar_url: null,
    },
    host_id: 'mock-host-2',
    currency: 'INR',
  },
  exp3: {
    id: 'exp3',
    title: 'Shakespeare Play Night',
    cover_image_url:
      'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 499,
    location_name: 'Koramangala',
    location_address: 'Koramangala, Bangalore',
    description: 'An evening of laughter with some of the best comedians in town!',
    type: 'experience',
    category: 'Entertainment',
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    max_capacity: 100,
    current_bookings: 75,
    tags: ['Entertainment', 'Comedy'],
    host: {
      full_name: 'The Comedy Club',
      avatar_url: null,
    },
    host_id: 'mock-host-8',
    currency: 'INR',
  },
  exp9: {
    id: 'exp9',
    title: 'Nandi Hills Sunrise Trek',
    cover_image_url:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 800,
    location_name: 'Nandi Hills',
    location_address: 'Nandi Hills, Bangalore',
    description: 'Experience a breathtaking sunrise trek at Nandi Hills.',
    type: 'experience',
    category: 'Hiking',
    start_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    max_capacity: 40,
    current_bookings: 28,
    tags: ['Hiking', 'Outdoors', 'Trek'],
    host: {
      full_name: 'Trekking Club',
      avatar_url: null,
    },
    host_id: 'mock-host-9',
    currency: 'INR',
  },
  exp10: {
    id: 'exp10',
    title: 'Morning Run Club',
    cover_image_url:
      'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 0,
    location_name: 'Cubbon Park',
    location_address: 'Cubbon Park, Bangalore',
    description: 'Join our morning running club at Cubbon Park. Free for all!',
    type: 'experience',
    category: 'Running',
    start_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
    max_capacity: 50,
    current_bookings: 32,
    tags: ['Running', 'Outdoors', 'Fitness'],
    host: {
      full_name: 'Fitness Club',
      avatar_url: null,
    },
    host_id: 'mock-host-10',
    currency: 'INR',
  },
  exp11: {
    id: 'exp11',
    title: 'Weekend House Party',
    cover_image_url:
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 1500,
    location_name: 'Indiranagar',
    location_address: 'Indiranagar, Bangalore',
    description: 'Dance the night away at the hottest house party in town!',
    type: 'experience',
    category: 'Parties',
    start_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
    max_capacity: 60,
    current_bookings: 45,
    tags: ['Parties', 'Nightlife', 'Dance'],
    host: {
      full_name: 'Party Organizers',
      avatar_url: null,
    },
    host_id: 'mock-host-11',
    currency: 'INR',
  },
  exp12: {
    id: 'exp12',
    title: 'DJ Night at SkyBar',
    cover_image_url:
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    price: 2000,
    location_name: 'UB City',
    location_address: 'UB City, Bangalore',
    description: 'Dance to the beats of top DJs in a stunning rooftop setting.',
    type: 'experience',
    category: 'Clubs',
    start_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    max_capacity: 200,
    current_bookings: 160,
    tags: ['Clubs', 'Nightlife', 'DJ'],
    host: {
      full_name: 'SkyBar Bangalore',
      avatar_url: null,
    },
    host_id: 'mock-host-12',
    currency: 'INR',
  },
  trip1: {
    id: 'trip1',
    title: 'Manali Backpacking',
    cover_image_url:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    price: 8499,
    location_name: 'Manali, Himachal Pradesh',
    departure_location: 'Bangalore',
    description:
      "Embark on an unforgettable 5-day adventure in the majestic Himalayas! This carefully curated trek takes you through some of the most scenic trails in Manali, offering breathtaking views of snow-capped peaks, lush valleys, and pristine landscapes.\n\nExperience the thrill of camping under a blanket of stars, wake up to stunning mountain sunrises, and immerse yourself in the rich local culture of Himachal Pradesh. Our expert guides will lead you through challenging yet rewarding trails, ensuring your safety while you create memories that will last a lifetime.\n\nThis trip is perfect for adventure enthusiasts who want to disconnect from city life and reconnect with nature. Whether you're an experienced trekker or a beginner, our team will ensure you have the best experience. All meals, comfortable accommodation, and transport are included, so you can focus on enjoying the journey.",
    type: 'trip',
    category: 'Adventure',
    start_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 26 * 24 * 60 * 60 * 1000).toISOString(),
    max_capacity: 25,
    current_bookings: 15,
    tags: ['Trek', 'Adventure', 'Mountains', 'Camping'],
    host: {
      full_name: 'Mountain Explorers',
      avatar_url: null,
    },
    host_id: 'mock-host-4',
    currency: 'INR',
    whats_included: [
      'Transport from Bangalore',
      'Accommodation',
      'All Meals',
      'Trek Guide',
      'Safety Equipment',
    ],
    whats_not_included: ['Personal expenses', 'Travel insurance', 'Tips'],
    pickups: ['Koramangala', 'Indiranagar', 'Whitefield'],
    itinerary: [
      {
        day: 1,
        title: 'Departure and Journey',
        activities: [
          'Depart from Bangalore at 6:00 PM',
          'Overnight journey to Manali',
          'Dinner en route',
        ],
      },
      {
        day: 2,
        title: 'Arrival and Local Sightseeing',
        activities: [
          'Arrive in Manali by morning',
          'Check-in to hotel and freshen up',
          'Visit Hadimba Temple and Mall Road',
          'Evening bonfire at hotel',
        ],
      },
      {
        day: 3,
        title: 'Solang Valley Adventure',
        activities: [
          'Early morning drive to Solang Valley',
          'Paragliding and zorbing activities',
          'Lunch at local restaurant',
          'Return to hotel and rest',
        ],
      },
      {
        day: 4,
        title: 'Rohtang Pass Excursion',
        activities: [
          'Early morning departure to Rohtang Pass',
          'Snow activities and photography',
          'Packed lunch at scenic viewpoint',
          'Return by evening and group dinner',
        ],
      },
      {
        day: 5,
        title: 'Old Manali and Departure',
        activities: [
          'Breakfast and checkout',
          'Explore Old Manali cafes and shops',
          'Late afternoon departure to Bangalore',
          'Overnight journey back',
        ],
      },
    ],
    images: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
  },
  trip2: {
    id: 'trip2',
    title: 'Goa Beach Party',
    cover_image_url:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    price: 12999,
    location_name: 'Goa',
    departure_location: 'Bangalore',
    description:
      "Get ready for 4 unforgettable nights in Goa - India's ultimate beach paradise! This trip is designed for those who want to experience the perfect blend of relaxation, adventure, and nightlife.\n\nStay at our handpicked beachfront resort with stunning ocean views and easy access to the best beaches. Enjoy daily breakfast, exclusive access to the hottest beach parties, and complimentary water sports activities. Dance the night away at premium DJ events, make new friends from across the country, and create memories that will last forever.\n\nWhether you're looking to unwind on pristine beaches, try exciting water sports, or party till sunrise, this Goa trip has it all. Our experienced team will ensure you have a hassle-free and incredible experience. Perfect for solo travelers, couples, and groups!",
    type: 'trip',
    category: 'Party',
    start_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
    max_capacity: 40,
    current_bookings: 28,
    tags: ['Beach', 'Party', 'Water Sports', 'Nightlife'],
    host: {
      full_name: 'Goa Adventures',
      avatar_url: null,
    },
    host_id: 'mock-host-5',
    currency: 'INR',
    whats_included: [
      'Beachfront accommodation',
      'Daily breakfast',
      'Beach party access',
      'Water sports',
    ],
    whats_not_included: ['Lunch and dinner', 'Alcohol', 'Personal expenses'],
    pickups: ['Koramangala', 'MG Road', 'Airport'],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1537551621259-8d4c3e00c26c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583198594211-9c6b5ec5c73e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
  },
  trip3: {
    id: 'trip3',
    title: 'Kasol & Kheerganga Trek',
    cover_image_url:
      'https://images.unsplash.com/photo-1455620611406-966ca6889d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    price: 7999,
    location_name: 'Kasol, Himachal Pradesh',
    departure_location: 'Delhi',
    description:
      'Discover the magic of Kasol and Kheerganga on this 4-day Himalayan adventure! Known as the "Mini Israel of India," Kasol offers a unique blend of Israeli culture, stunning mountain views, and peaceful riverside vibes.\n\nTrek through pine forests and scenic mountain trails to reach the famous Kheerganga hot springs, where you can relax in natural thermal waters surrounded by snow-capped peaks. Camp under the stars, enjoy delicious local and Israeli cuisine at Kasol\'s famous cafes, and experience the laid-back hippie culture.\n\nThis trip is perfect for nature lovers, solo travelers, and anyone seeking peace away from the chaos of city life. Our experienced guides will ensure your safety and comfort throughout the trek. All camping equipment, meals during the trek, and transport from Delhi are included.',
    type: 'trip',
    category: 'Trek',
    start_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 39 * 24 * 60 * 60 * 1000).toISOString(),
    max_capacity: 20,
    current_bookings: 8,
    tags: ['Trek', 'Mountains', 'Camping', 'Nature'],
    host: {
      full_name: 'Himalayan Trails',
      avatar_url: null,
    },
    host_id: 'mock-host-6',
    currency: 'INR',
    whats_included: ['Transport from Delhi', 'Camping equipment', 'All meals', 'Trek guide'],
    whats_not_included: ['Travel to Delhi', 'Personal expenses', 'Snacks'],
    pickups: ['Delhi - Kashmere Gate'],
    images: [
      'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ],
  },
};

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showAllGalleryImages, setShowAllGalleryImages] = React.useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState<number | null>(null);
  const [showAllItineraryDays, setShowAllItineraryDays] = React.useState(false);
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const [showTermsModal, setShowTermsModal] = React.useState(false);
  const [showCancellationModal, setShowCancellationModal] = React.useState(false);
  const [showAllThingsToKnow, setShowAllThingsToKnow] = React.useState(false);

  // Check if this is a mock event
  const isMockEvent = id && MOCK_EVENTS[id];
  const mockEvent = isMockEvent ? MOCK_EVENTS[id] : null;

  // Use real event hook (skip if mock)
  const { event: realEvent, ticketTypes, loading, error } = useEvent(isMockEvent ? '' : id);

  // Use mock event if available, otherwise real event
  const event = mockEvent || realEvent;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return 'Free';
    return `₹${price.toLocaleString('en-IN')}`;
  };

  const handleBookNow = () => {
    router.push(`/events/${id}/book`);
  };

  const handleImagePress = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleCloseImageModal = () => {
    setSelectedImageIndex(null);
  };

  const handleNextImage = () => {
    if (
      selectedImageIndex !== null &&
      event.images &&
      selectedImageIndex < event.images.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Show loading spinner while fetching event (but not for mock events)
  if (loading && !isMockEvent) {
    return (
      <View style={styles.container}>
        <LoadingSpinner fullScreen />
      </View>
    );
  }

  if ((error || !event) && !isMockEvent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error || 'Event not found'}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const spotsLeft = (event.max_capacity || 0) - (event.current_bookings || 0);
  const isSoldOut = event.max_capacity ? spotsLeft <= 0 : false;
  const isTrip = event.type === 'trip';

  // Calculate trip duration in days
  const getTripDuration = () => {
    if (!isTrip) return 0;
    const start = new Date(event.start_date);
    const end = new Date(event.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: '',
          headerLeft: () => (
            <Pressable
              style={styles.headerButton}
              onPress={() => router.back()}
              android_ripple={{ color: Colors.border, radius: 20, borderless: false }}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        {/* Sticky Cover Image */}
        <View style={[styles.imageContainer, isTrip && styles.imageContainerTrip]}>
          {event.cover_image_url ? (
            <Image
              source={{ uri: event.cover_image_url }}
              style={styles.coverImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="musical-notes" size={64} color={Colors.textTertiary} />
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, isTrip && styles.scrollContentTrip]}
          style={styles.scrollView}
        >
          {/* Content */}
          <View style={styles.content}>
            {/* Title & Price */}
            <View style={styles.titleSection}>
              {/* Category Tags */}
              {event.tags && event.tags.length > 0 && (
                <View style={styles.categoryTagsRow}>
                  {event.tags.slice(0, 2).map((tag, index) => (
                    <View key={index} style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.title}>{event.title}</Text>

              {/* Trip-specific layout */}
              {isTrip ? (
                <>
                  {/* Departure & Pickups in one line */}
                  {(event.departure_location || (event.pickups && event.pickups.length > 0)) && (
                    <View style={styles.tripCompactRow}>
                      <Text style={styles.tripDeparturePickupText}>
                        {event.departure_location && (
                          <>
                            <Text style={styles.tripDeparturePickupLabel}>Departure - </Text>
                            {event.departure_location}
                          </>
                        )}
                        {event.pickups && event.pickups.length > 0 && (
                          <>
                            {event.departure_location && ' | '}
                            <Text style={styles.tripDeparturePickupLabel}>Pickups - </Text>
                            {event.pickups[0]}
                            {event.pickups.length > 1 && '...'}
                          </>
                        )}
                      </Text>
                    </View>
                  )}

                  {/* Destination Location */}
                  {event.location_name && (
                    <View style={styles.tripCompactRow}>
                      <Image source={LocationIcon} style={{ width: 20, height: 20 }} resizeMode="contain" />
                      <Text style={styles.tripCompactText}>{event.location_name}</Text>
                    </View>
                  )}

                  {/* Trip Duration & Dates */}
                  <View style={styles.tripCompactRow}>
                    <Image source={DateTimeIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
                    <Text style={styles.tripCompactText}>
                      {formatDateShort(event.start_date)} - {formatDateShort(event.end_date)}
                      {getTripDuration() > 0 && ` (${getTripDuration()} days)`}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Date and Time in one line */}
                  <Text style={styles.dateTimeText}>
                    {formatDate(event.start_date)} | {formatTime(event.start_date)} -{' '}
                    {formatTime(event.end_date)}
                  </Text>
                  {/* Location */}
                  {event.location_name && (
                    <View style={styles.locationRow}>
                      <Image source={LocationIcon} style={{ width: 22, height: 22 }} resizeMode="contain" />
                      <Text style={styles.locationText}>{event.location_name}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Quick Info Cards - Only show for non-trip events */}
            {!isTrip && (
              <View style={styles.quickInfoContainer}>
                <View style={styles.quickInfoCard}>
                  <Image source={DateTimeIcon} style={[styles.quickInfoIcon, { width: 28, height: 28 }]} resizeMode="contain" />
                  <View>
                    <Text style={styles.quickInfoLabel}>DATE</Text>
                    <Text style={styles.quickInfoValue}>{formatDate(event.start_date)}</Text>
                  </View>
                </View>

                <View style={styles.quickInfoCard}>
                  <Image source={DateTimeIcon} style={[styles.quickInfoIcon, { width: 28, height: 28 }]} resizeMode="contain" />
                  <View>
                    <Text style={styles.quickInfoLabel}>TIME</Text>
                    <Text style={styles.quickInfoValue}>
                      {formatTime(event.start_date)} - {formatTime(event.end_date)}
                    </Text>
                  </View>
                </View>

                <View style={styles.quickInfoCard}>
                  <Image source={LocationIcon} style={[styles.quickInfoIcon, { width: 24, height: 24 }]} resizeMode="contain" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.quickInfoLabel}>VENUE</Text>
                    <Text style={styles.quickInfoValue}>{event.location_name || 'TBA'}</Text>
                    {event.location_address && (
                      <Text style={styles.quickInfoSubValue}>{event.location_address}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Host Section - Different for trips vs experiences */}
            {event.type === 'trip' ? (
              <Pressable
                style={styles.hostSection}
                onPress={() => {
                  if (event.host_id) {
                    router.push(`/profile?userId=${event.host_id}`);
                  }
                }}
              >
                <View style={styles.hostAvatar}>
                  {event.host?.avatar_url ? (
                    <Image source={{ uri: event.host.avatar_url }} style={styles.hostAvatarImage} />
                  ) : (
                    <Text style={styles.hostAvatarText}>
                      {event.host?.full_name?.charAt(0) || 'H'}
                    </Text>
                  )}
                </View>
                <View style={styles.hostInfo}>
                  <Text style={styles.hostedBy}>Hosted by</Text>
                  <Text style={styles.hostName}>{event.host?.full_name || 'Host'}</Text>
                  <Text style={styles.hostStats}>View profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
              </Pressable>
            ) : (
              <View style={styles.hostProfileSection}>
                <View style={styles.hostProfileCard}>
                  <View style={styles.hostProfileHeader}>
                    {/* Avatar */}
                    {event.host?.avatar_url ? (
                      <Image
                        source={{ uri: event.host.avatar_url }}
                        style={styles.hostProfileAvatarImage}
                      />
                    ) : (
                      <View style={styles.hostProfileAvatar}>
                        <Text style={styles.hostProfileAvatarText}>
                          {event.host?.full_name?.charAt(0).toUpperCase() || 'H'}
                        </Text>
                      </View>
                    )}

                    {/* Host Info */}
                    <View style={styles.hostProfileInfo}>
                      <Text style={styles.hostProfileName}>{event.host?.full_name || 'Host'}</Text>
                      {event.host?.bio && (
                        <Text style={styles.hostProfileBio} numberOfLines={2}>
                          {event.host.bio}
                        </Text>
                      )}

                      {/* Social Icons */}
                      <View style={styles.socialIcons}>
                        <View style={styles.socialIcon}>
                          <Ionicons name="logo-instagram" size={20} color="#E4405F" />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Stats Row */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{event.host?.reviews || 0}</Text>
                      <Text style={styles.statLabel}>Reviews</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.statValue}>{event.host?.rating || 0}</Text>
                        <Ionicons name="star" size={16} color="#FFB800" />
                      </View>
                      <Text style={styles.statLabel}>Ratings</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{event.host?.years_hosting || 0}</Text>
                      <Text style={styles.statLabel}>Years of hosting</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Trip-Specific Details */}
            {event.type === 'trip' && (
              <>
                {/* Departure & Pickups */}
                {(event.departure_location || (event.pickups && event.pickups.length > 0)) && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Departure & Pickups</Text>
                    {event.departure_location && (
                      <View style={styles.tripDetailRow}>
                        <Ionicons
                          name="location"
                          size={20}
                          color={Colors.primary}
                          style={styles.tripDetailIcon}
                        />
                        <View style={styles.tripDetailContent}>
                          <Text style={styles.tripDetailLabel}>Departure Location</Text>
                          <Text style={styles.tripDetailValue}>{event.departure_location}</Text>
                        </View>
                      </View>
                    )}
                    {event.pickups && event.pickups.length > 0 && (
                      <View style={styles.tripDetailRow}>
                        <Ionicons
                          name="navigate"
                          size={20}
                          color={Colors.primary}
                          style={styles.tripDetailIcon}
                        />
                        <View style={styles.tripDetailContent}>
                          <Text style={styles.tripDetailLabel}>Pickup Points</Text>
                          <View style={styles.pickupChipsContainer}>
                            {event.pickups.map((pickup, index) => (
                              <View key={index} style={styles.pickupChip}>
                                <Text style={styles.pickupChipText}>{pickup}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* About this Event */}
                <View style={styles.aboutEventContainer}>
                  <Text style={styles.aboutEventTitle}>About this Event</Text>
                  <Text
                    style={styles.aboutEventText}
                    numberOfLines={showFullDescription ? undefined : 4}
                  >
                    {event.description}
                  </Text>
                  {event.description && event.description.length > 200 && (
                    <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                      <Text style={styles.aboutEventSeeMore}>
                        {showFullDescription ? 'Show less' : 'See more...'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* What's Included & Not Included */}
                {(event.whats_included || event.whats_not_included) && (
                  <View style={styles.whatsIncludedSection}>
                    {event.whats_included && (
                      <View style={styles.whatsIncludedGroup}>
                        <Text style={styles.whatsIncludedGroupTitle}>What&apos;s Included</Text>
                        {Array.isArray(event.whats_included) ? (
                          event.whats_included.map((item: string, index: number) => (
                            <View key={index} style={styles.whatsIncludedItemRow}>
                              <Text style={styles.whatsIncludedIcon}>✓</Text>
                              <Text style={styles.whatsIncludedItemText}>{item}</Text>
                            </View>
                          ))
                        ) : (
                          <View style={styles.whatsIncludedItemRow}>
                            <Text style={styles.whatsIncludedIcon}>✓</Text>
                            <Text style={styles.whatsIncludedItemText}>{event.whats_included}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {event.whats_not_included && (
                      <View style={styles.whatsNotIncludedGroup}>
                        <Text style={styles.whatsNotIncludedGroupTitle}>
                          What&apos;s NOT Included
                        </Text>
                        {Array.isArray(event.whats_not_included) ? (
                          event.whats_not_included.map((item: string, index: number) => (
                            <View key={index} style={styles.whatsNotIncludedItemRow}>
                              <Text style={styles.whatsNotIncludedIcon}>✗</Text>
                              <Text style={styles.whatsNotIncludedItemText}>{item}</Text>
                            </View>
                          ))
                        ) : (
                          <View style={styles.whatsNotIncludedItemRow}>
                            <Text style={styles.whatsNotIncludedIcon}>✗</Text>
                            <Text style={styles.whatsNotIncludedItemText}>
                              {event.whats_not_included}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Trip Gallery */}
                {event.images && event.images.length > 0 && (
                  <View style={styles.tripGalleryContainer}>
                    <Text style={styles.tripGalleryTitle}>Trip Gallery:</Text>
                    <View style={styles.tripGalleryImagesRow}>
                      {(showAllGalleryImages ? event.images : event.images.slice(0, 3)).map(
                        (imageUrl, index) => (
                          <Pressable
                            key={index}
                            style={styles.tripGalleryImageWrapper}
                            onPress={() => handleImagePress(index)}
                          >
                            <Image source={{ uri: imageUrl }} style={styles.tripGalleryImage} />
                          </Pressable>
                        )
                      )}
                    </View>
                    {event.images.length > 3 && (
                      <Pressable
                        style={styles.tripGallerySeeAll}
                        onPress={() => setShowAllGalleryImages(!showAllGalleryImages)}
                      >
                        <Text style={styles.tripGallerySeeAllText}>
                          {showAllGalleryImages ? 'Show less' : 'See all...'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Itinerary */}
                {event.itinerary && Array.isArray(event.itinerary) && (
                  <View style={styles.itineraryContainer}>
                    <Text style={styles.itineraryTitle}>Itinerary:</Text>
                    {(showAllItineraryDays ? event.itinerary : event.itinerary.slice(0, 3)).map(
                      (dayPlan: any, index: number) => (
                        <View key={index} style={styles.itineraryDay}>
                          <Text style={styles.itineraryDayTitle}>
                            Day {dayPlan.day}: {dayPlan.title}
                          </Text>
                          {dayPlan.activities &&
                            dayPlan.activities.map((activity: string, actIndex: number) => (
                              <Text key={actIndex} style={styles.itineraryActivity}>
                                • {activity}
                              </Text>
                            ))}
                        </View>
                      )
                    )}
                    {event.itinerary.length > 3 && (
                      <Pressable
                        style={styles.itinerarySeeMore}
                        onPress={() => setShowAllItineraryDays(!showAllItineraryDays)}
                      >
                        <Text style={styles.itinerarySeeMoreText}>
                          {showAllItineraryDays ? 'Show less' : 'See more...'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Ideal For */}
                {event.ideal_for && (
                  <View style={styles.section}>
                    <View style={styles.tripDetailHeader}>
                      <Ionicons
                        name="people"
                        size={22}
                        color={Colors.primary}
                        style={styles.tripDetailHeaderIcon}
                      />
                      <Text style={styles.sectionTitle}>Ideal For</Text>
                    </View>
                    <Text style={styles.tripDetailText}>{event.ideal_for}</Text>
                  </View>
                )}
              </>
            )}

            {/* About this Event - for non-trip events */}
            {event.type !== 'trip' && (
              <>
                <View style={styles.aboutEventContainer}>
                  <Text style={styles.aboutEventTitle}>About this Event</Text>
                  <Text
                    style={styles.aboutEventText}
                    numberOfLines={showFullDescription ? undefined : 4}
                  >
                    {event.description}
                  </Text>
                  {event.description && event.description.length > 200 && (
                    <Pressable onPress={() => setShowFullDescription(!showFullDescription)}>
                      <Text style={styles.aboutEventSeeMore}>
                        {showFullDescription ? 'Show less' : 'See more...'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                {/* Things to Know Section */}
                {event.things_to_know && event.things_to_know.length > 0 && (
                  <View style={styles.thingsToKnowSection}>
                    <Text style={styles.thingsToKnowTitle}>Things to know:</Text>
                    <View style={styles.thingsToKnowList}>
                      {(showAllThingsToKnow
                        ? event.things_to_know
                        : event.things_to_know.slice(0, 3)
                      ).map((item: string, index: number, array: string[]) => (
                        <View
                          key={index}
                          style={[
                            styles.thingsToKnowItem,
                            index === array.length - 1 && styles.thingsToKnowItemLast,
                          ]}
                        >
                          <Text style={styles.thingsToKnowBullet}>•</Text>
                          <Text style={styles.thingsToKnowText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                    {event.things_to_know.length > 3 && (
                      <Pressable
                        style={styles.thingsToKnowSeeAll}
                        onPress={() => setShowAllThingsToKnow(!showAllThingsToKnow)}
                      >
                        <Text style={styles.thingsToKnowSeeAllText}>
                          {showAllThingsToKnow ? 'Show less' : 'See all...'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}

                {/* Terms & Conditions Button */}
                {event.terms_and_conditions && (
                  <Pressable style={styles.policyButton} onPress={() => setShowTermsModal(true)}>
                    <Text style={styles.policyButtonText}>Terms & Conditions</Text>
                  </Pressable>
                )}

                {/* Cancellation Policy Button */}
                {event.cancellation_policy && (
                  <Pressable
                    style={styles.policyButton}
                    onPress={() => setShowCancellationModal(true)}
                  >
                    <Text style={styles.policyButtonText}>Cancellation policy</Text>
                  </Pressable>
                )}
              </>
            )}

            {/* Ticket Types */}
            {ticketTypes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ticket Options</Text>
                {ticketTypes.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketTypeCard}>
                    <View style={styles.ticketTypeInfo}>
                      <Text style={styles.ticketTypeName}>{ticket.name}</Text>
                      <Text style={styles.ticketTypeAvailable}>
                        {ticket.quantity_available} available
                      </Text>
                    </View>
                    <Text style={styles.ticketTypePrice}>{formatPrice(ticket.price)}</Text>
                  </View>
                ))}
              </View>
            )}

          </View>
        </ScrollView>

        {/* Book Now Footer */}
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <View style={[styles.footerContainer, isTrip && styles.footerContainerTrip]}>
            <View style={[styles.footerPillContainer, isTrip && styles.footerPillContainerTrip]}>
              <Text style={styles.footerPriceValue}>{formatPrice(event.price)}</Text>
              <Pressable
                style={[styles.bookButtonNested, isSoldOut && styles.bookButtonDisabled]}
                onPress={handleBookNow}
                disabled={isSoldOut}
              >
                <Text style={styles.bookButtonNestedText}>
                  {isSoldOut ? 'Sold Out' : 'Book Ticket'}
                </Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>

        {/* Image Viewer Modal */}
        {selectedImageIndex !== null && event.images && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={handleCloseImageModal}
          >
            <View style={styles.imageModalContainer}>
              <SafeAreaView style={styles.imageModalSafeArea}>
                {/* Close Button */}
                <Pressable style={styles.imageModalCloseButton} onPress={handleCloseImageModal}>
                  <Ionicons name="close" size={30} color={Colors.textInverse} />
                </Pressable>

                {/* Image Counter */}
                <View style={styles.imageModalCounter}>
                  <Text style={styles.imageModalCounterText}>
                    {selectedImageIndex + 1} / {event.images.length}
                  </Text>
                </View>

                {/* Image */}
                <View style={styles.imageModalImageContainer}>
                  <Image
                    source={{ uri: event.images[selectedImageIndex] }}
                    style={styles.imageModalImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Navigation Buttons */}
                <View style={styles.imageModalNavigation}>
                  <Pressable
                    style={[
                      styles.imageModalNavButton,
                      selectedImageIndex === 0 && styles.imageModalNavButtonDisabled,
                    ]}
                    onPress={handlePreviousImage}
                    disabled={selectedImageIndex === 0}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={32}
                      color={selectedImageIndex === 0 ? Colors.textTertiary : Colors.textInverse}
                    />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.imageModalNavButton,
                      selectedImageIndex === event.images.length - 1 &&
                        styles.imageModalNavButtonDisabled,
                    ]}
                    onPress={handleNextImage}
                    disabled={selectedImageIndex === event.images.length - 1}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={32}
                      color={
                        selectedImageIndex === event.images.length - 1
                          ? Colors.textTertiary
                          : Colors.textInverse
                      }
                    />
                  </Pressable>
                </View>
              </SafeAreaView>
            </View>
          </Modal>
        )}

        {/* Terms & Conditions Modal */}
        {showTermsModal && (
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowTermsModal(false)}
          >
            <Pressable style={styles.policyModalContainer} onPress={() => setShowTermsModal(false)}>
              <Pressable style={styles.policyModalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.policyModalHeader}>
                  <Text style={styles.policyModalTitle}>Terms & Conditions</Text>
                  <Pressable
                    onPress={() => setShowTermsModal(false)}
                    style={styles.policyModalClose}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </Pressable>
                </View>
                <ScrollView style={styles.policyModalScroll}>
                  <Text style={styles.policyModalText}>{event?.terms_and_conditions}</Text>
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        )}

        {/* Cancellation Policy Modal */}
        {showCancellationModal && (
          <Modal
            visible={true}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowCancellationModal(false)}
          >
            <Pressable
              style={styles.policyModalContainer}
              onPress={() => setShowCancellationModal(false)}
            >
              <Pressable style={styles.policyModalContent} onPress={(e) => e.stopPropagation()}>
                <View style={styles.policyModalHeader}>
                  <Text style={styles.policyModalTitle}>Cancellation Policy</Text>
                  <Pressable
                    onPress={() => setShowCancellationModal(false)}
                    style={styles.policyModalClose}
                  >
                    <Ionicons name="close" size={24} color={Colors.text} />
                  </Pressable>
                </View>
                <ScrollView style={styles.policyModalScroll}>
                  <Text style={styles.policyModalText}>{event?.cancellation_policy}</Text>
                </ScrollView>
              </Pressable>
            </Pressable>
          </Modal>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Dimensions.get('window').height * 0.69, // Start content below image
    paddingBottom: 100,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: Dimensions.get('window').height * 0.69, // 69% of screen height
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0, // Behind content
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.text,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  categoryTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  content: {
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    marginTop: -Spacing.xl, // Overlap with image for smooth transition
    zIndex: 2,
    minHeight: Dimensions.get('window').height, // Ensure content is scrollable
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  dateTimeText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  price: {
    fontSize: 22,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  quickInfoContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  quickInfoIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  quickInfoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontFamily: Fonts.semiBold,
    letterSpacing: 0.5,
  },
  quickInfoValue: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  quickInfoSubValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  availabilitySection: {
    marginBottom: Spacing.lg,
  },
  availabilityBar: {
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  availabilityFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  spotsLeft: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  soldOut: {
    color: Colors.error,
    fontFamily: Fonts.semiBold,
  },
  hostSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  hostAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hostAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  hostAvatarText: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  hostInfo: {
    flex: 1,
  },
  hostedBy: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hostName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  hostStats: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  ticketTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ticketTypeInfo: {
    flex: 1,
  },
  ticketTypeName: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: 2,
  },
  ticketTypeAvailable: {
    fontSize: 13,
    color: Colors.textTertiary,
  },
  ticketTypePrice: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.textInverse,
  },
  footer: {
    backgroundColor: Colors.background,
    paddingTop: Spacing.md,
    paddingBottom: 0,
  },
  footerContainer: {
    paddingHorizontal: Spacing.xl + Spacing.md,
    paddingBottom: Spacing.lg,
  },
  footerPillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm + 4,
    paddingVertical: Spacing.sm + 4,
    minHeight: 60,
    alignSelf: 'stretch',
  },
  footerPriceValue: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.textInverse,
  },
  bookButtonNested: {
    backgroundColor: Colors.textInverse,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 6,
    borderRadius: BorderRadius.full,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.6,
  },
  bookButtonNestedText: {
    fontSize: 15,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  // Trip-specific styles
  tripDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tripDetailHeaderIcon: {
    marginRight: Spacing.xs,
  },
  tripDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  tripDetailIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  tripDetailContent: {
    flex: 1,
  },
  tripDetailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: Fonts.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tripDetailValue: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  tripDetailText: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  pickupChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  pickupChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  pickupChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
  },
  // Trip-specific compact layout styles
  imageContainerTrip: {
    height: Dimensions.get('window').height * 0.69, // 69% for trips
  },
  scrollContentTrip: {
    paddingTop: Dimensions.get('window').height * 0.69, // Match trip image height
  },
  tripCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tripCompactText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.text,
    flex: 1,
  },
  tripCompactLabel: {
    fontFamily: Fonts.bold,
    fontSize: 14,
    color: Colors.primary,
  },
  // Departure/Pickup specific styles (maroon and bold)
  tripDeparturePickupText: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.maroon,
    flex: 1,
  },
  tripDeparturePickupLabel: {
    fontSize: 14,
    fontFamily: Fonts.bold,
    color: Colors.maroon,
  },
  footerContainerTrip: {
    paddingHorizontal: Spacing.xl + 2,
  },
  footerPillContainerTrip: {
    paddingLeft: Spacing.md + 2,
    paddingRight: Spacing.xs + 2,
    paddingVertical: Spacing.xs + 2,
  },
  // Trip Gallery styles
  tripGalleryContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tripGalleryTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  tripGalleryImagesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tripGalleryImageWrapper: {
    width: `${(100 - Spacing.sm * 2) / 3}%`,
    aspectRatio: 4 / 3,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  tripGalleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  tripGallerySeeAll: {
    alignSelf: 'flex-end',
  },
  tripGallerySeeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  // Itinerary styles
  itineraryContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  itineraryTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  itineraryDay: {
    marginBottom: Spacing.lg,
  },
  itineraryDayTitle: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  itineraryActivity: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginLeft: Spacing.sm,
  },
  itinerarySeeMore: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  itinerarySeeMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  // About Event styles
  aboutEventContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  aboutEventTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  aboutEventText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  aboutEventSeeMore: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
    marginTop: Spacing.sm,
    alignSelf: 'flex-end',
  },
  // What's Included/Not Included styles
  whatsIncludedSection: {
    marginBottom: Spacing.lg,
  },
  whatsIncludedGroup: {
    marginBottom: Spacing.lg,
  },
  whatsIncludedGroupTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  whatsIncludedItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  whatsIncludedIcon: {
    fontSize: 14,
    color: Colors.success,
    marginRight: Spacing.xs,
    lineHeight: 22,
  },
  whatsIncludedItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  whatsNotIncludedGroup: {
    marginBottom: Spacing.sm,
  },
  whatsNotIncludedGroupTitle: {
    fontSize: 16,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  whatsNotIncludedItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  whatsNotIncludedIcon: {
    fontSize: 14,
    color: Colors.error,
    marginRight: Spacing.xs,
    lineHeight: 22,
  },
  whatsNotIncludedItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    flex: 1,
  },
  // Image Modal styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalSafeArea: {
    flex: 1,
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalCounter: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  imageModalCounterText: {
    fontSize: 14,
    color: Colors.textInverse,
    fontFamily: Fonts.semiBold,
  },
  imageModalImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  imageModalNavigation: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
  },
  imageModalNavButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageModalNavButtonDisabled: {
    opacity: 0.3,
  },
  // Experience Host Profile Card Styles (copied from profile.tsx)
  hostProfileSection: {
    marginBottom: Spacing.lg,
  },
  hostProfileCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.text,
    padding: Spacing.lg,
  },
  hostProfileHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  hostProfileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostProfileAvatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  hostProfileAvatarText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontFamily: Fonts.bold,
  },
  hostProfileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hostProfileName: {
    fontSize: 18,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: 4,
  },
  hostProfileBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  socialIcons: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  socialIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  // Things to Know Styles (no border, just text with dividers)
  thingsToKnowSection: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  thingsToKnowTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  thingsToKnowList: {
    alignSelf: 'stretch',
  },
  thingsToKnowItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
  },
  thingsToKnowItemLast: {
    borderBottomWidth: 0,
  },
  thingsToKnowBullet: {
    fontSize: 16,
    color: Colors.text,
    marginRight: Spacing.xs,
    width: 15,
    flexShrink: 0,
  },
  thingsToKnowText: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.text,
    lineHeight: 22,
    paddingRight: Spacing.xl,
  },
  thingsToKnowSeeAll: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  thingsToKnowSeeAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: Fonts.medium,
    textDecorationLine: 'underline',
  },
  // Policy Button Styles
  policyButton: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  policyButtonText: {
    fontSize: 15,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  // Policy Modal Styles
  policyModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  policyModalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    paddingTop: Spacing.lg,
  },
  policyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  policyModalTitle: {
    fontSize: 20,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  policyModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyModalScroll: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  policyModalText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
});
