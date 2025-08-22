import CommonHeader2 from '../../../components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords } from '../../../Services/ApiServices';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Avatar, Button, Card, List, Searchbar } from 'react-native-paper';

const { width: screenWidth } = Dimensions.get('window');

const Icons = {
  cashback: require('../../../../assets/icons/cashback.png'),
  other: require('../../../../assets/icons/coupon.png'),
  discount: require('../../../../assets/icons/discount.png'),
};

export default function Recharge({ route, navigation }) {
  const authContext = useContext(AuthContext);
  const { userData, userToken } = authContext;
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
  bill_details = null
} = route?.params || {};  

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
  console.log("plan",plan);

  const handleApplyCoupon = (couponCode, coupon_id,description) => {
    setCoupon(coupon_id);
    setSelectedCoupon(couponCode);
    setCouponDesc(description);
  };

  const handleApplyCoupon2 = (couponCode, coupon_id,description) => {
    console.log("coupon2",coupon2);
    if (coupon2 != null && coupon2 !== '') {
      console.log("Coupon2 Enter int Coupon",coupon2);
      setCoupon(coupon2);
      setCouponDesc(description);
      

    }
    
    setSelectedCoupon2(couponCode);
    setCouponModalVisible(false);
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

      const response = await getRecords({ displayOnScreen }, userToken, 'api/customer/coupon/allcoupons');
      if (response?.status === 'success') {
        const data = response.data;
        displayOnScreen == 1 ? setJsonData(data) : setJsonData2(data);
        const now = new Date().getTime();
        await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        await AsyncStorage.setItem(storageTimeKey, now.toString());
        return data;
      } else {
        console.log("API returned error:", response?.message);
        return null;
      }
    } catch (error) {
      console.log("fetchPlan Error:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchCoupon(true);
  }, []);

  const filteredCoupons = jsonData2.filter(coupon =>
    coupon.couponName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coupon.couponCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={{ flex: 1 }}>
      <CommonHeader2 heading="Mobile Recharge" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.viCard}>
            <Card.Title
              title={`${name} • ${mobile}`}
              subtitle={circle ? `${operator} • ${circle}` : operator}

              left={(props) => (
                <Avatar.Image
                  {...props}
                  source={companyLogo ? { uri: companyLogo } : require('../../../../assets/icons/default.png')}
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
      {plan.price ? (
        <View style={styles.planColumn}>
          <Text style={styles.planPrice}>{plan.price}</Text>
        </View>
      ) : null}

      {plan.validity ? (
        <View style={styles.planColumn}>
          <Text style={styles.detailLabel}>Validity</Text>
          <Text style={styles.detailValue}>{plan.validity}</Text>
        </View>
      ) : null}

      {plan.data ? (
        <View style={styles.planColumn}>
          <Text style={styles.detailLabel}>Data</Text>
          <Text style={styles.detailValue}>{plan.data}</Text>
        </View>
      ) : null}
    </View>

    {plan.description ? (
      <View style={styles.accordionContainer}>
        <List.Accordion
          title="View Details"
          expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          titleStyle={styles.accordionTitle}
          style={styles.accordion}
        >
          <Text style={styles.planDescriptionText}>{plan.description}</Text>
        </List.Accordion>
      </View>
    ) : null}
  </Card.Content>
</Card>

          <Text style={styles.offerHeader}>Offers for You</Text>
          
  {jsonData.map((offer, index) => {
  let discountValue = 0;

  // Extract numeric value from plan.price (e.g., "₹100" → 100)
  const rawPrice = plan?.price ?? '₹0';
  const numericPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 0;

  if (numericPrice > 0) {
    if (offer.type === 'FLAT') {
      discountValue = offer.amount;
    } else if (offer.type === 'PERCENTAGE') {
      discountValue = (offer.amount / 100) * numericPrice;
    }
  }

  // Format with two decimal places
  const formattedValue = `₹${discountValue.toFixed(1)}`;

  const formattedDescription = offer.description
    ?.replace('{#discount#}', formattedValue)
    .replace('{#cashback#}', formattedValue);

  return (
    <Card key={index} style={styles.offerCard}>
      <Card.Title
        title={`${offer.couponName}`}
        subtitle={formattedDescription || 'Coupon details here'}
        left={(props) => (
          <Avatar.Image
            {...props}
            source={Icons[offer.categoryId?.name?.toLowerCase()] || require('../../../../assets/icons/coupon.png')}
          />
        )}
        right={() => (
          <Button
            mode={coupon === offer.id ? 'outlined' : 'contained'}
            style={[
              styles.applyButton,
              coupon === offer.id && styles.appliedButton,
            ]}
            
            onPress={() => {
              if(offer.categoryId.name === 'Others'){
                  setCouponModalVisible(true);
                  fetchCoupon(false);
                  setCoupon2(offer.id);
                  
                }else{
                    handleApplyCoupon(offer.couponCode, offer.id,offer.description);
                }
            }}
          >
            {coupon === offer.id ? 'Applied' : 'Apply'}
          </Button>
        )}
      />
    </Card>
  );
})}



          {/* <Card style={styles.couponCard}>
            <Card.Title
              title="Apply Coupon"
              left={(props) => (
                <Avatar.Image
                  {...props}
                  source={Icons['coupon'] || require('../../../../assets/icons/coupon.png')}
                />
              )}
            />
            <Card.Content style={styles.couponContent}>
              <TextInput
                placeholder="Enter coupon code"
                value={selectedCoupon2}
                onChangeText={setSelectedCoupon2}
                style={styles.couponInput}
              />
              <Button
                mode="contained"
                style={styles.applyButton}
                onPress={() => {
                  setCouponModalVisible(true);
                  fetchCoupon(false);
                }}
              >
                Apply
              </Button>
            </Card.Content>
          </Card> */}

          <Button
            mode="contained"
            onPress={() =>
              navigation.navigate('Payment', {
                serviceId,
                operator_id,
                plan,
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
              })
            }
            style={styles.payButton}
          >
            Proceed to Pay
          </Button>
        </ScrollView>

        <Modal visible={couponModalVisible} animationType="slide">
          <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
            <Searchbar
              placeholder="Search Coupons"
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={{ marginBottom: 12, marginTop: 50 }}
            />
            <ScrollView>
              {filteredCoupons.map((offer, index) => (
                <Card key={index} style={styles.offerCard}>
                  <Card.Title
                    title={`${offer.couponName} ${offer.couponCode}`}
                    left={(props) => (
                      <Avatar.Image
                        {...props}
                        source={Icons[offer.type] || require('../../../../assets/icons/coupon.png')}
                      />
                    )}
                    right={() => (
                      <Button
                        mode={selectedCoupon2 === offer.couponCode ? 'outlined' : 'contained'}
                        style={[styles.applyButton, selectedCoupon2 === offer.couponCode && styles.appliedButton]}
                        onPress={() => handleApplyCoupon2(offer.couponCode, offer.id,offer.description)}
                      >
                        {selectedCoupon2 === offer.couponCode ? 'Applied' : 'Apply'}
                      </Button>
                    )}
                  />
                </Card>
              ))}
            </ScrollView>
            <Button onPress={() => setCouponModalVisible(false)} style={{ marginTop: 10 }}>Close</Button>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
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
    color: '#5E2EFF',
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
    color: '#5E2EFF',
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
    
    paddingHorizontal: 5,
    marginRight:5
  },
  appliedButton: {
    borderWidth: 1,
    borderColor: '#5E2EFF',
    backgroundColor: '#fff',
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
  payButton: {
    backgroundColor: '#FF6F00',
    height: 50,
    justifyContent: 'center',
    borderRadius: 8,
    marginBottom: 16,
  },
});