import CommonHeader2 from '../../components/CommoHedder2';
import { styles2 } from '../../components/Css';
import { getRecords } from '../../Services/ApiServices';
import { useContext, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Searchbar } from 'react-native-paper';

import { AuthContext } from '../../context/AuthContext';

export default function CouponList({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const { userData, userToken } = useContext(AuthContext);
  const [services, setServices] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   
   const getServices = async (display) => {
    setIsLoading(true);
      try {
        const response = await getRecords({'displayOnScreen':display}, userToken, 'api/customer/service/allService');
        if (response?.status === 'success') {
          console.log("response data",response.data);
          setServices(response.data);
        }
      } catch (error) {
        console.error('Services fetch error', error);
      }finally {
       setIsLoading(false);
      }
    };

//   const allServices = [
//     { icon: "recharge", label: "Mobile Recharge", screen: 'ContactList', params: { service: 'prepaid' } },
//     { icon: "bill", label: "Postpaid Bill", screen: 'ContactList', params: { service: 'postpaid' } },
//     { icon: "dth", label: "DTH / Cable TV", screen: 'ContactList', params: { service: 'dth' } },
//     { icon: "electricity-bill", label: "Electricity", screen: 'billerList', params: { service: 'electricity' } },
//     { icon: "fasttag", label: "Fasttag", screen: null },
//     { icon: "landline", label: "Broadband / Landline", screen: null },
//     { icon: "gas-cylinder", label: "Gas cylinder", screen: null },
//     { icon: "credit-card", label: "Credit card", screen: null },
//   ];

  const filteredServices = services.filter(service =>
    service.serviceName.toLowerCase().includes(searchText.toLowerCase())
  );

    const handlePress = (serviceName,serviceId) => {
    if (serviceName === "Mobile Recharge") {
      navigation.navigate('ContactList', { service: 'prepaid',serviceId});
    } else if (serviceName === "DTH / Cable TV") {
      navigation.navigate('DthOperatorList',{ service: 'prepaid',serviceId});
    } else {
      navigation.navigate('ViewBill',{ service: 'postpaid',serviceId});
    }
  };

    useEffect(() => {
      getServices('');
    }, []);

  return (
    <>
      <CommonHeader2 heading="More Services" />
      <ScrollView style={[styles2.container, { padding: 16 }]}>
        {/* 🔍 Paper Searchbar */}
        <Searchbar
          placeholder="Search Services"
          onChangeText={setSearchText}
          value={searchText}
          style={styles.searchbar}
          inputStyle={{ fontSize: 14 }}
          iconColor="#666"
        />

        {/* 🔳 4 Items in One Row */}
        <View style={styles.gridContainer}>
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 10 }}>
            <ActivityIndicator size="large" color="#5E2EFF" />
        </View>
      ) : (
        filteredServices.map((item, index) => (
          <Pressable
            key={index}
            style={styles.serviceCard}
            onPress={() => handlePress(item.serviceName,item.id)}
          >
            <Image source={{ uri: item.icon }} style={styles.serviceIcon} />
            <Text style={styles.serviceText}>{item.serviceName}</Text>
          </Pressable>
        ))
      )}
    </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  searchbar: {
    marginBottom: 16,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '23%',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  serviceIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
