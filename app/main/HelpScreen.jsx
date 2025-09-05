import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';

export default function HelpScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqData = [
    {
      id: '1',
      question: 'How do I book a gas cylinder?',
      answer: 'Go to the Home tab, select your gas provider, choose cylinder type, and confirm booking. You can pay online or choose cash on delivery.'
    },
    {
      id: '2',
      question: 'What are the delivery charges?',
      answer: 'Delivery charges vary by location. Typically ₹50-100 within city limits. Free delivery for orders above ₹1000.'
    },
    {
      id: '3',
      question: 'How can I track my order?',
      answer: 'After booking, you\'ll receive a tracking ID. Go to History tab to view real-time status updates of your order.'
    },
    {
      id: '4',
      question: 'What payment methods are accepted?',
      answer: 'We accept UPI, Credit/Debit cards, Net Banking, Wallets (Paytm, PhonePe), and Cash on Delivery.'
    },
    {
      id: '5',
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel within 1 hour of booking without any charges. After that, cancellation charges may apply.'
    },
    {
      id: '6',
      question: 'How do I register a complaint?',
      answer: 'Go to Profile > Help & Support > Complaint or use the Complaint option from the main menu to register your issue.'
    },
    {
      id: '7',
      question: 'What if I receive a defective cylinder?',
      answer: 'Contact our support immediately. We provide free replacement for defective cylinders within 24 hours.'
    },
    {
      id: '8',
      question: 'How do I update my delivery address?',
      answer: 'Go to Profile > Personal Information > Address and update your delivery address. Changes apply to future bookings.'
    }
  ];

  const contactOptions = [
    {
      id: '1',
      title: 'Call Support',
      subtitle: '24/7 Customer Care',
      icon: 'phone',
      action: () => Linking.openURL('tel:+918000123456')
    },
    {
      id: '2',
      title: 'WhatsApp Chat',
      subtitle: 'Quick assistance',
      icon: 'whatsapp',
      action: () => Linking.openURL('https://wa.me/918000123456')
    },
    {
      id: '3',
      title: 'Email Support',
      subtitle: 'support@vasbazaar.com',
      icon: 'envelope',
      action: () => Linking.openURL('mailto:support@vasbazaar.com')
    },
    {
      id: '4',
      title: 'Live Chat',
      subtitle: 'Chat with our agents',
      icon: 'comments',
      action: () => {
        // Navigate to live chat or open chat widget
        console.log('Open live chat');
      }
    }
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const renderFaqItem = (item) => (
    <ThemedView key={item.id} style={styles.faqItem}>
      <TouchableOpacity 
        style={styles.faqQuestion}
        onPress={() => toggleFaq(item.id)}
      >
        <ThemedText style={styles.faqQuestionText}>{item.question}</ThemedText>
        <FontAwesome 
          name={expandedFaq === item.id ? 'chevron-up' : 'chevron-down'} 
          size={16} 
          color="#000000" 
        />
      </TouchableOpacity>
      {expandedFaq === item.id && (
        <ThemedView style={styles.faqAnswer}>
          <ThemedText style={styles.faqAnswerText}>{item.answer}</ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );

  const renderContactOption = (item) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.contactOption}
      onPress={item.action}
    >
      <ThemedView style={styles.contactIconContainer}>
        <FontAwesome name={item.icon} size={24} color="#000000" />
      </ThemedView>
      <ThemedView style={styles.contactContent}>
        <ThemedText style={styles.contactTitle}>{item.title}</ThemedText>
        <ThemedText style={styles.contactSubtitle}>{item.subtitle}</ThemedText>
      </ThemedView>
      <FontAwesome name="chevron-right" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <MainHeader 
        title="Help & Support"
        showBack={true}
        showSearch={false}
        showNotification={false}
      />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact Section */}
        <ThemedView style={[styles.section, styles.firstSection]}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Contact Us</ThemedText>
          <ThemedView style={styles.contactGrid}>
            {contactOptions.map(renderContactOption)}
          </ThemedView>
        </ThemedView>

        {/* FAQ Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Frequently Asked Questions
          </ThemedText>
          <ThemedView style={styles.faqContainer}>
            {faqData.map(renderFaqItem)}
          </ThemedView>
        </ThemedView>

        {/* Additional Help Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>More Help</ThemedText>
          
          <TouchableOpacity 
            style={styles.helpOption}
            onPress={() => router.push('/main/ComplaintScreen')}
          >
            <FontAwesome name="exclamation-circle" size={20} color="#ff6b6b" />
            <ThemedView style={styles.helpContent}>
              <ThemedText style={styles.helpTitle}>Register Complaint</ThemedText>
              <ThemedText style={styles.helpSubtitle}>Report issues with your order</ThemedText>
            </ThemedView>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>

          

          


        </ThemedView>

        {/* App Info */}
        <ThemedView style={[styles.section, styles.lastSection]}>
          <ThemedView style={styles.appInfo}>
            <ThemedText style={styles.appInfoText}>vasbzaar v1.0.0</ThemedText>
            <ThemedText style={styles.appInfoText}>Made with ❤️ in India</ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: Platform.OS === 'web' ? 100 : 50,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  lastSection: {
    marginBottom: 50,
  },
  firstSection: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 15,
    fontWeight: '600',
  },
  contactGrid: {
    gap: 12,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  contactIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  faqContainer: {
    gap: 8,
  },
  faqItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  faqAnswer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
    paddingTop: 10,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 10,
  },
  helpContent: {
    flex: 1,
    marginLeft: 15,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 5,
  },
});