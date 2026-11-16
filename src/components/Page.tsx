import { useState, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, FileDown, Plus } from 'lucide-react-native';
import { useTheme } from '../ui/theme';
import {
  Body,
  Brand,
  Button,
  ErrorNote,
  Segments,
  Select,
  Title,
  styles,
  useSubmission,
} from '../ui/primitives';
import { useWorkspace } from '../state/workspace';
import { useAuth } from '../state/auth';
import { useReport, type Route } from '../state/finance';
import { monthLabel, shiftMonth, type Currency } from '../domain/ledger';
import { shareStatement } from '../data/statement';
import type { StatementFilters } from '../domain/statement-html';

export function Page({
  route,
  children,
  scroll = true,
  statementFilters,
}: {
  route: Route;
  children: ReactNode | ((header: ReactNode) => ReactNode);
  scroll?: boolean;
  statementFilters?: StatementFilters;
}) {
  const t = useTheme();
  const { data, loading, refreshing, saving, error, store } = useWorkspace();
  const { demo } = useAuth();
  const f = useReport(route);
  const exporting = useSubmission();
  const [datePicker, setDatePicker] = useState(false);
  const reporting = route !== 'Settings' && route !== 'Assistant';
  const header = (
    <View style={{ gap: 17, marginBottom: 16 }}>
      <View style={styles.between}>
        <Brand />
        <Body size={11} muted>
          {demo ? 'Demo' : saving ? 'Saving…' : refreshing ? 'Syncing…' : 'Connected'}
        </Body>
      </View>
      <View style={styles.between}>
        <Title size={32}>{route}</Title>
        {reporting && (
          <Button icon={Plus} onPress={() => f.open({ type: 'entry' })}>
            Add entry
          </Button>
        )}
      </View>
      <Select
        label="Finance sheet"
        value={route === 'Overview' ? f.book : f.sheetId}
        onChange={f.setBook}
        options={[
          ...(route === 'Overview' ? [{ value: 'all', label: 'All sheets' }] : []),
          { value: '', label: 'Personal' },
          ...data.finance_books.map((book) => ({ value: book.id, label: book.name })),
        ]}
      />
      {reporting && (
        <>
          <Segments
            value={f.mode}
            onChange={f.setMode}
            options={[
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year' },
              { value: 'all', label: 'All time' },
            ]}
          />
          {f.mode !== 'all' && (
            <View
              style={[
                styles.between,
                {
                  borderWidth: 1,
                  borderColor: t.line,
                  borderRadius: 12,
                  backgroundColor: t.surface,
                },
              ]}
            >
              <Button
                quiet
                icon={ChevronLeft}
                label="Previous period"
                onPress={() => f.setMonth(shiftMonth(f.month, f.mode === 'year' ? -12 : -1))}
                disabled={f.month <= '1900-01'}
              />
              <Button quiet onPress={() => setDatePicker(!datePicker)}>
                {f.mode === 'year' ? f.month.slice(0, 4) : monthLabel(f.month)}
              </Button>
              <Button
                quiet
                icon={ChevronRight}
                label="Next period"
                onPress={() => f.setMonth(shiftMonth(f.month, f.mode === 'year' ? 12 : 1))}
                disabled={f.month >= '2199-01'}
              />
            </View>
          )}
          {datePicker && (
            <Select
              label="Jump to month"
              value={f.month}
              onChange={(value) => {
                f.setMonth(value);
                setDatePicker(false);
              }}
              options={Array.from({ length: 49 }, (_, i) => {
                const value = shiftMonth(f.month, i - 24);
                return { value, label: monthLabel(value) };
              })}
            />
          )}
          <View style={styles.between}>
            <View style={{ flex: 1 }}>
              <Select
                label="Reporting currency"
                value={f.currency}
                onChange={(value) => f.setCurrency(value as Currency)}
                options={(f.currencies.length ? f.currencies : [f.currency]).map((value) => ({
                  value,
                  label: value,
                }))}
              />
            </View>
            <Button
              secondary
              icon={FileDown}
              busy={exporting.busy}
              onPress={() =>
                exporting.run(() =>
                  shareStatement(f.workspace, f.period, f.currency, route, statementFilters, demo),
                )
              }
            >
              PDF
            </Button>
          </View>
        </>
      )}
      {(error || exporting.error) && <ErrorNote>{error || exporting.error}</ErrorNote>}
      {error && (
        <Button secondary onPress={() => void store.refresh()}>
          Retry refresh
        </Button>
      )}
    </View>
  );
  if (loading)
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 15 }}>
        <ActivityIndicator color={t.accent} />
        <Body muted>Loading your finances…</Body>
      </SafeAreaView>
    );
  const content = (
    <View
      style={{ maxWidth: 850, width: '100%', alignSelf: 'center', flex: scroll ? undefined : 1 }}
    >
      {typeof children === 'function' ? (
        children(header)
      ) : (
        <>
          {header}
          {children}
        </>
      )}
    </View>
  );
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 17, paddingBottom: 110 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={t.accent}
              onRefresh={() => void store.refresh()}
            />
          }
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 17, paddingTop: 17 }}>{content}</View>
      )}
    </SafeAreaView>
  );
}
