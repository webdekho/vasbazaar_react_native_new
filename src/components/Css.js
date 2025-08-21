import { StyleSheet } from "react-native";

export const styles2 = StyleSheet.create({

        btn: {
        backgroundColor: '#0f60bd', // Green button
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        elevation: 3, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    btnText: {
        color: '#fff', // White text
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
   section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    width:'100%',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginTop:10
  },
  container: {
    padding: 10,
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  subTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 16,
  },
  // top box css
  topBox: {
    backgroundColor: '#0f60bd',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20
  },
  title1: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  subtitle1: {
    fontSize: 13,
    color: '#e0f0ff',
    textAlign: 'center',
    marginVertical: 8,
  },
  bookButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  bookButton: {
    flex: 1,
    padding: 6,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
   button: {
    width: '100%',
    height: 45,
    backgroundColor: '#FFCC29',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 1
  },
  buttonText: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  input: {
    width: '100%',
    height: 45,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 0,
  }
})



export const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'white',
    marginTop: 10,
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    paddingHorizontal: 5,
  },
  imageBackground: {
    width: '100%',
    // height: 300,
    alignItems: 'center',
    marginTop: 10,
    // backgroundColor: '#2E456E',
  },
  overlay: {
    backgroundColor: '#0f60bd',
    width: '100%',
    height: 180,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  hospitalName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 5,
  },
  icon: {
    marginRight: 6,
  },
  phoneNumber: {
    color: 'blue',
    fontSize: 16,
  },
  carouselImage: {
    width: '94%',
    height: 170,
    borderRadius: 10,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#a6a3a3'
  },
  shadowBox: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  accreditationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    color: '#0f60bd',
    paddingVertical: 8,
    paddingHorizontal: 40,
    borderRadius: 6,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#a6a3a3'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 0,
    marginHorizontal:15,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 15,
    color: '#000000ff',
    fontWeight: '600',
  },
  subheading: {
    color: 'black',
    marginTop: 4,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#00BFFF',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  specialty: {
    color: '#0f60bd',
    marginTop: 2,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    marginLeft: 4,
    color: '#333',
  },
  experience: {
    marginLeft: 4,
    color: '#666',
  },
  calendarIcon: {
    backgroundColor: '#E6F0FF',
    padding: 8,
    borderRadius: 8,
  },
  bookButton: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'center',
    width: '80%',
  },
  callText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#fff',
  },
  quickBox: {
    marginBottom: 50
  },
  quickTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
 quickContainer: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "flex-start",  // 👈 Left-align items
  paddingLeft: 10,               // 👈 Space from the left edge
  paddingRight: 10,              // 👈 Space from the right edge
  paddingTop: 10,
  rowGap: 0,                    // For vertical spacing between rows (RN 0.72+)
  columnGap: 10,
  marginRight:-18,                // For horizontal spacing between items (RN 0.72+)
},

  SuggestionItem: {
  width: 100, // fixed width
  height: 100, // maintain aspect ratio manually
  margin: 10,
  marginRight: 10,   // space between horizontal items
  marginBottom: 10,  // space between rows
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#f6f8fb",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 50, // circular shape
  elevation: 2,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
  quickItem: {
    width: "30%", // Three items per row
    aspectRatio: 1, // Ensures the item is square
    marginVertical: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f6f8fb",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    elevation: 2, // Shadow for Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3, // Shadow for iOS
  },
  SuggestionText: {
    fontSize: 12,
    textAlign: "center",
    fontWeight: "600",
    color: '#374151',
    marginTop: 4,
  },
  quickIcon: {
    fontSize: 24,
    marginBottom: 5,
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  quickText: {
    fontSize: 14,
    textAlign: "center",
    fontWeight: "bold",
  },
  topSection: {
    backgroundColor: '#0f60bd',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginTop: 10
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#cde3ff',
    textAlign: 'center',
  },
  facilitiesSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#000',
  },
  facilityBox: {
    flexDirection: 'row',
    backgroundColor: '#f6f8fb',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  icon1: {
    marginRight: 15,
  },
  facilityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  facilitySubtitle: {
    fontSize: 13,
    color: '#666',
  },
});

