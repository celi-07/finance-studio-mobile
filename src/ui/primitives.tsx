import { useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, ChevronDown, X, type LucideIcon } from 'lucide-react-native';
import Svg, { Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blend, useTheme, wash, type Tone } from './theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stack: { gap: 14 },
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
}: {
  children: ReactNode;
  muted?: boolean;
  bold?: boolean;
  size?: number;
  color?: string;
  style?: any;
  lines?: number;
}) {
  const t = useTheme();
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          color: color ?? (muted ? t.muted : t.ink),
          fontSize: size,
          lineHeight: size * 1.45,
          fontWeight: bold ? '600' : '400',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Title({ children, size = 17 }: { children: ReactNode; size?: number }) {
  return (
    <Body bold size={size} style={{ letterSpacing: -0.5 }}>
      {children}
    </Body>
  );
}
export function Brand() {
  return (
    <View style={styles.row}>
      <Svg width={33} height={33} viewBox="0 0 80 80" accessible={false}>
        <Rect width={80} height={80} rx={21} fill="#161616" />
        <Rect x={20} y={20} width={20} height={20} rx={5} fill="#639aee" />
        <Rect x={46} y={20} width={14} height={14} rx={4} fill="#4878c9" />
        <Rect x={20} y={46} width={14} height={14} rx={4} fill="#4878c9" />
        <Rect x={40} y={40} width={20} height={20} rx={5} fill="#91c5f5" />
      </Svg>
      <Title size={18}>Finance Studio</Title>
    </View>
  );
}
export function Panel({
  children,
  tone = 'blue',
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <LinearGradient
      colors={[t.surface, blend(t.surfaceEnd, wash(t, tone), 0.54)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        {
          borderRadius: 20,
          padding: 17,
          gap: 14,
          borderWidth: 1,
          borderColor: blend(t.strongLine, wash(t, tone), 0.5),
          boxShadow: '0 5px 18px #17284716',
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
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
    <LinearGradient
      colors={[blend(t.surface, wash(t, tone), 0.6), wash(t, tone)]}
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: blend(t.strongLine, wash(t, tone), 0.65),
      }}
    >
      <Icon size={size} color={t[tone]} strokeWidth={1.7} />
    </LinearGradient>
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
  const color = danger ? t.danger : secondary ? t.ink : quiet ? t.accent : t.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || busy}
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
          backgroundColor: quiet ? 'transparent' : secondary ? t.surface : t.accent,
          borderColor: secondary ? t.line : 'transparent',
          borderWidth: 1,
          opacity: disabled || busy ? 0.5 : pressed ? 0.72 : 1,
        },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={color} />
      ) : Icon ? (
        <Icon size={17} color={color} />
      ) : null}
      {children && (
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
      {label && (
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
            backgroundColor: t.control,
            color: t.ink,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontSize: 15,
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
export function Sheet({
  title,
  children,
  onClose,
  locked = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked?: boolean;
}) {
  const t = useTheme();
  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!locked) onClose();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, backgroundColor: '#10182860', justifyContent: 'flex-end' }}
      >
        <View
          style={{
            maxHeight: '94%',
            width: '100%',
            maxWidth: 680,
            alignSelf: 'center',
            backgroundColor: t.surface,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
          }}
        >
          <View
            style={[styles.between, { padding: 16, borderBottomWidth: 1, borderColor: t.line }]}
          >
            <Title size={21}>{title}</Title>
            <Button quiet icon={X} onPress={onClose} label="Close" disabled={locked} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 18, gap: 16 }}
          >
            <SafeAreaView edges={['bottom']}>{children}</SafeAreaView>
          </ScrollView>
        </View>
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
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  return (
    <View style={{ gap: 6, minWidth: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          label + ': ' + (options.find((o) => o.value === value)?.label ?? 'Choose')
        }
        disabled={disabled}
        onPress={() => setOpen(true)}
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
      {open && (
        <Sheet
          title={label}
          onClose={() => {
            setOpen(false);
            setQuery('');
          }}
        >
          <View style={styles.stack}>
            {options.length > 8 && (
              <Input label="Search options" value={query} onChangeText={setQuery} />
            )}
            {options
              .filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
              .map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: value === option.value }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={[
                    styles.between,
                    {
                      minHeight: 48,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: value === option.value ? wash(t, 'blue') : t.surface,
                    },
                  ]}
                >
                  <Body bold={value === option.value}>{option.label}</Body>
                  {value === option.value && <Check size={18} color={t.accent} />}
                </Pressable>
              ))}
          </View>
        </Sheet>
      )}
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
      {description && (
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
