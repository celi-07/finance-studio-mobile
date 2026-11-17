import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { PaintedView } from './paint';
import { ItemMotionContext, useItemReveal } from './motion';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { alpha, blend, useRouteTone, useTheme, wash, type Tone } from './theme';
import { fonts, shouldDismissSheet } from './layout';

const MotionPaintedView = Animated.createAnimatedComponent(PaintedView);

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stack: { gap: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  grow: { flex: 1, minWidth: 0 },
});
export function Body({
  children,
  muted,
  bold,
  size = 14,
  color,
  style,
  lines,
  fit,
}: {
  children: ReactNode;
  muted?: boolean;
  bold?: boolean;
  size?: number;
  color?: string;
  style?: any;
  lines?: number;
  fit?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={fit ? 1 : lines}
      adjustsFontSizeToFit={fit}
      minimumFontScale={0.6}
      style={[
        {
          color: color ?? (muted ? t.muted : t.ink),
          fontSize: size,
          lineHeight: size * 1.45,
          fontFamily: bold ? fonts.bold : fonts.regular,
          includeFontPadding: false,
          textAlignVertical: 'center',
          flexShrink: 1,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
function FittedTitle({ children, size }: { children: ReactNode; size: number }) {
  const { width } = useWindowDimensions();
  const fitted = Math.min(
    size,
    (Math.min(width, 850) - 76) / Math.max(1, String(children).length * 0.65),
  );
  return (
    <Body bold fit size={fitted} style={{ letterSpacing: -0.5, lineHeight: fitted * 1.2 }}>
      {children}
    </Body>
  );
}
export function Title({
  children,
  size = 17,
  fit,
}: {
  children: ReactNode;
  size?: number;
  fit?: boolean;
}) {
  if (fit) return <FittedTitle size={size}>{children}</FittedTitle>;
  return (
    <Body bold size={size} style={{ letterSpacing: -0.5, lineHeight: size * 1.2 }}>
      {children}
    </Body>
  );
}
export function StudioMark({ size = 33 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80" aria-hidden={true}>
      <Rect width={80} height={80} rx={21} fill="#161616" />
      <Rect x={20} y={20} width={20} height={20} rx={5} fill="#639aee" />
      <Rect x={46} y={20} width={14} height={14} rx={4} fill="#4878c9" />
      <Rect x={20} y={46} width={14} height={14} rx={4} fill="#4878c9" />
      <Rect x={40} y={40} width={20} height={20} rx={5} fill="#91c5f5" />
    </Svg>
  );
}
export function GoogleMark() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" aria-hidden={true}>
      <Path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <Path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.12H3.05v2.59A10 10 0 0 0 12 22Z"
      />
      <Path
        fill="#FBBC05"
        d="M6.39 13.92A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.49H3.05A10 10 0 0 0 2 12c0 1.61.38 3.14 1.05 4.51l3.34-2.59Z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.51 3.83 1.51l2.88-2.88A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.95 5.49l3.34 2.59A6 6 0 0 1 12 5.96Z"
      />
    </Svg>
  );
}
export function Brand() {
  return (
    <View style={styles.row}>
      <StudioMark />
      <Title size={18}>Finance Studio</Title>
    </View>
  );
}
export function Panel({
  children,
  tone,
  paint = 'panel',
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  paint?: 'panel' | 'cash';
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const motion = useItemReveal();
  const routeTone = useRouteTone();
  return (
    <MotionPaintedView
      testID="reveal-surface"
      paint={paint}
      tone={tone}
      style={[
        {
          borderRadius: 20,
          padding: 17,
          gap: 14,
          borderWidth: 1,
          borderColor: blend(t.strongLine, wash(t, tone ?? routeTone), 0.36),
          boxShadow: `inset 0 1px 0 ${t.rim}, 0 7px 20px #17284724`,
        },
        style,
        motion,
      ]}
    >
      {children}
    </MotionPaintedView>
  );
}
export function Glyph({
  icon: Icon,
  tone = 'blue',
  size = 20,
}: {
  icon: LucideIcon;
  tone?: Tone;
  size?: number;
}) {
  const t = useTheme();
  return (
    <PaintedView
      paint="glyph"
      tone={tone}
      radius={12}
      style={{
        width: 40,
        flexShrink: 0,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: alpha(t[tone], 0.19),
      }}
    >
      <Icon size={size} color={t[tone]} strokeWidth={1.7} style={{ zIndex: 1 }} />
    </PaintedView>
  );
}
export function Button({
  children,
  onPress,
  icon: Icon,
  secondary,
  quiet,
  danger,
  disabled,
  busy,
  style,
  label,
}: {
  children?: ReactNode;
  onPress: () => void;
  icon?: LucideIcon;
  secondary?: boolean;
  quiet?: boolean;
  danger?: boolean;
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
  label?: string;
}) {
  const t = useTheme();
  const color = danger ? t.danger : secondary ? t.ink : quiet ? t.accent : t.actionText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
      accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: 44,
          paddingHorizontal: 13,
          paddingVertical: 10,
          borderRadius: 12,
          flexDirection: 'row',
          gap: 7,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: quiet ? 'transparent' : secondary ? t.surface : t.action,
          borderColor: secondary ? t.line : quiet ? 'transparent' : t.action,
          borderWidth: 1,
          opacity: disabled || busy ? 0.5 : pressed ? 0.72 : 1,
        },
        style,
      ]}
    >
      {!secondary && !quiet && (
        <PaintedView
          pointerEvents="none"
          paint="button"
          radius={12}
          style={StyleSheet.absoluteFill}
        />
      )}
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : Icon ? (
        <Icon size={17} color={color} style={{ zIndex: 1 }} />
      ) : null}
      {!!children && (
        <Body size={13} bold color={color}>
          {children}
        </Body>
      )}
    </Pressable>
  );
}
export function Input({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label?: string; error?: string; hint?: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {!!label && (
        <Body size={13} bold>
          {label}
        </Body>
      )}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        {...props}
        style={[
          {
            minHeight: 46,
            borderWidth: 1,
            borderColor: error ? t.danger : t.strongLine,
            borderRadius: 11,
            backgroundColor: t.hover,
            color: t.ink,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 15,
            fontFamily: fonts.regular,
          },
          props.style,
        ]}
      />
      {error ? (
        <Body size={12} color={t.danger}>
          {error}
        </Body>
      ) : hint ? (
        <Body size={12} muted>
          {hint}
        </Body>
      ) : null}
    </View>
  );
}
const InSheet = createContext(false);

export function Sheet({
  title,
  children,
  onClose,
  locked = false,
  dirty = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
  dirty?: boolean;
}) {
  const t = useTheme();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(height)).current;
  const shade = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const tappedGrabber = useRef(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const reduceMotion = useRef(false);
  const latest = useRef({ locked, onClose, height, dirty });
  useEffect(() => {
    latest.current = { locked, onClose, height, dirty };
  }, [locked, onClose, height, dirty]);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!alive) return;
      reduceMotion.current = reduce;
      Animated.parallel([
        Animated.timing(shade, { toValue: 1, duration: reduce ? 0 : 180, useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: reduce ? 0 : 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
    return () => {
      alive = false;
      translateY.stopAnimation();
      shade.stopAnimation();
    };
  }, [shade, translateY]);
  const animateDismiss = useCallback(() => {
    if (latest.current.locked || closing.current) return;
    closing.current = true;
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(shade, {
        toValue: 0,
        duration: reduceMotion.current ? 0 : 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: latest.current.height,
        duration: reduceMotion.current ? 0 : 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) latest.current.onClose();
    });
  }, [shade, translateY]);
  const dismiss = useCallback(() => {
    if (latest.current.locked || closing.current) return;
    Keyboard.dismiss();
    if (latest.current.dirty) {
      setConfirmDiscard(true);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    } else animateDismiss();
  }, [animateDismiss, translateY]);
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !latest.current.locked && !closing.current,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        !latest.current.locked &&
        !closing.current &&
        gesture.dy > 4 &&
        gesture.dy > Math.abs(gesture.dx),
      onMoveShouldSetPanResponder: (_, gesture) =>
        !latest.current.locked &&
        !closing.current &&
        gesture.dy > 4 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: (event) => {
        tappedGrabber.current = event.nativeEvent.locationY < 44;
      },
      onPanResponderMove: (_, gesture) => {
        if (!latest.current.locked) translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (
          !latest.current.locked &&
          (shouldDismissSheet(gesture.dy, gesture.vy) ||
            (tappedGrabber.current && Math.abs(gesture.dy) < 5 && Math.abs(gesture.dx) < 5))
        )
          dismiss();
        else
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 90,
            friction: 14,
          }).start();
      },
      onPanResponderTerminate: () =>
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;
  return (
    <Modal
      visible
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#10182880', opacity: shade }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Dismiss backdrop"
        style={StyleSheet.absoluteFill}
        disabled={locked}
        onPress={dismiss}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        pointerEvents="box-none"
        style={{ flex: 1, justifyContent: 'flex-end' }}
      >
        <Animated.View
          accessibilityViewIsModal
          onAccessibilityEscape={dismiss}
          style={{
            maxHeight: '92%',
            width: '100%',
            maxWidth: 680,
            alignSelf: 'center',
            backgroundColor: t.surface,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            overflow: 'hidden',
            transform: [{ translateY }],
          }}
        >
          <View
            {...pan.panHandlers}
            testID="sheet-drag-region"
            style={{ minHeight: 100, borderBottomWidth: 1, borderColor: t.line }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss dialog"
              accessibilityHint="You can also drag this header down to close"
              onAccessibilityTap={dismiss}
              onPress={dismiss}
              disabled={locked}
              style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: t.strongLine }}
              />
            </Pressable>
            <View
              pointerEvents="none"
              style={{
                paddingHorizontal: 18,
                paddingBottom: 18,
                minHeight: 50,
                justifyContent: 'center',
              }}
            >
              <Title size={21}>{title}</Title>
            </View>
          </View>
          {confirmDiscard && (
            <View style={{ padding: 18, gap: 10, borderBottomWidth: 1, borderColor: t.line }}>
              <Body bold>Discard unsaved changes?</Body>
              <View style={styles.actions}>
                <Button secondary onPress={() => setConfirmDiscard(false)}>
                  Keep editing
                </Button>
                <Button secondary danger onPress={animateDismiss}>
                  Discard changes
                </Button>
              </View>
            </View>
          )}
          <ScrollView
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ padding: 18, gap: 16 }}
          >
            <SafeAreaView edges={['bottom']}>
              <ItemMotionContext.Provider value={null}>
                <InSheet.Provider value={true}>{children}</InSheet.Provider>
              </ItemMotionContext.Provider>
            </SafeAreaView>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export type Option = { value: string; label: string };
export function Select({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  const inSheet = useContext(InSheet);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const choices = (
    <View style={styles.stack}>
      {options.length > 8 && <Input label="Search options" value={query} onChangeText={setQuery} />}
      {options
        .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        .map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === option.value }}
            aria-checked={value === option.value}
            onPress={() => {
              onChange(option.value);
              setOpen(false);
              setQuery('');
            }}
            style={({ pressed }) => [
              styles.between,
              {
                minHeight: 48,
                padding: 12,
                borderRadius: 12,
                opacity: pressed ? 0.7 : 1,
                backgroundColor: value === option.value ? wash(t, 'blue') : t.surface,
              },
            ]}
          >
            <Body bold={value === option.value}>{option.label}</Body>
            {value === option.value && <Check size={18} color={t.accent} />}
          </Pressable>
        ))}
      {!options.some((o) => o.label.toLowerCase().includes(query.toLowerCase())) && (
        <Body muted>No options found.</Body>
      )}
    </View>
  );
  return (
    <View style={{ gap: 6, minWidth: 0 }}>
      <Body size={12} muted>
        {label}
      </Body>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          label + ': ' + (options.find((o) => o.value === value)?.label ?? 'Choose')
        }
        disabled={disabled}
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        onPress={() => setOpen(!open)}
        style={[
          styles.between,
          {
            minHeight: 44,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 12,
            backgroundColor: t.control,
            paddingHorizontal: 11,
            paddingVertical: 10,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Body size={13} style={styles.grow} lines={1}>
          {options.find((o) => o.value === value)?.label ?? 'Choose ' + label.toLowerCase()}
        </Body>
        <ChevronDown size={15} color={t.muted} />
      </Pressable>
      {open &&
        (inSheet ? (
          <View style={{ padding: 8, borderWidth: 1, borderColor: t.line, borderRadius: 12 }}>
            {choices}
          </View>
        ) : (
          <Sheet
            title={label}
            onClose={() => {
              setOpen(false);
              setQuery('');
            }}
          >
            {choices}
          </Sheet>
        ))}
    </View>
  );
}
export function Segments({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{ flexDirection: 'row', backgroundColor: t.control, borderRadius: 12, padding: 3 }}
    >
      {options.map((option) => (
        <Pressable
          key={option.value}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === option.value }}
          aria-selected={value === option.value}
          onPress={() => onChange(option.value)}
          style={{
            flex: 1,
            minHeight: 40,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 9,
            backgroundColor: value === option.value ? t.surface : 'transparent',
          }}
        >
          <Body size={12} bold={value === option.value}>
            {option.label}
          </Body>
        </Pressable>
      ))}
    </View>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', gap: 8, paddingVertical: 25 }}>
      <Title>{title}</Title>
      {!!description && (
        <Body muted style={{ textAlign: 'center' }}>
          {description}
        </Body>
      )}
      {action}
    </View>
  );
}
export function ErrorNote({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="alert"
      style={{ padding: 12, backgroundColor: wash(t, 'coral'), borderRadius: 12 }}
    >
      <Body size={13} color={t.danger}>
        {children}
      </Body>
    </View>
  );
}
/** Synchronous latch catches two taps before React gets a chance to re-render. */
export function useSubmission() {
  const latch = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(operation: () => Promise<void>) {
    if (latch.current) return;
    latch.current = true;
    setBusy(true);
    setError('');
    try {
      await operation();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Couldn’t complete this change.');
    } finally {
      latch.current = false;
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}
