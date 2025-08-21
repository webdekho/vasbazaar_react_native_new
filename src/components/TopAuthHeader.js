import { styles } from './styles';
import { Image, View } from 'react-native';


export default function TopAuthHeader({headerText, headerTitle}) {
    return (
        <View style={styles.background}>
          {/* <Text style={styles.headerText}>
            {headerText}
          </Text> */}
          {/* <Text style={styles.headerTitle}>{headerTitle}</Text> */}
          <Image
            source={require('../../assets/vas.jpg')}
            style={styles.headerImage}
          />
        </View>
    );
}