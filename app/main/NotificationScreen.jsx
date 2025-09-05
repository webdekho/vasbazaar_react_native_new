import { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, FlatList, View, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import MainHeader from '@/components/MainHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications } from '../../services';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState([]);
  const [apiNotifications, setApiNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Default notifications removed - will show empty state when no API data

  // Fetch notifications from API
  const fetchNotifications = async (pageNumber = 0, append = false) => {
    try {
      if (!append) setLoading(true);
      console.log('Fetching notifications, page:', pageNumber);
      
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      console.log('NotificationScreen - Session token check:', {
        hasToken: !!sessionToken,
        tokenLength: sessionToken?.length || 0,
        tokenPreview: sessionToken ? `${sessionToken.substring(0, 10)}...` : 'null'
      });
      
      if (!sessionToken) {
        console.log('No session token found, showing empty state');
        setApiNotifications([]);
        setLoading(false);
        return;
      }

      const response = await getNotifications(pageNumber, 10, sessionToken);
      
      console.log('API Response structure:', response);
      console.log('Response status check:', response?.status);
      console.log('Response data check:', !!response?.data);
      
      if (response?.status === 'success' && response?.data) {
        console.log('Successfully fetched notifications:', response.data.length);
        
        if (append) {
          setApiNotifications(prev => [...prev, ...response.data]);
        } else {
          setApiNotifications(response.data);
        }
        setPagination(response.pagination);
        setCurrentPage(pageNumber);
      } else {
        console.log('Failed to fetch notifications - Full Response:', JSON.stringify(response, null, 2));
        console.log('Response status:', response?.status);
        console.log('Response message:', response?.message);
        
        // Check if it's an authentication error
        if (response?.status === 'error' && response?.message?.toLowerCase().includes('token')) {
          console.log('Token issue detected, clearing session...');
          await AsyncStorage.removeItem('sessionToken');
        }
        
        if (!append) {
          setApiNotifications([]);
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (!append) {
        setApiNotifications([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load more notifications (pagination)
  const loadMoreNotifications = async () => {
    if (!pagination || currentPage >= pagination.totalPages - 1 || loadingMore) {
      return;
    }
    
    setLoadingMore(true);
    await fetchNotifications(currentPage + 1, true);
  };

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications(0, false);
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Add iPhone Safari specific CSS for bottom content visibility
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.innerHTML = `
        /* iPhone Safari specific styles for bottom content */
        @supports (-webkit-touch-callout: none) {
          @media screen and (max-width: 768px) {
            /* Ensure bottom content is visible */
            .notification-list-container {
              padding-bottom: 120px !important;
            }
          }
        }
        
        /* Additional iPhone viewport fixes */
        @media screen and (max-device-width: 480px) {
          .notification-list-container {
            padding-bottom: 120px !important;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      };
    }
  }, []);

  // Priority: API notifications > manual notifications  
  const displayNotifications = apiNotifications.length > 0 ? apiNotifications : notifications;
                               
  console.log('Display logic:', {
    apiCount: apiNotifications.length,
    manualCount: notifications.length,
    displaying: displayNotifications.length,
    source: apiNotifications.length > 0 ? 'API' : 'manual'
  });

  const handleDeleteNotification = (id) => {
    // Remove from displayed notifications
    if (apiNotifications.length > 0) {
      setApiNotifications(prev => prev.filter(notif => notif.id !== id));
    } else {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }
  };

  const handleClearAll = () => {
    if (apiNotifications.length > 0) {
      setApiNotifications([]);
    } else {
      setNotifications([]);
    }
  };

  const renderNotificationItem = ({ item }) => {
    // Get appropriate icon based on notification type or default
    const getNotificationIcon = (type) => {
      if (item.icon) return item.icon; // For default notifications
      
      switch (type) {
        case 'customer':
          return 'user';
        case 'general':
          return 'bell';
        default:
          return 'info-circle';
      }
    };

    const displayTime = item.time || `${item.date}${item.time ? ` at ${item.time}` : ''}`;

    return (
      <View style={styles.notificationItem}>
        <View style={styles.notificationIcon}>
          <FontAwesome 
            name={getNotificationIcon(item.type)} 
            size={20} 
            color="#000000" 
          />
        </View>
        <View style={styles.notificationContent}>
          <ThemedText style={styles.notificationTitle}>
            {item.title}
          </ThemedText>
          <ThemedText style={styles.notificationMessage}>
            {item.message}
          </ThemedText>
          <ThemedText style={styles.notificationTime}>
            {displayTime}
          </ThemedText>
          {item.cnf && (
            <ThemedText style={styles.cnfInfo}>
              From: {item.cnf.name}
            </ThemedText>
          )}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(item.id)}
        >
          {/* <FontAwesome name="times" size={16} color="#ff4444" /> */}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <MainHeader 
        title="Notifications"
        showBack={true}
        showSearch={false}
        showNotification={false}
        rightComponent={
          displayNotifications.length > 0 ? (
            <TouchableOpacity onPress={handleClearAll}>
              {/* <ThemedText style={styles.clearAllText}>Clear All</ThemedText> */}
            </TouchableOpacity>
          ) : null
        }
      />

      {loading && displayNotifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <ThemedText style={styles.loadingText}>Loading notifications...</ThemedText>
        </View>
      ) : displayNotifications.length > 0 ? (
        <FlatList
          data={displayNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.notificationList}
          contentContainerStyle={[
            styles.notificationListContent,
            Platform.OS === 'web' && { className: 'notification-list-container' }
          ]}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          bounces={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000000']}
            />
          }
          onEndReached={loadMoreNotifications}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => {
            if (loadingMore) {
              return (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color="#666" />
                  <ThemedText style={styles.footerLoadingText}>Loading more...</ThemedText>
                </View>
              );
            }
            return null;
          }}
        />
      ) : (
        <ThemedView style={styles.emptyContainer}>
          <FontAwesome name="bell-slash" size={60} color="#ccc" />
          <ThemedText style={styles.emptyText}>No notifications</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            You'll see your notifications here when they arrive
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clearAllText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notificationList: {
    flex: 1,
  },
  notificationListContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'web' ? 100 : 50,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000000',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerLoadingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    fontWeight: '500',
  },
  cnfInfo: {
    fontSize: 12,
    color: '#0066CC',
    fontWeight: '500',
    marginTop: 4,
  },
});