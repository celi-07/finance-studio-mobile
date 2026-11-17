import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Easing, type ViewProps } from 'react-native';
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
type Scope = { focused: boolean; reduced: boolean; allocate: (group: string) => number };
export const ItemMotionContext = createContext<Scope | null>(null);
export function PageMotionProvider({ children }: { children: ReactNode }) {
  const focused = useIsFocused(),
    reduced = useReducedMotion();
  const counters = useRef<Record<string, number>>({});
  const allocate = useCallback((group: string) => {
    const index = counters.current[group] ?? 0;
    counters.current[group] = index + 1;
    return index;
  }, []);
  const scope = useMemo(() => ({ focused, reduced, allocate }), [focused, reduced, allocate]);
  return <ItemMotionContext.Provider value={scope}>{children}</ItemMotionContext.Provider>;
}
export function useItemReveal(group = 'surface') {
  const scope = useContext(ItemMotionContext),
    index = useRef<number | null>(null);
  if (index.current === null && scope) index.current = scope.allocate(group);
  const progress = useRef(new Animated.Value(1)).current;
  const focused = scope?.focused ?? false,
    reduced = scope?.reduced ?? true;
  useLayoutEffect(() => {
    progress.stopAnimation();
    if (!focused || reduced) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      delay: Math.min((index.current ?? 0) * (group === 'header' ? 35 : 55), 275),
      easing: Easing.bezier(0.22, 0.69, 0.22, 1),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, reduced, group, progress]);
  return {
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.24, 1] }),
    transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };
}
export function Reveal({
  group = 'row',
  style,
  children,
  ...props
}: ViewProps & { group?: string; children?: ReactNode }) {
  const motion = useItemReveal(group);
  return (
    <Animated.View {...props} testID={props.testID ?? `reveal-${group}`} style={[style, motion]}>
      {children}
    </Animated.View>
  );
}
export function RevealGroup({
  children,
  group = 'header',
}: {
  children: ReactNode;
  group?: string;
}) {
  const id = useId();
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <Reveal key={`${id}-${index}`} group={group}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
