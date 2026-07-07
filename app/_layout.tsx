import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeContext } from '@/context/ThemeContext';
import { useState } from 'react';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // useEffect(() => {
  //   if (systemColorScheme === 'light' || systemColorScheme === 'dark') {
  //     setTheme(systemColorScheme);
  //   }
  // }, [systemColorScheme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

// npx eas-cli build -p android --profile preview
// cd android  && ./gradlew assembleDebug
// cd android && ./gradlew assembleRelease
// npx expo run:android
