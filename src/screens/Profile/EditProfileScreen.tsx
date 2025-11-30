import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';
import { useAuth } from '@context/AuthContext';

const INTERESTS = [
  'Music', 'Sports', 'Technology', 'Art', 'Food', 'Travel',
  'Fitness', 'Photography', 'Gaming', 'Movies', 'Fashion', 'Books',
];

const EditProfileScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    age: user?.age?.toString() || '',
    phone: '',
    location: 'New York, USA',
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    user?.interests || ['Music', 'Sports', 'Technology']
  );

  const handleSave = () => {
    // Validate
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    // In a real app, this would save to backend
    Alert.alert('Success', 'Profile updated successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      if (selectedInterests.length < 6) {
        setSelectedInterests([...selectedInterests, interest]);
      } else {
        Alert.alert('Limit Reached', 'You can select up to 6 interests');
      }
    }
  };

  const handleChangePhoto = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => console.log('Camera') },
        { text: 'Gallery', onPress: () => console.log('Gallery') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.avatarContainer}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {formData.name.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity 
              style={styles.changePhotoButton}
              onPress={handleChangePhoto}
            >
              <MaterialIcons name="camera-alt" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleChangePhoto}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="person" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: SPACING.md }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="cake" size={18} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#999"
                  value={formData.age}
                  onChangeText={(text) => setFormData({ ...formData, age: text })}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Location</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="location-on" size={18} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Your city"
                  placeholderTextColor="#999"
                  value={formData.location}
                  onChangeText={(text) => setFormData({ ...formData, location: text })}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
            </View>
            <Text style={styles.charCount}>{formData.bio.length}/200</Text>
          </View>
        </View>

        {/* Interests Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Interests</Text>
            <Text style={styles.interestCount}>{selectedInterests.length}/6 selected</Text>
          </View>
          
          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => {
              const isSelected = selectedInterests.includes(interest);
              return (
                <TouchableOpacity
                  key={interest}
                  style={[styles.interestChip, isSelected && styles.interestChipSelected]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.interestChipText,
                    isSelected && styles.interestChipTextSelected
                  ]}>
                    {interest}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.deleteButton}>
            <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.text,
    borderRadius: 18,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: COLORS.white,
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  formSection: {
    backgroundColor: COLORS.white,
    marginTop: 1,
    padding: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  interestCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    height: 46,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textAreaContainer: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
    marginLeft: 0,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  interestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 4,
  },
  interestChipSelected: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  interestChipTextSelected: {
    color: COLORS.white,
  },
  dangerSection: {
    backgroundColor: COLORS.white,
    marginTop: 1,
    padding: SPACING.md,
  },
  dangerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: SPACING.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default EditProfileScreen;
