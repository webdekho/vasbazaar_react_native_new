import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import PropTypes from 'prop-types';

const { width } = Dimensions.get('window');

/**
 * Processing component for displaying recharge processing status
 * 
 * Features:
 * - Advertisement display area
 * - Plan details visualization
 * - Transaction status indicator
 * - Step-by-step process display
 * - Navigation to success screen
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.navigation - Navigation object for screen transitions
 * @returns {JSX.Element} The Processing component
 */
export default function Processing({ navigation }) {
  return (
    <View style={styles.container}>
      

      {/* Advertisement Section */}
      <View style={styles.advertisementContainer}>
        <Text style={styles.advertisementText}>Advertisement</Text>
      </View>

      {/* Plan Details */}
      <View style={styles.planContainer}>
        <View style={styles.planHeader}>
          <Image
            source={require('../../../../assets/icons/bill.png')} // Replace with your logo path
            style={styles.logo}
          />
          <Text style={styles.planTitle}>Vi prepaid - 9702142142</Text>
        </View>
        <View style={styles.planDetails}>
          <Text style={styles.planPrice}>₹365</Text>
          <View style={styles.planInfo}>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Data</Text>
              <Text style={styles.infoValue}>2 GB/day</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Validity</Text>
              <Text style={styles.infoValue}>28 days</Text>
            </View>
            <View style={styles.infoColumn}>
              <Text style={styles.infoLabel}>Calls</Text>
              <Text style={styles.infoValue}>Unlimited</Text>
            </View>
          </View>
          <Text style={styles.viewDetailsText}>View plan detail</Text>
        </View>
      </View>

      {/* Transaction Accepted */}
      <View style={styles.transactionContainer}>
        <Image
          
          source={require('../../../../assets/icons/bill.png')} // Replace with your success icon path
          style={styles.successIcon}
        />
        <View style={styles.stepCircle}>
          <Text style={styles.stepNumber}>2</Text>
        </View>
        <Text style={styles.transactionText}>Transaction accepted</Text>
      </View>


    <TouchableOpacity onPress={() => navigation.navigate('Success')} style={styles.payButton}>
                <Text style={styles.payButtonText}>Pay</Text>
              </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 20,
    color: '#000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  advertisementContainer: {
    backgroundColor: '#2E5B99',
    borderRadius: 8,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  advertisementText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  planContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  planDetails: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingTop: 16,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E456E',
    marginBottom: 8,
  },
  planInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoColumn: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  viewDetailsText: {
    color: '#007BFF',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  transactionContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  stepCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
});

Processing.propTypes = {
  navigation: PropTypes.object.isRequired,
};
