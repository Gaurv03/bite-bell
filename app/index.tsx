import { FloatingEmojis } from '@/components/FloatingEmojis';
import { useAppTheme } from '@/context/ThemeContext';
import type { AudioPlayer } from 'expo-audio';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import 'lucide-react-native';
import { Check, Play, Square } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RINGTONES: Record<string, any> = {
  'Alert Alarm': require('@/assets/rings/mixkit-alert-alarm-1005.wav'),
  'Classic Alarm': require('@/assets/rings/mixkit-classic-alarm-995.wav'),
  'Crystal Chime': require('@/assets/rings/mixkit-crystal-chime-3108.wav'),
  'Facility Alarm': require('@/assets/rings/mixkit-facility-alarm-sound-999.wav'),
  'Hint Notification': require('@/assets/rings/mixkit-interface-hint-notification-911.wav'),
  Applause: require('@/assets/rings/mixkit-medium-size-crowd-applause-485.wav'),
  'Page Back Chime': require('@/assets/rings/mixkit-page-back-chime-1108.wav'),
  'Page Forward Chime': require('@/assets/rings/mixkit-page-forward-single-chime-1107.wav'),
  'Race Countdown': require('@/assets/rings/mixkit-race-countdown-1953.wav'),
  'Relaxing Bell': require('@/assets/rings/mixkit-relaxing-bell-chime-3109.wav'),
  'Sci-Fi Alarm': require('@/assets/rings/mixkit-scanning-sci-fi-alarm-905.wav'),
  'Casino Counter': require('@/assets/rings/mixkit-score-casino-counter-1998.wav'),
  'Slot Machine Payout': require('@/assets/rings/mixkit-slot-machine-payout-alarm-1996.wav'),
  'Slow Racing Countdown': require('@/assets/rings/mixkit-slow-racing-countdown-1055.wav'),
};

type TimeUnit = 'seconds' | 'minutes' | 'hours';

const getTimeMultiplier = (unit: TimeUnit) => {
  if (unit === 'hours') return 3600;
  if (unit === 'minutes') return 60;
  return 1;
};

export default function App() {
  const { theme, toggleTheme } = useAppTheme();

  const [durationInput, setDurationInput] = useState('40');
  const [durationUnit, setDurationUnit] = useState<TimeUnit>('minutes');

  const [intervalInput, setIntervalInput] = useState('1');
  const [intervalUnit, setIntervalUnit] = useState<TimeUnit>('minutes');

  const [durationSeconds, setDurationSeconds] = useState(0);
  const [intervalSeconds, setIntervalSeconds] = useState(0);

  const [isRunning, setIsRunning] = useState(false);
  const soundRef = useRef<AudioPlayer | null>(null);

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedRingtone, setSelectedRingtone] =
    useState<string>('Crystal Chime');
  const [previewingTone, setPreviewingTone] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationEndTimeRef = useRef<number>(0);
  const nextIntervalTimeRef = useRef<number>(0);

  useEffect(() => {
    setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
    });
  }, []);

  const isDark = theme === 'dark';

  const themeColors = {
    background: isDark ? '#121212' : '#F2F4F7',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#F9FAFB' : '#111827',
    subtext: isDark ? '#9CA3AF' : '#6B7280',
    primary: '#4F46E5', // Indigo
    primaryHover: '#4338CA',
    secondary: '#10B981', // Emerald
    danger: '#EF4444', // Red
    inputBorder: isDark ? '#374151' : '#E5E7EB',
    inputBg: isDark ? '#111827' : '#F9FAFB',
    shadow: isDark ? '#000000' : '#D1D5DB',
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
      }
    };
  }, []);

  const playSound = async (overrideSoundName?: string) => {
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
      }
      const soundSource = RINGTONES[overrideSoundName || selectedRingtone];
      if (!soundSource) return;

      const newSound = createAudioPlayer(soundSource);
      soundRef.current = newSound;
      newSound.play();

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }, 150);

      if (overrideSoundName) {
        setPreviewingTone(overrideSoundName);
        newSound.addListener('playbackStatusUpdate', (status: any) => {
          if (status.didJustFinish) {
            setPreviewingTone(null);
          }
        });
      }
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  const stopPreview = async () => {
    try {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
      setPreviewingTone(null);
    } catch (e) {}
  };

  const startTimer = () => {
    const totalDuration =
      parseFloat(durationInput) * getTimeMultiplier(durationUnit);
    const intervalDuration =
      parseFloat(intervalInput) * getTimeMultiplier(intervalUnit);

    if (
      isNaN(totalDuration) ||
      isNaN(intervalDuration) ||
      totalDuration <= 0 ||
      intervalDuration <= 0
    ) {
      alert('Please enter valid positive numbers for duration and interval.');
      return;
    }

    setDurationSeconds(totalDuration);
    setIntervalSeconds(intervalDuration);
    durationEndTimeRef.current = Date.now() + totalDuration * 1000;
    nextIntervalTimeRef.current = Date.now() + intervalDuration * 1000;
    setIsRunning(true);
  };

  const resumeTimer = () => {
    durationEndTimeRef.current = Date.now() + durationSeconds * 1000;
    nextIntervalTimeRef.current = Date.now() + intervalSeconds * 1000;
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const resetTimer = () => {
    stopTimer();
    setDurationSeconds(0);
    setIntervalSeconds(0);
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remainingDuration = Math.max(
          0,
          Math.ceil((durationEndTimeRef.current - now) / 1000),
        );
        let remainingInterval = Math.max(
          0,
          Math.ceil((nextIntervalTimeRef.current - now) / 1000),
        );

        if (remainingDuration <= 0) {
          setDurationSeconds(0);
          setIntervalSeconds(0);
          playSound();
          stopTimer();
          return;
        }

        if (remainingInterval <= 0) {
          playSound();
          const originalIntervalMs =
            parseFloat(intervalInput) * getTimeMultiplier(intervalUnit) * 1000;

          while (nextIntervalTimeRef.current <= now) {
            nextIntervalTimeRef.current += originalIntervalMs;
          }
          remainingInterval = Math.max(
            0,
            Math.ceil((nextIntervalTimeRef.current - now) / 1000),
          );
        }

        setDurationSeconds(remainingDuration);
        setIntervalSeconds(remainingInterval);
      }, 250);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, intervalInput, intervalUnit, selectedRingtone]);

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const UnitSelector = ({
    selected,
    onSelect,
  }: {
    selected: TimeUnit;
    onSelect: (u: TimeUnit) => void;
  }) => (
    <View
      style={[
        styles.unitSelector,
        {
          borderColor: themeColors.inputBorder,
          backgroundColor: themeColors.inputBg,
        },
      ]}
    >
      {(['hours', 'minutes', 'seconds'] as TimeUnit[]).map((unit) => (
        <TouchableOpacity
          key={unit}
          style={[
            styles.unitButton,
            selected === unit && { backgroundColor: themeColors.primary },
          ]}
          onPress={() => onSelect(unit)}
        >
          <Text
            style={[
              styles.unitButtonText,
              { color: selected === unit ? '#FFF' : themeColors.subtext },
            ]}
          >
            {unit.charAt(0).toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      {Platform.OS === 'web' && (
        <style type="text/css">{`
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background-color: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
          }
        `}</style>
      )}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <FloatingEmojis />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <Image
                  source={require('@/assets/images/icon.png')}
                  style={styles.logoImage}
                />
                <View>
                  <Text style={[styles.appTitle, { color: themeColors.text }]}>
                    Bite Bells
                  </Text>
                  <Text
                    style={[styles.appSubtitle, { color: themeColors.subtext }]}
                  >
                    Mindful eating tracker
                  </Text>
                </View>
              </View>
              <View style={styles.themeToggle}>
                <TouchableOpacity
                  onPress={() => setSettingsVisible(true)}
                  style={styles.iconButton}
                >
                  <Text style={{ fontSize: 24 }}>⚙️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleTheme}
                  style={styles.iconButton}
                >
                  <Text style={{ fontSize: 24 }}>{isDark ? '🌙' : '☀️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.content}>
              <BlurView
                intensity={isDark ? 30 : 60}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.aestheticCard,
                  {
                    overflow: 'hidden',
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.4)',
                    borderWidth: 1,
                    backgroundColor: isDark
                      ? 'rgba(30,30,30,0.5)'
                      : 'rgba(255,255,255,0.5)',
                    boxShadow: `0px 24px 32px ${isDark ? 'rgba(0,0,0,0.5)' : 'rgba(209,213,219,0.5)'}`,
                  },
                ]}
              >
                {!isRunning && durationSeconds === 0 ? (
                  <View style={styles.setupContainer}>
                    <Text
                      style={[styles.sectionTitle, { color: themeColors.text }]}
                    >
                      Configure Routine
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubtitle,
                        { color: themeColors.subtext },
                      ]}
                    >
                      Set your total meal time and how often you'd like to be
                      reminded to chew.
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: themeColors.text }]}>
                        Total Duration
                      </Text>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputFlex,
                            {
                              color: themeColors.text,
                              borderColor: themeColors.inputBorder,
                              backgroundColor: themeColors.inputBg,
                            },
                          ]}
                          keyboardType="numeric"
                          value={durationInput}
                          onChangeText={setDurationInput}
                          placeholder="e.g. 40"
                          placeholderTextColor={themeColors.subtext}
                        />
                        <UnitSelector
                          selected={durationUnit}
                          onSelect={setDurationUnit}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.label, { color: themeColors.text }]}>
                        Bite Interval
                      </Text>
                      <View style={styles.inputRow}>
                        <TextInput
                          style={[
                            styles.input,
                            styles.inputFlex,
                            {
                              color: themeColors.text,
                              borderColor: themeColors.inputBorder,
                              backgroundColor: themeColors.inputBg,
                            },
                          ]}
                          keyboardType="numeric"
                          value={intervalInput}
                          onChangeText={setIntervalInput}
                          placeholder="e.g. 1"
                          placeholderTextColor={themeColors.subtext}
                        />
                        <UnitSelector
                          selected={intervalUnit}
                          onSelect={setIntervalUnit}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.button,
                        { backgroundColor: themeColors.primary },
                      ]}
                      onPress={startTimer}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.buttonText}>
                        Start Mindful Eating
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.activeContainer}>
                    <View style={styles.timerBox}>
                      <Text
                        style={[
                          styles.activeLabel,
                          { color: themeColors.subtext },
                        ]}
                      >
                        Total Time Remaining
                      </Text>
                      <Text
                        style={[
                          styles.durationText,
                          { color: themeColors.text },
                        ]}
                      >
                        {formatTime(durationSeconds)}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.timerBox}>
                      <Text
                        style={[
                          styles.activeLabel,
                          { color: themeColors.subtext },
                        ]}
                      >
                        Next Bell In
                      </Text>
                      <Text
                        style={[
                          styles.intervalText,
                          { color: themeColors.secondary },
                        ]}
                      >
                        {formatTime(intervalSeconds)}
                      </Text>
                    </View>

                    <View style={styles.controlsRow}>
                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          {
                            backgroundColor: isRunning
                              ? '#F59E0B'
                              : themeColors.secondary,
                          },
                        ]}
                        onPress={() =>
                          isRunning ? stopTimer() : resumeTimer()
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={styles.buttonText}>
                          {isRunning ? 'Pause' : 'Resume'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.controlButton,
                          { backgroundColor: themeColors.danger },
                        ]}
                        onPress={resetTimer}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.buttonText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </BlurView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <Modal visible={settingsVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.card,
                borderColor: themeColors.inputBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                Settings
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSettingsVisible(false);
                  stopPreview();
                }}
              >
                <Text style={{ fontSize: 24, color: themeColors.subtext }}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <Text
              style={[
                styles.sectionSubtitle,
                { color: themeColors.subtext, marginBottom: 16 },
              ]}
            >
              Choose your preferred bite ringtone
            </Text>

            <ScrollView style={styles.ringtoneList}>
              {Object.keys(RINGTONES).map((tone) => {
                const isSelected = selectedRingtone === tone;
                const isPreviewing = previewingTone === tone;
                return (
                  <TouchableOpacity
                    key={tone}
                    onPress={() => setSelectedRingtone(tone)}
                    activeOpacity={0.7}
                    style={[
                      styles.ringtoneItem,
                      { borderBottomColor: themeColors.inputBorder },
                      isSelected && {
                        backgroundColor: themeColors.inputBg,
                        borderRadius: 12,
                      },
                    ]}
                  >
                    <View style={styles.ringtoneLeft}>
                      <TouchableOpacity
                        style={[
                          styles.previewButton,
                          {
                            backgroundColor: isPreviewing
                              ? themeColors.danger
                              : themeColors.primary,
                          },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (isPreviewing) {
                            stopPreview();
                          } else {
                            playSound(tone);
                          }
                        }}
                      >
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 16,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          {isPreviewing ? <Square /> : <Play />}
                        </Text>
                      </TouchableOpacity>
                      <Text
                        style={[
                          styles.ringtoneText,
                          { color: themeColors.text },
                          isSelected && {
                            color: themeColors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {tone}
                      </Text>
                    </View>
                    {isSelected && (
                      <Text
                        style={{
                          color: themeColors.primary,
                          fontSize: 18,
                          fontWeight: 'bold',
                        }}
                      >
                        <Check />
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(150,150,150,0.1)',
    borderRadius: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  aestheticCard: {
    width: '100%',
    borderRadius: 32,
    padding: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  setupContainer: {
    gap: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  inputGroup: {
    gap: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputFlex: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 16,
    height: 60,
    padding: 4,
  },
  unitButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  input: {
    height: 60,
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '500',
  },
  button: {
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    boxShadow: '0px 8px 16px rgba(79, 70, 229, 0.3)',
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  activeContainer: {
    alignItems: 'center',
    gap: 16,
  },
  timerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  activeLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  durationText: {
    fontSize: 72,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 80,
    letterSpacing: -2,
  },
  intervalText: {
    fontSize: 56,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    lineHeight: 64,
    letterSpacing: -1,
  },
  divider: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(150,150,150,0.1)',
    marginVertical: 24,
    borderRadius: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
    width: '100%',
  },
  controlButton: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 32,
    height: '70%',
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  ringtoneList: {
    flex: 1,
  },
  ringtoneItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  ringtoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringtoneText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
