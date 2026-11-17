import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
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
import { alpha, routeTones, useTheme } from '../ui/theme';
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
function TabItem({
  name,
  selected,
  reduced,
  onPress,
  onLongPress,
  compact,
}: {
  name: TabName;
  selected: boolean;
  reduced: boolean;
  onPress: () => void;
  onLongPress: () => void;
  compact: boolean;
}) {
  const t = useTheme(),
    Icon = icons[name];
  const [focused, setFocused] = useState(false);
  const scale = useRef(new Animated.Value(selected ? 1.09 : 1)).current;
  useEffect(() => {
    const animation = Animated.timing(scale, {
      toValue: selected ? 1.09 : 1,
      duration: reduced ? 0 : 220,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [selected, reduced, scale]);
  const color = selected ? t[routeTones[name]] : t.navInk;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={routeLabels[name]}
      accessibilityState={{ selected }}
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
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        borderRadius: tabBar.itemRadius,
        borderWidth: 1,
        borderColor: focused ? t.focus : 'transparent',
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed && !reduced ? 0.96 : 1 }],
      })}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon color={color} size={20} strokeWidth={selected ? 2 : 1.65} />
      </Animated.View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={{
          color,
          fontFamily: selected ? fonts.bold : fonts.regular,
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
    [rowWidth, setRowWidth] = useState(0);
  const position = useRef(new Animated.Value(0)).current,
    previousWidth = useRef(0);
  const itemWidth = (rowWidth - (state.routes.length - 1) * 2) / state.routes.length;
  const name = state.routes[state.index].name as TabName,
    tone = routeTones[name];
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
    position.stopAnimation();
    const target = state.index * (itemWidth + 2);
    if (reduced || previousWidth.current !== rowWidth) position.setValue(target);
    else
      Animated.spring(position, {
        toValue: target,
        stiffness: 260,
        damping: 28,
        mass: 1,
        useNativeDriver: true,
        overshootClamping: true,
      }).start();
    previousWidth.current = rowWidth;
    return () => position.stopAnimation();
  }, [state.index, rowWidth, itemWidth, reduced, position]);
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
      <PaintedView
        testID="studio-tab-bar"
        paint="navigation"
        tone={tone}
        radius={tabBar.radius}
        style={{
          width: '100%',
          maxWidth: tabBar.maxWidth,
          height: tabBar.height,
          borderRadius: tabBar.radius,
          padding: 5,
          borderWidth: 1,
          borderColor: t.line,
          boxShadow: `inset 0 1px 0 ${t.rim}, 0 5px 24px #16274424`,
        }}
      >
        <View
          onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
          style={{ flex: 1, flexDirection: 'row', gap: 2 }}
        >
          {itemWidth > 0 && (
            <Animated.View
              testID="tab-selection"
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: itemWidth,
                transform: [{ translateX: position }],
              }}
            >
              <PaintedView
                paint="selection"
                tone={tone}
                radius={tabBar.itemRadius}
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: tabBar.itemRadius,
                    borderWidth: 1,
                    borderColor: alpha(t[tone], 0.24),
                    boxShadow: `inset 0 1px 0 ${t.rim}, 0 3px 12px #234fca0c`,
                  },
                ]}
              />
            </Animated.View>
          )}
          {state.routes.map((route, index) => (
            <TabItem
              key={route.key}
              name={route.name as TabName}
              selected={state.index === index}
              reduced={reduced}
              compact={width < 360}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (state.index !== index && !event.defaultPrevented)
                  navigation.navigate(route.name, route.params);
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          ))}
        </View>
      </PaintedView>
    </View>
  );
}
