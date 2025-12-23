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
import { Fonts } from '../../constants/Fonts';
import { Spacing, Typography } from '../../constants/Styles';

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

    try {
      // Stop typing indicator
      if (onStopTyping) {
        onStopTyping();
      }

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await onSend(trimmedMessage);
      setMessage('');
      Keyboard.dismiss();
    } catch (error) {
      // Error handling is done in parent component
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    minHeight: 44,
    maxHeight: 120,
    justifyContent: 'center',
  },
  input: {
    ...Typography.body,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    height: 44,
  },
  sendButtonActive: {
    backgroundColor: 'transparent',
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
  sendText: {
    ...Typography.body,
    color: Colors.primary,
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  sendTextDisabled: {
    color: Colors.primaryLight,
  },
});
