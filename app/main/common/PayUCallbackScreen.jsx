import { useEffect } from 'react';
import { StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { handlePayUCallback } from '../../../services/payment/payuService';

export default function PayUCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    console.log('PayU Callback Screen - Params:', params);
    
    // Extract all parameters including web URL params
    let allParams = { ...params };
    
    // On web, also check URL parameters directly
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.forEach((value, key) => {
        allParams[key] = value;
      });
      
      console.log('PayU Callback - All params including URL:', allParams);
    }
    
    // Handle the callback and redirect to PendingScreen
    const handleCallback = async () => {
      try {
        await handlePayUCallback(allParams, router);
      } catch (error) {
        console.error('Error handling PayU callback:', error);
        // Fallback navigation with minimal params
        router.replace({
          pathname: '/main/common/PendingScreen',
          params: {
            txn_id: `FALLBACK_${Date.now()}`,
            transactionId: `FALLBACK_${Date.now()}`,
            paymentStatus: 'cancelled',
            paymentMethod: 'payu',
            amount: '0',
          },
        });
      }
    };
    
    setTimeout(handleCallback, 1000); // Small delay to ensure screen is mounted
    
  }, [params, router]);

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator size="large" color="#000000" />
      <ThemedText style={styles.text}>Processing payment response...</ThemedText>
      <ThemedText style={styles.subText}>Please wait while we verify your payment</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    marginTop: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
});