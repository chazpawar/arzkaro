import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Styles';
import { Fonts } from '../../constants/Fonts';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  onTyping?: () => void;
  onStopTyping?: () => void;
}

export default function ChatInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  sending = false,
  onTyping,
  onStopTyping,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = React.useRef<any>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      setMessage(text);

      // Trigger typing indicator
      if (text.trim() && onTyping) {
        onTyping();

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          if (onStopTyping) {
            onStopTyping();
          }
        }, 2000);
      } else if (!text.trim() && onStopTyping) {
        // Stop typing if input is empty
        onStopTyping();
      }
    },
    [onTyping, onStopTyping]
  );

  const handleSend = useCallback(async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || sending) return;

    // Store message and clear input immediately for better UX
    const messageToSend = trimmedMessage;
    setMessage('');
    Keyboard.dismiss();

    try {
      // Stop typing indicator
      if (onStopTyping) {
        onStopTyping();
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await onSend(messageToSend);
    } catch (error) {
      // On error, restore the message so user can retry
      setMessage(messageToSend);
      console.error('Failed to send message:', error);
    }
  }, [message, disabled, sending, onSend, onStopTyping]);

  const canSend = message.trim().length > 0 && !disabled && !sending;

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          multiline
          maxLength={1000}
          editable={!disabled}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>

      <Pressable
        style={[styles.sendButton, canSend ? styles.sendButtonActive : styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!canSend}
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <Text style={[styles.sendText, !canSend && styles.sendTextDisabled]}>Send</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 0.5,
    borderTopColor: Colors.borderLight,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: Spacing.sm,
    minHeight: 36,
    maxHeight: 100,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    fontFamily: Fonts.regular,
    color: Colors.text,
    maxHeight: 80,
    paddingTop: 0,
    paddingBottom: 0,
    lineHeight: 20,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    height: 36,
    marginBottom: 0,
  },
  sendButtonActive: {
    backgroundColor: 'transparent',
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
  sendText: {
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    fontSize: 15,
  },
  sendTextDisabled: {
    color: '#C7C7C7',
  },
});
