import { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function BillViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isDownloading, setIsDownloading] = useState(false);

  const billData = {
    billerName: params.billerName || 'Utility Provider',
    accountNumber: params.accountNumber || '',
    customerName: params.customerName || 'John Doe',
    billNumber: params.billNumber || 'BILL2024001234',
    billDate: params.billDate || '2024-01-01',
    dueDate: params.dueDate || '2024-01-25',
    amount: parseFloat(params.amount) || 0,
    status: params.status || 'unpaid',
    address: params.address || '123 Main Street, City - 400001',
    units: params.units || '245 kWh',
    previousReading: params.previousReading || '12500',
    currentReading: params.currentReading || '12745',
    tariff: params.tariff || '₹5.12 per unit',
    lateFee: parseFloat(params.lateFee) || 0
  };

  const handlePayBill = () => {
    router.push({
      pathname: '/main/common/PaymentScreen',
      params: {
        type: 'bill',
        billerId: params.billerId,
        billerName: billData.billerName,
        accountNumber: billData.accountNumber,
        amount: billData.amount.toString(),
        customerName: billData.customerName,
        billNumber: billData.billNumber,
        dueDate: billData.dueDate
      }
    });
  };

  const handleShareBill = async () => {
    try {
      await Share.share({
        message: `Bill Details - ${billData.billerName}\nAccount: ${billData.accountNumber}\nAmount: ₹${billData.amount}\nDue Date: ${billData.dueDate}`,
        title: 'Bill Details'
      });
    } catch (error) {
      console.log('Error sharing bill:', error);
    }
  };

  const handleDownloadBill = () => {
    setIsDownloading(true);
    // Simulate download
    setTimeout(() => {
      setIsDownloading(false);
      // Show success message or handle download
    }, 2000);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#4CAF50';
      case 'overdue': return '#FF5722';
      case 'pending': return '#FF9800';
      default: return '#FF5722';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'check-circle';
      case 'overdue': return 'exclamation-triangle';
      case 'pending': return 'clock-o';
      default: return 'exclamation-circle';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>Bill Details</ThemedText>
        <TouchableOpacity onPress={handleShareBill}>
          <FontAwesome name="share-alt" size={20} color="#000000" />
        </TouchableOpacity>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Bill Header */}
        <ThemedView style={styles.billHeader}>
          <ThemedView style={styles.billerInfo}>
            <ThemedText style={styles.billerName}>{billData.billerName}</ThemedText>
            <ThemedText style={styles.billNumber}>Bill #{billData.billNumber}</ThemedText>
          </ThemedView>
          <ThemedView style={[styles.statusBadge, { backgroundColor: getStatusColor(billData.status) }]}>
            <FontAwesome name={getStatusIcon(billData.status)} size={14} color="white" />
            <ThemedText style={styles.statusText}>{billData.status.toUpperCase()}</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* Amount Section */}
        <ThemedView style={styles.amountSection}>
          <ThemedText style={styles.amountLabel}>Total Amount</ThemedText>
          <ThemedText style={styles.amountValue}>₹{billData.amount}</ThemedText>
          {billData.lateFee > 0 && (
            <ThemedText style={styles.lateFeeText}>Includes late fee: ₹{billData.lateFee}</ThemedText>
          )}
          <ThemedText style={styles.dueDateText}>Due Date: {billData.dueDate}</ThemedText>
        </ThemedView>

        {/* Customer Details */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Customer Details</ThemedText>
          <ThemedView style={styles.detailsContainer}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Name:</ThemedText>
              <ThemedText style={styles.detailValue}>{billData.customerName}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Account Number:</ThemedText>
              <ThemedText style={styles.detailValue}>{billData.accountNumber}</ThemedText>
            </ThemedView>
            {billData.address && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Address:</ThemedText>
                <ThemedText style={[styles.detailValue, { flex: 2 }]}>{billData.address}</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>

        {/* Bill Details */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Bill Details</ThemedText>
          <ThemedView style={styles.detailsContainer}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Bill Date:</ThemedText>
              <ThemedText style={styles.detailValue}>{billData.billDate}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Due Date:</ThemedText>
              <ThemedText style={styles.detailValue}>{billData.dueDate}</ThemedText>
            </ThemedView>
            {billData.units && (
              <>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Previous Reading:</ThemedText>
                  <ThemedText style={styles.detailValue}>{billData.previousReading}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Current Reading:</ThemedText>
                  <ThemedText style={styles.detailValue}>{billData.currentReading}</ThemedText>
                </ThemedView>
                <ThemedView style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Units Consumed:</ThemedText>
                  <ThemedText style={styles.detailValue}>{billData.units}</ThemedText>
                </ThemedView>
                {billData.tariff && (
                  <ThemedView style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Rate per Unit:</ThemedText>
                    <ThemedText style={styles.detailValue}>{billData.tariff}</ThemedText>
                  </ThemedView>
                )}
              </>
            )}
          </ThemedView>
        </ThemedView>

        {/* Amount Breakdown */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Amount Breakdown</ThemedText>
          <ThemedView style={styles.detailsContainer}>
            <ThemedView style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Base Amount:</ThemedText>
              <ThemedText style={styles.detailValue}>₹{(billData.amount - billData.lateFee).toFixed(2)}</ThemedText>
            </ThemedView>
            {billData.lateFee > 0 && (
              <ThemedView style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Late Fee:</ThemedText>
                <ThemedText style={[styles.detailValue, { color: '#FF5722' }]}>₹{billData.lateFee}</ThemedText>
              </ThemedView>
            )}
            <ThemedView style={[styles.detailRow, styles.totalRow]}>
              <ThemedText style={styles.totalLabel}>Total Amount:</ThemedText>
              <ThemedText style={styles.totalValue}>₹{billData.amount}</ThemedText>
            </ThemedView>
          </ThemedView>
        </ThemedView>

        {/* Action Buttons */}
        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.downloadButton} 
            onPress={handleDownloadBill}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <FontAwesome name="spinner" size={16} color="#000000" />
            ) : (
              <FontAwesome name="download" size={16} color="#000000" />
            )}
            <ThemedText style={styles.downloadButtonText}>
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareBill}>
            <FontAwesome name="share" size={16} color="#000000" />
            <ThemedText style={styles.shareButtonText}>Share Bill</ThemedText>
          </TouchableOpacity>
        </ThemedView>

        {/* Payment History (if bill is paid) */}
        {billData.status === 'paid' && (
          <ThemedView style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Payment History</ThemedText>
            <ThemedView style={styles.paymentHistoryItem}>
              <FontAwesome name="check-circle" size={16} color="#4CAF50" />
              <ThemedView style={styles.paymentHistoryDetails}>
                <ThemedText style={styles.paymentHistoryText}>Payment Successful</ThemedText>
                <ThemedText style={styles.paymentHistoryDate}>Paid on: 2024-01-20</ThemedText>
                <ThemedText style={styles.paymentHistoryAmount}>₹{billData.amount}</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {/* Important Notes */}
        <ThemedView style={styles.notesSection}>
          <ThemedText style={styles.notesTitle}>Important Notes</ThemedText>
          <ThemedView style={styles.noteItem}>
            <FontAwesome name="info-circle" size={14} color="#000000" />
            <ThemedText style={styles.noteText}>
              Payment may take up to 24 hours to reflect in your account
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.noteItem}>
            <FontAwesome name="info-circle" size={14} color="#000000" />
            <ThemedText style={styles.noteText}>
              Keep this bill for your records and future reference
            </ThemedText>
          </ThemedView>
          <ThemedView style={styles.noteItem}>
            <FontAwesome name="info-circle" size={14} color="#000000" />
            <ThemedText style={styles.noteText}>
              Contact customer care for any billing disputes
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Pay Now Button */}
      {billData.status !== 'paid' && (
        <ThemedView style={styles.footer}>
          <TouchableOpacity style={styles.payButton} onPress={handlePayBill}>
            <ThemedText style={styles.payButtonText}>Pay Now ₹{billData.amount}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 20,
  },
  billerInfo: {
    flex: 1,
  },
  billerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  billNumber: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  amountSection: {
    alignItems: 'center',
    padding: 25,
    backgroundColor: '#e8f4f8',
    borderRadius: 12,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  lateFeeText: {
    fontSize: 12,
    color: '#FF5722',
    marginBottom: 4,
  },
  dueDateText: {
    fontSize: 14,
    opacity: 0.8,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  detailsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#000000',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  downloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
    gap: 8,
  },
  shareButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f9f0',
    borderRadius: 8,
    gap: 12,
  },
  paymentHistoryDetails: {
    flex: 1,
  },
  paymentHistoryText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  paymentHistoryDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  paymentHistoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  notesSection: {
    backgroundColor: '#fff9e6',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  noteText: {
    fontSize: 12,
    opacity: 0.8,
    flex: 1,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});