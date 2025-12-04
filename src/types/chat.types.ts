// Chat Types

export type MessageType = 'text' | 'image' | 'system';

// Event Group Chat
export interface EventGroup {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  created_at: string;
  // Joined fields
  event?: {
    id: string;
    title: string;
    cover_image_url: string | null;
  };
  member_count?: number;
  unread_count?: number;
  last_message?: Message;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'host';
  joined_at: string;
  // Joined fields
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Message {
  id: string;
  group_id: string;
  user_id: string;
  content: string;
  message_type: MessageType;
  is_deleted: boolean;
  created_at: string;
  // Joined fields
  user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateMessage {
  group_id: string;
  content: string;
  message_type?: MessageType;
}

// Friend Requests
export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  responded_at: string | null;
  // Joined fields
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  // Joined field - the friend's profile
  friend?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Direct Messages
export interface DMConversation {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  other_user?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  last_message?: DMMessage;
  unread_count?: number;
}

export interface DMMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  is_read: boolean;
  is_deleted: boolean;
  created_at: string;
  // Joined fields
  sender?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateDMMessage {
  conversation_id: string;
  content: string;
  message_type?: MessageType;
}
