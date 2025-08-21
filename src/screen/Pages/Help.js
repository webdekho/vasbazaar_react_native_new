import CommonHeader2 from '../../components/CommoHedder2';
import { ScrollView, StyleSheet, Linking, Alert, Platform } from 'react-native';
import { Button, Card, Divider, List, Text } from 'react-native-paper';
export default function Help({ navigation }) {
  
  const handleContactSupport = async () => {
    const emailAddress = 'support@vasbazaar.com';
    const subject = 'Support Request';
    const body = 'Hello vasbazaar Support Team,\n\nI need help with:\n\n';
    
    // Create the email URL
    const emailUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      // Check if the email URL can be opened
      const canOpen = await Linking.canOpenURL(emailUrl);
      
      if (canOpen) {
        // Open the email app
        await Linking.openURL(emailUrl);
      } else {
        // If email app is not available, show an alert
        Alert.alert(
          'Email App Not Available',
          `Please send an email to ${emailAddress}`,
          [
            { text: 'Copy Email', onPress: () => {
              // For web platform, use navigator.clipboard if available
              if (Platform.OS === 'web' && navigator.clipboard) {
                navigator.clipboard.writeText(emailAddress);
                Alert.alert('Success', 'Email address copied to clipboard');
              }
            }},
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening email app:', error);
      Alert.alert(
        'Error',
        'Unable to open email app. Please contact support at ' + emailAddress,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <>
    
    <CommonHeader2 heading="Help & Support" />


    <ScrollView style={styles.container}>
      
      {/* FAQs */}
      <Card style={styles.card}>
        <Card.Title title="Frequently Asked Questions" />
        <Divider />
        <List.Section>
          <List.Accordion
            title="How do I update my profile?"
            left={(props) => <List.Icon {...props} icon="account-edit" />}
          >
            <List.Item title="Go to Profile > Edit and update your details." />
          </List.Accordion>

          <List.Accordion
            title="How can I add a bank account?"
            left={(props) => <List.Icon {...props} icon="bank" />}
          >
            <List.Item title="Navigate to Add Bank section from the side menu and fill your details." />
          </List.Accordion>

          <List.Accordion
            title="How do I contact support?"
            left={(props) => <List.Icon {...props} icon="phone" />}
          >
            <List.Item title="Scroll below to 'Contact Support' and tap the button." />
          </List.Accordion>
        </List.Section>
      </Card>

      {/* Contact Support Section */}
      <Card style={styles.card}>
        <Card.Title title="Need More Help?" />
        <Card.Content>
          <Text>If you have any issue or need personal assistance, reach out to our team.</Text>
          <Button
            icon="email-outline"
            mode="contained"
            style={styles.button}
            onPress={handleContactSupport}
          >
            Contact Support
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fb',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2E456E',
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 16,
    backgroundColor: '#000000ff',
    borderRadius: 8,
  },
});
