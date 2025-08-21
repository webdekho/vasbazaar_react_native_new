// DthPlanScreen.js
import { AntDesign } from '@expo/vector-icons';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Avatar, Card, Searchbar } from 'react-native-paper';

import CommonHeader2 from '@/src/components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords, postRequest } from '@/src/Services/ApiServices';

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

  return (
    <View style={styles.container}>
      <CommonHeader2 heading="DTH Plans" />

      {/* User Info Card */}
      <Card style={styles.viCard} onPress={() => setOperatorModalVisible(true)}>
        <Card.Title
          title={`${name} • ${mobile}`}
          subtitle={`${operator}`}
          left={(props) => (
            <Avatar.Image
              {...props}
              source={logo ? { uri: logo } : require('@/assets/icons/default.png')}
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
    !['rmn'].includes(key) // Hide rmn key using array
  )
  .map(([key, value]) => (
    <View key={key} style={styles.infoRow}>
      <Text style={styles.infoKey}>{keyLabels[key] || key} : </Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  ))}

</Card.Content>
      </Card>

      {/* Search */}
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

      {/* Category Scroll */}
      <View style={{ height: 40, marginHorizontal: 16, marginBottom: 16 }}>
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

      {/* Plan Cards */}
      <ScrollView style={styles.plansContainer}>
        {filteredPlans.length > 0 ? (
          filteredPlans.map(plan => (
            <View key={plan.id} style={styles.planCard}>
              <Text style={styles.planName}>{plan.planName}</Text>
              <Text style={styles.planInfo}>{plan.channels} | {plan.paidChannels} | {plan.hdChannels}</Text>
              <Text style={styles.planUpdate}>Last Updated: {plan.lastUpdate}</Text>

              {plan.pricing.map((priceObj, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.planPriceButton}
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
                  <Text style={styles.planPriceText}>{priceObj.Amount} • {priceObj.Month}</Text>
                  <AntDesign name="arrowright" size={16} color="#8400E5" />
                </TouchableOpacity>
              ))}
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

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          Disclaimer: Double check your plan before proceeding with the recharge.
        </Text>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  viCard: { backgroundColor: '#fff', borderRadius: 8, margin: 16 },
  logo: { width: 45, height: 45, backgroundColor: '#f6f6f6' },
  changeText: { color: '#5E2EFF', fontWeight: '600', fontSize: 14, marginRight: 16 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#fff', margin: 0, marginBottom: 10, padding: 10, borderRadius: 8 },
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
    backgroundColor: '',
  },
  activeCategoryButton: { backgroundColor: '#000000ff' },
  categoryText: { fontSize: 13 },
  activeCategoryText: { color: '#fff' },
  plansContainer: { paddingHorizontal: 16 },
  planCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12 },
  planName: { fontWeight: 'bold', fontSize: 16, marginBottom: 6 },
  planInfo: { fontSize: 13, color: '#666' },
  planUpdate: { fontSize: 12, color: '#999', marginBottom: 10 },
  planPriceButton: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  planPriceText: { color: '#8400E5', fontWeight: '600' },
  disclaimerContainer: { padding: 16, backgroundColor: '#FFF9E6', position: 'absolute', bottom: 0, width: '100%' },
  disclaimerText: { fontSize: 12, textAlign: 'center' },
  infoRow: { flexDirection: 'row', paddingVertical: 4 },
  infoKey: { fontWeight: '600', color: '#444' },
  infoValue: { textAlign: 'left', color: '#222',fontWeight: '600',color: '#8400E5' },
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