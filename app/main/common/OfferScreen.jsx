import MainHeader from '../../../components/MainHeader';
import { getSessionToken } from '../../../services/auth/sessionManager';
import { getRequest } from '../../../services/api/baseApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
, TextInput } from 'react-native';
import { Avatar, Button, Card, List } from 'react-native-paper';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width: screenWidth } = Dimensions.get('window');

const Icons = {
  cashback: require('../../../assets/icons/cashback.png'),
  other: require('../../../assets/icons/coupon.png'),
  discount: require('../../../assets/icons/discount.png'),
};

export default function OfferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const {
    serviceId = null,
    operator_id = null,
    plan = null,
    circleCode = null,
    companyLogo = null,
    name = null,
    mobile = null,
    operator = null,
    circle = null,
    bill_details = null,
    service = null,
  } = params || {};

  const [coupon, setCoupon] = useState('');
  const [coupon2, setCoupon2] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [jsonData, setJsonData] = useState([]);
  const [jsonData2, setJsonData2] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [selectedCoupon2, setSelectedCoupon2] = useState(null);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [couponDesc, setCouponDesc] = useState('');
  
  // Confetti effect refs
  const confettiRef = useRef(null);
  const modalConfettiRef = useRef(null);
  
  // Parse plan data
  const planData = typeof plan === 'string' ? JSON.parse(plan || '{}') : (plan || {});

  // Function to trigger confetti effect
  const triggerConfetti = () => {
    if (confettiRef.current) {
      confettiRef.current.start();
    }
  };

  // Function to trigger confetti effect in modal
  const triggerModalConfetti = () => {
    if (modalConfettiRef.current) {
      modalConfettiRef.current.start();
    }
  };

  const handleApplyCoupon = (couponCode, coupon_id, description) => {
    setCoupon(coupon_id);
    setSelectedCoupon(couponCode);
    setCouponDesc(description);
    
    // Trigger lightweight confetti effect on coupon apply
    triggerConfetti();
  };

  const handleApplyCoupon2 = (couponCode, coupon_id, description) => {
    if (coupon2 != null && coupon2 !== '') {
      setCoupon(coupon2);
      setCouponDesc(description);
    }
    
    setSelectedCoupon2(couponCode);
    
    // Trigger lightweight confetti effect on coupon apply in modal
    triggerModalConfetti();
    
    // Close modal after a brief delay to show confetti
    setTimeout(() => {
      setCouponModalVisible(false);
    }, 800);
  };

  const fetchCoupon = async (displayOnScreen) => {
    const storageKey = `coupon_${displayOnScreen}`;
    const storageTimeKey = `${storageKey}_timestamp`;
    const oneDayMs = 24 * 60 * 60 * 1000;
    try {
      const [cachedData, timestamp] = await Promise.all([
        AsyncStorage.getItem(storageKey),
        AsyncStorage.getItem(storageTimeKey),
      ]);

      if (displayOnScreen == 1) {
        const now = new Date().getTime();
        if (cachedData && timestamp && now - parseInt(timestamp) < oneDayMs) {
          const parsedData = JSON.parse(cachedData);
          setJsonData(parsedData);
          return parsedData;
        }
      }

      const sessionToken = await getSessionToken();
      if (!sessionToken) {
        console.log('No session token available');
        return null;
      }

      const response = await getRequest('api/customer/coupon/allcoupons', { displayOnScreen }, sessionToken);
      if (response?.status === 'success') {
        const data = response.data;
        displayOnScreen == 1 ? setJsonData(data) : setJsonData2(data);
        const now = new Date().getTime();
        await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        await AsyncStorage.setItem(storageTimeKey, now.toString());
        return data;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    fetchCoupon(true);
  }, []);

  const filteredCoupons = jsonData2.filter(coupon =>
    coupon.couponName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.couponCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <MainHeader title="Mobile Recharge" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.viCard}>
            <Card.Title
              title={`${name} • ${mobile}`}
              subtitle={circle ? `${operator} • ${circle}` : operator}
              left={(props) => (
                <Avatar.Image
                  {...props}
                  source={companyLogo ? { uri: companyLogo } : require('../../../assets/icons/default.png')}
                  style={styles.logo}
                />
              )}
              titleStyle={styles.userName}
              subtitleStyle={styles.userPlan}
            />
          </Card>

          <Card style={styles.planCard}>
            <Card.Content>
              <View style={styles.planRowSingle}>
                {planData.price ? (
                  <View style={styles.planColumn}>
                    <Text style={styles.planPrice}>{planData.price}</Text>
                  </View>
                ) : null}

                {planData.validity ? (
                  <View style={styles.planColumn}>
                    <Text style={styles.detailLabel}>Validity</Text>
                    <Text style={styles.detailValue}>{planData.validity}</Text>
                  </View>
                ) : null}

                {planData.data ? (
                  <View style={styles.planColumn}>
                    <Text style={styles.detailLabel}>Data</Text>
                    <Text style={styles.detailValue}>{planData.data}</Text>
                  </View>
                ) : null}
              </View>

              {planData.description ? (
                <View style={styles.accordionContainer}>
                  <List.Accordion
                    title="View Details"
                    expanded={expanded}
                    onPress={() => setExpanded(!expanded)}
                    titleStyle={styles.accordionTitle}
                    style={styles.accordion}
                  >
                    <Text style={styles.planDescriptionText}>{planData.description}</Text>
                  </List.Accordion>
                </View>
              ) : null}
            </Card.Content>
          </Card>

          {/* This instruction should not appear for mobile recharges - only for DTH */}
          {service && service.toLowerCase() === 'dth' && (
            <Text style={styles.blakPutti}>
              Keep Set top box on while recharging.
            </Text>
          )}

          <Text style={styles.offerHeader}>Offers for You</Text>
          
          {jsonData.map((offer, index) => {
            let discountValue = 0;
            const rawPrice = planData?.price ?? '₹0';
            const numericPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

            if (numericPrice > 0) {
              if (offer.type === 'FLAT') {
                discountValue = offer.amount;
              } else if (offer.type === 'PERCENTAGE') {
                discountValue = (offer.amount / 100) * numericPrice;
              }
            }

            const formattedValue = `₹${discountValue.toFixed(1)}`;
            const formattedDescription = offer.description
              ?.replace('{#discount#}', formattedValue)
              .replace('{#cashback#}', formattedValue);

            const isOther = offer.categoryId?.name === 'Other';
            const isApplied = coupon === offer.id;

            return (
              <Card key={index} style={styles.offerCard}>
                <Card.Title
                  title={`${offer.couponName}`}
                  subtitle={formattedDescription || 'Coupon details here'}
                  left={(props) => (
                    <Avatar.Image
                      {...props}
                      source={Icons[offer.categoryId?.name?.toLowerCase()] || require('../../../assets/icons/coupon.png')}
                    />
                  )}
                  right={() => (
                    <Button
                      mode={isApplied ? 'outlined' : 'contained'}
                      style={[styles.applyButton, isApplied && styles.appliedButton]}
                      labelStyle={{
                        color: isApplied ? '#000000ff' : isOther ? '#fff' : '#fff',
                        fontWeight: '600',
                        fontSize: 12
                      }}
                      onPress={() => {
                        if (isOther) {
                          setCouponModalVisible(true);
                          fetchCoupon(false);
                          setCoupon2(offer.id);
                        } else {
                          handleApplyCoupon(offer.couponCode, offer.id, offer.description);
                        }
                      }}
                    >
                      {isApplied ? 'Applied' : isOther ? 'Select' : 'Apply'}
                    </Button>
                  )}
                />
              </Card>
            );
          })}

        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: screenWidth / 2, y: 50 }}
          autoStart={false}
          fadeOut={true}
          explosionSpeed={250}
          fallSpeed={1800}
          particleSize={8}
          spread={100}
          colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7']}
        />

        </ScrollView>

        {/* Fixed Proceed to Pay Button at Bottom */}
        <View style={styles.bottomPaySection}>
          <Button
            mode="contained"
            onPress={() =>
              router.push({
                pathname: '/main/common/PaymentScreen',
                params: {
                  serviceId,
                  operator_id,
                  plan: typeof plan === 'string' ? plan : JSON.stringify(plan),
                  circleCode,
                  companyLogo,
                  name,
                  mobile,
                  operator,
                  circle,
                  coupon,
                  coupon2,
                  selectedCoupon2,
                  bill_details,
                  couponDesc
                }
              })
            }
            style={styles.payButton}
            contentStyle={styles.payButtonContent}
            labelStyle={styles.payButtonLabel}
            icon=""
          >
            Proceed to Pay
          </Button>
        </View>

        {/* Confetti Cannon for main screen - Enhanced */}
        

        <Modal visible={couponModalVisible} animationType="slide">
          <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <View style={styles.modalInputGroup}>
              <TextInput
                style={styles.modalInput}
                placeholder="Search Coupon"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <ScrollView>
              {filteredCoupons.map((offer, index) => (
                <Card key={index} style={styles.offerCard}>
                  <Card.Title
                    title={offer.couponName}
                    subtitle={offer.description}
                    left={(props) => (
                      <Avatar.Image
                        {...props}
                        source={Icons[offer.type] || require('../../../assets/icons/coupon.png')}
                      />
                    )}
                    right={() => (
                      <Button
                        mode={selectedCoupon2 === offer.couponCode ? 'outlined' : 'contained'}
                        style={[styles.applyButton, selectedCoupon2 === offer.couponCode && styles.appliedButton]}
                        labelStyle={{
                          color: selectedCoupon2 === offer.couponCode ? '#000000ff' : '#fff',
                          fontWeight: '600',
                          fontSize: 12
                        }}
                        onPress={() => handleApplyCoupon2(offer.couponCode, offer.id, offer.description)}
                      >
                        {selectedCoupon2 === offer.couponCode ? 'Applied' : 'Apply'}
                      </Button>
                    )}
                  />
                </Card>
              ))}
            </ScrollView>
            <Button 
              mode="contained"
              onPress={() => setCouponModalVisible(false)} 
              style={{ 
                marginTop: 10, 
                backgroundColor: '#000000',
                borderRadius: 8
              }}
              labelStyle={{
                color: '#ffffff',
                fontWeight: '600'
              }}
            >
              Close
            </Button>
            
            {/* Confetti Cannon for modal - Enhanced */}
            <ConfettiCannon
              ref={modalConfettiRef}
              count={45}
              origin={{ x: screenWidth / 2, y: 80 }}
              autoStart={false}
              fadeOut={true}
              explosionSpeed={200}
              fallSpeed={1600}
              particleSize={7}
              spread={90}
              colors={['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']}
            />
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  blakPutti: {
    color: 'white',
    backgroundColor: '#000000ff',
    padding: 10,
    borderRadius: 10,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 90,
    backgroundColor: '#f7f7f7',
  },
  viCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 16,
    elevation: 1,
  },
  logo: {
    width: 45,
    height: 45,
    backgroundColor: '#f6f6f6',
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
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 8,
    marginVertical: 10,
    elevation: 2,
  },
  planRowSingle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planColumn: {
    flex: 1,
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  detailLabel: {
    fontSize: 12,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  accordionContainer: {
    marginTop: 10,
    backgroundColor: '#F8F8F8',
    borderRadius: 6,
  },
  accordion: {
    backgroundColor: '#F2F2F2',
    borderRadius: 6,
  },
  accordionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000ff',
  },
  planDescriptionText: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 8,
    lineHeight: 18,
  },
  offerHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 5,
  },
  offerCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 1,
  },
  applyButton: {
    backgroundColor: '#000000ff',
    paddingHorizontal: 5,
    marginRight: 5
  },
  appliedButton: {
    borderWidth: 1,
    borderColor: '#000000ff',
    backgroundColor: '#fff',
    color: '#000000ff',
  },
  couponCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  couponContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginRight: 8,
  },
  bottomPaySection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    backgroundColor: '#f7f7f7',
  },
  payButton: {
    backgroundColor: '#000000ff',
    height: 50,
    justifyContent: 'center',
    borderRadius: 12,
  },
  payButtonContent: {
    height: 50,
    justifyContent: 'center',
  },
  payButtonLabel: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalInputGroup: {
    marginBottom: 16,
    marginTop: 50,
  },
  modalInput: {
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
});