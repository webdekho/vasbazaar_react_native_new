import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth, getAuthRedirect } from '../hooks/useAuth';

export default function Index() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const authState = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log('Index.jsx - Letting AuthGuard handle all navigation');
    // AuthGuard will handle ALL navigation - no navigation from index.jsx
    // This completely eliminates navigation conflicts
  }, []);

  // Show a loading indicator while checking auth and redirecting
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  );
}