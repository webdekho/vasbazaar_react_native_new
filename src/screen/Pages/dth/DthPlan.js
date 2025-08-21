// DthPlanScreen.js
import { AntDesign } from '@expo/vector-icons';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar, Card, Searchbar } from 'react-native-paper';

import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '../../../Services/ApiServices';

export default function DthPlan({ route, navigation }) {
  const [activeCategory, setActiveCategory] = useState('All Plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [operatorModalVisible, setOperatorModalVisible] = useState(false);
  const [jsonData, setJsonData] = useState({});
  const [operatorList, setOperatorList] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomAmountButton, setShowCustomAmountButton] = useState(false);

  const authContext = useContext(AuthContext);
  const { userToken } = authContext;

  const {
    serviceId = 'NA',
    contact = {},
    operator = 'NA',
    name = 'No Name',
    operatorCircle = {},
    companyLogo = '',
    operator_id = null,
    dth_info = {},
    operatorCode,
  } = route.params || {};

  const [mobile, setMobile] = useState(contact?.number || 'NA');
  const [circle, setCircle] = useState(null);
  const [operatorId, setOperatorId] = useState(null);
  const [logo, setLogo] = useState(companyLogo);

  useEffect(() => {
    const init = async () => {
      await fetchPlan(operatorCode);
      await getOperatorList(serviceId);
    };
    init();
  }, []);

  const fetchPlan = async (opCode) => {
    try {
      const response = await postRequest(
        { opCode },
        userToken,
        'api/customer/plan_recharge/fetch_DTHPlans'
      );

      if (response?.status === 'success') {
        console.log("plan_response", response.data);
        setJsonData(response.data?.RDATA?.Combo || {});
      }
    } catch (error) {
      console.error('Plan fetch error:', error);
    }
  };

  const getOperatorList = async (serviceId) => {
    setIsLoading(true);
    try {
      const response = await getRecords({ serviceId }, userToken, 'api/customer/operator/getByServiceId');
      if (response?.status === 'success') {
        setOperatorList(response.data);
      }
    } catch (err) {
      console.error('Operator fetch error:', err);
    } finally {
      setIsLoading(false);
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
    
    return jsonData.flatMap((comboItem) => {
      if (!comboItem.Details || !Array.isArray(comboItem.Details)) return [];
      
      return comboItem.Details.map((detail) => ({
        id: `${comboItem.Language}-${detail.PlanName}`,
        category: comboItem.Language,
        language: comboItem.Language,
        planName: detail.PlanName,
        channels: detail.Channels,
        paidChannels: detail.PaidChannels,
        hdChannels: detail.HdChannels,
        lastUpdate: detail.last_update,
        pricing: detail.PricingList || [],
        // Extract numeric value from amount for comparison
        numericAmounts: (detail.PricingList || []).map(p => 
          parseInt(p.Amount.replace(/[^0-9]/g, ''), 10)
        )
      }));
    });
  }, [jsonData]);

  const filteredPlans = useMemo(() => {
    // Check if search query is a number
    const searchAmount = parseInt(searchQuery.replace(/[^0-9]/g, ''), 10);
    const isAmountSearch = !isNaN(searchAmount) && searchQuery.trim() !== '';

    return allPlans.filter(plan => {
      // Category filter
      const categoryMatch = activeCategory === 'All Plans' || plan.category === activeCategory;
      
      // If searching by amount
      if (isAmountSearch) {
        return categoryMatch && plan.numericAmounts.some(amount => amount === searchAmount);
      }
      
      // Regular text search
      return categoryMatch && (
        searchQuery === '' ||
        plan.planName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [allPlans, activeCategory, searchQuery]);

  // Check if we should show custom amount button
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
    navigation.navigate('Recharge', {
      serviceId,
      operator_id,
      plan: {
        name: `Custom Amount: ₹${searchQuery}`,
        price: `₹${searchQuery}`,
        validity: 'N/A',
        data: 'Custom Recharge',
      },
      circleCode: operatorCircle?.CircleCode,
      companyLogo: logo,
      name, 
      mobile, 
      operator, 
      circle
    });
  };


  const keyLabels = {
    customerName: 'Customer Name',
    vcNumber: 'Consumer Number',
    rmn: 'Registered Mobile Number',
    balance: 'Customer DTH Balance',
    city: 'City',
    state: 'State',
    pinCode: 'Pin Code',
    address: 'Address',
    district: 'District',
    nextRechargeDate: 'Next Recharge Date',
    monthlyPack: 'Monthly Pack'
  };

  // Render content for web platform
  const renderWebContent = () => {
    if (Platform.OS !== 'web') return null;
    
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100vh',
        backgroundColor: '#F5F5F5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        {/* Fixed Header */}
        <div style={{ flexShrink: 0 }}>
          <CommonHeader2 heading="DTH Plans" />
        </div>
        
        {/* Fixed Company Info Card */}
        <div style={{ flexShrink: 0, padding: '16px', paddingBottom: '0' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid rgba(0,0,0,0.05)'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}>
              <img
                src={logo || '/assets/icons/default.png'}
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
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#1a1a1a', 
                  marginBottom: '4px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}>
                  {`${name} • ${mobile}`}
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#666', 
                  fontWeight: '500',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}>
                  {operator}
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
                  transition: 'background-color 0.2s',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
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
            
            {/* DTH Info */}
            <div style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}>
              {Object.entries(dth_info)
                .filter(([key, value]) => 
                  value != null && 
                  value.toString().trim() !== '' &&
                  !['rmn'].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key} style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    paddingVertical: '12px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <span style={{ 
                      fontWeight: '500', 
                      color: '#666',
                      fontSize: '14px',
                      marginRight: '16px',
                      minWidth: '140px',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                      {keyLabels[key] || key}:
                    </span>
                    <span style={{ 
                      fontWeight: '600', 
                      color: '#1a1a1a',
                      fontSize: '14px',
                      flex: 1,
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                    }}>
                      {value}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Fixed Search */}
        <div style={{ flexShrink: 0, padding: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '12px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}>
            <span style={{ marginRight: '8px', color: '#666' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Plan or Enter Amount"
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#000',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
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
            paddingBottom: '8px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '16px',
                  border: 'none',
                  backgroundColor: activeCategory === cat ? '#000' : 'transparent',
                  color: activeCategory === cat ? 'white' : '#666',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {/* Scrollable Plans Content */}
        <div style={{ 
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          height: 0,
          padding: '0 16px'
        }}>
          {filteredPlans.length > 0 ? (
            filteredPlans.map(plan => (
              <div key={plan.id} style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}>
                {/* Plan Header */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#1a1a1a',
                        marginBottom: '4px'
                      }}>
                        {plan.planName}
                      </div>
                    </div>
                    <div style={{
                      backgroundColor: '#E8F5E8',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#4CAF50'
                    }}>
                      DTH
                    </div>
                  </div>

                  {/* Channel Information */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '8px',
                    marginBottom: '8px',
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
                        CHANNELS
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#1a1a1a',
                        fontWeight: '600'
                      }}>
                        {plan.channels}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#666',
                        fontWeight: '500',
                        marginBottom: '2px'
                      }}>
                        PAID
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#1a1a1a',
                        fontWeight: '600'
                      }}>
                        {plan.paidChannels}
                      </div>
                    </div>
                    <div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#666',
                        fontWeight: '500',
                        marginBottom: '2px'
                      }}>
                        HD
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        color: '#1a1a1a',
                        fontWeight: '600'
                      }}>
                        {plan.hdChannels}
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    fontSize: '12px', 
                    color: '#999',
                    fontWeight: '400'
                  }}>
                    Last Updated: {plan.lastUpdate}
                  </div>
                </div>

                {/* Pricing Options */}
                <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '12px' }}>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#666',
                    fontWeight: '500',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    RECHARGE OPTIONS
                  </div>
                  {plan.pricing.map((priceObj, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        navigation.navigate('Recharge', {
                          serviceId,
                          operator_id,
                          plan: {
                            name: plan.planName,
                            price: priceObj.Amount,
                            validity: priceObj.Month,
                            data: plan.channels,
                          },
                          circleCode: operatorCircle?.CircleCode,
                          companyLogo: logo,
                          name, mobile, operator, circle,
                          service: 'dth',
                        });
                      }}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E0E0E0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#F8F9FA';
                        e.currentTarget.style.borderColor = '#2196F3';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                        e.currentTarget.style.borderColor = '#E0E0E0';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div>
                        <div style={{ 
                          fontSize: '16px', 
                          fontWeight: '700', 
                          color: '#1a1a1a',
                          marginBottom: '2px'
                        }}>
                          {priceObj.Amount}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          fontWeight: '500'
                        }}>
                          {priceObj.Month}
                        </div>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: '#2196F3',
                        fontWeight: '600'
                      }}>
                        →
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : showCustomAmountButton ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
                No plans found for ₹{searchQuery}
              </div>
              <button 
                onClick={handleCustomAmountRecharge}
                style={{
                  backgroundColor: '#8400E5',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  padding: '15px',
                  borderRadius: '8px',
                  border: 'none',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                Proceed with ₹{searchQuery}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '16px', color: '#666' }}>No plans found</div>
            </div>
          )}
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
              Disclaimer: Double check your plan before proceeding with the recharge.
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
        <CommonHeader2 heading="DTH Plans" />

        {/* Fixed User Info Card */}
        <Card style={styles.viCard} onPress={() => setOperatorModalVisible(true)}>
          <Card.Title
            title={`${name} • ${mobile}`}
            subtitle={`${operator}`}
            left={(props) => (
              <Avatar.Image
                {...props}
                source={logo ? { uri: logo } : require('../../../../assets/icons/default.png')}
                style={styles.logo}
              />
            )}
            right={() => (
              <TouchableOpacity onPress={() => setOperatorModalVisible(true)}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            )}
          />
          <Card.Content>
            {Object.entries(dth_info)
              .filter(([key, value]) => 
                value != null && 
                value.toString().trim() !== '' &&
                !['rmn'].includes(key)
              )
              .map(([key, value]) => (
                <View key={key} style={styles.infoRow}>
                  <Text style={styles.infoKey}>{keyLabels[key] || key} : </Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
          </Card.Content>
        </Card>

        {/* Fixed Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search Plan or Enter Amount"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchInput}
            inputStyle={{ fontSize: 14 }}
            iconColor="#666"
          />
        </View>

        {/* Fixed Category Tabs */}
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

        {/* Scrollable Plan Cards */}
        <ScrollView 
          style={styles.plansContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.plansContent}
        >
          {filteredPlans.length > 0 ? (
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
                      onPress={() => {
                        navigation.navigate('Recharge', {
                          serviceId,
                          operator_id,
                          plan: {
                            name: plan.planName,
                            price: priceObj.Amount,
                            validity: priceObj.Month,
                            data: plan.channels,
                          },
                          circleCode: operatorCircle?.CircleCode,
                          companyLogo: logo,
                          name, mobile, operator, circle,
                          service: 'dth',
                        });
                      }}
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

        {/* Fixed Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            Disclaimer: Double check your plan before proceeding with the recharge.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <>
      {renderWebContent()}
      {renderMobileContent()}

      {/* Operator Modal */}
      <Modal visible={operatorModalVisible} transparent animationType="slide" onRequestClose={() => setOperatorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Operator</Text>
            <FlatList
              data={operatorList}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    fetchPlan(item.operatorCode, operatorCircle?.CircleCode);
                    setSelectedOperator(item);
                    setLogo(item.logo);
                    setOperatorId(item.id);
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
              <Text style={{ color: '#5E2EFF' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
  logo: { width: 45, height: 45, backgroundColor: '#f6f6f6' },
  changeText: { color: '#2196F3', fontWeight: '600', fontSize: 14, marginRight: 16 },
  searchContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    marginHorizontal: 16,
    marginBottom: 16, 
    padding: 10, 
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchInput: { marginLeft: 10, flex: 1 },
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
  activeCategoryButton: { backgroundColor: '#000000ff' },
  categoryText: { fontSize: 13, color: '#666', fontWeight: '500' },
  activeCategoryText: { color: '#fff' },
  fixedCategoryContainer: {
    height: 40,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  plansContainer: { 
    flex: 1,
    paddingHorizontal: 16 
  },
  plansContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  planCard: { 
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
  // New Rewards-style card design for DTH
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
  planName: { fontWeight: 'bold', fontSize: 16, marginBottom: 6, color: '#1a1a1a' },
  planInfo: { fontSize: 13, color: '#666' },
  planUpdate: { fontSize: 12, color: '#999', marginBottom: 10 },
  planPriceButton: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4
  },
  planPriceText: { color: '#8400E5', fontWeight: '600' },
  disclaimerContainer: { 
    padding: 16, 
    backgroundColor: '#FFF9E6',
    margin: 0,
    borderRadius: 8,
  },
  disclaimerText: { fontSize: 12, textAlign: 'center', color: '#666' },
  infoRow: { flexDirection: 'row', paddingVertical: 4 },
  infoKey: { fontWeight: '600', color: '#444' },
  infoValue: { textAlign: 'left', color: '#8400E5', fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(1, 1, 1, 0.5)' },
  modalContainer: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 8 },
  modalTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  operatorItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  cancelButton: { marginTop: 10, alignSelf: 'flex-end' },
  noPlansContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: '#8400E5',
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
});