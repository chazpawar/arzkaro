import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import { COLORS, SPACING, SHADOWS } from '@theme';

const CATEGORIES = [
  { id: 'concert', name: 'Concert', icon: 'music-note' },
  { id: 'festival', name: 'Festival', icon: 'celebration' },
  { id: 'sports', name: 'Sports', icon: 'sports-soccer' },
  { id: 'party', name: 'Party', icon: 'nightlife' },
  { id: 'workshop', name: 'Workshop', icon: 'build' },
  { id: 'conference', name: 'Conference', icon: 'groups' },
  { id: 'exhibition', name: 'Exhibition', icon: 'palette' },
  { id: 'other', name: 'Other', icon: 'category' },
];

const CreateEventScreen = ({ navigation, route }: any) => {
  const { user } = useAuth();
  const editingEvent = route?.params?.eventId;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    location: '',
    ticketPrice: '',
    totalTickets: '',
    ageLimit: '18',
    refundPolicy: 'Full refund up to 7 days before event',
    organizerContact: '',
    eventRules: '',
  });

  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectCategory = (categoryId: string) => {
    setFormData(prev => ({ ...prev, category: categoryId }));
  };

  const handleSelectImage = () => {
    // In a real app, this would open image picker
    Alert.alert(
      'Select Image',
      'Choose how you want to add an image',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: () => setBannerImage('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800')
        },
        { 
          text: 'Gallery',
          onPress: () => setBannerImage('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800')
        },
      ]
    );
  };

  const validateForm = () => {
    const required = ['title', 'description', 'category', 'date', 'time', 'location', 'ticketPrice', 'totalTickets'];
    for (const field of required) {
      if (!formData[field as keyof typeof formData]) {
        Alert.alert('Missing Information', `Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }
    if (!bannerImage) {
      Alert.alert('Missing Image', 'Please add a banner image for your event');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Success',
        editingEvent ? 'Event updated successfully!' : 'Event created successfully!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Header - consistent with other admin screens */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingEvent ? 'Edit Event' : 'Create Event'}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner Image */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Event Banner</Text>
            <TouchableOpacity style={styles.imageSelector} onPress={handleSelectImage}>
              {bannerImage ? (
                <Image source={{ uri: bannerImage }} style={styles.bannerPreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="add-photo-alternate" size={48} color={COLORS.textGray} />
                  <Text style={styles.imagePlaceholderText}>Add Banner Image</Text>
                  <Text style={styles.imagePlaceholderHint}>Recommended: 16:9 ratio</Text>
                </View>
              )}
              {bannerImage && (
                <TouchableOpacity style={styles.changeImageBtn} onPress={handleSelectImage}>
                  <MaterialIcons name="edit" size={18} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Basic Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event title"
                placeholderTextColor={COLORS.textGray}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your event..."
                placeholderTextColor={COLORS.textGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
              />
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    formData.category === cat.id && styles.categoryCardActive
                  ]}
                  onPress={() => handleSelectCategory(cat.id)}
                >
                  <MaterialIcons
                    name={cat.icon as any}
                    size={24}
                    color={formData.category === cat.id ? COLORS.white : COLORS.textGray}
                  />
                  <Text style={[
                    styles.categoryCardText,
                    formData.category === cat.id && styles.categoryCardTextActive
                  ]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date & Time</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Date *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textGray}
                  value={formData.date}
                  onChangeText={(value) => handleInputChange('date', value)}
                />
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Time *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="HH:MM"
                  placeholderTextColor={COLORS.textGray}
                  value={formData.time}
                  onChangeText={(value) => handleInputChange('time', value)}
                />
              </View>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Venue Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter venue address"
                placeholderTextColor={COLORS.textGray}
                value={formData.location}
                onChangeText={(value) => handleInputChange('location', value)}
              />
            </View>
          </View>

          {/* Tickets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tickets</Text>
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Price (₹) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={COLORS.textGray}
                  keyboardType="numeric"
                  value={formData.ticketPrice}
                  onChangeText={(value) => handleInputChange('ticketPrice', value)}
                />
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Total Tickets *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="100"
                  placeholderTextColor={COLORS.textGray}
                  keyboardType="numeric"
                  value={formData.totalTickets}
                  onChangeText={(value) => handleInputChange('totalTickets', value)}
                />
              </View>
            </View>
          </View>

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age Limit</Text>
              <TextInput
                style={styles.input}
                placeholder="18"
                placeholderTextColor={COLORS.textGray}
                keyboardType="numeric"
                value={formData.ageLimit}
                onChangeText={(value) => handleInputChange('ageLimit', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Refund Policy</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter refund policy"
                placeholderTextColor={COLORS.textGray}
                value={formData.refundPolicy}
                onChangeText={(value) => handleInputChange('refundPolicy', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91-XXXXXXXXXX"
                placeholderTextColor={COLORS.textGray}
                keyboardType="phone-pad"
                value={formData.organizerContact}
                onChangeText={(value) => handleInputChange('organizerContact', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Event Rules</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter event rules (one per line)"
                placeholderTextColor={COLORS.textGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={formData.eventRules}
                onChangeText={(value) => handleInputChange('eventRules', value)}
              />
            </View>
          </View>

          {/* Host Info */}
          <View style={styles.hostInfoCard}>
            <MaterialIcons name="info-outline" size={20} color={COLORS.info} />
            <Text style={styles.hostInfoText}>
              This event will be created under your account ({user?.name || 'User'})
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Creating...</Text>
          ) : (
            <>
              <MaterialIcons name={editingEvent ? 'save' : 'add-circle'} size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>
                {editingEvent ? 'Update Event' : 'Create Event'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  // Image Selector
  imageSelector: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.backgroundLight,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  bannerPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.textGray,
    marginTop: SPACING.sm,
  },
  imagePlaceholderHint: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  changeImageBtn: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Input
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textGray,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryCardText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textGray,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  categoryCardTextActive: {
    color: COLORS.white,
  },
  // Host Info
  hostInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.info + '15',
    borderRadius: 12,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  hostInfoText: {
    fontSize: 13,
    color: COLORS.info,
    flex: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    ...SHADOWS.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default CreateEventScreen;
