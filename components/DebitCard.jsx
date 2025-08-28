import React from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function DebitCard({
  cardNumber = "****  ****  ****  1234",
  holderName = "JOHN DOE",
  expiryDate = "12/28",
  balance = "12,500.50",
  cardType = "VISA",
  onCardPress = () => {},
  gradientColors = ['#667eea', '#764ba2'],
  showBalance = true
}) {
  const formatCardNumber = (number) => {
    // Remove all non-digit characters and add spaces every 4 digits
    return number.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
  };

  const getCardIcon = () => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'cc-visa';
      case 'mastercard':
        return 'cc-mastercard';
      case 'amex':
        return 'cc-amex';
      default:
        return 'credit-card';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={onCardPress}
      activeOpacity={0.95}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <ThemedText style={styles.cardTitle}>vasbzaar</ThemedText>
          <FontAwesome 
            name={getCardIcon()} 
            size={32} 
            color="#ffffff" 
            style={styles.cardTypeIcon}
          />
        </View>

        {/* Balance Section */}
        {showBalance && (
          <View style={styles.balanceSection}>
            <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
            <ThemedText style={styles.balanceAmount}>₹{balance}</ThemedText>
          </View>
        )}

        {/* Card Number */}
        <View style={styles.cardNumberSection}>
          <ThemedText style={styles.cardNumber}>
            {formatCardNumber(cardNumber)}
          </ThemedText>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.cardHolderSection}>
            <ThemedText style={styles.cardLabel}>CARD HOLDER</ThemedText>
            <ThemedText style={styles.cardHolderName}>{holderName}</ThemedText>
          </View>
          
          <View style={styles.expirySection}>
            <ThemedText style={styles.cardLabel}>EXPIRES</ThemedText>
            <ThemedText style={styles.expiryDate}>{expiryDate}</ThemedText>
          </View>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        {/* Chip */}
        <View style={styles.chipContainer}>
          <View style={styles.chip} />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 8,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      }
    }),
  },
  card: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardTypeIcon: {
    opacity: 0.9,
  },
  balanceSection: {
    marginBottom: 20,
  },
  balanceLabel: {
    color: '#ffffff',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 4,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
  },
  cardNumberSection: {
    marginBottom: 20,
  },
  cardNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardHolderSection: {
    flex: 1,
  },
  expirySection: {
    alignItems: 'flex-end',
  },
  cardLabel: {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  cardHolderName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  expiryDate: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -40,
    right: -40,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: -20,
  },
  chipContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
  },
  chip: {
    width: 35,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFA500',
  },
});