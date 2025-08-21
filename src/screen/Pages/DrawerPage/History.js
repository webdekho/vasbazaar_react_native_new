import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '../../../Services/ApiServices';
import { Ionicons } from '@expo/vector-icons';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';

// Custom Popup Component
const CustomPopup = ({ visible, type, title, message, onClose, onAction, actionText }) => {
  const [scaleValue] = useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    } else {
      Animated.timing(scaleValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const getPopupConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: '✅',
          iconColor: '#4CAF50',
          backgroundColor: '#E8F5E8',
          borderColor: '#4CAF50',
          buttonColor: '#4CAF50',
        };
      case 'error':
        return {
          icon: '❌',
          iconColor: '#F44336',
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          buttonColor: '#F44336',
        };
      case 'warning':
        return {
          icon: '⚠️',
          iconColor: '#FF9800',
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          buttonColor: '#FF9800',
        };
      default:
        return {
          icon: 'ℹ️',
          iconColor: '#2196F3',
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          buttonColor: '#2196F3',
        };
    }
  };

  const config = getPopupConfig();

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.popupOverlay}>
        <Animated.View 
          style={[
            styles.popupContainer,
            { 
              transform: [{ scale: scaleValue }],
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
            }
          ]}
        >
          <View style={styles.popupHeader}>
            <Text style={styles.popupIcon}>{config.icon}</Text>
            <Text style={[styles.popupTitle, { color: config.iconColor }]}>{title}</Text>
          </View>
          
          <Text style={styles.popupMessage}>{message}</Text>
          
          <View style={styles.popupButtonContainer}>
            <TouchableOpacity
              style={[styles.popupButton, { backgroundColor: config.buttonColor }]}
              onPress={onAction || onClose}
            >
              <Text style={styles.popupButtonText}>
                {actionText || 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const History = ({ navigation }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [complaintText, setComplaintText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Custom popup states
  const [popup, setPopup] = useState({
    visible: false,
    type: 'success',
    title: '',
    message: '',
    actionText: 'OK'
  });
  
  const authContext = useContext(AuthContext);
  const { userData, userToken } = authContext;

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (page > 0) {
      loadMoreTransactions();
    }
  }, [page]);

  // Show custom popup
  const showPopup = (type, title, message, actionText = 'OK') => {
    setPopup({
      visible: true,
      type,
      title,
      message,
      actionText
    });
  };

  // Hide custom popup
  const hidePopup = () => {
    setPopup(prev => ({ ...prev, visible: false }));
  };

  // Copy coupon code to clipboard
  const copyCouponCode = (couponCode) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      // Web clipboard API
      navigator.clipboard.writeText(couponCode).then(() => {
        showPopup('success', 'Copied!', `Coupon code "${couponCode}" has been copied to clipboard.`);
      }).catch((error) => {
        console.error('Error copying to clipboard:', error);
        showPopup('error', 'Copy Failed', 'Unable to copy coupon code to clipboard.');
      });
    } else {
      // Fallback for mobile or when clipboard API is not available
      Alert.alert(
        'Coupon Code', 
        `${couponCode}\n\nCoupon code is displayed above. You can manually copy it.`,
        [
          { text: 'OK', style: 'default' }
        ]
      );
    }
  };

  const fetchTransactions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getRecords(
        { pageNumber: 0 }, 
        userToken, 
        'api/customer/transaction/getByUserId'
      );
      
      if (response?.Status === "SUCCESS" || response?.status === "success") {
        const { records, totalPages } = response.data;
        const processedRecords = records.map(record => ({
          ...record,
          operatorId: {
            ...record.operatorId,
            name: record.operatorId?.operatorName || 'Unknown',
            logo: record.operatorId?.logo || 'https://via.placeholder.com/40'
          }
        }));
        
        setTransactions(processedRecords);
        setTotalPages(totalPages);
        setPage(1);
      } else {
        showPopup('error', 'Error', 'Failed to load transactions. Please try again.');
        console.log('Transaction fetch failed:', response.message || response.fail);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showPopup('error', 'Network Error', 'Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (isLoadingMore || page > totalPages) {
      return;
    }

    try {
      setIsLoadingMore(true);
      const response = await getRecords(
        { pageNumber: page }, 
        userToken, 
        'api/customer/transaction/getByUserId'
      );
      
      if (response?.Status === "SUCCESS" || response?.status === "success") {
        const { records } = response.data;
        const processedRecords = records.map(record => ({
          ...record,
          operatorId: {
            ...record.operatorId,
            name: record.operatorId?.operatorName || 'Unknown',
            logo: record.operatorId?.logo || 'https://via.placeholder.com/40'
          }
        }));
        
        setTransactions(prev => [...prev, ...processedRecords]);
      } else {
        showPopup('warning', 'Load More Failed', 'Unable to load more transactions.');
      }
    } catch (error) {
      console.error('Error loading more transactions:', error);
      showPopup('error', 'Network Error', 'Failed to load more transactions.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleComplaintSubmit = async () => {
    if (!complaintText.trim()) {
      showPopup('warning', 'Incomplete Form', 'Please enter your complaint details before submitting.');
      return;
    }

    if (complaintText.trim().length < 10) {
      showPopup('warning', 'Invalid Description', 'Please provide a more detailed description (at least 10 characters).');
      return;
    }

    try {
      setSubmitting(true);
      const complaintData = {
        txnId: selectedTransaction.txnId,
        description: complaintText.trim()
      };

      const response = await postRequest(
        complaintData, 
        userToken, 
        'api/customer/complaint/addComplaint'
      );
      
      if (response?.Status === "SUCCESS" || response?.status === "success") {
        // Close the complaint modal first
        setModalVisible(false);
        setComplaintText('');
        
        // Show success popup
        showPopup(
          'success', 
          'Complaint Submitted Successfully!', 
          `Your complaint has been registered with Transaction ID: ${selectedTransaction.txnId}. Our support team will review it shortly.`,
          'Got it!'
        );
        
        // Update the transaction status locally if needed
        setTransactions(prev => 
          prev.map(txn => 
            txn.txnId === selectedTransaction.txnId 
              ? { ...txn, hasComplaint: true }
              : txn
          )
        );
        
      } else {
        showPopup(
          'error', 
          'Submission Failed', 
          response?.message || 'Unable to submit your complaint. Please try again later.',
          'Retry'
        );
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      showPopup(
        'error', 
        'Network Error', 
        'Unable to connect to server. Please check your internet connection and try again.',
        'Retry'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString) => {
    return timeString.split('.')[0];
  };

  const getServiceDisplayName = (serviceType, operatorName) => {
    switch (serviceType) {
      case 'wallet':
        return `${operatorName}`;
      case 'upi':
        return `${operatorName}`;
      default:
        return serviceType;
    }
  };

  const groupByMonth = (data) => {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      // Build description with serviceName if available
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

      // Debug coupon data
      if (item.couponCode) {
        console.log('Coupon data found:', {
          couponCode: item.couponCode,
          description: item.description,
          discription: item.discription
        });
      }

      grouped[monthYear].push({
        id: item.txnId,
        name: getServiceDisplayName(item.serviceType, item.operatorId?.name),
        desc: description,
        amount: item.txnAmt,
        date: formatDate(item.date),
        time: formatTime(item.time),
        icon: item.operatorId?.logo || 'https://via.placeholder.com/40',
        status: item.status.toLowerCase(),
        serviceType: item.serviceType,
        couponCode: item.couponCode,
        couponDescription: item.discription || item.description,
        originalData: item
      });
    });
    
    return grouped;
  };

  const filteredTransactions = transactions.filter(txn => 
    txn.operatorNo?.includes(searchQuery) ||
    txn.txnId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (txn.customerName && txn.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    txn.serviceType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedTransactions = groupByMonth(filteredTransactions);

  const loadMore = () => {
    if (page < totalPages && !isLoadingMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const onRefresh = () => {
    fetchTransactions(true);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.footerText}>Loading more transactions...</Text>
      </View>
    );
  };

  const openComplaintModal = (transaction) => {
    setSelectedTransaction(transaction);
    setComplaintText('');
    setModalVisible(true);
  };

  const closeComplaintModal = () => {
    setModalVisible(false);
    setComplaintText('');
    setSelectedTransaction(null);
  };

  return (
    <View style={styles.mainContainer}>
      {/* Custom Popup */}
      <CustomPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        actionText={popup.actionText}
        onClose={hidePopup}
        onAction={hidePopup}
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
                <Ionicons name="close" size={24} color="#666" />
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
            
            <Text style={styles.inputLabel}>Describe your issue *</Text>
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
            <Text style={styles.characterCount}>
              {complaintText.length}/500 characters
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeComplaintModal}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton, 
                  styles.submitButton,
                  submitting && styles.disabledButton
                ]}
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
          </View>
        </View>
      </Modal>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search transaction..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={onRefresh} disabled={isRefreshing}>
          <Ionicons 
            name="refresh-outline" 
            size={20} 
            color={isRefreshing ? "#ccc" : "#2196F3"} 
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
          style={styles.container}
          data={Object.entries(groupedTransactions)}
          keyExtractor={([month]) => month}
          renderItem={({ item: [month, entries] }) => (
            <View style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              
              {entries.map((txn) => (
                <View key={txn.id.toString()} style={styles.item}>
                  <View style={styles.cardContent}>
                    <View style={styles.iconBox}>
                      <Image 
                        source={{ uri: txn.icon }} 
                        style={styles.operatorIcon}
                        defaultSource={require('../../../../assets/icons/help.png')}
                      />
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
                          <Ionicons name="alert-circle-outline" size={12} color="#FFFFFF" />
                          <Text style={styles.complaintBtnText}>Raise Complaint</Text>
                        </TouchableOpacity>
                      )}
                      {txn.originalData.hasComplaint && (
                        <View style={styles.complaintSubmitted}>
                          <Ionicons name="checkmark-circle" size={12} color="#4CAF50" />
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
                  {txn.couponCode && (
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
                          <Ionicons name="copy-outline" size={14} color="#2E7D32" />
                          <Text style={styles.copyText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 5,
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  // Popup Styles
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
  },
  popupHeader: {
    alignItems: 'center',
    marginBottom: 15,
  },
  popupIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  popupMessage: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
    lineHeight: 22,
    marginBottom: 25,
  },
  popupButtonContainer: {
    alignItems: 'center',
  },
  popupButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 120,
  },
  popupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Loading and Empty States
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
    fontSize: 15,
    color: '#333',
  },
  // Transaction List
  monthSection: {
    marginBottom: 25,
  },
  monthTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#1a1a1a',
    paddingHorizontal: 4,
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
    fontSize: 15,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
    marginBottom: 20,
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
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    
    backgroundColor:'black'
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
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
});

export default History;