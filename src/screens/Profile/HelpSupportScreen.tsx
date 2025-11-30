import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '@theme';

const HelpSupportScreen = ({ navigation }: any) => {

  const handleEmail = () => {
    Linking.openURL('mailto:support@arzkaro.com?subject=Help%20Request');
  };

  const handleCall = () => {
    Linking.openURL('tel:+911234567890');
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/911234567890?text=Hi,%20I%20need%20help%20with%20ArzKaro');
  };

  const handleFAQ = (question: string, answer: string) => {
    Alert.alert(question, answer);
  };

  const faqs = [
    {
      question: 'How do I book an event?',
      answer: 'Browse events on the home screen, tap on an event to view details, then tap "Book Now" to proceed with payment.',
    },
    {
      question: 'How can I cancel my booking?',
      answer: 'Go to My Tickets, select the booking you want to cancel, and tap on "Cancel Booking". Refund policy varies by event.',
    },
    {
      question: 'How do I become a host?',
      answer: 'Go to Profile > Become a Host and fill out the application. Our team will review and approve your request.',
    },
    {
      question: 'How do I contact event organizers?',
      answer: 'On the event details page, you can find the organizer contact information under "Additional Info" section.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept UPI, Credit/Debit Cards, Net Banking, and popular wallets like Google Pay and PhonePe.',
    },
  ];

  const contactOptions = [
    {
      icon: 'email',
      label: 'Email Us',
      subtitle: 'support@arzkaro.com',
      onPress: handleEmail,
      color: COLORS.primary,
    },
    {
      icon: 'phone',
      label: 'Call Us',
      subtitle: '+91 123 456 7890',
      onPress: handleCall,
      color: COLORS.success,
    },
    {
      icon: 'chat',
      label: 'WhatsApp',
      subtitle: 'Chat with us',
      onPress: handleWhatsApp,
      color: '#25D366',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contact Section */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <View style={styles.card}>
          {contactOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.contactItem,
                index < contactOptions.length - 1 && styles.contactItemBorder,
              ]}
              onPress={option.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${option.color}15` }]}>
                <MaterialIcons name={option.icon as any} size={22} color={option.color} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{option.label}</Text>
                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs Section */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <View style={styles.card}>
          {faqs.map((faq, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.faqItem,
                index < faqs.length - 1 && styles.faqItemBorder,
              ]}
              onPress={() => handleFAQ(faq.question, faq.answer)}
              activeOpacity={0.7}
            >
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <MaterialIcons name="chevron-right" size={22} color={COLORS.textGray} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>We're here to help!</Text>
          <Text style={styles.footerSubtext}>Response time: Within 24 hours</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
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
    borderBottomColor: COLORS.border,
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
    color: COLORS.black,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  contactItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  faqItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.black,
    flex: 1,
    marginRight: SPACING.sm,
  },
  footer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: COLORS.textGray,
  },
});

export default HelpSupportScreen;
