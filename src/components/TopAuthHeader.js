import { StyleSheet, Image, View, Text } from 'react-native';

export default function TopAuthHeader({headerText, headerTitle}) {
    return (
        <View style={styles.background}>
          <Text style={styles.headerText}>VasBazaar</Text>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#0f60bd',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 16,
    color: '#ffffff',
  },
});
