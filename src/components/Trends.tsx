import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import {
  overviewHistory,
  money,
  monthLabel,
  type Currency,
  type Workspace,
} from '../domain/ledger';
import { Body, Panel, Title, styles } from '../ui/primitives';
import { useTheme } from '../ui/theme';
export function Trends({
  workspace,
  period,
  currency,
}: {
  workspace: Workspace;
  period: string;
  currency: Currency;
}) {
  const t = useTheme();
  const series = overviewHistory(workspace, period, currency);
  const min = Math.min(0, ...series.map((s) => s.wealth));
  const max = Math.max(1, ...series.map((s) => s.wealth));
  const barMax = Math.max(1, ...series.flatMap((s) => [s.income, s.expenses]));
  const points = series.map((row, i) => ({
    x: 10 + (i / Math.max(1, series.length - 1)) * 300,
    y: 120 - ((row.wealth - min) / (max - min)) * 105,
  }));
  return (
    <View style={styles.stack}>
      <Panel>
        <Title>Net wealth</Title>
        <Body muted size={12}>
          Cash + investments + owed to you · {currency}
        </Body>
        <Title size={25}>{money(series.at(-1)?.wealth ?? 0, currency)}</Title>
        <View
          accessible
          accessibilityLabel={series
            .map((s) => monthLabel(s.month) + ': ' + money(s.wealth, currency))
            .join('. ')}
        >
          <Svg width="100%" height={145} viewBox="0 0 320 140">
            {[15, 50, 85, 120].map((y) => (
              <Line key={y} x1={0} x2={320} y1={y} y2={y} stroke={t.line} strokeDasharray="4 4" />
            ))}
            <Polyline
              points={points.map((p) => p.x + ',' + p.y).join(' ')}
              stroke={t.accent}
              strokeWidth={2.5}
              fill="none"
            />
            {points.map((p) => (
              <Circle key={p.x} cx={p.x} cy={p.y} r={3} fill={t.accent} />
            ))}
          </Svg>
          <View style={styles.between}>
            <Body muted size={10}>
              {monthLabel(series[0].month)}
            </Body>
            <Body muted size={10}>
              {monthLabel(series.at(-1)!.month)}
            </Body>
          </View>
        </View>
      </Panel>
      <Panel tone="mint">
        <Title>Monthly income and expenses</Title>
        <View style={styles.row}>
          <Body size={11} color={t.flowIn}>
            ● Income
          </Body>
          <Body size={11} color={t.flowOut}>
            ● Expenses
          </Body>
        </View>
        <View style={{ flexDirection: 'row', gap: 7, alignItems: 'flex-end', height: 150 }}>
          {series.map((row) => (
            <View
              key={row.month}
              style={{ flex: 1, gap: 6 }}
              accessible
              accessibilityLabel={`${monthLabel(row.month)}. Income ${money(row.income, currency)}, expenses ${money(row.expenses, currency)}`}
            >
              <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 3 }}>
                <View
                  style={{
                    flex: 1,
                    height: Math.max(2, (row.income / barMax) * 120),
                    backgroundColor: t.flowIn,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
                <View
                  style={{
                    flex: 1,
                    height: Math.max(2, (row.expenses / barMax) * 120),
                    backgroundColor: t.flowOut,
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                  }}
                />
              </View>
              <Body muted size={9} style={{ textAlign: 'center' }}>
                {monthLabel(row.month).slice(0, 3)}
              </Body>
            </View>
          ))}
        </View>
      </Panel>
    </View>
  );
}
