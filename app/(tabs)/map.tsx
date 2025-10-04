import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

import { ThemedView } from '@/components/themed-view';

export default function TabTwoScreen() {
  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 49.2827, // Vancouver latitude
          longitude: -123.1207, // Vancouver longitude
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
