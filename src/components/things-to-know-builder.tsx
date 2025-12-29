import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput as RNTextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import Card from './ui/card';

interface ThingsToKnowBuilderProps {
  value: string[];
  onChange: (items: string[]) => void;
}

export default function ThingsToKnowBuilder({ value, onChange }: ThingsToKnowBuilderProps) {
  const [items, setItems] = useState<string[]>(value.length > 0 ? value : []);

  const addItem = () => {
    const updated = [...items, ''];
    setItems(updated);
    onChange(updated);
  };

  const updateItem = (index: number, text: string) => {
    const updated = [...items];
    updated[index] = text;
    setItems(updated);
    onChange(updated);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* Header Row with Title and Add Button */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Things to know:</Text>
        <Pressable style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </Pressable>
      </View>

      {items.length === 0 ? (
        <Card style={styles.emptyCard} variant="outlined">
          <Ionicons name="information-circle-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No items added yet</Text>
          <Text style={styles.emptySubtext}>
            Tap &quot;Add Item&quot; above to add important information for participants
          </Text>
        </Card>
      ) : (
        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.bulletContainer}>
                <View style={styles.bullet} />
              </View>
              <RNTextInput
                style={styles.itemInput}
                value={item}
                onChangeText={(text) => updateItem(index, text)}
                placeholder="e.g., Wear comfortable shoes, Bring sunscreen..."
                placeholderTextColor={Colors.textTertiary}
                multiline
              />
              <Pressable onPress={() => removeItem(index)} style={styles.removeButton} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.bold,
    color: Colors.text,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  itemsContainer: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bulletContainer: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.text,
  },
  itemInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  addButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.primary,
  },
});
