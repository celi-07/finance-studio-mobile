import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { activity, dayLabel, today, type Currency, type Workspace } from '../domain/ledger';
import { Body, Panel, Title } from '../ui/primitives';
import { useTheme, wash } from '../ui/theme';
import { ActivityRow } from './ActivityRow';
export function ActivityCalendar({
  workspace,
  month,
  currency,
}: {
  workspace: Workspace;
  month: string;
  currency: Currency;
}) {
  const t = useTheme();
  const [selected, setSelected] = useState(today());
  const day = selected.startsWith(month) ? selected : month + '-01';
  const rows = activity(workspace, month, currency);
  const groups = Map.groupBy(rows, (row) => row.date);
  const first = new Date(month + '-01T00:00:00Z');
  const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return (
    <Panel tone="coral">
      <Title>Activity calendar</Title>
      <Body muted size={12}>
        Tap a date to see its entries · {currency}
      </Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => (
          <View
            key={'weekday-' + index}
            style={{ width: '14.2857%', alignItems: 'center', paddingBottom: 10 }}
          >
            <Body size={11} muted>
              {label}
            </Body>
          </View>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <View key={'blank-' + i} style={{ width: '14.2857%' }} />
        ))}
        {Array.from({ length: count }, (_, i) => {
          const date = month + '-' + String(i + 1).padStart(2, '0');
          const entries = groups.get(date) ?? [];
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityState={{ selected: day === date }}
              accessibilityLabel={`${dayLabel(date)}, ${entries.length} entries`}
              onPress={() => setSelected(date)}
              style={{
                width: '14.2857%',
                minHeight: 47,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                borderRadius: 10,
                backgroundColor: day === date ? wash(t, 'blue') : 'transparent',
                borderWidth: 1,
                borderColor: date === today() ? t.accent : 'transparent',
              }}
            >
              <Body bold={day === date} size={12}>
                {i + 1}
              </Body>
              <View style={{ flexDirection: 'row', gap: 3, height: 5 }}>
                {entries.some((r) => r.kind === 'income') && (
                  <View style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: t.mint }} />
                )}
                {entries.some((r) => r.kind === 'expense') && (
                  <View
                    style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: t.coral }}
                  />
                )}
                {entries.length > 0 &&
                  !entries.some((r) => r.kind === 'expense' || r.kind === 'income') && (
                    <View
                      style={{ width: 4, height: 4, borderRadius: 4, backgroundColor: t.blue }}
                    />
                  )}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Title>{dayLabel(day)}</Title>
      <View>
        {groups
          .get(day)
          ?.map((row) => (
            <ActivityRow key={row.id} row={row} workspace={workspace} currency={currency} />
          )) ?? <Body muted>No entries on this date.</Body>}
      </View>
    </Panel>
  );
}
