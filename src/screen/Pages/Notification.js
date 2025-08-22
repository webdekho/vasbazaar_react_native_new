import CommonHeader2 from '../../components/CommoHedder2';
import { AuthContext } from '../../context/AuthContext';
import { getRecords } from '../../Services/ApiServices';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

// Extend dayjs with relative time plugin
dayjs.extend(relativeTime);

export default function NotificationAlertList({ navigation }) {
  const { userData, userToken } = useContext(AuthContext);
  
  // State management
  const [notificationData, setNotificationData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [error, setError] = useState(null);

  // Fetch notifications from API
  const fetchNotifications = async (pageNumber = 1, isRefresh = false, isLoadMore = false) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setIsRefreshing(true);
        setError(null);
      } else if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
        setError(null);
      }

      const response = await getRecords(
        { pageNumber: pageNumber - 1 }, // API expects 0-based page numbers
        userToken,
        'api/customer/announcement/notification'
      );

      if (response?.Status === "SUCCESS" || response?.status === "success") {
        const { records = [], totalPages: apiTotalPages = 1, currentPage: apiCurrentPage = 1 } = response.data || {};

        if (isRefresh || pageNumber === 1) {
          // Replace data for refresh or first load
          setNotificationData(records);
          setCurrentPage(1);
        } else {
          // Append data for pagination
          setNotificationData(prevData => {
            // Avoid duplicates based on ID
            const existingIds = new Set(prevData.map(item => item.id));
            const newRecords = records.filter(record => !existingIds.has(record.id));
            return [...prevData, ...newRecords];
          });
          setCurrentPage(pageNumber);
        }

        setTotalPages(apiTotalPages);
        setHasMoreData(pageNumber < apiTotalPages);
        
        console.log(`Loaded page ${pageNumber}/${apiTotalPages}, Records: ${records.length}`);
      } else {
        throw new Error(response?.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error.message || 'Failed to load notifications');
      
      // Show error only for initial load, not for pagination
      if (!isLoadMore && !isRefresh) {
        setNotificationData([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (userToken) {
      fetchNotifications(1);
    }
  }, [userToken]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    fetchNotifications(1, true);
  }, [userToken]);

  // Load more data when scrolled to bottom
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreData && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      console.log(`Loading more data: page ${nextPage}`);
      fetchNotifications(nextPage, false, true);
    }
  }, [isLoadingMore, hasMoreData, currentPage, totalPages]);

  // Get icon based on notification type or status
  const getNotificationIcon = (status, userType) => {
    if (status === 'sent') {
      return userType === 'customer' ? '✅' : '📢';
    }
    return '🔔';
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  // Format date and time
  const formatDateTime = (schedule, createdDate) => {
    if (schedule) {
      return dayjs(schedule).fromNow();
    }
    if (createdDate) {
      return dayjs(createdDate).fromNow();
    }
    return 'Unknown time';
  };

  // Render individual notification item
  const renderNotificationItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.notificationCard}
      onPress={() => {
        // Handle notification tap - could navigate to detail screen
        console.log('Notification tapped:', item.id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.notificationContent}>
        {/* Left side - Avatar/Profile */}
        <View style={styles.leftSection}>
          {item.customerId?.profile ? (
            <Image
              source={{ uri: item.customerId.profile }}
              style={styles.profileImage}
              defaultSource={require('../../../assets/icons/success.png')}
            />
          ) : (
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>{getNotificationIcon(item.status, item.userType)}</Text>
            </View>
          )}
        </View>

        {/* Main content */}
        <View style={styles.mainContent}>
          <View style={styles.headerRow}>
            <Text style={styles.senderName} numberOfLines={1}>
              {item.customerId?.name || 'System Notification'}
            </Text>
            
          </View>

          <Text style={styles.messageText} numberOfLines={3}>
            {item.message}
          </Text>

          <View style={styles.footerRow}>
            <Text style={styles.timeText}>
              {formatDateTime(item.schedule, item.createdDate)}
            </Text>
            {item.userType && (
              <Text style={styles.userTypeText}>
                {item.userType.charAt(0).toUpperCase() + item.userType.slice(1)}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render loading footer for pagination
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000000" />
        <Text style={styles.loadingText}>Loading more notifications...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        You don't have any notifications yet. Check back later!
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchNotifications(1)}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Handle scroll for web pagination
  const handleWebScroll = (e) => {
    if (Platform.OS !== 'web') return;
    
    const element = e.target;
    const threshold = 100; // Trigger when 100px from bottom
    
    if (element.scrollHeight - element.scrollTop <= element.clientHeight + threshold) {
      // User has scrolled near the bottom
      if (hasMoreData && !isLoadingMore && !loading) {
        handleLoadMore();
      }
    }
  };

  // Render content for web using native div
  const renderWebContent = () => {
    if (Platform.OS !== 'web') return null;
    
    const contentToRender = notificationData.length === 0 && !loading ? (
      renderEmptyState()
    ) : error && notificationData.length === 0 ? (
      renderErrorState()
    ) : (
      <div>
        {notificationData.map((item, index) => (
          <div key={`notification-${item.id}-${index}`}>
            <div style={{ marginBottom: '8px' }}>
              {React.createElement(renderNotificationItem, { item, index })}
            </div>
          </div>
        ))}
        {renderFooter() && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ActivityIndicator size="small" color="#000000" />
              <span style={{ color: '#666' }}>Loading more notifications...</span>
            </div>
          </div>
        )}
        {hasMoreData && !isLoadingMore && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            margin: '10px',
            cursor: 'pointer'
          }}
          onClick={() => !loading && handleLoadMore()}
          >
            <span style={{ color: '#666', fontSize: '14px' }}>
              Load More Notifications (Page {currentPage + 1} of {totalPages})
            </span>
          </div>
        )}
        {!hasMoreData && notificationData.length > 0 && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            color: '#999',
            fontSize: '14px'
          }}>
            No more notifications to load
          </div>
        )}
      </div>
    );

    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        backgroundColor: '#F8F9FA'
      }}>
        <div style={{ flexShrink: 0 }}>
          <CommonHeader2 heading="Notifications" goback="Home" />
        </div>
        
        {/* Header with count */}
        {notificationData.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E0E0E0',
            flexShrink: 0
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#1a1a1a',
              margin: 0
            }}>
              Notifications
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '14px', 
                color: '#666', 
                fontWeight: '500' 
              }}>
                {notificationData.length} of {totalPages > 1 ? `${totalPages} pages` : 'all'}
              </span>
              <button
                onClick={() => handleRefresh()}
                disabled={isRefreshing}
                style={{
                  padding: '6px 12px',
                  backgroundColor: isRefreshing ? '#ccc' : '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isRefreshing ? 'default' : 'pointer',
                  fontSize: '12px'
                }}
              >
                {isRefreshing ? '↻' : '↻'} Refresh
              </button>
            </div>
          </div>
        )}

        <div 
          style={{ 
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
            height: 0 // Force flex item to shrink
          }}
          onScroll={handleWebScroll}
        >
          {loading && notificationData.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <ActivityIndicator size="large" color="#000000" />
              <span style={{ marginTop: '12px', color: '#666' }}>Loading notifications...</span>
            </div>
          ) : (
            <div style={{ padding: '8px' }}>
              {contentToRender}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Mobile render
  const renderMobileContent = () => (
    <View style={styles.mainContainer}>
      <CommonHeader2 heading="Notifications" goback="Home" />
      <View style={styles.container}>
        {/* Header with count */}
        {notificationData.length > 0 && (
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Notifications</Text>
            <Text style={styles.countText}>
              {notificationData.length} of {totalPages > 1 ? `${totalPages} pages` : 'all'}
            </Text>
          </View>
        )}

        {/* Loading state for initial load */}
        {loading && notificationData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={notificationData}
            keyExtractor={(item, index) => `notification-${item.id}-${index}`}
            renderItem={renderNotificationItem}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={['#000000']}
                tintColor="#000000"
                title="Pull to refresh"
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={!loading ? (error && notificationData.length === 0 ? renderErrorState : renderEmptyState) : null}
            contentContainerStyle={[
              styles.listContainer,
              notificationData.length === 0 && styles.emptyListContainer
            ]}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </View>
  );

  return Platform.OS === 'web' ? renderWebContent() : renderMobileContent();
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      },
    }),
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    ...Platform.select({
      web: {
        flex: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 8,
    ...Platform.select({
      web: {
        paddingBottom: 20,
      },
    }),
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  flatList: {
    flex: 1,
    ...Platform.select({
      web: {
        flex: 1,
        overflow: 'auto',
        height: '100%',
      },
    }),
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
    marginVertical: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  leftSection: {
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  iconText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
  },
  userTypeText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F44336',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});