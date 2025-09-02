import MainHeader from '@/components/MainHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserComplaints } from '../../services';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ComplaintScreen() {
  // State management
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageSize] = useState(10);
  const [error, setError] = useState(null);

  // Fetch complaints from API
  const fetchComplaints = async (pageNumber = 1, isRefresh = false) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setIsRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
        setError(null);
      }

      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        throw new Error('No session token found');
      }

      const response = await getUserComplaints(pageNumber - 1, pageSize, sessionToken);
      console.log('Complaints API Response:', response);

      if (response?.status === 'success' || response?.Status === "SUCCESS") {
        const { records = [], totalPages: apiTotalPages = 1, totalRecords: apiTotalRecords = 0 } = response.data || {};

        if (isRefresh || pageNumber === 1) {
          // Replace data for refresh or first load
          setComplaints(records);
        } else {
          // Append data for pagination (web scrolling)
          setComplaints(prevData => {
            // Avoid duplicates based on ID
            const existingIds = new Set(prevData.map(item => item.id));
            const newRecords = records.filter(record => !existingIds.has(record.id));
            return [...prevData, ...newRecords];
          });
        }
        
        setCurrentPage(pageNumber);
        setTotalPages(apiTotalPages);
        setTotalRecords(apiTotalRecords);
        setHasMoreData(pageNumber < apiTotalPages);
        
        // Loaded page data
        console.log('Complaints loaded:', records.length);
      } else {
        throw new Error(response?.message || 'Failed to fetch complaints');
      }
    } catch (error) {
      // Error fetching complaints
      console.error('Error fetching complaints:', error);
      setError(error.message || 'Failed to load complaints');
      if (!isRefresh) {
        setComplaints([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchComplaints(1);
  }, []);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    fetchComplaints(currentPage, true);
  }, [currentPage]);

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      fetchComplaints(newPage);
    }
  };

  // Load more data (for web scrolling)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);

  // Load more handler for web scrolling
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreData && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      // Loading more complaints
      setIsLoadingMore(true);
      
      fetchComplaints(nextPage).finally(() => {
        setIsLoadingMore(false);
      });
    }
  }, [isLoadingMore, hasMoreData, currentPage, totalPages]);

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

  // Get status color and icon
  const getStatusStyle = (status) => {
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case 'open':
        return {
          color: '#FF6B6B',
          backgroundColor: '#FFE0E0',
          icon: 'exclamation-circle',
        };
      case 'closed':
        return {
          color: '#4CAF50',
          backgroundColor: '#E8F5E9',
          icon: 'check-circle',
        };
      case 'pending':
        return {
          color: '#FF9800',
          backgroundColor: '#FFF3E0',
          icon: 'clock-o',
        };
      default:
        return {
          color: '#666666',
          backgroundColor: '#F5F5F5',
          icon: 'info-circle',
        };
    }
  };

  // Format date and time
  const formatDateTime = (date, time) => {
    if (date && time) {
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const formattedTime = time.split('.')[0];
      return `${formattedDate} at ${formattedTime}`;
    }
    return 'N/A';
  };

  // Render individual complaint item
  const renderComplaintItem = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);
    
    return (
      <View style={styles.complaintCard}>
        {/* Header with Transaction ID and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.txnContainer}>
            <Text style={styles.txnLabel}>Transaction ID</Text>
            <Text style={styles.txnId}>{item.txnId || 'N/A'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <FontAwesome name={statusStyle.icon} size={16} color={statusStyle.color} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>
              {item.status?.toUpperCase() || 'UNKNOWN'}
            </Text>
          </View>
        </View>

        {/* User Info Section */}
        <View style={styles.userSection}>
          {item.logo ? (
            <Image
              source={{ uri: item.logo }}
              style={styles.userAvatar}
              defaultSource={require('../../assets/images/avatar.jpg')}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <FontAwesome name="user" size={20} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item?.name || 'Unknown User'}</Text>
            <Text style={styles.userMobile}>
              <FontAwesome name="phone" size={12} color="#666666" />
              {' '}{item?.mobile || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Complaint Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionLabel}>Complaint Description</Text>
          <Text style={styles.descriptionText}>{item.description || 'No description provided'}</Text>
        </View>

        {/* Date and Time */}
        <View style={styles.dateTimeSection}>
          <FontAwesome name="calendar" size={16} color="#666666" />
          <Text style={styles.dateTimeText}>{formatDateTime(item.date, item.time)}</Text>
        </View>

        {/* Reply Section (if exists) */}
        {item.reply && (
          <View style={styles.replySection}>
            <View style={styles.replyHeader}>
              <FontAwesome name="comment" size={18} color="#000000" />
              <Text style={styles.replyLabel}>Admin Reply</Text>
            </View>
            <Text style={styles.replyText}>{item.reply}</Text>
            {(item.replyDate || item.replyTime) && (
              <Text style={styles.replyDateTime}>
                Replied on: {formatDateTime(item.replyDate, item.replyTime)}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render pagination controls
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => handlePageChange(1)}
          disabled={currentPage === 1}
        >
          <FontAwesome name="fast-backward" size={18} color={currentPage === 1 ? '#CCCCCC' : '#000000'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FontAwesome name="chevron-left" size={18} color={currentPage === 1 ? '#CCCCCC' : '#000000'} />
        </TouchableOpacity>

        {startPage > 1 && (
          <>
            <TouchableOpacity style={styles.pageButton} onPress={() => handlePageChange(1)}>
              <Text style={styles.pageButtonText}>1</Text>
            </TouchableOpacity>
            {startPage > 2 && <Text style={styles.ellipsis}>...</Text>}
          </>
        )}

        {pageNumbers.map(page => (
          <TouchableOpacity
            key={page}
            style={[styles.pageButton, currentPage === page && styles.pageButtonActive]}
            onPress={() => handlePageChange(page)}
          >
            <Text style={[styles.pageButtonText, currentPage === page && styles.pageButtonTextActive]}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Text style={styles.ellipsis}>...</Text>}
            <TouchableOpacity style={styles.pageButton} onPress={() => handlePageChange(totalPages)}>
              <Text style={styles.pageButtonText}>{totalPages}</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FontAwesome name="chevron-right" size={18} color={currentPage === totalPages ? '#CCCCCC' : '#000000'} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <FontAwesome name="fast-forward" size={18} color={currentPage === totalPages ? '#CCCCCC' : '#000000'} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="file-text-o" size={80} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Complaints Found</Text>
      <Text style={styles.emptySubtitle}>
        You haven't raised any complaints yet.
      </Text>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <FontAwesome name="exclamation-triangle" size={80} color="#FF6B6B" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchComplaints(1)}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Render content for web using native div
  const renderWebContent = () => {
    if (Platform.OS !== 'web') return null;
    
    const contentToRender = complaints.length === 0 && !loading ? (
      renderEmptyState()
    ) : error && complaints.length === 0 ? (
      renderErrorState()
    ) : (
      <div>
        {complaints.map((item, index) => (
          <div key={`complaint-${item.id}-${index}`}>
            <div style={{ marginBottom: '8px' }}>
              {React.createElement(renderComplaintItem, { item, index })}
            </div>
          </div>
        ))}
        {isLoadingMore && (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <ActivityIndicator size="small" color="#000000" />
              <span style={{ color: '#666' }}>Loading more complaints...</span>
            </div>
          </div>
        )}
        {hasMoreData && !isLoadingMore && currentPage < totalPages && (
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
              Load More Complaints (Page {currentPage + 1} of {totalPages})
            </span>
          </div>
        )}
        {!hasMoreData && complaints.length > 0 && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center',
            color: '#999',
            fontSize: '14px'
          }}>
            No more complaints to load
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
          <MainHeader title="Complaints" showBack={true} showSearch={false} showNotification={false} />
        </div>
        
        {/* Header with count */}
        {complaints.length > 0 && (
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
              Your Complaints
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                fontSize: '14px', 
                color: '#666', 
                fontWeight: '500' 
              }}>
                Page {currentPage} of {totalPages} ({totalRecords} total)
              </span>
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
          {loading && complaints.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%'
            }}>
              <ActivityIndicator size="large" color="#000000" />
              <span style={{ marginTop: '12px', color: '#666' }}>Loading complaints...</span>
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
      <MainHeader title="Complaints" showBack={true} showSearch={false} showNotification={false} />
      <View style={styles.container}>
        {/* Header with count */}
        {complaints.length > 0 && (
          <View style={styles.headerContainer}>
            <Text style={styles.heading}>Your Complaints</Text>
            <Text style={styles.countText}>
              Page {currentPage} of {totalPages} ({totalRecords} total)
            </Text>
          </View>
        )}

        {/* Loading state for initial load */}
        {loading && complaints.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading complaints...</Text>
          </View>
        ) : (
          <FlatList
            data={complaints}
            keyExtractor={(item, index) => `complaint-${item.id}-${index}`}
            renderItem={renderComplaintItem}
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
            ListFooterComponent={renderPaginationControls}
            ListEmptyComponent={!loading ? (error && complaints.length === 0 ? renderErrorState : renderEmptyState) : null}
            contentContainerStyle={[
              styles.listContainer,
              complaints.length === 0 && styles.emptyListContainer
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
    fontWeight: '600',
    color: '#1a1a1a',
  },
  countText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        overflow: 'auto',
      },
    }),
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  listContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  // Complaint Card Styles
  complaintCard: {
    backgroundColor: '#FFFFFF',
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  txnContainer: {
    flex: 1,
  },
  txnLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  txnId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // User Section
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  userMobile: {
    fontSize: 13,
    color: '#666666',
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Description Section
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  
  // Date Time Section
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 13,
    color: '#666666',
  },
  
  // Reply Section
  replySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  replyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  replyText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  replyDateTime: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 8,
  },
  pageButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  pageButtonTextActive: {
    color: '#FFFFFF',
  },
  ellipsis: {
    fontSize: 14,
    color: '#666666',
    paddingHorizontal: 4,
  },
  
  // Loading, Empty, and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6B6B',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#666666',
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