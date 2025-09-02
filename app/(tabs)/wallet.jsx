import { getWalletTransactions as getWalletRecords, getWalletBalance } from '../../services/wallet/walletService';
import { useAuth } from '../../hooks/useAuth';
import { getSessionToken } from '../../services/auth/sessionManager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import Header, { HeaderPresets } from '@/components/Header';

export default function WalletScreen() {
  const router = useRouter();
  const { isAuthenticated, userToken: contextUserToken } = useAuth();
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Animation values map for expandable items
  const [animationValues] = useState(new Map());
  
  const handleNotificationPress = () => {
    console.log('Notification pressed');
    router.push('/main/NotificationScreen');
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
    router.push('/main/AllServicesScreen');
  };
  
  // Fetch wallet balance
  const fetchWalletBalance = useCallback(async () => {
    try {
      if (!contextUserToken) return;
      
      const response = await getWalletBalance(contextUserToken);
      
      if (response?.status === "success") {
        setWalletBalance(response.data?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  }, [contextUserToken]);

  // Fetch wallet transactions
  const fetchTransactions = useCallback(async (pageNumber = 1, isRefresh = false, isLoadMore = false) => {
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

      const response = await getWalletRecords(
        { page: pageNumber - 1 },
        contextUserToken,
        'api/customer/wallet_transaction/getAll'
      );
      
      if (response?.status === "success" || response?.Status === "SUCCESS") {
        const { records = [], totalPages: apiTotalPages = 1 } = response.data || {};

        // Initialize animation values for new records
        records.forEach(record => {
          if (!animationValues.has(record.id)) {
            animationValues.set(record.id, new Animated.Value(0));
          }
        });

        if (isRefresh || pageNumber === 1) {
          // Replace data for refresh or first load
          setTransactions(records);
          setCurrentPage(1);
          
          // Set wallet balance from the most recent transaction
          if (records.length > 0) {
            setWalletBalance(records[0]?.closingBal || 0);
          }
        } else {
          // Append data for pagination
          setTransactions(prevData => {
            // Avoid duplicates based on ID
            const existingIds = new Set(prevData.map(item => item.id));
            const newRecords = records.filter(record => !existingIds.has(record.id));
            return [...prevData, ...newRecords];
          });
          setCurrentPage(pageNumber);
        }

        setTotalPages(apiTotalPages);
        setHasMoreData(pageNumber < apiTotalPages);
        
        // Update last refreshed timestamp
        if (isRefresh || pageNumber === 1) {
          setLastUpdated(new Date());
        }
        
      } else {
        throw new Error(response?.message || 'Failed to fetch wallet transactions');
      }
    } catch (error) {
      setError(error.message || 'Failed to load wallet transactions');
      
      // Don't clear data for pagination errors
      if (!isLoadMore && !isRefresh && pageNumber === 1) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  }, [contextUserToken, animationValues]);

  // Initial data fetch
  useEffect(() => {
    // console.log('Wallet useEffect triggered:', { isAuthenticated, hasToken: !!contextUserToken });
    if (isAuthenticated && contextUserToken) {
      // console.log('Calling wallet API functions...');
      fetchTransactions(1, false);
      fetchWalletBalance();
    } else {
      console.log('Skipping wallet API calls - missing auth or token');
    }
  }, [isAuthenticated, contextUserToken]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    setExpandedTransaction(null);
    setError(null);
    setCurrentPage(1);
    setHasMoreData(true);
    fetchTransactions(1, true);
    fetchWalletBalance();
  }, [contextUserToken]);

  // Load more data when scrolled to bottom
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && hasMoreData && currentPage < totalPages) {
      const nextPage = currentPage + 1;
      fetchTransactions(nextPage, false, true);
    }
  }, [isLoadingMore, hasMoreData, currentPage, totalPages]);

  // Toggle transaction expansion with animation
  const toggleTransactionExpand = (id) => {
    const animValue = animationValues.get(id);
    if (!animValue) return;

    if (expandedTransaction === id) {
      // Collapse animation
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false
      }).start(() => setExpandedTransaction(null));
    } else {
      // Collapse any currently expanded item first
      if (expandedTransaction) {
        const prevAnimValue = animationValues.get(expandedTransaction);
        if (prevAnimValue) {
          Animated.timing(prevAnimValue, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false
          }).start();
        }
      }
      
      // Expand new item
      setExpandedTransaction(id);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false
      }).start();
    }
  };

  // Format date and time
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.split('.')[0];
  };

  // Get transaction icon based on service type
  const getTransactionIcon = (serviceType, txnMode) => {
    if (txnMode === 1) {
      switch (serviceType) {
        case 'recharge':
          return 'phone-portrait-outline';
        case 'electricity':
          return 'flash-outline';
        case 'dth':
          return 'tv-outline';
        default:
          return 'arrow-up-outline';
      }
    } else {
      switch (serviceType) {
        case 'cashback':
          return 'gift-outline';
        case 'refund':
          return 'return-up-back-outline';
        default:
          return 'arrow-down-outline';
      }
    }
  };

  // Get transaction display name
  const getTransactionName = (serviceType, operatorName, txnMode) => {
    if (txnMode === 1) {
      switch (serviceType) {
        case 'recharge':
          return operatorName ? `${operatorName} Recharge` : 'Mobile Recharge';
        case 'electricity':
          return 'Electricity Bill Payment';
        case 'dth':
          return 'DTH Recharge';
        default:
          return 'Payment';
      }
    } else {
      switch (serviceType) {
        case 'cashback':
          return 'Cashback Reward';
        case 'refund':
          return 'Refund Received';
        default:
          return 'Credit';
      }
    }
  };

  // Get display message for transaction
  const getDisplayMessage = (item) => {
    const operatorName = item.operatorId?.operatorName;
    const message = item.message || 'Transaction';
    const operatorNo = item.operatorNo;
    
    if (operatorName && item.serviceType !== 'cashback') {
      if (operatorNo) {
        return `${operatorName} (${operatorNo}) - ${message}`;
      }
      return `${operatorName} - ${message}`;
    }
    
    return message;
  };

  // Get transaction status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'refunded':
        return '#FF9800';
      case 'pending':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  // Group transactions by month
  const groupByMonth = (data) => {
    const grouped = {};
    
    data.forEach(item => {
      const date = new Date(item.date);
      const monthYear = date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      const isDebit = item.txnMode === 1;
      
      grouped[monthYear].push({
        id: item.id,
        name: getTransactionName(item.serviceType, item.operatorId?.operatorName, item.txnMode),
        desc: getDisplayMessage(item),
        amount: item.txnAmt,
        date: formatDate(item.date),
        time: formatTime(item.time),
        icon: getTransactionIcon(item.serviceType, item.txnMode),
        status: item.status,
        serviceType: item.serviceType,
        openingBal: item.openingBal,
        closingBal: item.closingBal,
        txnId: item.txnId,
        txnMode: item.txnMode,
        isDebit,
        operatorLogo: item.operatorId?.logo,
        operatorName: item.operatorId?.operatorName,
        operatorNo: item.operatorNo,
        originalData: item
      });
    });
    
    return grouped;
  };

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    
    return transactions.filter(txn => {
      const searchLower = searchQuery.toLowerCase();
      return (
        txn.message?.toLowerCase().includes(searchLower) ||
        txn.txnId?.toLowerCase().includes(searchLower) ||
        txn.operatorId?.operatorName?.toLowerCase().includes(searchLower) ||
        txn.operatorNo?.toLowerCase().includes(searchLower)
      );
    });
  }, [transactions, searchQuery]);

  // Group filtered transactions
  const groupedTransactions = useMemo(() => {
    return groupByMonth(filteredTransactions);
  }, [filteredTransactions]);

  // Render transaction item with animation
  const renderTransactionItem = ({ item: txn }) => {
    const isExpanded = expandedTransaction === txn.id;
    const animValue = animationValues.get(txn.id) || new Animated.Value(0);

    // Animation interpolations
    const detailsHeight = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 180],
    });

    const iconRotation = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    const renderIcon = () => {
      if (txn.operatorLogo) {
        return (
          <Image 
            source={{ uri: txn.operatorLogo }} 
            style={styles.operatorLogo}
            defaultSource={require('../../assets/icons/gas-cylinder.png')}
          />
        );
      } else {
        return (
          <Ionicons 
            name={txn.icon} 
            size={24} 
            color={txn.isDebit ? '#F44336' : '#4CAF50'} 
          />
        );
      }
    };

    return (
      <TouchableOpacity 
        onPress={() => toggleTransactionExpand(txn.id)}
        activeOpacity={0.7}
        style={styles.transactionItem}
      >
        <View style={styles.transactionHeader}>
          <View style={[
            styles.iconBox,
            { backgroundColor: txn.isDebit ? '#FFEBEE' : '#E8F5E8' }
          ]}>
            {renderIcon()}
          </View>
          
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionName} numberOfLines={1}>
              {txn.name}
            </Text>
            <Text style={styles.transactionDesc} numberOfLines={2}>
              {txn.desc}
            </Text>
            <Text style={[styles.transactionStatus, { color: getStatusColor(txn.status) }]}>
              {txn.status?.toUpperCase()}
            </Text>
          </View>
          
          <View style={styles.amountSection}>
            <Text style={[
              styles.transactionAmount, 
              { color: txn.isDebit ? '#F44336' : '#4CAF50' }
            ]}>
              {txn.isDebit ? `-₹${Math.abs(txn.amount || 0).toFixed(2)}` : `+₹${(txn.amount || 0).toFixed(2)}`}
            </Text>
            <Text style={styles.transactionTime}>
              {txn.date} {txn.time}
            </Text>
            <Animated.View style={[
              styles.expandIcon,
              { transform: [{ rotate: iconRotation }] }
            ]}>
              <Ionicons name="chevron-down" size={16} color="#999" />
            </Animated.View>
          </View>
        </View>
        
        <Animated.View style={[
          styles.expandableDetails,
          { 
            height: detailsHeight,
            opacity: animValue
          }
        ]}>
          <View style={styles.detailsContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID:</Text>
              <Text style={styles.detailValue}>{txn.txnId}</Text>
            </View>
            
            {txn.operatorName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Operator:</Text>
                <Text style={styles.detailValue}>{txn.operatorName}</Text>
              </View>
            )}
            
            {txn.operatorNo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile Number:</Text>
                <Text style={[styles.detailValue, styles.mobileNumber]}>
                  {txn.operatorNo}
                </Text>
              </View>
            )}
            
            <View style={styles.balanceSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Opening Balance:</Text>
                <Text style={styles.detailValue}>₹{(txn.openingBal || 0).toFixed(2)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction Amount:</Text>
                <Text style={[
                  styles.detailValue, 
                  { 
                    color: txn.isDebit ? '#F44336' : '#4CAF50',
                    fontWeight: '600'
                  }
                ]}>
                  {txn.isDebit ? `-₹${Math.abs(txn.amount || 0).toFixed(2)}` : `+₹${(txn.amount || 0).toFixed(2)}`}
                </Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Closing Balance:</Text>
                <Text style={[styles.detailValue, styles.closingBalance]}>
                  ₹{(txn.closingBal || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Render loading footer
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#000000" />
        <Text style={styles.footerText}>Loading transactions...</Text>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>₹</Text>
      </View>
      <Text style={styles.emptyTitle}>No Wallet Transactions</Text>
      <Text style={styles.emptySubtitle}>
        Your wallet transaction history will appear here once you make transactions.
      </Text>
    </View>
  );

  // Show loading state if not authenticated
  if (!isAuthenticated || !contextUserToken) {
    return (
      <ThemedView style={styles.container}>
        <Header 
          {...HeaderPresets.tabs}
          onNotificationPress={handleNotificationPress}
          onSearchPress={handleSearchPress}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        {...HeaderPresets.tabs}
        onNotificationPress={handleNotificationPress}
        onSearchPress={handleSearchPress}
      />
      
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Ionicons name="wallet-outline" size={24} color="#000000" />
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <View style={styles.balanceRight}>
            <Text style={styles.balanceAmount}>₹{(walletBalance || 0).toFixed(2)}</Text>
            <TouchableOpacity 
              onPress={handleRefresh}
              disabled={isRefreshing}
              style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color={isRefreshing ? "#999" : "#000000"} 
                style={[styles.refreshIcon, isRefreshing && styles.refreshIconSpinning]}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Only wallet transactions will be shown here</Text>
        {lastUpdated && (
          <Text style={styles.lastUpdatedText}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          placeholder="Search transactions..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="options-outline" size={20} color="#999" />
        )}
      </View>

      {/* Transaction List */}
      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>Loading wallet transactions...</Text>
        </View>
      ) : error && transactions.length === 0 ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Failed to Load</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => fetchTransactions(1)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={Object.entries(groupedTransactions)}
          keyExtractor={([month]) => month}
          renderItem={({ item: [month, entries] }) => (
            <View style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              {entries.map(txn => (
                <View key={txn.id}>
                  {renderTransactionItem({ item: txn })}
                </View>
              ))}
            </View>
          )}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2196F3', '#4CAF50']}
              tintColor="#2196F3"
              title={isRefreshing ? "Refreshing transactions..." : "Pull to refresh"}
              titleColor="#666"
              progressBackgroundColor="#FFFFFF"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContainer,
            Object.keys(groupedTransactions).length === 0 && styles.emptyListContainer
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // Balance Card
  balanceCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
    flex: 1,
  },
  balanceRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginRight: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
  },
  refreshButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  refreshIcon: {
    // Base icon styles
  },
  refreshIconSpinning: {
    // Animation could be added here if needed
  },
  // Instruction
  instructionContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  instructionText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    textAlign: 'left',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right',
    marginTop: 4,
  },
  // Search Bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
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
  },
  // List Container
  listContainer: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  // Month Section
  monthSection: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  monthTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    color: '#1a1a1a',
  },
  // Transaction Item
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  operatorLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  transactionDetails: {
    flex: 1,
    paddingRight: 10,
  },
  transactionName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  transactionDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
    lineHeight: 18,
  },
  transactionStatus: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  expandIcon: {
    marginTop: 4,
  },
  // Expandable Details
  expandableDetails: {
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  detailsContent: {
    padding: 16,
    paddingTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  mobileNumber: {
    color: '#2196F3',
    fontFamily: 'monospace',
  },
  balanceSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  closingBalance: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
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
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
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
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 40,
    color: '#000000',
    fontWeight: 'bold',
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
    backgroundColor: '#2196F3',
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