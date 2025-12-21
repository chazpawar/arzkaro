import React from 'react';
import { View, StyleSheet, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  return (
    <View style={styles.header}>
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
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: -15,
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
    marginTop: 0,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 15,
    color: Colors.text,
  },
});
