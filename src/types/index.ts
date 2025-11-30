export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  age?: number;
  isHost: boolean;
  isAdmin: boolean;
  hostVerificationStatus?: 'pending' | 'approved' | 'rejected';
  hostDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    panNumber: string;
    aadharNumber: string;
    upiId: string;
  };
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  ticketPrice: number;
  totalTickets: number;
  availableTickets: number;
  bannerImage: string;
  galleryImages: string[];
  ageLimit: number;
  refundPolicy: string;
  organizerContact: string;
  eventRules: string[];
  hostId: string;
  hostName: string;
  hostProfilePicture?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  trending?: boolean;
  featured?: boolean;
}

export type EventCategory = 
  | 'concert' 
  | 'festival' 
  | 'sports' 
  | 'party' 
  | 'workshop' 
  | 'conference' 
  | 'exhibition'
  | 'other';

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventBanner: string;
  userId: string;
  userName: string;
  userEmail: string;
  qrCode: string;
  purchaseDate: string;
  amount: number;
  paymentId: string;
  status: 'active' | 'used' | 'cancelled' | 'refunded';
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  receiverId: string;
  receiverName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Friendship {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderProfilePicture?: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  replyTo?: string;
  createdAt: string;
  updatedAt?: string;
  deletedFor?: string[];
}

export interface ChatRoom {
  id: string;
  type: 'personal' | 'group';
  participants: string[];
  eventId?: string;
  eventTitle?: string;
  name?: string;
  lastMessage?: Message;
  updatedAt: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'friend_request'
  | 'friend_accepted'
  | 'ticket_booked'
  | 'event_reminder'
  | 'event_update'
  | 'host_approval'
  | 'group_message'
  | 'personal_message'
  | 'payment_success'
  | 'payment_failed'
  | 'admin_announcement'
  | 'new_event';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaymentRequest {
  eventId: string;
  amount: number;
  upiId: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  orderId: string;
}
