import CommonHeader2 from '@/src/components/CommoHedder2';
import { AuthContext } from '../../../context/AuthContext';
import { getRecords } from '@/src/Services/ApiServices';
import React, { useContext, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { IconButton } from 'react-native-paper';
// import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DthOperatorList({ route,navigation }) {
    const [search, setSearch] = useState('');
    const authContext = useContext(AuthContext);
    const { userData, userToken } = authContext;
    const serviceId = route.params?.serviceId || 'NA';
    const [name, setName] = useState("No Name");
    const [operatorList, setOperatorList] = useState([]);
    const [operatorId, setOperatorId] = useState(null);
    const [companyLogo, setCompanyLogo] = useState(null);
    const [jsonData, setJsonData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const getOperatorList = async (serviceId) => {
            setIsLoading(true);
            try {
            const response = await getRecords({ serviceId }, userToken, 'api/customer/operator/getByServiceId');
            if (response?.status === 'success') {
                setOperatorList(response.data);
            }
            } catch (error) {
                console.error('Services fetch error', error);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
    };

    useEffect(() => {
        const init = async () => {
          await getOperatorList(serviceId);
        };
        init();
      }, []);  

    const filteredBillers = operatorList.filter((biller) =>
        biller.operatorName.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <CommonHeader2
        heading="Select DTH Provider"
        showLogo={true}
        bharat_connect="bharat_connect"
        whiteHeader={true}
        whiteText={false}
      />

      <ScrollView style={styles.container}>
        <View style={styles.searchBar}>
          <IconButton icon="magnify" style={styles.searchIcon} />
          <TextInput
            placeholder="Search by biller"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billers</Text>
          {filteredBillers.length > 0 ? (
            filteredBillers.map((biller, index) => (
              <Pressable
                key={index}
                style={styles.billerItem}
                onPress={() => navigation.navigate('DthRecharge', { biller,serviceId})}
              >
                <Image source={{ uri: biller.logo }} style={styles.logo} />

                
                <Text style={styles.billerText}>{biller.operatorName}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={{ textAlign: 'center', paddingVertical: 10, color: '#999' }}>
              No billers found.
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
    searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize:14
  },
  searchIcon: {
    marginLeft: 0,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgb(245 245 245)',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  section: {
    marginBottom: 10,
    backgroundColor:'#FFF',
    borderRadius:10,
    padding:20,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 10,
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  logo: {
    width: 36,
    height: 36,
    resizeMode: 'contain',
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
  },
  subText: {
    color: '#555',
    fontSize: 13,
  },
  billerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
  },
  billerText: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  }
});
