import React from 'react';
import { View, StyleSheet, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Spacing, BorderRadius } from '../constants/Styles';

interface TabHeaderProps {
  searchPlaceholder?: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

export default function TabHeader({
  searchPlaceholder = 'Search...',
  searchQuery,
  onSearchChange,
}: TabHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top - 40 : 0 }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/arz.png')} style={styles.logo} resizeMode="contain" />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={Colors.textTertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logo: {
    width: 200,
    height: 100,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.text,
  },
});
