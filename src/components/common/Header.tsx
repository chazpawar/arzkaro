import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES } from '@theme';

interface HeaderProps {
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
}

const Header: React.FC<HeaderProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
}) => {
  return (
    <View style={styles.headerWrapper}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>arz</Text>
        <View style={styles.logoDot} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={COLORS.textGray}
            value={searchValue}
            onChangeText={onSearchChange}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 45 : 45,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: -1,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
    marginBottom: 7,
    marginLeft: 2,
  },
  searchContainer: {
    paddingTop: SPACING.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 25,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
});

export default Header;
