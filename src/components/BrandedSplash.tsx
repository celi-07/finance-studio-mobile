import { Text, View } from 'react-native';
import { PaintedView } from '../ui/paint';
import { StudioMark } from '../ui/primitives';
import { fonts } from '../ui/layout';
import { useTheme } from '../ui/theme';

export function BrandedSplash({ fontsReady = true }: { fontsReady?: boolean }) {
  const t = useTheme();
  return (
    <PaintedView
      paint="canvas"
      radius={0}
      inset={0}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}
    >
      <View
        accessibilityLabel="Finance Studio is loading"
        accessible
        style={{ alignItems: 'center', gap: 18 }}
      >
        <StudioMark size={76} />
        <Text
          style={{
            color: t.ink,
            fontFamily: fontsReady ? fonts.bold : undefined,
            fontSize: 28,
            letterSpacing: -1,
          }}
        >
          Finance Studio
        </Text>
        <Text
          style={{
            color: t.muted,
            fontFamily: fontsReady ? fonts.regular : undefined,
            fontSize: 13,
          }}
        >
          Your money, in perspective.
        </Text>
      </View>
    </PaintedView>
  );
}
