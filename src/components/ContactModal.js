import React from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PropTypes from 'prop-types';

/**
 * Contact confirmation modal component that displays success message
 * after user submits a contact form or inquiry.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {boolean} props.visible - Whether the modal is visible
 * @param {Function} props.onClose - Callback function called when modal is closed
 * @param {string} [props.bookingNumber] - Booking number for reference (currently unused)
 * @returns {React.ReactElement} The rendered ModalContact component
 * 
 * @example
 * // Basic contact modal
 * <ModalContact 
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 * />
 * 
 * @example
 * // Contact modal with booking reference
 * <ModalContact 
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   bookingNumber="BK123456"
 * />
 */
const ModalContact = ({ visible, onClose, bookingNumber }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Image
            source={require('../../assets/images/check.png')} 
            style={styles.image}
            onError={() => {
              // Handle image loading error silently
            }}
          />
          <Text style={styles.title}>Sent</Text>
          <Text style={styles.message}>
            Thank you for contacting, we will contact very soon
          </Text>
          {/* <Text style={styles.bookingNo}>Booking No: {bookingNumber}</Text> */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// PropTypes validation
ModalContact.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bookingNumber: PropTypes.string,
};

ModalContact.defaultProps = {
  bookingNumber: null,
};

export default ModalContact;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    padding: 25,
    borderRadius: 20,
    alignItems: 'center'
  },
  image: {
    width: 80,
    height: 80,
    marginBottom: 15,
    resizeMode: 'contain'
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 10
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15
  },
  bookingNo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20
  },
  button: {
    backgroundColor: 'green',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 16
  }
});
