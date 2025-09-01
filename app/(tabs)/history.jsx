import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, TextInput, Modal, Pressable, Alert, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Header, { HeaderPresets } from '@/components/Header';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactionHistory, submitComplaint } from '../../services';

export default function HistoryScreen() {
  const router = useRouter();
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Complaint modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [complaintStatus, setComplaintStatus] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  
  const handleNotificationPress = () => {
    console.log('Notification pressed');
    router.push('/main/NotificationScreen');
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
    router.push('/main/AllServicesScreen');
  };

 

  // Fetch transactions from API
  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const sessionToken = await AsyncStorage.getItem('sessionToken');
      if (!sessionToken) {
        console.log('No session token found');
        setTransactions([]);
        return;
      }

      const response = await getTransactionHistory(0, sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        const { records, totalPages } = response.data;
        setTransactions(records);
        setTotalPages(totalPages);
        setPage(1);
        console.log('Successfully fetched transactions:', records.length);
      } else {
        console.log('Failed to fetch transactions:', response?.message);
        Alert.alert('Error', 'Failed to load transaction history. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load more transactions (pagination)
  const loadMoreTransactions = async () => {
    if (isLoadingMore || page >= totalPages) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      const response = await getTransactionHistory(page, sessionToken);
      
      if (response?.status === 'success' && response?.data) {
        const { records } = response.data;
        setTransactions(prev => [...prev, ...records]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Step 1: Check complaint status
  const checkComplaintStatus = async (txnId) => {
    try {
      setCheckingStatus(true);
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      const response = await submitComplaint(
        txnId, 
        '', // Empty complaint text for status check
        sessionToken,
        'check' // Action parameter for checking status
      );
      
      if (response?.status === 'success' && response?.data) {
        const { hasComplaint, complaintDetails, message } = response.data;
        
        setComplaintStatus({
          hasComplaint,
          details: complaintDetails,
          message: message || 'Complaint status checked successfully'
        });
        
        if (hasComplaint || response?.data?.message) {
          // Show existing complaint details or API message
          const displayMessage = response.data.message || 
            `A complaint already exists for this transaction.\n\nStatus: ${complaintDetails?.status || 'Under Review'}\nDate: ${complaintDetails?.date || 'N/A'}\nDescription: ${complaintDetails?.description || 'No description available'}`;
          
          setComplaintStatus({
            hasComplaint: true,
            details: complaintDetails,
            message: displayMessage,
            complaintStatus: response.data.complaintStatus
          });
        } else {
          // Show complaint form
          setShowComplaintForm(true);
        }
      } else {
        // No existing complaint found or API error, show form
        setComplaintStatus({ hasComplaint: false });
        setShowComplaintForm(true);
      }
    } catch (error) {
      console.error('Error checking complaint status:', error);
      // On error, show complaint form anyway
      setComplaintStatus({ hasComplaint: false });
      setShowComplaintForm(true);
      Alert.alert('Info', 'Unable to check complaint status. You can still submit a new complaint.');
    } finally {
      setCheckingStatus(false);
    }
  };

  // Step 2: Submit complaint
  const handleComplaintSubmit = async () => {
    try {
      setSubmitting(true);
      const sessionToken = await AsyncStorage.getItem('sessionToken');
      
      const response = await submitComplaint(
        selectedTransaction.txnId, 
        complaintText.trim(), 
        sessionToken,
        'add' // Action parameter for adding new complaint
      );
      
      if (response?.status === 'success') {
        if (response.data?.hasExistingComplaint || response.data?.message) {
          // Show existing complaint message in modal
          setShowComplaintForm(false);
          setComplaintStatus({
            hasComplaint: true,
            details: null,
            message: response.data.message,
            complaintStatus: response.data.complaintStatus || 'processing'
          });
        } else {
          // Step 3: Close modal and refresh history for new complaint
          setModalVisible(false);
          setComplaintText('');
          setShowComplaintForm(false);
          setComplaintStatus(null);
          
          Alert.alert(
            'Success', 
            `Your complaint has been registered with Transaction ID: ${selectedTransaction.txnId}. Our support team will review it shortly.`,
            [{ 
              text: 'OK', 
              onPress: () => {
                // Refresh transaction history after user acknowledges
                fetchTransactions(true);
              }
            }]
          );
          
          // Update local state immediately
          setTransactions(prev => 
            prev.map(txn => 
              txn.txnId === selectedTransaction.txnId 
                ? { ...txn, hasComplaint: true }
                : txn
            )
          );
        }
      } else {
        Alert.alert('Error', response?.message || 'Unable to submit your complaint. Please try again later.');
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      Alert.alert('Network Error', 'Unable to connect to server. Please check your internet connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Copy coupon code
  const copyCouponCode = (couponCode) => {
    Alert.alert(
      'Coupon Code', 
      `${couponCode}\n\nCoupon code is displayed above. You can manually copy it.`,
      [{ text: 'OK', style: 'default' }]
    );
  };

  // Format date and time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    return timeString.split('.')[0];
  };

  // Group transactions by month
  const groupByMonth = (data) => {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      // Build description
      let description = '';
      if (item.operatorId?.serviceId?.serviceName) {
        description += `${item.operatorId.serviceId.serviceName}`;
      }
      if (item.operatorNo) {
        description += description ? ` - ${item.operatorNo}` : item.operatorNo;
      }
      if (item.customerName) {
        description += ` - ${item.customerName}`;
      }

      grouped[monthYear].push({
        id: item.txnId,
        name: item.operatorId?.name || item.serviceType,
        desc: description,
        amount: item.txnAmt,
        date: formatDate(item.date),
        time: formatTime(item.time),
        icon: item.operatorId?.logo || 'https://via.placeholder.com/40',
        status: item.status.toLowerCase(),
        serviceType: item.serviceType,
        couponCode: item.couponCode,
        couponDescription: item.discription,
        originalData: item
      });
    });
    
    return grouped;
  };

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(txn => 
    txn.operatorNo?.includes(searchQuery) ||
    txn.txnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (txn.customerName && txn.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    txn.serviceType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTransactions = groupByMonth(filteredTransactions);

  const openComplaintModal = (transaction) => {
    setSelectedTransaction(transaction);
    setComplaintText('');
    setComplaintStatus(null);
    setShowComplaintForm(false);
    setModalVisible(true);
    
    // Step 1: Check complaint status first
    checkComplaintStatus(transaction.txnId);
  };

  const closeComplaintModal = () => {
    setModalVisible(false);
    setComplaintText('');
    setSelectedTransaction(null);
    setComplaintStatus(null);
    setShowComplaintForm(false);
    setCheckingStatus(false);
  };

  // Component for operator icon with fallback
  const OperatorIcon = ({ icon, size = 35 }) => {
    const [imageError, setImageError] = useState(false);

    if (!icon || imageError) {
      return <MaterialIcons name="account-circle" size={size} color="#666" />;
    }

    return (
      <Image 
        source={{ uri: icon }} 
        style={styles.operatorIcon}
        onError={() => setImageError(true)}
        onLoad={() => setImageError(false)}
      />
    );
  };

  // iOS zoom prevention for web browsers
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Prevent zoom on touch events (iOS Safari/Chrome)
      const preventZoom = (event) => {
        if (event.touches && event.touches.length > 1) {
          event.preventDefault();
        }
      };

      // Prevent double-tap zoom
      const preventDoubleTapZoom = (event) => {
        if (event.detail === 2) {
          event.preventDefault();
        }
      };

      // Add event listeners
      document.addEventListener('touchmove', preventZoom, { passive: false });
      document.addEventListener('click', preventDoubleTapZoom, { passive: false });

      return () => {
        document.removeEventListener('touchmove', preventZoom);
        document.removeEventListener('click', preventDoubleTapZoom);
      };
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <Header 
        {...HeaderPresets.tabs}
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
      />

      {/* Complaint Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeComplaintModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Complaint</Text>
              <TouchableOpacity 
                onPress={closeComplaintModal}
                style={styles.closeButton}
                disabled={submitting}
              >
                <FontAwesome name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.transactionInfo}>
              <Text style={styles.modalSubtitle}>
                Transaction ID: {selectedTransaction?.txnId}
              </Text>
              <Text style={styles.transactionAmount}>
                Amount: ₹{selectedTransaction?.txnAmt}
              </Text>
            </View>
            
            {checkingStatus ? (
              <View style={styles.statusCheckContainer}>
                <ActivityIndicator color="#FF9800" size="large" />
                <Text style={styles.statusCheckText}>Checking complaint status...</Text>
              </View>
            ) : showComplaintForm ? (
              <>
                <Text style={styles.inputLabel}>Describe your issue (Optional)</Text>
                <TextInput
                  style={styles.complaintInput}
                  multiline
                  numberOfLines={4}
                  placeholder="Please provide detailed information about your complaint..."
                  placeholderTextColor="#999"
                  value={complaintText}
                  onChangeText={setComplaintText}
                  editable={!submitting}
                  maxLength={500}
                />
                
                <View style={styles.modalButtonContainer}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={closeComplaintModal}
                    disabled={submitting}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.submitButton]}
                    onPress={handleComplaintSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <View style={styles.submittingContainer}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.submittingText}>Submitting...</Text>
                      </View>
                    ) : (
                      <Text style={styles.submitButtonText}>Submit</Text>
                    )}
                  </Pressable>
                </View>
              </>
            ) : complaintStatus?.hasComplaint ? (
              <View style={styles.existingComplaintContainer}>
                <View style={styles.complaintStatusHeader}>
                  <FontAwesome name="info-circle" size={28} color="#FF9800" />
                  <Text style={styles.complaintStatusTitle}>Complaint Status</Text>
                </View>
                
                <View style={styles.complaintMessageContainer}>
                  <Text style={styles.complaintMessageText}>
                    {complaintStatus.message}
                  </Text>
                  
                  {complaintStatus.complaintStatus && (
                    <View style={styles.statusBadgeContainer}>
                      <View style={[styles.complaintStatusBadge, {
                        backgroundColor: complaintStatus.complaintStatus === 'processing' ? '#FFF3E0' : '#E8F5E8'
                      }]}>
                        <FontAwesome 
                          name={complaintStatus.complaintStatus === 'processing' ? 'clock-o' : 'check-circle'} 
                          size={14} 
                          color={complaintStatus.complaintStatus === 'processing' ? '#FF9800' : '#4CAF50'} 
                        />
                        <Text style={[styles.complaintStatusText, {
                          color: complaintStatus.complaintStatus === 'processing' ? '#FF9800' : '#4CAF50'
                        }]}>
                          {complaintStatus.complaintStatus.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
                
                <Pressable
                  style={[styles.modalButton, styles.cancelButton, { marginTop: 20 }]}
                  onPress={closeComplaintModal}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <Text style={styles.waitingText}>Please wait while we check your complaint status...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search transactions..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => fetchTransactions(true)} disabled={refreshing}>
          <FontAwesome 
            name="refresh" 
            size={20} 
            color={refreshing ? "#ccc" : "#2196F3"} 
          />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>No Transactions Found</Text>
          <Text style={styles.emptySubtitle}>
            Your transaction history will appear here once you make your first transaction.
          </Text>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedTransactions)}
          keyExtractor={([month]) => month}
          renderItem={({ item: [month, entries] }) => (
            <View style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              
              {entries.map((txn) => (
                <View key={txn.id.toString()} style={styles.item}>
                  <View style={styles.cardContent}>
                    <View style={styles.iconBox}>
                      <OperatorIcon icon={txn.icon} />
                    </View>
                    <View style={styles.details}>
                      <Text style={styles.name} numberOfLines={1}>{txn.name}</Text>
                      <Text style={styles.desc} numberOfLines={1}>{txn.desc}</Text>
                      <Text style={styles.txnId}>ID: {txn.id} • {txn.serviceType}</Text>
                      {txn.status === 'pending' && !txn.originalData.hasComplaint && (
                        <TouchableOpacity
                          style={styles.complaintBtn}
                          onPress={() => openComplaintModal(txn.originalData)}
                        >
                          <FontAwesome name="exclamation-circle" size={12} color="#FFFFFF" />
                          <Text style={styles.complaintBtnText}>Raise Complaint</Text>
                        </TouchableOpacity>
                      )}
                      {txn.originalData.hasComplaint && (
                        <View style={styles.complaintSubmitted}>
                          <FontAwesome name="check-circle" size={12} color="#4CAF50" />
                          <Text style={styles.complaintSubmittedText}>Complaint Submitted</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.amountBox}>
                      <Text style={[styles.amount, { color: '#333' }]}>
                        ₹{Math.abs(txn.amount)}
                      </Text>
                      <Text style={styles.time}>{txn.date} {txn.time}</Text>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: txn.status === 'success' ? '#E8F5E8' : '#FFF3E0' }
                      ]}>
                        <Text style={[
                          styles.status, 
                          { color: txn.status === 'success' ? '#4CAF50' : '#FF9800' }
                        ]}>
                          {txn.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {txn.couponCode && txn.status === 'success' && (
                    <View style={styles.couponSection}>
                      <View style={styles.couponInfo}>
                        <View style={styles.couponContent}>
                          <Text style={styles.couponCode}>Coupon: {txn.couponCode}</Text>
                          {txn.couponDescription && (
                            <Text style={styles.couponDesc}>{txn.couponDescription}</Text>
                          )}
                        </View>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyCouponCode(txn.couponCode)}
                        >
                          <FontAwesome name="copy" size={14} color="#2E7D32" />
                          <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          onEndReached={loadMoreTransactions}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchTransactions(true)}
              colors={['#2196F3']}
            />
          }
          ListFooterComponent={() => (
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.footerText}>Loading more transactions...</Text>
              </View>
            ) : null
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    // iOS zoom prevention
    touchAction: 'manipulation',
  },
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16, // Minimum 16px to prevent iOS zoom
    color: '#333',
    // Additional iOS zoom prevention
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
  },
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  // Transaction List
  monthSection: {
    marginBottom: 25,
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  item: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'column',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  operatorIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  details: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  desc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  txnId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  amountBox: {
    alignItems: 'flex-end',
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  status: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Complaint Buttons
  complaintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  complaintBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  complaintSubmitted: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  complaintSubmittedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  // Coupon Section
  couponSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  couponInfo: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A5D6A7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponContent: {
    flex: 1,
    marginRight: 12,
  },
  couponCode: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    marginBottom: 4,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C8E6C9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  copyText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 4,
  },
  couponDesc: {
    fontSize: 12,
    color: '#4CAF50',
    lineHeight: 16,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 5,
  },
  transactionInfo: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  complaintInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    minHeight: 120,
    fontSize: 16, // Minimum 16px to prevent iOS zoom
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
    // Additional iOS zoom prevention
    WebkitTapHighlightColor: 'transparent',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'text', // Allow text selection for textarea
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#000000',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submittingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submittingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // New complaint status styles
  statusCheckContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  statusCheckText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  existingComplaintContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  complaintStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  complaintStatusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  complaintMessageContainer: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  complaintMessageText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
  statusBadgeContainer: {
    alignItems: 'flex-start',
    marginTop: 15,
  },
  complaintStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  complaintStatusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  existingComplaintText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  waitingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});