import CommonHeader2 from '../../components/CommoHedder2';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Divider, List, Switch, Text } from 'react-native-paper';
    
const initialAutoPays = [
  {
    id: 1,
    service: 'Electricity Bill',
    frequency: 'Monthly',
    amount: '₹1,200',
    consumerNumber: 'CN: 2458123498',
    active: true,
    icon: 'flash',
  },
  {
    id: 2,
    service: 'Mobile Recharge',
    frequency: 'Every 28 Days',
    amount: '₹399',
    consumerNumber: 'Mobile: +91 9876543210',
    active: false,
    icon: 'cellphone',
  },
  {
    id: 3,
    service: 'DTH Recharge',
    frequency: 'Monthly',
    amount: '₹550',
    consumerNumber: 'CN: 7788990011',
    active: true,
    icon: 'satellite-variant',
  },
  {
    id: 4,
    service: 'Water Bill',
    frequency: 'Monthly',
    amount: '₹300',
    consumerNumber: 'CN: 1234567890',
    active: true,
    icon: 'water-pump',
  },
  {
    id: 5,
    service: 'Broadband',
    frequency: 'Monthly',
    amount: '₹799',
    consumerNumber: 'Account: 0011223344',
    active: false,
    icon: 'wifi',
  },
];

export default function AutoPay() {
  const [autoPays, setAutoPays] = useState(initialAutoPays);

  const toggleAutoPay = (id) => {
    const updated = autoPays.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    setAutoPays(updated);
  };

  return (
    <>
        
        <CommonHeader2 heading="Auto Pay" />
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AutoPay Services</Text>

      {autoPays.map((item) => (
        <View key={item.id}>
          <List.Item
            title={item.service}
            description={`${item.frequency} • ${item.amount}\n${item.consumerNumber}`}
            left={() => (
              <Avatar.Icon
                icon={item.icon}
                size={40}
                style={{ backgroundColor: '#e3f2fd' }}
                color="#0d47a1"
              />
            )}
            right={() => (
              <Switch
                value={item.active}
                onValueChange={() => toggleAutoPay(item.id)}
              />
            )}
            descriptionNumberOfLines={3}
          />
          <Divider />
        </View>
      ))}
    </ScrollView>
    </>
  );
}

AutoPay.propTypes = {};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f8',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#263238',
  },
});
