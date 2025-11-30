import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';

const HostRequestScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    website: '',
    phone: '',
    experience: '',
  });

  const handleSubmit = () => {
    if (!formData.businessName.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Request Submitted',
      'Your host request has been submitted for review. We will get back to you within 2-3 business days.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
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
        <Text style={styles.headerTitle}>Become a Host</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <MaterialIcons name="star" size={24} color={COLORS.text} />
          </View>
          <Text style={styles.infoTitle}>Host Benefits</Text>
          <Text style={styles.infoText}>
            Create and manage events, earn revenue from ticket sales, access analytics, and build your community.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Business Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Name *</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="business" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Your business or brand name"
                placeholderTextColor="#999"
                value={formData.businessName}
                onChangeText={(text) => setFormData({ ...formData, businessName: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Business Type</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="category" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="e.g., Event Organizer, Venue, Artist"
                placeholderTextColor="#999"
                value={formData.businessType}
                onChangeText={(text) => setFormData({ ...formData, businessType: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Contact phone number"
                placeholderTextColor="#999"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Website (Optional)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="language" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="https://yourwebsite.com"
                placeholderTextColor="#999"
                value={formData.website}
                onChangeText={(text) => setFormData({ ...formData, website: text })}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Experience</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="work" size={18} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Years of experience in hosting events"
                placeholderTextColor="#999"
                value={formData.experience}
                onChangeText={(text) => setFormData({ ...formData, experience: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description *</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about your events and what makes them special..."
                placeholderTextColor="#999"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>
            <Text style={styles.charCount}>{formData.description.length}/500</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsText}>
            By submitting this request, you agree to our Host Terms of Service and Community Guidelines.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>

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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  infoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
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
    height: 100,
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
    height: 80,
    textAlignVertical: 'top',
    marginLeft: 0,
  },
  charCount: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  termsSection: {
    padding: SPACING.lg,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: COLORS.text,
    marginHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default HostRequestScreen;
