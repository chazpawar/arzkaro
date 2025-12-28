import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput as RNTextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';
import { Fonts } from '../constants/Fonts';
import Button from './ui/button';
import Card from './ui/card';

interface InclusionsBuilderProps {
  includedItems: string[];
  notIncludedItems: string[];
  onIncludedChange: (items: string[]) => void;
  onNotIncludedChange: (items: string[]) => void;
}

export default function InclusionsBuilder({
  includedItems,
  notIncludedItems,
  onIncludedChange,
  onNotIncludedChange,
}: InclusionsBuilderProps) {
  const [included, setIncluded] = useState<string[]>(includedItems.length > 0 ? includedItems : []);
  const [notIncluded, setNotIncluded] = useState<string[]>(
    notIncludedItems.length > 0 ? notIncludedItems : []
  );

  // What's Included functions
  const addIncludedItem = () => {
    const updated = [...included, ''];
    setIncluded(updated);
    onIncludedChange(updated);
  };

  const updateIncludedItem = (index: number, text: string) => {
    const updated = [...included];
    updated[index] = text;
    setIncluded(updated);
    onIncludedChange(updated);
  };

  const removeIncludedItem = (index: number) => {
    const updated = included.filter((_, i) => i !== index);
    setIncluded(updated);
    onIncludedChange(updated);
  };

  // What's NOT Included functions
  const addNotIncludedItem = () => {
    const updated = [...notIncluded, ''];
    setNotIncluded(updated);
    onNotIncludedChange(updated);
  };

  const updateNotIncludedItem = (index: number, text: string) => {
    const updated = [...notIncluded];
    updated[index] = text;
    setNotIncluded(updated);
    onNotIncludedChange(updated);
  };

  const removeNotIncludedItem = (index: number) => {
    const updated = notIncluded.filter((_, i) => i !== index);
    setNotIncluded(updated);
    onNotIncludedChange(updated);
  };

  return (
    <View style={styles.container}>
      {/* What's Included Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={styles.sectionTitle}>What's Included</Text>
          </View>
          <Button title="Add Item" onPress={addIncludedItem} variant="outline" size="small" />
        </View>

        {included.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <Ionicons name="add-circle-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No items added</Text>
            <Text style={styles.emptySubtext}>Tap "Add Item" to include amenities or services</Text>
          </Card>
        ) : (
          <View style={styles.itemsContainer}>
            {included.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.checkIconContainer}>
                  <Ionicons name="checkmark" size={16} color={Colors.success} />
                </View>
                <RNTextInput
                  style={styles.itemInput}
                  value={item}
                  onChangeText={(text) => updateIncludedItem(index, text)}
                  placeholder="e.g., Accommodation, Meals, Transportation..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                />
                <Pressable onPress={() => removeIncludedItem(index)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* What's NOT Included Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="close-circle" size={20} color={Colors.error} />
            <Text style={styles.sectionTitle}>What's NOT Included</Text>
          </View>
          <Button title="Add Item" onPress={addNotIncludedItem} variant="outline" size="small" />
        </View>

        {notIncluded.length === 0 ? (
          <Card style={styles.emptyCard} variant="outlined">
            <Ionicons name="add-circle-outline" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No exclusions added</Text>
            <Text style={styles.emptySubtext}>Tap "Add Item" to specify what's not covered</Text>
          </Card>
        ) : (
          <View style={styles.itemsContainer}>
            {notIncluded.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.crossIconContainer}>
                  <Ionicons name="close" size={16} color={Colors.error} />
                </View>
                <RNTextInput
                  style={styles.itemInput}
                  value={item}
                  onChangeText={(text) => updateNotIncludedItem(index, text)}
                  placeholder="e.g., Personal expenses, Travel insurance..."
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                />
                <Pressable onPress={() => removeNotIncludedItem(index)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Fonts.semiBold,
    color: Colors.text,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  itemsContainer: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.successLight || '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  crossIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.errorLight || '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  itemInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: Colors.text,
    minHeight: 20,
    paddingVertical: 0,
  },
});
