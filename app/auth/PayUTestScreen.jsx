import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, TextInput, Alert, Platform, Text } from 'react-native';

export default function PayUTestScreen() {
  const [amount, setAmount] = useState('100');
  const [productInfo, setProductInfo] = useState('Test Product');
  const [firstName, setFirstName] = useState('Test User');
  const [email, setEmail] = useState('test@example.com');
  const [phone, setPhone] = useState('9876543210');
  const [loading, setLoading] = useState(false);

  // Load PayU Bolt SDK
  useEffect(() => {
    if (Platform.OS === 'web' && !window.bolt) {
      const script = document.createElement('script');
      script.src = 'https://jssdk.payu.in/bolt/bolt.min.js'; // ✅ Sandbox SDK
      script.async = true;
      script.onload = () => console.log('✅ PayU Bolt SDK loaded');
      script.onerror = () => console.error('❌ Failed to load PayU Bolt SDK');
      document.body.appendChild(script);
    }
  }, []);

  const waitForBolt = () => new Promise((resolve) => {
    const interval = setInterval(() => {
      if (window.bolt) {
        clearInterval(interval);
        resolve(true);
      }
    }, 50);
    setTimeout(() => resolve(false), 5000);
  });

  const startPayUCheckout = async () => {
    setLoading(true);
    const boltReady = await waitForBolt();

    if (!boltReady) {
      Alert.alert('Error', 'PayU SDK not loaded');
      setLoading(false);
      return;
    }

    const txnid = 'TXN' + Date.now();

    // ✅ Get secure hash from backend
    const res = await fetch("http://localhost/PayU_Test/payment.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        txnid,
        amount,
        productinfo: productInfo,
        firstname: firstName,
        email,
      }).toString(),
    });
    const data = await res.json();

    if (data.status !== "success") {
      Alert.alert("Error", "Failed to generate hash");
      setLoading(false);
      return;
    }

    const paymentOptions = {
      key: data.key,
      txnid,
      amount,
      productinfo: productInfo,
      firstname: firstName,
      email,
      phone,
      hash: data.hash,
      surl: window.location.origin,
      furl: window.location.origin,
    };

    console.log("🚀 Launching PayU Bolt with:", paymentOptions);

    window.bolt.launch(paymentOptions, {
      responseHandler: (BOLT) => {
        console.log("📨 Payment Response:", BOLT);
        if (BOLT.response.txnStatus === "SUCCESS") {
          Alert.alert("✅ Payment Success", `Transaction ID: ${BOLT.response.txnid}`);
        } else {
          Alert.alert("❌ Payment Failed", BOLT.response.error_Message || "Something went wrong");
        }
      },
      catchException: (BOLT) => {
        console.error("❌ PayU Exception:", BOLT);
        Alert.alert("Error", BOLT.message || "Unexpected error during payment");
      },
    });

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="Amount" />
      <TextInput style={styles.input} value={productInfo} onChangeText={setProductInfo} placeholder="Product Info" />
      <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="Name" />
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone" />

      <TouchableOpacity style={styles.payButton} onPress={startPayUCheckout} disabled={loading}>
        <Text style={styles.payButtonText}>{loading ? "Processing..." : `Pay ₹${amount}`}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  payButton: { backgroundColor: '#000', padding: 16, borderRadius: 8, alignItems: 'center' },
  payButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
