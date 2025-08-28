import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Image, 
  Dimensions, 
  TouchableOpacity 
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 40; // Account for padding

export default function ImageSlider({ 
  images = [], 
  autoPlay = true, 
  autoPlayInterval = 3000,
  showDots = true,
  onImagePress = () => {}
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  // Default images if none provided
  const defaultImages = [
    {
      id: 1,
      uri: 'https://via.placeholder.com/350x180/FF6B35/FFFFFF?text=VAS+Bazaar+Offers',
      title: 'Special Offers'
    },
    {
      id: 2,
      uri: 'https://via.placeholder.com/350x180/0066CC/FFFFFF?text=Mobile+Recharge',
      title: 'Mobile Recharge'
    },
    {
      id: 3,
      uri: 'https://via.placeholder.com/350x180/28A745/FFFFFF?text=Bill+Payments',
      title: 'Bill Payments'
    },
    {
      id: 4,
      uri: 'https://via.placeholder.com/350x180/FFC107/000000?text=DTH+Services',
      title: 'DTH Services'
    }
  ];

  const sliderImages = images.length > 0 ? images : defaultImages;

  // Auto play functionality
  useEffect(() => {
    if (autoPlay && sliderImages.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentIndex + 1) % sliderImages.length;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * SLIDER_WIDTH,
          animated: true
        });
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [currentIndex, autoPlay, autoPlayInterval, sliderImages.length]);

  const onScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentIndex(index);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    scrollViewRef.current?.scrollTo({
      x: index * SLIDER_WIDTH,
      animated: true
    });
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {sliderImages.map((image, index) => (
          <TouchableOpacity
            key={image.id || index}
            style={styles.slide}
            onPress={() => onImagePress(image, index)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: image.uri }}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots indicator */}
      {showDots && sliderImages.length > 1 && (
        <View style={styles.dotsContainer}>
          {sliderImages.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot
              ]}
              onPress={() => goToSlide(index)}
            />
          ))}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  scrollView: {
    width: SLIDER_WIDTH,
  },
  scrollContent: {
    alignItems: 'center',
  },
  slide: {
    width: SLIDER_WIDTH,
    height: 180,
    marginRight: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#FF6B35',
    width: 24,
    borderRadius: 4,
  },
  inactiveDot: {
    backgroundColor: '#D1D5DB',
  },
});