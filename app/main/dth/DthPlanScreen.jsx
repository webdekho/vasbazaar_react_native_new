import { AntDesign } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar, Card } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';

import MainHeader from '../../../components/MainHeader';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest, postRequest } from '../../../services/api/baseApi';

export default function DthPlanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [activeCategory, setActiveCategory] = useState('All Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorModalVisible, setOperatorModalVisible] = useState(false);
  const [jsonData, setJsonData] = useState({});
  const [operatorList, setOperatorList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomAmountButton, setShowCustomAmountButton] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Parse parameters from DthRechargeScreen
  const serviceId = params?.serviceId || 'NA';
  const operatorCode = params?.operatorCode || '';
  
  // Parse contact info
  const contact = params?.contact ? JSON.parse(params.contact) : {};
  const mobile = contact?.number || 'NA';
  
  // Parse DTH info
  const dthInfo = params?.dth_info ? JSON.parse(params.dth_info) : {};
  console.log('DTH Info:', dthInfo);
  
  const [circle] = useState(null);
  const [operatorId, setOperatorId] = useState(params?.operator_id || null);
  const [logo, setLogo] = useState(params?.companyLogo || '');
  const [operator, setOperator] = useState(params?.operator || 'DTH Operator');
  const [name] = useState(params?.name || dthInfo?.customerName || 'Customer');

  useEffect(() => {
    const init = async () => {
      if (operatorCode) {
        await fetchPlan(operatorCode);
      }
      await getOperatorList(serviceId);
    };
    init();
  }, []);

  const fetchPlan = async (opCode) => {
    if (!opCode) return;
    
    try {
      setIsLoading(true);
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return;
      }

      const response = await postRequest(
        'api/customer/plan_recharge/fetch_DTHPlans',
        { opCode },
        sessionToken
      );

      if (response?.status === 'success') {
        setJsonData(response.data?.RDATA?.Combo || {});
      } else {
        Alert.alert('Error', response?.message || 'Failed to load DTH plans');
      }
    } catch (error) {
      console.error('Plan fetch error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getOperatorList = async (serviceId) => {
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
      }
    } catch (err) {
      console.error('Operator fetch error:', err);
    }
  };

  const categories = useMemo(() => {
    const langs = jsonData?.length > 0 
      ? [...new Set(jsonData.map(item => item.Language))] 
      : [];
    return ['All Plans', ...langs];
  }, [jsonData]);

  const allPlans = useMemo(() => {
    if (!jsonData || !Array.isArray(jsonData)) return [];
    
    return jsonData.flatMap((comboItem, comboIndex) => {
      if (!comboItem.Details || !Array.isArray(comboItem.Details)) return [];
      
      return comboItem.Details.map((detail, detailIndex) => ({
        id: `${comboItem.Language}-${detail.PlanName}-${comboIndex}-${detailIndex}`,
        category: comboItem.Language,
        language: comboItem.Language,
        planName: detail.PlanName,
        channels: detail.Channels,
        paidChannels: detail.PaidChannels,
        hdChannels: detail.HdChannels,
        lastUpdate: detail.last_update,
        pricing: detail.PricingList || [],
        numericAmounts: (detail.PricingList || []).map(p => 
          parseInt(p.Amount.replace(/[^0-9]/g, ''), 10)
        )
      }));
    });
  }, [jsonData]);

  const filteredPlans = useMemo(() => {
    const searchAmount = parseInt(searchQuery.replace(/[^0-9]/g, ''), 10);
    const isAmountSearch = !isNaN(searchAmount) && searchQuery.trim() !== '';

    return allPlans.filter(plan => {
      const categoryMatch = activeCategory === 'All Plans' || plan.category === activeCategory;
      
      if (isAmountSearch) {
        return categoryMatch && plan.numericAmounts.some(amount => amount === searchAmount);
      }
      
      return categoryMatch && (
        searchQuery === '' ||
        plan.planName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [allPlans, activeCategory, searchQuery]);

  useEffect(() => {
    const searchAmount = parseInt(searchQuery.replace(/[^0-9]/g, ''), 10);
    const isAmountSearch = !isNaN(searchAmount) && searchQuery.trim() !== '';
    
    setShowCustomAmountButton(
      isAmountSearch && 
      filteredPlans.length === 0 && 
      searchAmount > 0
    );
  }, [filteredPlans, searchQuery]);

  const handleCustomAmountRecharge = () => {
    Keyboard.dismiss();
    router.push({
      pathname: '/main/common/OfferScreen',
      params: {
        serviceId,
        operator_id: operatorId,
        plan: JSON.stringify({
          name: `Custom Amount: ₹${searchQuery}`,
          price: `₹${searchQuery}`,
          validity: 'N/A',
          data: 'Custom Recharge',
        }),
        circleCode: circle,
        companyLogo: logo,
        name, 
        mobile, 
        operator, 
        circle,
        service: 'dth'
      }
    });
  };

  const handlePlanSelect = (plan, priceObj) => {
    router.push({
      pathname: '/main/common/OfferScreen',
      params: {
        serviceId,
        operator_id: operatorId,
        plan: JSON.stringify({
          name: plan.planName,
          price: priceObj.Amount,
          validity: priceObj.Month,
          data: `${plan.channels} Channels`,
        }),
        circleCode: circle,
        companyLogo: logo,
        name,
        mobile,
        operator,
        circle,
        service: 'dth'
      }
    });
  };

  return (
    <>
      <MainHeader 
        title="DTH Plans"
        showBack={true}
        showSearch={false}
        showNotification={false}
      />

      <View style={styles.container}>
        {/* Fixed Header Section */}
        <View style={styles.fixedHeader}>
          {/* Company Info Card */}
          <Card style={styles.viCard}>
            <Card.Title
              title={`${name} • ${mobile}`}
              subtitle={operator}
              left={(props) => (
                <Avatar.Image
                  {...props}
                  source={logo ? { uri: logo } : require('../../../assets/icons/default.png')}
                  style={styles.logo}
                />
              )}
              right={() => (
                <TouchableOpacity onPress={() => setOperatorModalVisible(true)}>
                  <Text style={styles.changeText}>Change</Text>
                </TouchableOpacity>
              )}
              titleStyle={styles.userName}
              subtitleStyle={styles.userPlan}
            />
          </Card>

          {/* DTH Info Card */}
          {dthInfo && Object.keys(dthInfo).length > 0 && (
            <Card style={styles.dthInfoCard}>
              <Card.Content>
                <Text style={styles.dthInfoTitle}>Account Details</Text>
                <View style={styles.dthInfoGrid}>
                  {dthInfo.balance && (
                    <View style={styles.dthInfoItem}>
                      <Text style={styles.dthInfoLabel}>Balance</Text>
                      <Text style={styles.dthInfoValue}>₹{dthInfo.balance}</Text>
                    </View>
                  )}
                  {dthInfo.vcNumber && (
                    <View style={styles.dthInfoItem}>
                      <Text style={styles.dthInfoLabel}>VC Number</Text>
                      <Text style={styles.dthInfoValue}>{dthInfo.vcNumber}</Text>
                    </View>
                  )}
                  {dthInfo.rmn && (
                    <View style={styles.dthInfoItem}>
                      <Text style={styles.dthInfoLabel}>RMN</Text>
                      <Text style={styles.dthInfoValue}>{dthInfo.rmn}</Text>
                    </View>
                  )}
                  {dthInfo.nextRechargeDate && (
                    <View style={styles.dthInfoItem}>
                      <Text style={styles.dthInfoLabel}>Next Recharge</Text>
                      <Text style={styles.dthInfoValue}>{dthInfo.nextRechargeDate}</Text>
                    </View>
                  )}
                  {dthInfo.monthlyPack && (
                    <View style={styles.dthInfoItem}>
                      <Text style={styles.dthInfoLabel}>Monthly Pack</Text>
                      <Text style={styles.dthInfoValue}>{dthInfo.monthlyPack}</Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[
              styles.searchBar,
              isSearchFocused && styles.searchBarFocused
            ]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                placeholder="Search Plan or Enter Amount"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                selectionColor="#000000"
                underlineColorAndroid="transparent"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Category Tabs */}
          <View style={styles.fixedCategoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryButton, activeCategory === cat && styles.activeCategoryButton]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollableContent}
          contentContainerStyle={styles.scrollContentContainer}
        >

        {/* Plans List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading DTH plans...</Text>
          </View>
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map(plan => (
            <View key={plan.id} style={styles.rewardsPlanCard}>
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <View style={styles.planLeftSection}>
                  <Text style={styles.rewardsPlanName}>{plan.planName}</Text>
                </View>
                <View style={styles.planStatusBadge}>
                  <Text style={styles.planStatusText}>DTH</Text>
                </View>
              </View>

              {/* Channel Information */}
              <View style={styles.channelDetailsSection}>
                <View style={styles.channelDetailItem}>
                  <Text style={styles.channelDetailLabel}>CHANNELS</Text>
                  <Text style={styles.channelDetailValue}>{plan.channels}</Text>
                </View>
                <View style={styles.channelDetailItem}>
                  <Text style={styles.channelDetailLabel}>PAID</Text>
                  <Text style={styles.channelDetailValue}>{plan.paidChannels}</Text>
                </View>
                <View style={styles.channelDetailItem}>
                  <Text style={styles.channelDetailLabel}>HD</Text>
                  <Text style={styles.channelDetailValue}>{plan.hdChannels}</Text>
                </View>
              </View>

              {/* Last Updated */}
              <Text style={styles.planUpdateText}>Last Updated: {plan.lastUpdate}</Text>

              {/* Pricing Options */}
              <View style={styles.pricingSection}>
                <Text style={styles.pricingSectionTitle}>RECHARGE OPTIONS</Text>
                {plan.pricing.map((priceObj, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.modernPriceButton}
                    activeOpacity={0.7}
                    onPress={() => handlePlanSelect(plan, priceObj)}
                  >
                    <View style={styles.priceButtonLeft}>
                      <Text style={styles.priceAmount}>{priceObj.Amount}</Text>
                      <Text style={styles.priceValidity}>{priceObj.Month}</Text>
                    </View>
                    <AntDesign name="right" size={14} color="#2196F3" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : showCustomAmountButton ? (
          <View style={styles.customAmountContainer}>
            <Text style={styles.noPlansText}>No plans found for ₹{searchQuery}</Text>
            <TouchableOpacity 
              style={styles.customAmountButton}
              onPress={handleCustomAmountRecharge}
            >
              <Text style={styles.customAmountButtonText}>Proceed with ₹{searchQuery}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noPlansContainer}>
            <Text style={styles.noPlansText}>No plans found</Text>
          </View>
        )}
        </ScrollView>

        {/* Disclaimer - Always show */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Disclaimer: Review your plan with the operator before recharging.
          </Text>
        </View>
      </View>

      {/* Operator Modal */}
      <Modal visible={operatorModalVisible} transparent animationType="slide" onRequestClose={() => setOperatorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Operator</Text>
            <FlatList
              data={operatorList}
              keyExtractor={(_, index) => index.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    if (item.operatorCode) {
                      fetchPlan(item.operatorCode);
                    }
                    setLogo(item.logo);
                    setOperatorId(item.id);
                    setOperator(item.operatorName);
                    setOperatorModalVisible(false);
                  }}
                  style={styles.operatorItem}
                >
                  <Avatar.Image source={{ uri: item.logo }} size={32} style={{ marginRight: 12 }} />
                  <Text>{item.operatorName}</Text>
                </Pressable>
              )}
            />
            <TouchableOpacity onPress={() => setOperatorModalVisible(false)} style={styles.cancelButton}>
              <Text style={{ color: '#000000' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8F9FA' 
  },
  fixedHeader: {
    backgroundColor: '#F8F9FA',
    paddingBottom: 8,
  },
  scrollableContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    paddingBottom: 80, // Add padding to prevent content from being hidden behind fixed disclaimer
  },
  viCard: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {},
    }),
  },
  logo: { 
    width: 45, 
    height: 45, 
    backgroundColor: '#f6f6f6' 
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  userPlan: {
    fontSize: 14,
    color: '#6B7280',
  },
  changeText: { 
    color: '#2196F3', 
    fontWeight: '600', 
    fontSize: 14, 
    marginRight: 16 
  },
  dthInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {},
    }),
  },
  dthInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  dthInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dthInfoItem: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  dthInfoLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  dthInfoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: { 
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
      default: {},
    }),
  },
  searchBarFocused: {
    borderColor: '#000000',
    borderWidth: 2,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  fixedCategoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryContent: {
    paddingRight: 32,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  activeCategoryButton: { 
    backgroundColor: '#000000' 
  },
  categoryText: { 
    fontSize: 13, 
    color: '#666', 
    fontWeight: '500' 
  },
  activeCategoryText: { 
    color: '#fff' 
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  rewardsPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...Platform.select({
      ios: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
      default: {},
    }),
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planLeftSection: {
    flex: 1,
  },
  rewardsPlanName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  planStatusBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  planStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  channelDetailsSection: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  channelDetailItem: {
    flex: 1,
  },
  channelDetailLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  channelDetailValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  planUpdateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
    marginBottom: 12,
  },
  pricingSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  pricingSectionTitle: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modernPriceButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
  },
  priceButtonLeft: {
    flex: 1,
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  priceValidity: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  noPlansContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noPlansText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  customAmountContainer: {
    alignItems: 'center',
    padding: 20,
  },
  customAmountButton: {
    backgroundColor: '#000000',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  customAmountButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disclaimerContainer: { 
    padding: 16, 
    backgroundColor: '#FFF9E6',
    borderTopWidth: 1,
    borderTopColor: '#F59E0B',
    // Fixed positioning for all platforms
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        position: 'fixed', // Explicit fixed positioning for web
        boxShadow: '0 -2px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        visibility: 'visible',
        opacity: 1,
      },
    }),
  },
  disclaimerText: { 
    fontSize: 13, 
    textAlign: 'center', 
    color: '#92400E',
    fontWeight: '500',
    lineHeight: 18,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0, 0, 0, 0.5)' 
  },
  modalContainer: { 
    backgroundColor: '#fff', 
    margin: 20, 
    padding: 20, 
    borderRadius: 12 
  },
  modalTitle: { 
    fontWeight: '700', 
    fontSize: 18, 
    marginBottom: 16,
    color: '#111827'
  },
  operatorItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  cancelButton: { 
    marginTop: 16, 
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6'
  },
});