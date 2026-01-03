import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, Platform, Pressable, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants/Colors';
import { Spacing, BorderRadius } from '../../constants/Styles';
import { Fonts } from '../../constants/Fonts';

interface DateTimePickerModalProps {
  visible: boolean;
  mode: 'date' | 'time' | 'datetime';
  value: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
}

export default function DateTimePickerModal({
  visible,
  mode,
  value,
  minimumDate,
  maximumDate,
  onConfirm,
  onCancel,
  title,
}: DateTimePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState(value);

  const handleChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      // On Android, the picker dismisses automatically
      if (event.type === 'set' && date) {
        onConfirm(date);
      } else if (event.type === 'dismissed') {
        onCancel();
      }
    } else {
      // On iOS, update the temporary value
      if (date) {
        setSelectedDate(date);
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  // On Android, render the picker directly (it's a modal by default)
  if (Platform.OS === 'android' && visible) {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        onChange={handleChange}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
      />
    );
  }

  // On iOS, wrap in a custom modal
  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
        <Pressable style={styles.overlay} onPress={onCancel}>
          <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
            <View style={styles.header}>
              <Text style={styles.title}>{title || 'Select Date & Time'}</Text>
            </View>

            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={selectedDate}
                mode={mode}
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                textColor={Colors.text}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
    textAlign: 'center',
  },
  pickerContainer: {
    paddingVertical: Spacing.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.background,
  },
});
