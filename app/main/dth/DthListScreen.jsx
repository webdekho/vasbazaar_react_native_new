import { useEffect, useState } from 'react';
import { 
  Alert,
  Image, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  View,
  ActivityIndicator,
  Platform
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

import MainHeader from '../../../components/MainHeader';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest } from '../../../services/api/baseApi';

/**
 * DthListScreen component for displaying DTH service providers
 * 
 * Features:
 * - Search functionality to filter DTH operators
 * - Loading states and error handling
 * - Navigation to DTH recharge screen with selected operator
 * - Responsive list layout for operator selection
 * 
 * @component
 * @returns {JSX.Element} The DthListScreen component
 */
export default function DthListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceId = params?.serviceId || 'NA';
  const serviceName = params?.serviceName || 'DTH';
  
  const [search, setSearch] = useState('');
  const [operatorList, setOperatorList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const getOperatorList = async (serviceId) => {
    setIsLoading(true);
    try {
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return;
      }

      const response = await getRequest(
        'api/customer/operator/getByServiceId', 
        { serviceId }, 
        sessionToken
      );
      
      if (response?.status === 'success') {
        setOperatorList(response.data);
      } else {
        Alert.alert('Error', response?.message || 'Failed to load DTH operators.');
      }
    } catch (error) {
      console.error('Error fetching DTH operators:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await getOperatorList(serviceId);
    };
    init();
  }, [serviceId]);

  const filteredBillers = operatorList.filter((biller) =>
    biller.operatorName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOperatorPress = (biller) => {
    router.push({
      pathname: '/main/dth/DthRechargeScreen',
      params: {
        biller: JSON.stringify(biller),
        serviceId,
        serviceName
      }
    });
  };

  return (
    <>
      <MainHeader 
        title="DTH Operators"
        showBack={true}
        showSearch={false}
        showNotification={false}
        rightComponent={
          <Image 
            source={require('../../../assets/icons/bharat_connect.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        }
      />

      <ScrollView style={styles.container}>
        <View style={[
          styles.searchBar,
          isSearchFocused && styles.searchBarFocused
        ]}>
          <IconButton 
            icon="magnify" 
            style={styles.searchIcon}
            iconColor="#666"
            size={20}
          />
          <TextInput
            placeholder="Search by operator"
            style={[
              styles.searchInput,
              Platform.OS === 'web' && { outlineStyle: 'none' }
            ]}
            value={search}
            onChangeText={setSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            selectionColor="#000000"
            underlineColorAndroid="transparent"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DTH Operators</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Loading operators...</Text>
            </View>
          ) : filteredBillers.length > 0 ? (
            filteredBillers.map((biller, index) => (
              <Pressable
                key={biller.id || index}
                style={styles.billerItem}
                onPress={() => handleOperatorPress(biller)}
                android_ripple={{ color: '#E5E7EB' }}
              >
                <View style={styles.logoContainer}>
                  <Image 
                    source={{ uri: biller.logo }} 
                    style={styles.logo}
                    defaultSource={require('../../../assets/icons/default.png')}
                  />
                </View>
                <Text style={styles.billerText}>{biller.operatorName}</Text>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  iconColor="#9CA3AF"
                  style={styles.chevronIcon}
                />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <IconButton
                icon="television"
                size={64}
                iconColor="#E5E7EB"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>
                {search ? 'No operators found' : 'No DTH operators available'}
              </Text>
              <Text style={styles.emptySubText}>
                {search 
                  ? 'Try searching with a different keyword'
                  : 'Please check your connection and try again'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 4,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  searchBarFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    ...(Platform.OS === 'web' && {
      outline: 'none',
    }),
  },
  searchIcon: {
    margin: 0,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 16,
    color: '#111827',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  billerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderRadius: 8,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  billerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chevronIcon: {
    margin: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  headerLogo: {
    width: 60,
    height: 24,
    marginRight: 8,
  },
});