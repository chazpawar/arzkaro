import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Input from '../ui/input';
import Button from '../ui/button';
import Card from '../ui/card';
import { Colors } from '@/constants/colors';
import { BorderRadius, Spacing, Typography } from '@/constants/styles';
import {
  HostRequestFormData,
  HOST_TYPE_LABELS,
} from '@/types/host.types';
import { submitHostRequest, validateHostRequest } from '@/services/host-service';

interface HostApplicationFormProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function HostApplicationForm({
  userId,
  onSuccess,
  onCancel,
}: HostApplicationFormProps) {
  const [hostType, setHostType] = useState<'full' | 'activity' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<HostRequestFormData>({
    host_type: 'activity',
    organizer_name: '',
    contact_number: '',
    email: '',
    street_address: '',
    city: '',
    state: '',
    pin_code: '',
    pan_number: '',
    pan_card_photo_url: '',
    account_holder_name: '',
    beneficiary_name: '',
    account_number: '',
    ifsc_code: '',
    gstin: '',
    gst_certificate_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof HostRequestFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleHostTypeSelect = (type: 'full' | 'activity') => {
    setHostType(type);
    setFormData((prev) => ({ ...prev, host_type: type }));
  };

  const handleSubmit = async () => {
    if (!hostType) {
      Alert.alert('Error', 'Please select a host type');
      return;
    }

    // Map form data to request data format for validation and submission
    const requestData = {
      user_id: userId,
      requested_host_type: formData.host_type,
      organizer_name: formData.organizer_name,
      contact_number: formData.contact_number,
      email: formData.email,
      street_address: formData.street_address,
      city: formData.city,
      state: formData.state,
      pin_code: formData.pin_code,
      pan_number: formData.pan_number,
      account_holder_name: formData.account_holder_name,
      beneficiary_name: formData.beneficiary_name,
      account_number: formData.account_number,
      ifsc_code: formData.ifsc_code,
      pan_card_photo_url: formData.pan_card_photo_url,
      ...(formData.host_type === 'full' && {
        gstin: formData.gstin || null,
        gst_certificate_url: formData.gst_certificate_url || null,
      }),
    };

    // Validate form
    const validation = validateHostRequest(requestData as any);
    if (!validation.isValid) {
      setErrors(validation.errors);
      Alert.alert(
        'Validation Error',
        'Please fix the errors in the form before submitting.'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await submitHostRequest(requestData as any);
      Alert.alert(
        'Success',
        'Your host application has been submitted successfully! Our team will review it within 2-3 business days.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Submit host request error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit host application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Host type selection screen
  if (!hostType) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Apply to Become a Host</Text>
        <Text style={styles.subtitle}>
          Choose the type of host you'd like to become
        </Text>

        <TouchableOpacity
          style={styles.hostTypeCard}
          onPress={() => handleHostTypeSelect('activity')}
        >
          <View style={styles.hostTypeHeader}>
            <Text style={styles.hostTypeTitle}>Activity Host</Text>
            <Text style={styles.hostTypeBadge}>Simpler KYC</Text>
          </View>
          <Text style={styles.hostTypeDescription}>
            Create and manage activities/experiences only. Perfect for activity organizers who want
            a quick start.
          </Text>
          <View style={styles.hostTypeFeatures}>
            <Text style={styles.hostTypeFeature}>• Create Activities</Text>
            <Text style={styles.hostTypeFeature}>• Simpler verification process</Text>
            <Text style={styles.hostTypeFeature}>• No GST required</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.hostTypeCard}
          onPress={() => handleHostTypeSelect('full')}
        >
          <View style={styles.hostTypeHeader}>
            <Text style={styles.hostTypeTitle}>Full Host</Text>
            <Text style={[styles.hostTypeBadge, styles.hostTypeBadgePremium]}>Complete Access</Text>
          </View>
          <Text style={styles.hostTypeDescription}>
            Create events, trips, and activities. Complete business verification required.
          </Text>
          <View style={styles.hostTypeFeatures}>
            <Text style={styles.hostTypeFeature}>• Create Events</Text>
            <Text style={styles.hostTypeFeature}>• Create Trips</Text>
            <Text style={styles.hostTypeFeature}>• Create Activities</Text>
            <Text style={styles.hostTypeFeature}>• GST verification optional</Text>
          </View>
        </TouchableOpacity>

        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="ghost"
            fullWidth
          />
        )}
      </View>
    );
  }

  // Application form
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {HOST_TYPE_LABELS[hostType]} Application
        </Text>
        <TouchableOpacity onPress={() => setHostType(null)}>
          <Text style={styles.changeLink}>Change Type</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <Input
          label="Organizer/Business Name"
          value={formData.organizer_name}
          onChangeText={(value) => handleInputChange('organizer_name', value)}
          placeholder="Enter your full name or business name"
          error={errors.organizer_name}
          required
        />

        <Input
          label="Contact Number"
          value={formData.contact_number}
          onChangeText={(value) => handleInputChange('contact_number', value)}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          error={errors.contact_number}
          required
        />

        <Input
          label="Email Address"
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          required
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        
        <Input
          label="Street Address"
          value={formData.street_address}
          onChangeText={(value) => handleInputChange('street_address', value)}
          placeholder="Building name, street"
          error={errors.street_address}
          required
        />

        <Input
          label="City"
          value={formData.city}
          onChangeText={(value) => handleInputChange('city', value)}
          placeholder="Enter city"
          error={errors.city}
          required
        />

        <Input
          label="State"
          value={formData.state}
          onChangeText={(value) => handleInputChange('state', value)}
          placeholder="Enter state"
          error={errors.state}
          required
        />

        <Input
          label="PIN Code"
          value={formData.pin_code}
          onChangeText={(value) => handleInputChange('pin_code', value)}
          placeholder="6-digit PIN"
          keyboardType="number-pad"
          maxLength={6}
          error={errors.pin_code}
          required
        />
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>KYC Documents</Text>
        
        <Input
          label="PAN Number"
          value={formData.pan_number}
          onChangeText={(value) => handleInputChange('pan_number', value.toUpperCase())}
          placeholder="ABCDE1234F"
          autoCapitalize="characters"
          maxLength={10}
          error={errors.pan_number}
          required
        />

        <Input
          label="PAN Card Photo URL"
          value={formData.pan_card_photo_url}
          onChangeText={(value) => handleInputChange('pan_card_photo_url', value)}
          placeholder="Google Drive link or image URL"
          autoCapitalize="none"
          error={errors.pan_card_photo_url}
          hint="Upload to Google Drive and share the link"
          required
        />

        {hostType === 'full' && (
          <>
            <Input
              label="GSTIN (Optional)"
              value={formData.gstin}
              onChangeText={(value) => handleInputChange('gstin', value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              autoCapitalize="characters"
              maxLength={15}
              error={errors.gstin}
            />

            <Input
              label="GST Certificate URL (Optional)"
              value={formData.gst_certificate_url}
              onChangeText={(value) => handleInputChange('gst_certificate_url', value)}
              placeholder="Google Drive link or image URL"
              autoCapitalize="none"
              error={errors.gst_certificate_url}
              hint="Required if GSTIN is provided"
            />
          </>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Bank Details</Text>
        <Text style={styles.sectionHint}>
          For receiving payments from bookings
        </Text>
        
        <Input
          label="Account Holder Name"
          value={formData.account_holder_name}
          onChangeText={(value) => handleInputChange('account_holder_name', value)}
          placeholder="As per bank records"
          error={errors.account_holder_name}
          required
        />

        <Input
          label="Beneficiary Name"
          value={formData.beneficiary_name}
          onChangeText={(value) => handleInputChange('beneficiary_name', value)}
          placeholder="Beneficiary name"
          error={errors.beneficiary_name}
          required
        />

        <Input
          label="Account Number"
          value={formData.account_number}
          onChangeText={(value) => handleInputChange('account_number', value)}
          placeholder="Enter account number"
          keyboardType="number-pad"
          error={errors.account_number}
          required
        />

        <Input
          label="IFSC Code"
          value={formData.ifsc_code}
          onChangeText={(value) => handleInputChange('ifsc_code', value.toUpperCase())}
          placeholder="ABCD0123456"
          autoCapitalize="characters"
          maxLength={11}
          error={errors.ifsc_code}
          required
        />
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title={isSubmitting ? 'Submitting...' : 'Submit Application'}
          onPress={handleSubmit}
          variant="primary"
          size="large"
          fullWidth
          disabled={isSubmitting}
          loading={isSubmitting}
        />
        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="outline"
            size="large"
            fullWidth
            disabled={isSubmitting}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  changeLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  hostTypeCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hostTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  hostTypeTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: 'bold',
  },
  hostTypeBadge: {
    ...Typography.caption,
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    fontWeight: '600',
  },
  hostTypeBadgePremium: {
    color: Colors.success,
    backgroundColor: Colors.successLight,
  },
  hostTypeDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  hostTypeFeatures: {
    gap: Spacing.xs,
  },
  hostTypeFeature: {
    ...Typography.bodySmall,
    color: Colors.text,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
