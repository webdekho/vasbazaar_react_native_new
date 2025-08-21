import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const TimeSlots = ({ slots, setSelectedSlotId, selectedSlotId }) => {
  const [morningSlots, setMorningSlots] = useState([]);
  const [eveningSlots, setEveningSlots] = useState([]);
  // const [selectedSlotId, setSelectedSlotId] = useState(null);

  useEffect(() => {
    const categorizeSlots = () => {
      const morning = [];
      const evening = [];

      
      slots.forEach((slot) => {
        const time = slot.slot.toLowerCase();
        const [hour, minute = 0] = time
          .replace(/[^\d:]/g, "")
          .split(":")
          .map(Number);
        const isPM = time.includes("pm");

        const hourIn24Format = isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour;

        if (hourIn24Format >= 17) {
          evening.push(slot);
        } else {
          morning.push(slot);
        }
      });

      setMorningSlots(morning);
      setEveningSlots(evening);
    };

    categorizeSlots();
  }, [slots]);

  return (
     <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Morning</Text>
        <View style={styles.slotContainer}>
          {morningSlots.length > 0 ? (
            morningSlots.map((slot) => {
              const isSelected = slot.slot_id === selectedSlotId;
              const isBooked = slot.status !== "Available";

              return (
                <TouchableOpacity
                  key={slot.slot_id}
                  style={[
                    styles.timeSlot,
                    isBooked && { backgroundColor: "#ccc" },
                    !isBooked && isSelected && styles.selectedSlot,
                  ]}
                  onPress={() => setSelectedSlotId(slot.slot_id)}
                  disabled={isBooked}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isBooked && { color: "#666" },
                      !isBooked && isSelected && styles.selectedTimeText,
                    ]}
                  >
                    {slot.slot}{"\n"}({slot.status})
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={{ color: "gray" }}>No availability found.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Evening</Text>
        <View style={styles.slotContainer}>
          {eveningSlots.length > 0 ? (
            eveningSlots.map((slot) => {
              const isSelected = slot.slot_id === selectedSlotId;
              const isBooked = slot.status !== "Available";

              return (
                <TouchableOpacity
                  key={slot.slot_id}
                  style={[
                    styles.timeSlot,
                    isBooked && { backgroundColor: "#ccc" },
                    !isBooked && isSelected && styles.selectedSlot,
                  ]}
                  onPress={() => setSelectedSlotId(slot.slot_id)}
                  disabled={isBooked}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isBooked && { color: "#666" },
                      !isBooked && isSelected && styles.selectedTimeText,
                    ]}
                  >
                    {slot.slot}{"\n"}({slot.status})
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={{ color: "gray" }}>No availability found.</Text>
          )}
        </View>
      </View>
    </>
  );
};

export default TimeSlots;

// Paste your CSS styles here
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    slotContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    timeSlot: {
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    selectedSlot: {
        backgroundColor: '#0f60bd',
    },
    timeText: {
        fontSize: 14,
        color: '#333',
    },
    selectedTimeText: {
        color: 'white',
        fontWeight: '500',
    },
});
