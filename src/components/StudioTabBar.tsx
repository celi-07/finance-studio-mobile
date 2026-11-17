import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChartNoAxesCombined,
  HandCoins,
  PanelsTopLeft,
  ReceiptText,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react-native';
import { blend, useTheme } from '../ui/theme';
import { fonts, routeLabels, tabBar } from '../ui/layout';

const icons = {
  Overview: PanelsTopLeft,
  Transactions: ReceiptText,
  Reimbursements: HandCoins,
  Investments: ChartNoAxesCombined,
  Assistant: Sparkles,
  Settings: SlidersHorizontal,
};
export function StudioTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [keyboard, setKeyboard] = useState(false);
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
      <LinearGradient
        colors={[t.navStart, t.navEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          maxWidth: tabBar.maxWidth,
          height: tabBar.height,
          borderRadius: tabBar.radius,
          padding: 5,
          borderWidth: 1,
          borderColor: t.strongLine,
          boxShadow: '0 6px 24px #10182824',
          overflow: 'hidden',
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', gap: 2 }}>
          {state.routes.map((route, index) => {
            const selected = state.index === index;
            const name = route.name as keyof typeof icons;
            const Icon = icons[name];
            const color = selected ? t.accent : t.ink;
            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityLabel={routeLabels[name]}
                accessibilityState={{ selected }}
                testID={`tab-${name.toLowerCase()}`}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!selected && !event.defaultPrevented)
                    navigation.navigate(route.name, route.params);
                }}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={({ pressed }) => ({
                  flex: 1,
                  minWidth: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: tabBar.itemRadius,
                  overflow: 'hidden',
                  opacity: pressed ? 0.7 : 1,
                  backgroundColor: selected
                    ? blend(t.surface, t.orchidWash, t.dark ? 0.35 : 0.2)
                    : 'transparent',
                  borderWidth: 1,
                  borderColor: selected ? blend(t.surface, t.strongLine, 0.45) : 'transparent',
                })}
              >
                <Icon color={color} size={20} strokeWidth={selected ? 2 : 1.65} />
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                  style={{
                    color,
                    fontFamily: selected ? fonts.bold : fonts.regular,
                    fontSize: width < 360 ? 9 : 10,
                    lineHeight: 13,
                    textAlign: 'center',
                    maxWidth: '100%',
                  }}
                >
                  {routeLabels[name]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}
