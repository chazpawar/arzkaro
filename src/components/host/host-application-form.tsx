import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Input from '../ui/input';
import Button from '../ui/button';
import Card from '../ui/card';
import ImageUpload from '../ui/image-upload';
import { Colors } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Styles';
import { Fonts } from '../../constants/Fonts';
import { HostRequestFormData, HOST_TYPE_LABELS } from '@/types/host.types';
import { submitHostRequest, validateHostRequest } from '@/services/host-service';

interface HostApplicationFormProps {
  userId: string;
  initialHostType?: 'full' | 'activity';
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function HostApplicationForm({
  userId,
  initialHostType = 'activity',
  onSuccess,
  onCancel,
}: HostApplicationFormProps) {
  const [hostType, setHostType] = useState<'full' | 'activity'>(initialHostType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<HostRequestFormData>({
    host_type: initialHostType,
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
    if (field === 'host_type') {
      setHostType(value as 'full' | 'activity');
    }
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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      // Personal Information validation
      if (!formData.organizer_name.trim()) {
        newErrors.organizer_name = 'Full name is required';
      }
      if (!formData.contact_number.trim()) {
        newErrors.contact_number = 'Contact number is required';
      } else if (!/^\d{10}$/.test(formData.contact_number)) {
        newErrors.contact_number = 'Enter a valid 10-digit number';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Enter a valid email address';
      }
    } else if (currentStep === 2) {
      // Address validation
      if (!formData.street_address.trim()) {
        newErrors.street_address = 'Street address is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.pin_code.trim()) {
        newErrors.pin_code = 'PIN code is required';
      } else if (!/^\d{6}$/.test(formData.pin_code)) {
        newErrors.pin_code = 'Enter a valid 6-digit PIN code';
      }
    } else if (currentStep === 3) {
      // KYC validation
      if (!formData.pan_number.trim()) {
        newErrors.pan_number = 'PAN number is required';
      } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan_number)) {
        newErrors.pan_number = 'Enter a valid PAN number';
      }
      if (!formData.pan_card_photo_url.trim()) {
        newErrors.pan_card_photo_url = 'Please upload PAN card photo';
      }
      if (
        hostType === 'full' &&
        formData.gstin &&
        !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z][Z][0-9A-Z]$/.test(formData.gstin)
      ) {
        newErrors.gstin = 'Enter a valid GSTIN';
      }
    } else if (currentStep === 4) {
      // Bank Details validation
      if (!formData.account_holder_name.trim()) {
        newErrors.account_holder_name = 'Account holder name is required';
      }
      if (!formData.account_number.trim()) {
        newErrors.account_number = 'Account number is required';
      }
      if (!formData.ifsc_code.trim()) {
        newErrors.ifsc_code = 'IFSC code is required';
      } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code)) {
        newErrors.ifsc_code = 'Enter a valid IFSC code';
      }
      if (!formData.beneficiary_name.trim()) {
        newErrors.beneficiary_name = 'Beneficiary name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
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
      Alert.alert('Validation Error', 'Please fix the errors in the form before submitting.');
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
      Alert.alert('Error', error.message || 'Failed to submit host application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <Text style={styles.sectionDescription}>
              Please provide your personal details as per your official documents
            </Text>
            <Input
              label="Full Name"
              value={formData.organizer_name}
              onChangeText={(value) => handleInputChange('organizer_name', value)}
              placeholder="As per PAN"
              error={errors.organizer_name}
              required
            />
            <Input
              label="Contact Number"
              value={formData.contact_number}
              onChangeText={(value) => handleInputChange('contact_number', value)}
              placeholder="10-digit mobile"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.contact_number}
              required
              leftIcon={
                <View style={styles.countryCodeContainer}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
              }
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
        );

      case 2:
        return (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>
            <Text style={styles.sectionDescription}>
              Enter your complete address for verification purposes
            </Text>
            <Input
              label="Street Address"
              value={formData.street_address}
              onChangeText={(value) => handleInputChange('street_address', value)}
              placeholder="Building, street, area"
              error={errors.street_address}
              required
            />
            <View style={styles.row}>
              <View style={styles.flex2}>
                <Input
                  label="City"
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  placeholder="City"
                  error={errors.city}
                  required
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="PIN Code"
                  value={formData.pin_code}
                  onChangeText={(value) => handleInputChange('pin_code', value)}
                  placeholder="6-digit"
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.pin_code}
                  required
                />
              </View>
            </View>
            <Input
              label="State"
              value={formData.state}
              onChangeText={(value) => handleInputChange('state', value)}
              placeholder="Enter state"
              error={errors.state}
              required
            />
          </Card>
        );

      case 3:
        return (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>KYC Documents</Text>
            <Text style={styles.sectionDescription}>
              Upload your KYC documents for verification
            </Text>
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
            <ImageUpload
              label="PAN Card Photo *"
              currentImageUrl={formData.pan_card_photo_url}
              onImageSelected={(url) => handleInputChange('pan_card_photo_url', url)}
              bucket="host-documents"
              folder={userId}
            />
            {errors.pan_card_photo_url && (
              <Text style={styles.errorText}>{errors.pan_card_photo_url}</Text>
            )}
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
                <ImageUpload
                  label="GST Certificate (Optional)"
                  currentImageUrl={formData.gst_certificate_url}
                  onImageSelected={(url) => handleInputChange('gst_certificate_url', url)}
                  bucket="host-documents"
                  folder={userId}
                />
                {errors.gst_certificate_url && (
                  <Text style={styles.errorText}>{errors.gst_certificate_url}</Text>
                )}
              </>
            )}
          </Card>
        );

      case 4:
        return (
          <Card style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Details</Text>
            <Text style={styles.sectionDescription}>
              Provide your bank account details for receiving payouts
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
              label="Account Number"
              value={formData.account_number}
              onChangeText={(value) => handleInputChange('account_number', value)}
              placeholder="Enter account number"
              keyboardType="number-pad"
              error={errors.account_number}
              required
            />
            <View style={styles.row}>
              <View style={styles.flex1}>
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
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Beneficiary"
                  value={formData.beneficiary_name}
                  onChangeText={(value) => handleInputChange('beneficiary_name', value)}
                  placeholder="Name"
                  error={errors.beneficiary_name}
                  required
                />
              </View>
            </View>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle} numberOfLines={2}>
          {HOST_TYPE_LABELS[hostType]}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.changeTypeButton}>
          <Text style={styles.changeLink}>Change Type</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          {currentStep > 1 && (
            <Button
              title="Back"
              onPress={handleBack}
              variant="outline"
              size="large"
              style={styles.backButton}
              disabled={isSubmitting}
            />
          )}
          {currentStep < 4 ? (
            <Button
              title="Next"
              onPress={handleNext}
              variant="primary"
              size="large"
              style={styles.nextButton}
            />
          ) : (
            <Button
              title={isSubmitting ? 'Submitting...' : 'Submit Application'}
              onPress={handleSubmit}
              variant="primary"
              size="large"
              style={styles.nextButton}
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text,
    fontFamily: Fonts.bold,
    flex: 1,
    flexShrink: 1,
    marginRight: Spacing.sm,
  },
  changeTypeButton: {
    flexShrink: 0,
    paddingVertical: Spacing.xs,
  },
  changeLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  countryCodeContainer: {
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    marginRight: Spacing.sm,
  },
  countryCodeText: {
    fontSize: 16,
    fontFamily: Fonts.medium,
    color: Colors.text,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
