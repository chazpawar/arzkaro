import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '@theme';
import { useAuth } from '@context/AuthContext';

// Mock messages
const MOCK_MESSAGES = [
  {
    id: '1',
    senderId: '2',
    senderName: 'John Doe',
    senderAvatar: 'https://ui-avatars.com/api/?name=John+Doe&background=FF6B9D&color=fff',
    text: 'Hey! Are you coming to the festival tomorrow?',
    timestamp: '10:30 AM',
    isMe: false,
  },
  {
    id: '2',
    senderId: '1',
    senderName: 'Me',
    text: 'Yes! I just got my tickets yesterday. So excited! 🎉',
    timestamp: '10:32 AM',
    isMe: true,
  },
  {
    id: '3',
    senderId: '2',
    senderName: 'John Doe',
    senderAvatar: 'https://ui-avatars.com/api/?name=John+Doe&background=FF6B9D&color=fff',
    text: 'Awesome! What section are you in?',
    timestamp: '10:33 AM',
    isMe: false,
  },
  {
    id: '4',
    senderId: '1',
    senderName: 'Me',
    text: 'I got VIP passes! Section A, Row 5. What about you?',
    timestamp: '10:35 AM',
    isMe: true,
  },
  {
    id: '5',
    senderId: '2',
    senderName: 'John Doe',
    senderAvatar: 'https://ui-avatars.com/api/?name=John+Doe&background=FF6B9D&color=fff',
    text: 'Nice! I\'m in Section B. We should meet at the entrance around 5 PM?',
    timestamp: '10:38 AM',
    isMe: false,
  },
  {
    id: '6',
    senderId: '1',
    senderName: 'Me',
    text: 'Perfect! See you there 👋',
    timestamp: '10:40 AM',
    isMe: true,
  },
];

const ChatRoomScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const chatName = route?.params?.name || 'Chat';
  const isGroup = route?.params?.isGroup || false;

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: '1',
      senderName: 'Me',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
    };

    setMessages([...messages, newMessage]);
    setMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = (msg: typeof MOCK_MESSAGES[0], index: number) => {
    const showAvatar = !msg.isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);
    
    return (
      <View
        key={msg.id}
        style={[
          styles.messageRow,
          msg.isMe ? styles.messageRowMe : styles.messageRowOther,
        ]}
      >
        {!msg.isMe && showAvatar && (
          <Image source={{ uri: msg.senderAvatar }} style={styles.messageAvatar} />
        )}
        {!msg.isMe && !showAvatar && <View style={styles.avatarPlaceholder} />}
        
        <View style={[
          styles.messageBubble,
          msg.isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
        ]}>
          {!msg.isMe && isGroup && showAvatar && (
            <Text style={styles.senderName}>{msg.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            msg.isMe ? styles.messageTextMe : styles.messageTextOther,
          ]}>
            {msg.text}
          </Text>
          <Text style={[
            styles.messageTime,
            msg.isMe ? styles.messageTimeMe : styles.messageTimeOther,
          ]}>
            {msg.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter}>
          <Image
            source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=6C5CE7&color=fff` }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{chatName}</Text>
            <View style={styles.statusContainer}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        </TouchableOpacity>

      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
      >
        {/* Date Divider */}
        <View style={styles.dateDivider}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>Today</Text>
          <View style={styles.dateLine} />
        </View>

        {messages.map((msg, index) => renderMessage(msg, index))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textPlaceholder}
            value={message}
            onChangeText={setMessage}
            maxLength={1000}
          />
        </View>

        <TouchableOpacity
          style={[styles.sendButton, message.trim() && styles.sendButtonActive]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <Ionicons
            name="send"
            size={22}
            color={message.trim() ? COLORS.white : COLORS.textLight}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.small,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },

  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  dateDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: '500',
    paddingHorizontal: SPACING.md,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: SPACING.sm,
  },
  avatarPlaceholder: {
    width: 32,
    marginRight: SPACING.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTextMe: {
    color: COLORS.white,
  },
  messageTextOther: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeMe: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  messageTimeOther: {
    color: COLORS.textLight,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 24,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: COLORS.primary,
  },
});

export default ChatRoomScreen;
