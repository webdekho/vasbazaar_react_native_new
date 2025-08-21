import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '../../../Services/ApiServices';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useContext, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import { CustomSearchInput } from '../../../components/CustomInput';
import { ActivityIndicator, Avatar, Card } from 'react-native-paper';

export default function RechargePlan({ route, navigation }) {
  const [activeCategory, setActiveCategory] = useState('All Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const authContext = useContext(AuthContext);
  const { userData, userToken } = authContext;
  
  // Safely extract route params with defaults
  const operatorCircle = route.params?.operatorCircle || route.params?.OperatorCircle || {};
  const serviceId = route.params?.serviceId || 'NA';
  const contact = route.params?.contact || {};
  
  const [mobile, setMobile] = useState(contact?.number || '');
  const [name, setName] = useState(contact?.name || '');
  
  // Improved operator name mapping
  const [operator, setOperator] = useState(() => {
    const op = operatorCircle?.Operator || operatorCircle?.operator;
    if (!op) return '';
      const lowerOp = op.toLowerCase();
      if (lowerOp.includes("jio")) return 'jio';
      if (lowerOp.includes("vodafone") || lowerOp.includes("vi")) return 'vi';
      if (lowerOp.includes("airtel")) return 'airtel';
      if (lowerOp.includes("bsnl")) return 'bsnl';
      return op.toLowerCase().replace(/\s+/g, '-');
  });

  // Safely get circle information
  const [circle, setCircle] = useState(
    operatorCircle?.Circle || 
    operatorCircle?.circle || 
    operatorCircle?.circleName || 
    ''
  );

  const [operatorModalVisible, setOperatorModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operatorList, setOperatorList] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [operatorId, setOperatorId] = useState(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [jsonData, setJsonData] = useState({});
  const [operatorNotFound, setOperatorNotFound] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Get operator code from params with fallbacks
  const operatorCode = operatorCircle?.OpCode || 
                      operatorCircle?.opCode || 
                      operatorCircle?.operatorCode || 
                      '';

  // Get circle code from params with fallbacks
  const circleCode = operatorCircle?.CircleCode || 
                    operatorCircle?.circleCode || 
                    operatorCircle?.circleId || 
                    '';

  // Load plans from cache immediately, then refresh in background
  const fetchPlan = async (opCode = operatorCode, crleCode = circleCode, forceRefresh = false) => {
    if (!opCode || !crleCode) {
      console.warn("Missing operatorCode or circleCode");
      setIsInitialLoading(false);
      return;
    }

    const storageKey = `plans_${opCode}_${crleCode}`;
    const storageTimeKey = `${storageKey}_timestamp`;
    const oneDayMs = 24 * 60 * 60 * 1000;

    try {
      // Step 1: Load from cache immediately (if not force refresh)
      if (!forceRefresh) {
        const cachedData = await AsyncStorage.getItem(storageKey);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setJsonData(parsedData);
          setIsInitialLoading(false);
          console.log("Loaded plans from cache instantly");
        }
      }

      // Step 2: Check if background refresh is needed
      const timestamp = await AsyncStorage.getItem(storageTimeKey);
      const now = new Date().getTime();
      const shouldRefresh = forceRefresh || !timestamp || (now - parseInt(timestamp)) >= oneDayMs;

      if (shouldRefresh) {
        // Show refresh indicator only if we have data
        const cached = await AsyncStorage.getItem(storageKey);
        if (Object.keys(jsonData || {}).length > 0 || (!forceRefresh && cached)) {
          setIsRefreshing(true);
        }

        // Fetch fresh data from API
        const response = await postRequest(
          { opCode, circleCode: crleCode },
          userToken,
          'api/customer/plan_recharge/fetchPlansByCode'
        );

        if (response?.status === 'success') {
          const data = response.data;
          setJsonData(data.RDATA);
          
          // Update cache
          await AsyncStorage.setItem(storageKey, JSON.stringify(data.RDATA));
          await AsyncStorage.setItem(storageTimeKey, now.toString());
          
          console.log("Plans refreshed from API");
        } else {
          console.warn("API returned error:", response?.message);
        }
        
        setIsRefreshing(false);
      }
    } catch (error) {
      console.error("fetchPlan Error:", error);
      
      // If we have cached data, don't show error to user
      if (Object.keys(jsonData || {}).length === 0) {
        // Try to load any cached data as fallback
        try {
          const cachedData = await AsyncStorage.getItem(storageKey);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setJsonData(parsedData);
            console.log("Loaded stale cache as fallback");
          }
        } catch (cacheError) {
          console.error("Cache fallback error:", cacheError);
        }
      }
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  const getOperatorList = async (serviceId) => {
    try {
      const response = await getRecords(
        { serviceId }, 
        userToken, 
        'api/customer/operator/getByServiceId'
      );
      
      if (response?.status === 'success') {
        setOperatorList(response.data);
        const matched = response.data.find(op => 
          op.operatorCode === operatorCode ||
          op.operatorName.toLowerCase().includes(operator.toLowerCase())
        );
        
        if (matched) {
          setOperatorId(matched.id);
          setCompanyLogo(matched.logo);
          setSelectedOperator(matched);
          setOperatorNotFound(false);
          // Update operator display name
          setOperator(matched.operatorName.toLowerCase());
        } else {
          // Operator not found in the list
          setOperatorNotFound(true);
          setOperatorId(null);
          setCompanyLogo(null);
          setSelectedOperator(null);
        }
      }
    } catch (error) {
      console.error('Services fetch error', error);
      setOperatorNotFound(true);
    }
  };

  useEffect(() => {
    // Load plans from cache immediately
    fetchPlan();
    // Load operator list in parallel
    getOperatorList(serviceId);
  }, [operatorCode, circleCode, serviceId]);

const categories = ['All Plans', ...Object.keys(jsonData || {})];

const allPlans = categories.slice(1).flatMap((category, catIndex) =>
  (jsonData[category] || []).map((item, i) => {
    let dataValue = 'N/A';
    const desc = item.desc || '';
    const benefitsList = new Set();

    // Match: Data: 1GB
    const dataMatch = desc.match(/Data\s*:\s*([^|]+)/i);
    if (dataMatch) {
      benefitsList.add(dataMatch[1].trim());
    }

    // Match: Benefits: Unlimited Data...
    const benefitsMatch = desc.match(/Benefits\s*:\s*([^|]+)/i);
    if (benefitsMatch) {
      const benefits = benefitsMatch[1];

      if (/unlimited\s+data/i.test(benefits)) benefitsList.add('Unlimited Data');
      if (/unlimited\s+(calls|voice)/i.test(benefits)) benefitsList.add('Unlimited Calls');

      const highSpeedMatch = benefits.match(/(\d+(\.\d+)?\s*GB|\d+\s*MB)\s+(High\s*Speed|per\s*day|\/day)/i);
      if (highSpeedMatch) {
        benefitsList.add(highSpeedMatch[0].replace(/High Speed/i, '').trim());
      }
    }

    // Match: Generic 4G/5G Data like "5 GB 4G/5G Data"
    const generalDataMatch = desc.match(/(\d+(\.\d+)?\s*GB|\d+\s*MB)(\s*[45]G\/[45]G)?\s*Data/i);
    if (generalDataMatch) {
      benefitsList.add(generalDataMatch[0].trim());
    }

    // Match: "Unlimited Calls + 1.5 GB/day Data"
    const comboMatch = desc.match(/(Unlimited\s+Calls)[\s+|&]*([\d.]+\s*GB\/day\s*Data)/i);
    if (comboMatch) {
      benefitsList.add(comboMatch[1].trim()); // Unlimited Calls
      benefitsList.add(comboMatch[2].trim()); // 1.5 GB/day Data
    }

    if (benefitsList.size > 0) {
      dataValue = Array.from(benefitsList).join(' / ');
    }

    return {
      id: `${catIndex}-${i}`,
      price: `₹${item.rs}`,
      name: '',
      validity: item.validity || 'NA',
      data: dataValue,
      description: desc,
      isHighlighted: false,
      category: category,
    };
  })
);


  const filteredPlans = allPlans.filter(plan => {
    // Category filter
    if (activeCategory !== 'All Plans' && plan.category !== activeCategory) {
      return false;
    }
    
    // If no search query, show all plans for the category
    if (!searchQuery) {
      return true;
    }
    
    // Enhanced search logic
    const query = searchQuery.toLowerCase().trim();
    const isNumericQuery = /^\d+$/.test(query);
    
    // If searching by number (amount)
    if (isNumericQuery) {
      const searchAmount = parseInt(query);
      const planAmount = parseInt(plan.price.replace('₹', ''));
      
      // Exact match
      if (planAmount === searchAmount) return true;
      
      // Related amounts (±50% range or containing the digits)
      const lowerBound = searchAmount * 0.5;
      const upperBound = searchAmount * 1.5;
      if (planAmount >= lowerBound && planAmount <= upperBound) return true;
      
      // Contains the search digits
      if (plan.price.includes(query)) return true;
      
      return false;
    }
    
    // Text search in other fields
    return (
      plan.price.toLowerCase().includes(query) ||
      plan.validity.toLowerCase().includes(query) ||
      plan.data.toLowerCase().includes(query) ||
      plan.description.toLowerCase().includes(query)
    );
  });

  // Check if search query is a valid amount
  const isSearchingAmount = searchQuery && /^\d+$/.test(searchQuery.trim());
  const searchAmount = isSearchingAmount ? parseInt(searchQuery) : 0;

  // Sort filtered plans when searching by amount (closest amounts first)
  const sortedPlans = isSearchingAmount && searchAmount > 0
    ? [...filteredPlans].sort((a, b) => {
        const amountA = parseInt(a.price.replace('₹', ''));
        const amountB = parseInt(b.price.replace('₹', ''));
        const diffA = Math.abs(amountA - searchAmount);
        const diffB = Math.abs(amountB - searchAmount);
        return diffA - diffB;
      })
    : filteredPlans;
  
  // Show custom amount option if:
  // 1. User is searching for a specific amount AND
  // 2. No exact match exists (but there might be related results)
  const hasExactMatch = isSearchingAmount && 
    sortedPlans.some(plan => parseInt(plan.price.replace('₹', '')) === searchAmount);
  const showCustomAmountOption = isSearchingAmount && !hasExactMatch;

  // Handle custom amount recharge
  const handleCustomAmountRecharge = () => {
    const customPlan = {
      id: 'custom-amount',
      price: `₹${searchQuery}`,
      name: 'Custom Amount',
      validity: 'As per operator',
      data: 'As per operator',
      description: `Recharge with custom amount of ₹${searchQuery}`,
      isHighlighted: false,
      category: 'Custom',
    };

    navigation.navigate('Recharge', {
      serviceId: serviceId,
      operator_id: operatorId,
      plan: customPlan,
      circleCode: operatorCircle.CircleCode || circleCode,
      companyLogo: companyLogo,
      name,
      mobile,
      operator,
      circle,
      isCustomAmount: true
    });
  };

  // Get screen dimensions
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  // Render content for web platform
  const renderWebContent = () => {
    if (Platform.OS !== 'web') return null;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        backgroundColor: '#F5F5F5'
      }}>
        {/* Fixed Header */}
        <div style={{ flexShrink: 0 }}>
          <CommonHeader2 heading="Mobile Recharge" />
        </div>
        
        {/* Fixed Company Logo/Card Section */}
        <div style={{ flexShrink: 0, padding: '16px', paddingBottom: '0' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <img
              src={companyLogo || '/assets/icons/default.png'}
              alt="Operator Logo"
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                marginRight: '12px',
                border: '1px solid #e0e0e0'
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' }}>
                {`${name} • ${mobile}`}
              </div>
              <div style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                {`${operator?.toUpperCase() || 'N/A'} • ${circle?.toUpperCase() || 'N/A'}`}
              </div>
            </div>
            <button
              onClick={() => setOperatorModalVisible(true)}
              style={{
                color: '#2196F3',
                fontWeight: '600',
                fontSize: '14px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#F0F8FF';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Change
            </button>
          </div>
        </div>

        {/* Fixed Error Display */}
        {operatorNotFound && (
          <div style={{ flexShrink: 0, padding: '0 16px 16px 16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FEDEDE',
              border: '1px solid #E53E3E',
              borderRadius: '8px',
              padding: '12px 16px'
            }}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>⚠️</span>
              <span style={{ fontSize: '14px', color: '#C53030', fontWeight: '600' }}>
                ❌ Operator not available. We cannot proceed with the recharge.
              </span>
            </div>
          </div>
        )}

        {/* Fixed Search Input */}
        <div style={{ flexShrink: 0, padding: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            opacity: operatorNotFound ? 0.6 : 1
          }}>
            <span style={{ marginRight: '8px', color: operatorNotFound ? '#ccc' : '#666' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={operatorNotFound ? "Operator not available - search disabled" : "Search plan or enter amount to recharge"}
              disabled={operatorNotFound}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: operatorNotFound ? '#ccc' : '#000'
              }}
            />
          </div>
        </div>

        {/* Fixed Category Tabs */}
        <div style={{ flexShrink: 0, padding: '0 16px 16px 16px' }}>
          <div style={{ 
            overflowX: 'auto',
            display: 'flex',
            gap: '8px',
            paddingBottom: '8px'
          }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => !operatorNotFound && setActiveCategory(category)}
                disabled={operatorNotFound}
                style={{
                  padding: '8px 16px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: activeCategory === category ? '#000' : 'transparent',
                  color: activeCategory === category ? 'white' : '#666',
                  fontWeight: '500',
                  cursor: operatorNotFound ? 'not-allowed' : 'pointer',
                  opacity: operatorNotFound ? 0.5 : 1,
                  whiteSpace: 'nowrap'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        {/* Scrollable Plans Content */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          height: 0, // Force flex item to shrink
          padding: '0 16px'
        }}>
          <div>
              {/* Refresh indicator */}
              {isRefreshing && !isInitialLoading && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F8F4FF',
                  padding: '8px 12px',
                  borderRadius: '20px',
                  marginBottom: '10px',
                  alignSelf: 'center'
                }}>
                  <div style={{ marginRight: '8px' }}>⟳</div>
                  <span style={{ fontSize: '12px', color: '#8400E5', fontWeight: '500' }}>
                    Updating plans...
                  </span>
                </div>
              )}

              {operatorNotFound ? (
                <div style={{
                  textAlign: 'center',
                  padding: '64px 32px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '64px', marginBottom: '16px' }}>📵</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                    Operator Not Available
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '20px' }}>
                    The selected operator is not available in our system. Please select a different operator to continue with recharge.
                  </div>
                </div>
              ) : (
                <>
                  {/* Custom amount option */}
                  {showCustomAmountOption && (
                    <div
                      onClick={handleCustomAmountRecharge}
                      style={{
                        backgroundColor: '#F8F4FF',
                        border: '2px dashed #8400E5',
                        borderRadius: '8px',
                        padding: '16px',
                        marginBottom: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ marginRight: '8px', color: '#8400E5' }}>➕</span>
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#8400E5', flex: 1 }}>
                          {sortedPlans.length === 0 
                            ? `No plans found for ₹${searchQuery}` 
                            : `₹${searchQuery} plan not available`}
                        </span>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                          {sortedPlans.length === 0 
                            ? 'Continue with custom amount' 
                            : 'See related plans below or continue with custom amount'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#8400E5' }}>
                            ₹{searchQuery}
                          </span>
                          <span style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                            Benefits as per operator
                          </span>
                        </div>
                      </div>
                      <div style={{ 
                        borderTop: '1px solid #E0D4F7', 
                        paddingTop: '12px', 
                        textAlign: 'center' 
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#8400E5' }}>
                          Tap to proceed →
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Related plans header */}
                  {showCustomAmountOption && sortedPlans.length > 0 && (
                    <div style={{ margin: '16px 0', padding: '0 4px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                        Related Plans for ₹{searchQuery}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Plans in similar price range
                      </div>
                    </div>
                  )}

                  {/* Loading state */}
                  {isInitialLoading && Object.keys(jsonData || {}).length === 0 ? (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '100px 0',
                      color: '#666'
                    }}>
                      <div style={{ marginBottom: '10px' }}>⟳</div>
                      <div style={{ fontSize: '14px' }}>Loading plans...</div>
                    </div>
                  ) : (
                    // Plans list
                    sortedPlans.map(plan => (
                      <div
                        key={plan.id}
                        onClick={() => navigation.navigate('Recharge', {
                          serviceId: serviceId,
                          operator_id: operatorId,
                          plan: plan,
                          circleCode: operatorCircle.CircleCode,
                          companyLogo: companyLogo,
                          name, mobile, operator, circle
                        })}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '8px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {/* Header Section */}
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontSize: '20px', 
                              fontWeight: '700', 
                              color: '#1a1a1a',
                              marginBottom: '4px'
                            }}>
                              {plan.price}
                            </div>
                            {plan.name && (
                              <div style={{ 
                                fontSize: '14px', 
                                color: '#666',
                                fontWeight: '500'
                              }}>
                                {plan.name}
                              </div>
                            )}
                          </div>
                          <div style={{
                            backgroundColor: '#E8F5E8',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#4CAF50'
                          }}>
                            RECHARGE
                          </div>
                        </div>

                        {/* Details Section */}
                        <div style={{ 
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          marginBottom: '12px',
                          padding: '12px',
                          backgroundColor: '#F8F9FA',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#666',
                              fontWeight: '500',
                              marginBottom: '2px'
                            }}>
                              VALIDITY
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#1a1a1a',
                              fontWeight: '600'
                            }}>
                              {plan.validity}
                            </div>
                          </div>
                          <div>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#666',
                              fontWeight: '500',
                              marginBottom: '2px'
                            }}>
                              DATA/BENEFITS
                            </div>
                            <div style={{ 
                              fontSize: '13px', 
                              color: '#1a1a1a',
                              fontWeight: '600'
                            }}>
                              {plan.data}
                            </div>
                          </div>
                        </div>

                        {/* Description Section */}
                        {plan.description && (
                          <div style={{
                            borderTop: '1px solid #E0E0E0',
                            paddingTop: '12px',
                            marginTop: '8px'
                          }}>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#666', 
                              lineHeight: '16px',
                              fontWeight: '400'
                            }}>
                              {plan.description}
                            </div>
                          </div>
                        )}

                        {/* Action Indicator */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                          marginTop: '8px'
                        }}>
                          <div style={{
                            fontSize: '12px',
                            color: '#2196F3',
                            fontWeight: '600'
                          }}>
                            →
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
          </div>
        </div>

        {/* Fixed Disclaimer at Bottom */}
        <div style={{ flexShrink: 0, padding: '16px' }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#FFF9E6',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Disclaimer: Check the plan benefits before you recharge.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render content for mobile platforms
  const renderMobileContent = () => {
    if (Platform.OS === 'web') return null;

    return (
      <View style={styles.container}>
        {/* Fixed Header */}
        <CommonHeader2 heading="Mobile Recharge" />
        
        {/* Fixed Company Logo/Card */}
        <Card style={styles.viCard} onPress={() => setOperatorModalVisible(true)}>
          <Card.Title
            title={`${name} • ${mobile}`}
            subtitle={`${operator?.toUpperCase() || 'N/A'} • ${circle?.toUpperCase() || 'N/A'}`}
            left={(props) => (
              <Avatar.Image
                {...props}
                source={companyLogo ? { uri: companyLogo } : require('../../../../assets/icons/default.png')}
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

        {/* Fixed Error Display */}
        {operatorNotFound && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error" size={20} color="#E53E3E" />
            <Text style={styles.errorText}>
              ❌ Operator not available. We cannot proceed with the recharge.
            </Text>
          </View>
        )}

        {/* Fixed Search Input */}
        <CustomSearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={operatorNotFound ? "Operator not available - search disabled" : "Search plan or enter amount to recharge"}
          placeholderTextColor={operatorNotFound ? "#ccc" : "#666"}
          editable={!operatorNotFound}
          leftIcon={() => <MaterialIcons name="search" size={20} color={operatorNotFound ? "#ccc" : "#666"} />}
          containerStyle={[styles.searchContainer, operatorNotFound && styles.disabledContainer]}
          inputStyle={[styles.searchInput, operatorNotFound && styles.disabledInput]}
        />

        {/* Fixed Category Tabs */}
        <View style={styles.fixedCategoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContent}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton, 
                  activeCategory === category && styles.activeCategoryButton,
                  operatorNotFound && styles.disabledCategoryButton
                ]}
                onPress={() => !operatorNotFound && setActiveCategory(category)}
                disabled={operatorNotFound}
              >
                <Text style={[
                  styles.categoryText, 
                  activeCategory === category && styles.activeCategoryText,
                  operatorNotFound && styles.disabledCategoryText
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Scrollable Plans Content */}
        <ScrollView 
          style={styles.plansContainer}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.plansContent}
        >
          {/* Show refresh indicator when data is being refreshed in background */}
          {isRefreshing && !isInitialLoading && (
            <View style={styles.refreshIndicator}>
              <ActivityIndicator size="small" color="#8400E5" />
              <Text style={styles.refreshText}>Updating plans...</Text>
            </View>
          )}
          
          {operatorNotFound ? (
            <View style={styles.noOperatorContainer}>
              <MaterialIcons name="signal-cellular-no-sim" size={64} color="#ccc" />
              <Text style={styles.noOperatorTitle}>Operator Not Available</Text>
              <Text style={styles.noOperatorMessage}>
                The selected operator is not available in our system. Please select a different operator to continue with recharge.
              </Text>
            </View>
          ) : (
            <>
              {/* Show custom amount option when searching for amount without exact match */}
              {showCustomAmountOption && (
            <TouchableOpacity style={[styles.planCard, styles.customAmountCard]} onPress={handleCustomAmountRecharge}>
              <View style={styles.customAmountHeader}>
                <MaterialIcons name="add-circle-outline" size={24} color="#8400E5" />
                <Text style={styles.customAmountTitle}>
                  {sortedPlans.length === 0 
                    ? `No plans found for ₹${searchQuery}` 
                    : `₹${searchQuery} plan not available`}
                </Text>
              </View>
              <View style={styles.customAmountContent}>
                <Text style={styles.customAmountSubtitle}>
                  {sortedPlans.length === 0 
                    ? 'Continue with custom amount' 
                    : 'See related plans below or continue with custom amount'}
                </Text>
                <View style={styles.customAmountDetails}>
                  <Text style={styles.customAmountPrice}>₹{searchQuery}</Text>
                  <Text style={styles.customAmountNote}>Benefits as per operator</Text>
                </View>
              </View>
              <View style={styles.customAmountFooter}>
                <Text style={styles.proceedButtonText}>Tap to proceed →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Show related plans header when there are related results */}
          {showCustomAmountOption && sortedPlans.length > 0 && (
            <View style={styles.relatedPlansHeader}>
              <Text style={styles.relatedPlansTitle}>Related Plans for ₹{searchQuery}</Text>
              <Text style={styles.relatedPlansSubtitle}>Plans in similar price range</Text>
            </View>
          )}

          {/* Show loading only on initial load when no cached data */}
          {isInitialLoading && Object.keys(jsonData || {}).length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8400E5" />
              <Text style={styles.loadingText}>Loading plans...</Text>
            </View>
          ) : (
            sortedPlans.map(plan => (
              <TouchableOpacity 
                key={plan.id} 
                style={styles.rewardsPlanCard} 
                onPress={() => navigation.navigate('Recharge', {
                  serviceId: serviceId,
                  operator_id: operatorId,
                  plan: plan,
                  circleCode: operatorCircle.CircleCode,
                  companyLogo: companyLogo,
                  name,mobile,operator,circle
                })}
                activeOpacity={0.7}
              >
                {/* Header Section */}
                <View style={styles.planHeader}>
                  <View style={styles.planLeftSection}>
                    <Text style={styles.rewardsPlanPrice}>{plan.price}</Text>
                    {plan.name && <Text style={styles.rewardsPlanName}>{plan.name}</Text>}
                  </View>
                  <View style={styles.planStatusBadge}>
                    <Text style={styles.planStatusText}>RECHARGE</Text>
                  </View>
                </View>

                {/* Details Section */}
                <View style={styles.planDetailsSection}>
                  <View style={styles.planDetailItem}>
                    <Text style={styles.planDetailLabel}>VALIDITY</Text>
                    <Text style={styles.planDetailValue}>{plan.validity}</Text>
                  </View>
                  <View style={styles.planDetailItem}>
                    <Text style={styles.planDetailLabel}>DATA/BENEFITS</Text>
                    <Text style={styles.planDetailValue}>{plan.data}</Text>
                  </View>
                </View>

                {/* Description Section */}
                {plan.description && (
                  <View style={styles.rewardsPlanDescription}>
                    <Text style={styles.rewardsPlanDescriptionText}>{plan.description}</Text>
                  </View>
                )}

                {/* Action Indicator */}
                <View style={styles.planActionIndicator}>
                  <AntDesign name="right" size={14} color="#2196F3" />
                </View>
              </TouchableOpacity>
            ))
          )}
            </>
          )}
        </ScrollView>

        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Disclaimer: Check the plan benefits before you recharge.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {renderWebContent()}
      {renderMobileContent()}

      <Modal visible={operatorModalVisible} transparent animationType="slide" onRequestClose={() => setOperatorModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '85%', borderWidth: 1, borderColor: '#e0e0e0' }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>Select Operator</Text>
            <FlatList
              data={operatorList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    fetchPlan(item.operatorCode, operatorCircle.CircleCode);
                    setOperator(item.operatorName.toLowerCase());
                    setSelectedOperator(item);
                    setOperatorId(item.id);
                    setCompanyLogo(item.logo);
                    setOperatorNotFound(false);
                    setOperatorModalVisible(false);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#a5a5a5ff' }}
                >
                  <Avatar.Image source={{ uri: item.logo }} size={32} style={{ marginRight: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e0e0e0' }} />
                  <Text style={{ fontSize: 14 }}>{item.operatorName}</Text>
                </Pressable>
              )}
            />
            <TouchableOpacity onPress={() => setOperatorModalVisible(false)} style={{ marginTop: 15, alignSelf: 'flex-end' }}>
              <Text style={{ color: '#f9f9f9ff' }}>Cancel</Text>
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
    backgroundColor: '#F5F5F5',
  },
  viCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
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
    alignItems : 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  userPlan: {
    fontSize: 14,
    color: '#666',
  },
  changeText: {
    color: '#5E2EFF',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
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
    backgroundColor: 'rgba(0, 0, 0, 1)',
  },
  categoryText: {
    color: '#666',
    fontWeight: '500',
  },
  activeCategoryText: {
    color: 'white',
  },
  fixedCategoryContainer: {
    height: 40,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  plansContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  plansContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  // New Rewards-style card design
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
  rewardsPlanPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  rewardsPlanName: {
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
  planDetailsSection: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  planDetailItem: {
    flex: 1,
  },
  planDetailLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginBottom: 2,
  },
  planDetailValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  rewardsPlanDescription: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    marginTop: 8,
  },
  rewardsPlanDescriptionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontWeight: '400',
  },
  planActionIndicator: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
  },
  // Keep old styles for backward compatibility
  planLeft: {
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8400E5',
  },
  planName: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  planMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  planValidity: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  planData: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  planValue: {
    color: '#333',
    fontWeight: 'bold',
  },
  planRight: {
    alignItems: 'flex-end',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsButtonText: {
    color: '#8400E5',
    fontSize: 12,
  },
  planDescription: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    marginTop: 8,
  },
  planDescriptionText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  disclaimerContainer: {
    padding: 16,
    backgroundColor: '#FFF9E6',
    margin: 0,
    borderRadius: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // Custom Amount Styles
  customAmountCard: {
    borderWidth: 2,
    borderColor: '#8400E5',
    borderStyle: 'dashed',
    backgroundColor: '#F8F4FF',
  },
  customAmountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customAmountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8400E5',
    marginLeft: 8,
    flex: 1,
  },
  customAmountContent: {
    marginBottom: 12,
  },
  customAmountSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  customAmountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customAmountPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8400E5',
  },
  customAmountNote: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  customAmountFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E0D4F7',
    paddingTop: 12,
    alignItems: 'center',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8400E5',
  },
  // Related Plans Header Styles
  relatedPlansHeader: {
    marginVertical: 16,
    paddingHorizontal: 4,
  },
  relatedPlansTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  relatedPlansSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  // Error States Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEDEDE',
    borderWidth: 1,
    borderColor: '#E53E3E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#C53030',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  disabledInput: {
    color: '#ccc',
  },
  disabledCategoryButton: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  disabledCategoryText: {
    color: '#ccc',
  },
  noOperatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  noOperatorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noOperatorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Loading and refresh styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F4FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'center',
  },
  refreshText: {
    fontSize: 12,
    color: '#8400E5',
    marginLeft: 8,
    fontWeight: '500',
  },
});