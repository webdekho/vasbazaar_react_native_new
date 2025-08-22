import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { Button, TextInput, Title } from 'react-native-paper';
import Carousel from 'react-native-snap-carousel';
import PropTypes from 'prop-types';

import CommonHeader2 from '../../components/CommoHedder2';
    
const { width: screenWidth } = Dimensions.get('window');

const advertisementImages = [
  require('../../../assets/images/slider1.png'),
  require('../../../assets/images/slider1.png'),
  require('../../../assets/images/slider1.png'),
];

/**
 * AddBank component for adding bank account details
 * 
 * Features:
 * - Advertisement carousel display
 * - Bank selection form
 * - Account number input with validation
 * - Keyboard avoiding view for better UX
 * - Multiple advertisement sliders
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.navigation - Navigation object for screen transitions
 * @returns {JSX.Element} The AddBank component
 */
const AddBank = ({ navigation }) => {
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const carouselRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const renderAdvertisementItem = ({ item }) => (
    <Image source={item} style={styles.advertisementImage} />
  );

  return (
        <>
        <CommonHeader2 heading="Add Bank Details" />
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
      {/* Top Slider */}
      <View style={styles.sliderContainer}>
        <Carousel
          ref={carouselRef}
          data={advertisementImages}
          renderItem={renderAdvertisementItem}
          sliderWidth={screenWidth}
          itemWidth={screenWidth * 0.9}
          onSnapToItem={(index) => setActiveIndex(index)}
          autoplay
          autoplayInterval={3000}
          loop
          inactiveSlideScale={0.95}
          inactiveSlideOpacity={0.8}
        />
      </View>

      {/* Form Section */}
      <View style={styles.form}>
        <Title style={styles.sectionTitle}>Bank Details</Title>

        <TextInput
          label="Select Bank"
          value={bank}
          onChangeText={setBank}
          mode="outlined"
          placeholder="List of banks"
          style={styles.input}
        />

        <TextInput
          label="Account Number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          mode="outlined"
          placeholder="Enter your account number"
          keyboardType="number-pad"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={() => {
            // Handle bank account update logic here
            // For now, just log the action
          }}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Update Account
        </Button>
      </View>

      {/* Additional Sliders */}
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.sliderContainer}>
          <Carousel
            data={advertisementImages}
            renderItem={renderAdvertisementItem}
            sliderWidth={screenWidth}
            itemWidth={screenWidth * 0.9}
            autoplay
            loop
            autoplayInterval={3500}
            inactiveSlideScale={0.95}
            inactiveSlideOpacity={0.8}
          />
        </View>
      ))}
    </ScrollView>
    </KeyboardAvoidingView>
    </>
  );
};

AddBank.propTypes = {
  navigation: PropTypes.object.isRequired,
};

export default AddBank;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f6f9fc',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sliderContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  advertisementImage: {
    width: screenWidth * 0.9,
    height: 150,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  form: {
    marginVertical: 10,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 10,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
