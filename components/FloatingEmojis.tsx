import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const EMOJIS = [
  '🍎',
  '🍏',
  '🍐',
  '🍊',
  '🍋',
  '🍋‍🟩',
  '🍌',
  '🍉',
  '🍇',
  '🍓',
  '🫐',
  '🍈',
  '🍒',
  '🍑',
  '🥭',
  '🍍',
  '🥥',
  '🥝',
  '🍅',
  '🫒',
  '🥑',
  '🍆',
  '🥔',
  '🥕',
  '🌽',
  '🌶️',
  '🫑',
  '🥒',
  '🥬',
  '🥦',
  '🧄',
  '🧅',
  '🫛',
  '🫘',
  '🫜',
  '🫚',
  '🍄‍🟫',
  '🍄',
];
const { width, height } = Dimensions.get('window');

const FloatingEmoji = ({ emoji }: { emoji: string }) => {
  const x = useSharedValue(Math.random() * width);
  const y = useSharedValue(Math.random() * height);
  const rotation = useSharedValue(Math.random() * 360);
  const scale = useSharedValue(Math.random() * 0.5 + 0.8);

  const moveRandomly = () => {
    const nextX = Math.random() * width;
    const nextY = Math.random() * height;
    const nextRotation = rotation.value + (Math.random() * 180 - 90);
    const duration = 10000 + Math.random() * 10000;

    x.value = withTiming(nextX, { duration, easing: Easing.linear });
    rotation.value = withTiming(nextRotation, {
      duration,
      easing: Easing.linear,
    });
    y.value = withTiming(
      nextY,
      { duration, easing: Easing.linear },
      (finished) => {
        if (finished) {
          runOnJS(moveRandomly)();
        }
      },
    );
  };

  useEffect(() => {
    moveRandomly();
  }, []);

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value },
      ],
      opacity: 0.5, // Subtle opacity
    };
  });

  return <Animated.Text style={[styles.emoji, style]}>{emoji}</Animated.Text>;
};

export const FloatingEmojis = () => {
  const [emojis, setEmojis] = useState<Array<{ id: number; emoji: string }>>(
    [],
  );

  useEffect(() => {
    const items = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    }));
    setEmojis(items);
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' } as any]}>
      {emojis.map((item) => (
        <FloatingEmoji key={item.id} emoji={item.emoji} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  emoji: {
    position: 'absolute',
    fontSize: 42,
  },
});
