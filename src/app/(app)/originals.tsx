import { StyleSheet, View } from 'react-native';

import { VideoList } from '@/components/VideoList';
import { colors } from '@/constants/theme';

export default function OriginalsScreen() {
  return (
    <View style={styles.container}>
      <VideoList mode="originals" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
