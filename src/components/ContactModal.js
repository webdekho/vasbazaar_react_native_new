import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
