import { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';
import { getReferredUsers } from '../../services/user/userService';

export default function ReferralListScreen() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Constants
  const ITEMS_PER_PAGE = 10;

  // Fetch referrals from API
  const fetchReferrals = useCallback(async (pageNumber = 0, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setError(null);
      } else if (pageNumber === 0) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      // Get user token
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        throw new Error('Please log in again');
      }

      // API call using our service
      const response = await getReferredUsers(sessionToken, pageNumber, ITEMS_PER_PAGE);

      if (response?.status === 'success') {
        const { records = [], totalRecords: total = 0 } = response.data || {};
        
        if (isRefresh || pageNumber === 0) {
          setReferrals(records);
        } else {
          setReferrals(prev => [...prev, ...records]);
        }
        
        setTotalRecords(total);
        setPage(pageNumber);
      } else {
        throw new Error(response?.message || 'Failed to fetch referrals');
      }
    } catch (error) {
      console.error('Fetch referrals error:', error);
      setError(error.message);
      
      // If first load fails, show empty state
      if (pageNumber === 0 || isRefresh) {
        setReferrals([]);
        setTotalRecords(0);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchReferrals(0);
  }, [fetchReferrals]);

  // Refresh handler
  const onRefresh = () => {
    fetchReferrals(0, true);
  };

  // Load more handler
  const loadMoreReferrals = () => {
    if (referrals.length < totalRecords && !loadingMore && !loading) {
      const nextPage = page + 1;
      fetchReferrals(nextPage);
    }
  };

  // Retry handler
  const retryFetch = () => {
    fetchReferrals(0);
  };

  // Render referral item
  const renderReferralItem = ({ item, index }) => (
    <ThemedView style={styles.referralCard}>
      <ThemedView style={styles.referralHeader}>
        <ThemedView style={styles.userAvatar}>
          <ThemedText style={styles.avatarText}>
            {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.userInfo}>
          <ThemedText style={styles.userName}>
            {item.name || 'Unknown User'}
          </ThemedText>
          <ThemedText style={styles.userPhone}>
            {item.phone || item.mobile || 'No phone number'}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.referralIndex}>
          <ThemedText style={styles.indexText}>#{index + 1}</ThemedText>
        </ThemedView>
      </ThemedView>
      
      {/* Additional user details if available */}
      {(item.email || item.city || item.joinedDate) && (
        <ThemedView style={styles.referralDetails}>
          {item.email && (
            <ThemedView style={styles.detailRow}>
              <FontAwesome name="envelope" size={12} color="#666" />
              <ThemedText style={styles.detailText}>{item.email}</ThemedText>
            </ThemedView>
          )}
          {item.city && (
            <ThemedView style={styles.detailRow}>
              <FontAwesome name="map-marker" size={12} color="#666" />
              <ThemedText style={styles.detailText}>{item.city}</ThemedText>
            </ThemedView>
          )}
          {item.joinedDate && (
            <ThemedView style={styles.detailRow}>
              <FontAwesome name="calendar" size={12} color="#666" />
              <ThemedText style={styles.detailText}>
                Joined: {new Date(item.joinedDate).toLocaleDateString()}
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );

  // Render footer for load more
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <ThemedView style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#000" />
        <ThemedText style={styles.loadingText}>Loading more...</ThemedText>
      </ThemedView>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <ThemedView style={styles.emptyContainer}>
      <FontAwesome name="users" size={60} color="#ccc" />
      <ThemedText style={styles.emptyTitle}>No Referrals Yet</ThemedText>
      <ThemedText style={styles.emptyText}>
        {error ? error : "You haven't referred anyone yet. Start sharing your referral code to see users here!"}
      </ThemedText>
      {error && (
        <TouchableOpacity style={styles.retryButton} onPress={retryFetch}>
          <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
        </TouchableOpacity>
      )}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <MainHeader 
        title="Referral Users"
        showBack={true}
        showSearch={false}
        showNotification={false}
        rightComponent={
          totalRecords > 0 ? (
            <ThemedView style={styles.statsContainer}>
              <ThemedText style={styles.statsText}>{totalRecords}</ThemedText>
            </ThemedView>
          ) : null
        }
      />

      {loading && !refreshing ? (
        <ThemedView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <ThemedText style={styles.loadingText}>Loading referrals...</ThemedText>
        </ThemedView>
      ) : (
        <FlatList
          data={referrals}
          renderItem={renderReferralItem}
          keyExtractor={(item, index) => `${item.id || item.phone || index}-${index}`}
          contentContainerStyle={[
            styles.listContent,
            referrals.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000"
              colors={['#000']}
            />
          }
          onEndReached={loadMoreReferrals}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Summary footer */}
      {referrals.length > 0 && (
        <ThemedView style={styles.summaryFooter}>
          <ThemedText style={styles.summaryText}>
            Showing {referrals.length} of {totalRecords} referrals
          </ThemedText>
          {referrals.length < totalRecords && (
            <ThemedText style={styles.summarySubtext}>
              Pull to refresh or scroll down for more
            </ThemedText>
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  referralCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  referralHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#666',
  },
  referralIndex: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  indexText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  referralDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  separator: {
    height: 12,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  summarySubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});