import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@context/AuthContext';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import { COLORS, SPACING, SHADOWS } from '@theme';

const RegisterScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();

  const validate = () => {
    const newErrors: any = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register(name, email, password);
      Alert.alert('Success', 'Account created successfully!');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.black} />
            </TouchableOpacity>
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="person-add" size={32} color={COLORS.white} />
            </View>
            <Text style={styles.logoText}>Create Account</Text>
            <Text style={styles.tagline}>Join ArzKaro today</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.title}>Get Started</Text>
            <Text style={styles.subtitle}>Create your account to book amazing events</Text>

            <View style={styles.form}>
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                error={errors.name}
                leftIcon={<MaterialIcons name="person-outline" size={20} color={COLORS.textLight} />}
              />

              <Input
                label="Email Address"
                placeholder="your.email@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
                leftIcon={<MaterialIcons name="mail-outline" size={20} color={COLORS.textLight} />}
              />

              <Input
                label="Password"
                placeholder="Minimum 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                error={errors.password}
                leftIcon={<MaterialIcons name="lock-outline" size={20} color={COLORS.textLight} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={COLORS.textLight} 
                    />
                  </TouchableOpacity>
                }
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                error={errors.confirmPassword}
                leftIcon={<MaterialIcons name="lock-outline" size={20} color={COLORS.textLight} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <MaterialIcons 
                      name={showConfirmPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color={COLORS.textLight} 
                    />
                  </TouchableOpacity>
                }
              />

              {/* Terms */}
              <View style={styles.termsContainer}>
                <MaterialIcons name="info-outline" size={16} color={COLORS.textLight} />
                <Text style={styles.termsText}>
                  By signing up, you agree to our Terms & Privacy Policy
                </Text>
              </View>

              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                style={styles.registerButton}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefits}>
            <Text style={styles.benefitsTitle}>Why join ArzKaro?</Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <MaterialIcons name="event" size={20} color={COLORS.black} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Exclusive Events</Text>
                  <Text style={styles.benefitDesc}>Access to premium events</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <MaterialIcons name="notifications-active" size={20} color={COLORS.black} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Early Bird Tickets</Text>
                  <Text style={styles.benefitDesc}>Get notified before others</Text>
                </View>
              </View>

              <View style={styles.benefitItem}>
                <View style={styles.benefitIconContainer}>
                  <MaterialIcons name="card-giftcard" size={20} color={COLORS.black} />
                </View>
                <View style={styles.benefitContent}>
                  <Text style={styles.benefitTitle}>Special Offers</Text>
                  <Text style={styles.benefitDesc}>Exclusive discounts & deals</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    marginBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  form: {
    gap: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundLight,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  registerButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  footerText: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  signInText: {
    fontSize: 15,
    color: COLORS.black,
    fontWeight: '700',
  },
  benefits: {
    backgroundColor: COLORS.backgroundLight,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: SPACING.lg,
  },
  benefitsList: {
    gap: SPACING.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 13,
    color: COLORS.textLight,
  },
});

export default RegisterScreen;
