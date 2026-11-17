import { forwardRef, useId, useState, type ComponentRef, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { alpha, blend, useRouteTone, useTheme, wash, type Tone } from './theme';

type Paint =
  'canvas' | 'panel' | 'cash' | 'summary' | 'navigation' | 'selection' | 'button' | 'glyph';
// CSS gradient angles and color mixes are copied from the website's globals.css.
function endpoints(degrees: number, width: number, height: number) {
  const a = (degrees * Math.PI) / 180,
    x = Math.sin(a),
    y = -Math.cos(a);
  const length = Math.abs(width * x) + Math.abs(height * y);
  return {
    x1: (width - x * length) / 2,
    y1: (height - y * length) / 2,
    x2: (width + x * length) / 2,
    y2: (height + y * length) / 2,
  };
}
function PaintLayer({
  paint,
  tone,
  width,
  height,
}: {
  paint: Paint;
  tone: Tone;
  width: number;
  height: number;
}) {
  const t = useTheme(),
    id = useId().replace(/:/g, ''),
    tint = wash(t, tone);
  const base: string[] =
    paint === 'cash'
      ? [t.surface, t.orchidWash, t.mintWash]
      : paint === 'summary'
        ? [blend(t.surface, tint, 0.51), alpha(t.surface, 0.48)]
        : paint === 'canvas'
          ? [t.canvas, t.canvasEnd]
          : paint === 'navigation'
            ? [t.navStart, t.navEnd]
            : paint === 'selection'
              ? [blend(t.surface, tint, 0.73), tint]
              : paint === 'button'
                ? [t.actionTop, t.action]
                : paint === 'glyph'
                  ? [blend(t.surface, tint, 0.58), tint]
                  : [t.surface, blend(t.surfaceEnd, tint, 0.4)];
  const angle =
    paint === 'cash'
      ? 120
      : paint === 'summary'
        ? 105
        : paint === 'canvas' || paint === 'button'
          ? 155
          : paint === 'panel'
            ? 148
            : paint === 'navigation'
              ? 151
              : 150;
  const clouds =
    paint === 'cash'
      ? [
          {
            color: t.amberWash,
            cx: width,
            cy: height * 1.1,
            rx: width * 0.5,
            ry: height * 1.3,
            end: 0.76,
            opacity: 1,
          },
        ]
      : paint === 'canvas'
        ? [
            {
              color: t.canvasMint,
              cx: width * 0.86,
              cy: 672,
              rx: 816,
              ry: 704,
              end: 0.8,
              opacity: 1,
            },
            {
              color: t.canvasPeach,
              cx: width * 1.01,
              cy: 0,
              rx: 832,
              ry: 544,
              end: 0.79,
              opacity: 1,
            },
            {
              color: t.canvasOrchid,
              cx: width * 0.01,
              cy: height * -0.03,
              rx: 864,
              ry: 736,
              end: 0.77,
              opacity: 1,
            },
          ]
        : paint === 'panel'
          ? [{ color: tint, cx: width, cy: 0, rx: 592, ry: 384, end: 0.83, opacity: 0.9 }]
          : paint === 'navigation'
            ? [
                {
                  color: tint,
                  cx: 0,
                  cy: 0,
                  rx: width * Math.SQRT2,
                  ry: height * Math.SQRT2,
                  end: 0.68,
                  opacity: 0.75,
                },
              ]
            : [];
  if (width <= 0 || height <= 0) return null;
  return (
    <Svg
      width={width}
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden
    >
      <Defs>
        <LinearGradient
          id={`${id}base`}
          gradientUnits="userSpaceOnUse"
          {...endpoints(angle, width, height)}
        >
          {(paint === 'cash'
            ? [0.05, 0.53, 0.96]
            : [
                paint === 'panel' ? 0.1 : paint === 'navigation' ? 0.09 : 0,
                paint === 'summary' ? 0.9 : 1,
              ]
          ).map((offset, i) => (
            <Stop key={i} offset={offset} stopColor={base[i]} />
          ))}
        </LinearGradient>
        {clouds.map((c, i) => (
          <RadialGradient
            key={i}
            id={`${id}cloud${i}`}
            gradientUnits="userSpaceOnUse"
            cx={0}
            cy={0}
            r={1}
            gradientTransform={`translate(${c.cx} ${c.cy}) scale(${c.rx} ${c.ry})`}
          >
            <Stop offset="0" stopColor={c.color} stopOpacity={c.opacity} />
            <Stop offset={c.end} stopColor={c.color} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect width={width} height={height} fill={`url(#${id}base)`} />
      {clouds.map((_, i) => (
        <Rect key={i} width={width} height={height} fill={`url(#${id}cloud${i})`} />
      ))}
    </Svg>
  );
}
type PaintedViewProps = ViewProps & {
  paint?: Paint;
  tone?: Tone;
  radius?: number;
  inset?: number;
  children?: ReactNode;
};
export const PaintedView = forwardRef<ComponentRef<typeof View>, PaintedViewProps>(
  function PaintedView(
    {
      paint = 'panel',
      tone,
      radius = 20,
      inset = 1,
      children,
      onLayout,
      ...props
    }: PaintedViewProps,
    ref,
  ) {
    const routeTone = useRouteTone();
    const [size, setSize] = useState({ width: 0, height: 0 });
    return (
      <View
        {...props}
        ref={ref}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setSize((old) =>
            old.width === width && old.height === height ? old : { width, height },
          );
          onLayout?.(event);
        }}
      >
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              top: inset,
              left: inset,
              right: inset,
              bottom: inset,
              borderRadius: Math.max(0, radius - inset),
              overflow: 'hidden',
            },
          ]}
        >
          <PaintLayer
            paint={paint}
            tone={tone ?? routeTone}
            width={size.width - inset * 2}
            height={size.height - inset * 2}
          />
        </View>
        {children}
      </View>
    );
  },
);
