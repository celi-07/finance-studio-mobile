import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (alive) setReduced(value);
    });
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      listener.remove();
    };
  }, []);
  return reduced;
}
export function usePageTransition() {
  const focused = useIsFocused(),
    reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(1)).current;
  useLayoutEffect(() => {
    progress.stopAnimation();
    if (!focused || reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      easing: Easing.bezier(0.22, 0.69, 0.22, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, progress]);
  return {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.24, 1] }),
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [13, 0] }) }],
  };
}
