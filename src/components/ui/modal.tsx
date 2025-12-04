import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/styles';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom';
  style?: ViewStyle;
}

export default function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'fade',
  size = 'medium',
  position = 'center',
  style,
}: ModalProps) {
  return (
    <RNModal visible={visible} transparent animationType={animationType} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, position === 'bottom' && styles.overlayBottom]}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.content,
                styles[size],
                position === 'bottom' && styles.contentBottom,
                style,
              ]}
            >
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && <Text style={styles.title}>{title}</Text>}
                  {showCloseButton && (
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                      <Text style={styles.closeText}>×</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.body}>{children}</View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  overlayBottom: {
    justifyContent: 'flex-end',
    padding: 0,
  },
  content: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
    maxHeight: '90%',
  },
  contentBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    width: '100%',
  },
  small: {
    width: '80%',
    maxWidth: 300,
  },
  medium: {
    width: '90%',
    maxWidth: 400,
  },
  large: {
    width: '95%',
    maxWidth: 500,
  },
  fullscreen: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  closeText: {
    fontSize: 24,
    color: Colors.textSecondary,
    lineHeight: 28,
  },
  body: {
    padding: Spacing.lg,
  },
});
