import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Dimensions, StyleSheet, View, Text } from 'react-native';
import Animated, { Easing, Keyframe, runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '@/context/ThemeContext';

const DURATION = 2000;

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);
  const { theme } = useAppTheme();

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: { opacity: 1 },
    80: { opacity: 1 },
    100: { opacity: 0, easing: Easing.inOut(Easing.ease) },
  });

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#121212' : '#F9FAFB';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subTextColor = isDark ? '#9CA3AF' : '#6B7280';

  const content = (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: textColor }]}>Bite Bells</Text>
      <Text style={[styles.subtitle, { color: subTextColor }]}>Track every bite you chew</Text>
    </View>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          runOnJS(setVisible)(false);
        }
      })}
      style={[styles.splashOverlay, { backgroundColor: bgColor }]}>
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={[styles.splashOverlay, { backgroundColor: bgColor }]}>
      {content}
    </View>
  );
}

export function AnimatedIcon() {
  return null;
}

const styles = StyleSheet.create({
  splashOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
  },
});
