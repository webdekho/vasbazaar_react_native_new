import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

import MainHeader from '../../../components/MainHeader';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest, postRequest } from '../../../services/api/baseApi';

export default function RechargePlanScreen() {
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

  // Parse parameters from PrepaidRechargeScreen
  const serviceId = params?.serviceId || '1';
  
  // Parse operator info  
  const operatorData = params?.operatorData ? JSON.parse(params.operatorData) : {};
  console.log('Operator Data:', operatorData);
  
  // Get operator code from operatorData or params
  const operatorCode = params?.operatorCode || operatorData?.opCode || '';
  
  // Parse contact info
  let contact = {};
  if (params?.contact) {
    try {
      contact = JSON.parse(params.contact);
    } catch (e) {
      console.log('Error parsing contact:', e);
    }
  }
  const contactName = params?.contactName || contact?.name || '';
  const phoneNumber = params?.phoneNumber || contact?.number || '';
  const mobile = phoneNumber || operatorData?.mobile || 'NA';
  
  const [circle] = useState(params?.circle || operatorData?.circle || 'Circle');
  const [circleCode] = useState(operatorData?.circleCode || '');
  const [operatorId, setOperatorId] = useState(params?.operator_id || null);
  const [logo, setLogo] = useState(params?.companyLogo || operatorData?.logo || '');
  const [operator, setOperator] = useState(params?.operator || operatorData?.operator || 'Operator');
  const [name] = useState(contactName || 'Customer');
  
  useEffect(() => {
    const init = async () => {
      if (operatorCode) {
        await fetchPlan(operatorCode);
      }
      await getOperatorList(serviceId);
    };
    init();
  }, []);

  const fetchPlan = async (opCode, crCode = circleCode) => {
    if (!opCode) return;
    
    try {
      setIsLoading(true);
      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        router.push('/auth/PinValidateScreen');
        return;
      }

      console.log('Fetching plans with:', { opCode, circleCode: crCode });

      const response = await postRequest(
        'api/customer/plan_recharge/fetchPlansByCode',
        { opCode, circleCode: crCode },
        sessionToken
      );

      console.log('Plans API response:', response);

      if (response?.status === 'success') {
        // Try different possible data structures for mobile plans
        const data = response.data;
        let plansData = data?.RDATA || data?.rdata || data?.data || data;
        
        console.log('Plans data:', plansData);
        setJsonData(plansData);
      } else {
        Alert.alert('Error', response?.message || 'Failed to load mobile plans');
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
    if (!jsonData || typeof jsonData !== 'object') return ['All Plans'];
    
    // For mobile recharge, categories are the keys of the jsonData object
    const categoryKeys = Object.keys(jsonData).filter(key => 
      Array.isArray(jsonData[key]) && jsonData[key].length > 0
    );
    
    return ['All Plans', ...categoryKeys];
  }, [jsonData]);

  const allPlans = useMemo(() => {
    if (!jsonData || typeof jsonData !== 'object') return [];
    
    const plans = [];
    
    // Function to extract data information from description
    const extractDataInfo = (desc) => {
      if (!desc) return null;
      
      // Common patterns for data in descriptions
      const patterns = [
        /(\d+\.?\d*\s*GB|MB)(?:\s*\/\s*day|\s*per\s*day)?(?:\s*data)?/gi,
        /(?:data|DATA)\s*[:|-]?\s*(\d+\.?\d*\s*(?:GB|MB))(?:\s*\/\s*day)?/gi,
        /(\d+\.?\d*\s*GB|MB)\s*(?:4G|3G|2G)?\s*data/gi,
        /unlimited\s*(?:4G|5G|3G)?\s*data/gi,
        /(\d+\s*GB)\s*\+\s*(\d+\s*GB)/gi // For plans like 1GB + 1GB
      ];
      
      for (const pattern of patterns) {
        const match = desc.match(pattern);
        if (match) {
          return match[0].trim();
        }
      }
      
      // Check for unlimited data
      if (/unlimited.*data/i.test(desc)) {
        return 'Unlimited Data';
      }
      
      return null;
    };
    
    // Process each category (key) in jsonData
    Object.entries(jsonData).forEach(([category, categoryPlans]) => {
      if (Array.isArray(categoryPlans)) {
        categoryPlans.forEach((plan, index) => {
          const description = plan.desc || '';
          const extractedData = extractDataInfo(description);
          
          // For mobile plans, the structure is simpler
          plans.push({
            id: `${category}-${index}-${plan.rs}`,
            category: category,
            planName: plan.name || `₹${plan.rs} Plan`,
            price: `₹${plan.rs}`,
            validity: plan.validity || 'N/A',
            description: description,
            data: extractedData || plan.data || 'No data',
            talktime: plan.talktime,
            rs: plan.rs,
            numericAmount: parseInt(plan.rs, 10)
          });
        });
      }
    });
    
    return plans;
  }, [jsonData]);

  const filteredPlans = useMemo(() => {
    const searchAmount = parseInt(searchQuery.replace(/[^0-9]/g, ''), 10);
    const isAmountSearch = !isNaN(searchAmount) && searchQuery.trim() !== '';

    return allPlans.filter(plan => {
      const categoryMatch = activeCategory === 'All Plans' || plan.category === activeCategory;
      
      if (isAmountSearch) {
        return categoryMatch && plan.numericAmount === searchAmount;
      }
      
      return categoryMatch && (
        searchQuery === '' ||
        plan.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.data.toLowerCase().includes(searchQuery.toLowerCase())
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
        circleCode: null,
        companyLogo: logo,
        name, 
        mobile, 
        operator, 
        circle,
        service: 'prepaid'
      }
    });
  };

  const handlePlanSelect = (plan) => {
    router.push({
      pathname: '/main/common/OfferScreen',
      params: {
        serviceId,
        operator_id: operatorId,
        plan: JSON.stringify({
          name: plan.planName,
          price: plan.price,
          validity: plan.validity,
          data: plan.data,
          description: plan.description,
          talktime: plan.talktime
        }),
        circleCode: circleCode,
        companyLogo: logo,
        name,
        mobile,
        operator,
        circle,
        service: 'prepaid'
      }
    });
  };

  return (
    <>
      <MainHeader 
        title="Mobile Recharge Plans"
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
              subtitle={`${operator} - ${circle}`}
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
        <ScrollView style={styles.scrollableContent}>

        {/* Plans List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading mobile plans...</Text>
          </View>
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map(plan => (
            <TouchableOpacity 
              key={plan.id} 
              style={styles.rewardsPlanCard}
              activeOpacity={0.7}
              onPress={() => handlePlanSelect(plan)}
            >
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <View style={styles.planLeftSection}>
                  <Text style={styles.rewardsPlanPrice}>{plan.price}</Text>
                  <Text style={styles.rewardsPlanValidity}>Validity: {plan.validity}</Text>
                </View>
                <View style={styles.planStatusBadge}>
                  <Text style={styles.planStatusText}>{plan.category}</Text>
                </View>
              </View>

              {/* Plan Details */}
              {(plan.data || plan.talktime) && (
                <View style={styles.channelDetailsSection}>
                  {plan.data && (
                    <View style={styles.channelDetailItemLeft}>
                      <Text style={styles.channelDetailLabelLeft}>DATA</Text>
                      <Text style={styles.channelDetailValueLeft} numberOfLines={2}>{plan.data}</Text>
                    </View>
                  )}
                  {plan.talktime && (
                    <View style={styles.channelDetailItemLeft}>
                      <Text style={styles.channelDetailLabelLeft}>TALKTIME</Text>
                      <Text style={styles.channelDetailValueLeft}>{plan.talktime}</Text>
                    </View>
                  )}
                  <View style={styles.channelDetailItemRight}>
                    <Text style={styles.channelDetailLabel}>VALIDITY</Text>
                    <Text style={styles.channelDetailValue}>{plan.validity}</Text>
                  </View>
                </View>
              )}

              {/* Description */}
              {plan.description && (
                <View style={styles.planDescriptionSection}>
                  <Text style={styles.planDescriptionText} numberOfLines={3}>{plan.description}</Text>
                </View>
              )}

              {/* Action Button */}
              <View style={styles.planActionSection}>
                <Text style={styles.planActionText}>Tap to recharge →</Text>
              </View>
            </TouchableOpacity>
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

          {/* Disclaimer */}
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              Disclaimer: Double check your plan before proceeding with the recharge.
            </Text>
          </View>
        </ScrollView>
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
  viCard: { 
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
  rewardsPlanPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  rewardsPlanValidity: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
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
    alignItems: 'flex-end',
  },
  channelDetailItemLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  channelDetailItemRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  channelDetailLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'right',
  },
  channelDetailLabelLeft: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
    textAlign: 'left',
  },
  channelDetailValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
  },
  channelDetailValueLeft: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'left',
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
    marginVertical: 16,
    borderRadius: 8,
  },
  disclaimerText: { 
    fontSize: 12, 
    textAlign: 'center', 
    color: '#666' 
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
  planDescriptionSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  planDescriptionText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  planActionSection: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  planActionText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});