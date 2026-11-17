import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  Animated,
  Keyboard,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChartNoAxesCombined,
  HandCoins,
  PanelsTopLeft,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';
import { routeTones, useTheme } from '../ui/theme';
import { PaintedView } from '../ui/paint';
import { useReducedMotion } from '../ui/motion';
import { fonts, routeLabels, tabBar } from '../ui/layout';

const icons = {
  Overview: PanelsTopLeft,
  Transactions: ReceiptText,
  Reimbursements: HandCoins,
  Investments: ChartNoAxesCombined,
  Assistant: Sparkles,
  Settings: SlidersHorizontal,
};
type TabName = keyof typeof icons;
const names = Object.keys(icons) as TabName[];
function GradientLayers({
  progress,
  paint,
  radius,
}: {
  progress: Animated.AnimatedInterpolation<number>;
  paint: 'navigation' | 'selection';
  radius: number;
}) {
  return (
    <>
      {names.map((name, index) => (
        <Animated.View
          key={name}
          pointerEvents="none"
          testID={`${paint}-gradient-${index}`}
          style={[
            StyleSheet.absoluteFill,
            {
              opacity:
                index === 0
                  ? 1
                  : progress.interpolate({
                      inputRange: [index - 1, index],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
            },
          ]}
        >
          <PaintedView
            paint={paint}
            tone={routeTones[name]}
            radius={radius}
            inset={0}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ))}
    </>
  );
}
function TabItem({
  name,
  selected,
  highlighted,
  reduced,
  compact,
  onPress,
  onLongPress,
  setRef,
}: {
  name: TabName;
  selected: boolean;
  highlighted: boolean;
  reduced: boolean;
  compact: boolean;
  onPress: () => void;
  onLongPress: () => void;
  setRef: (node: ComponentRef<typeof View> | null) => void;
}) {
  const t = useTheme(),
    Icon = icons[name];
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(highlighted ? 1.09 : 1)).current;
  useEffect(() => {
    const animation = Animated.timing(scale, {
      toValue: highlighted ? 1.09 : 1,
      duration: reduced ? 0 : 180,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [highlighted, reduced, scale]);
  const color = highlighted ? t[routeTones[name]] : t.navInk;
  return (
    <Pressable
      ref={setRef}
      accessibilityRole="tab"
      accessibilityLabel={routeLabels[name]}
      accessibilityState={{ selected }}
      aria-selected={selected}
      testID={`tab-${name.toLowerCase()}`}
      onPress={onPress}
      onLongPress={onLongPress}
      onFocus={(event) => {
        const target = event.nativeEvent.target as unknown as {
          matches?: (selector: string) => boolean;
        };
        setFocused(Platform.OS !== 'web' || !!target?.matches?.(':focus-visible'));
      }}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        flex: 1,
        minWidth: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        borderRadius: tabBar.itemRadius,
        borderWidth: 1,
        borderColor: focused ? t.focus : 'transparent',
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed && !reduced ? 0.96 : 1 }],
      })}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon color={color} size={20} strokeWidth={highlighted ? 2 : 1.65} />
      </Animated.View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={{
          color,
          fontFamily: highlighted ? fonts.bold : fonts.regular,
          fontSize: compact ? 9 : 10,
          letterSpacing: compact ? -0.25 : 0,
          lineHeight: 13,
          includeFontPadding: false,
          textAlign: 'center',
          maxWidth: '100%',
        }}
      >
        {routeLabels[name]}
      </Text>
    </Pressable>
  );
}
export function StudioTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme(),
    insets = useSafeAreaInsets(),
    { width } = useWindowDimensions(),
    reduced = useReducedMotion();
  const [keyboard, setKeyboard] = useState(false),
    [rowWidth, setRowWidth] = useState(0),
    [preview, setPreview] = useState<number | null>(null);
  const tabRefs = useRef<Array<ComponentRef<typeof View> | null>>([]);
  const row = useRef<ComponentRef<typeof View>>(null),
    rowX = useRef(0),
    dragging = useRef(false),
    previousWidth = useRef(0);
  const position = useRef(new Animated.Value(0)).current;
  const itemWidth = Math.max(0, (rowWidth - (state.routes.length - 1) * 2) / state.routes.length),
    slot = itemWidth + 2;
  const progress = useMemo(
    () =>
      position.interpolate({
        inputRange: [0, Math.max(1, (state.routes.length - 1) * slot)],
        outputRange: [0, state.routes.length - 1],
        extrapolate: 'clamp',
      }),
    [position, slot, state.routes.length],
  );
  const settle = useCallback(
    (index: number, immediate = false) => {
      position.stopAnimation();
      const target = index * slot;
      if (reduced || immediate) position.setValue(target);
      else
        Animated.spring(position, {
          toValue: target,
          stiffness: 260,
          damping: 28,
          mass: 1,
          overshootClamping: true,
          useNativeDriver: true,
        }).start();
    },
    [position, reduced, slot],
  );
  const select = (index: number) => {
    const route = state.routes[index];
    if (!route) return false;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (event.defaultPrevented) return false;
    if (Platform.OS === 'web') tabRefs.current[index]?.focus();
    if (state.index !== index) navigation.navigate(route.name, route.params);
    return true;
  };
  const latest = useRef({
    index: state.index,
    count: state.routes.length,
    slot,
    itemWidth,
    select,
    settle,
  });
  latest.current = {
    index: state.index,
    count: state.routes.length,
    slot,
    itemWidth,
    select,
    settle,
  };
  const move = (x: number) => {
    const current = latest.current;
    const value = Math.max(
      0,
      Math.min((current.count - 1) * current.slot, x - rowX.current - current.itemWidth / 2),
    );
    position.setValue(value);
    const index = Math.max(0, Math.min(current.count - 1, Math.round(value / current.slot)));
    setPreview(index);
    return index;
  };
  const moveRef = useRef(move);
  moveRef.current = move;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        rowX.current >= 0 && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
      onPanResponderGrant: (event) => {
        dragging.current = true;
        position.stopAnimation();
        moveRef.current(event.nativeEvent.pageX);
      },
      onPanResponderMove: (event) => moveRef.current(event.nativeEvent.pageX),
      onPanResponderRelease: (event, g) => {
        const index = moveRef.current(event.nativeEvent.pageX);
        dragging.current = false;
        setPreview(null);
        if (Math.abs(g.dy) < tabBar.height * 1.5 && latest.current.select(index))
          latest.current.settle(index);
        else latest.current.settle(latest.current.index);
      },
      onPanResponderTerminate: () => {
        dragging.current = false;
        setPreview(null);
        latest.current.settle(latest.current.index);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboard(true),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboard(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  useEffect(() => {
    if (!dragging.current) settle(state.index, previousWidth.current !== rowWidth);
    previousWidth.current = rowWidth;
    return () => position.stopAnimation();
  }, [state.index, rowWidth, settle, position]);
  if (keyboard) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: tabBar.margin + insets.left,
        right: tabBar.margin + insets.right,
        bottom: Math.max(12, insets.bottom),
        alignItems: 'center',
      }}
    >
      <View
        testID="studio-tab-bar"
        style={{
          width: '100%',
          maxWidth: tabBar.maxWidth,
          height: tabBar.height,
          borderRadius: tabBar.radius,
          boxShadow: '0 5px 24px #16274424',
        }}
      >
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: tabBar.radius, overflow: 'hidden' }]}
        >
          <GradientLayers progress={progress} paint="navigation" radius={tabBar.radius} />
        </View>
        <View style={{ flex: 1, padding: 6 }}>
          <View
            ref={row}
            {...pan.panHandlers}
            testID="tab-scrub-region"
            onLayout={(event) => {
              setRowWidth(event.nativeEvent.layout.width);
              row.current?.measureInWindow((x) => {
                rowX.current = x;
              });
            }}
            style={{ flex: 1, flexDirection: 'row', gap: 2 }}
          >
            {itemWidth > 0 && (
              <Animated.View
                testID="tab-selection"
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: -2,
                  bottom: -2,
                  left: -5,
                  width: itemWidth + 10,
                  borderRadius: tabBar.itemRadius,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: t.strongLine,
                  transform: [{ translateX: position }],
                }}
              >
                <GradientLayers progress={progress} paint="selection" radius={tabBar.itemRadius} />
              </Animated.View>
            )}
            {state.routes.map((route, index) => (
              <TabItem
                key={route.key}
                setRef={(node) => {
                  tabRefs.current[index] = node;
                }}
                name={route.name as TabName}
                selected={state.index === index}
                highlighted={(preview ?? state.index) === index}
                reduced={reduced}
                compact={width < 360}
                onPress={() => {
                  setPreview(null);
                  if (select(index)) settle(index);
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
