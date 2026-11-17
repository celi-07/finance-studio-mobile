import { useState, type ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, FileDown, Plus, SlidersHorizontal } from 'lucide-react-native';
import { usePullRefresh } from '../ui/use-pull-refresh';
import { PageMotionProvider, RevealGroup } from '../ui/motion';
import { RouteToneProvider, routeTones } from '../ui/theme';
import { useTheme } from '../ui/theme';
import {
  Body,
  Brand,
  Button,
  ErrorNote,
  Segments,
  Sheet,
  Select,
  Title,
  styles,
  useSubmission,
} from '../ui/primitives';
import { useWorkspace } from '../state/workspace';
import { useAuth } from '../state/auth';
import { useReport, type Route } from '../state/finance';
import { blankDraft, monthLabel, shiftMonth, type Currency } from '../domain/ledger';
import { shareStatement } from '../data/statement';
import type { StatementFilters } from '../domain/statement-html';
import { routeLabels, screenBottomPadding } from '../ui/layout';

export function Page({
  route,
  children,
  scroll = true,
  statementFilters,
  filters,
  filterCount = 0,
}: {
  route: Route;
  children: ReactNode | ((header: ReactNode) => ReactNode);
  scroll?: boolean;
  statementFilters?: StatementFilters;
  filters?: ReactNode;
  filterCount?: number;
}) {
  const t = useTheme();
  const pull = usePullRefresh();
  const insets = useSafeAreaInsets();
  const { data, loading, refreshing, saving, error, store } = useWorkspace();
  const { demo } = useAuth();
  const f = useReport(route);
  const exporting = useSubmission();
  const [datePicker, setDatePicker] = useState(false);
  const [filtering, setFiltering] = useState(false);
  const reporting = route !== 'Settings' && route !== 'Assistant';
  const header = (
    <View style={{ gap: 17, marginBottom: 16 }}>
      <RevealGroup>
        <View style={styles.between}>
          <Brand />
          <Body size={11} muted>
            {demo ? 'Demo' : saving ? 'Saving…' : refreshing ? 'Syncing…' : 'Connected'}
          </Body>
        </View>
        <View testID="page-heading" style={[styles.between, { minHeight: 48 }]}>
          <View style={styles.grow}>
            <Title size={30}>{routeLabels[route]}</Title>
          </View>
          {route === 'Settings' && (
            <Button
              icon={Plus}
              label="Add finance sheet"
              onPress={() => f.open({ type: 'manage', collection: 'finance_books' })}
            >
              Add sheet
            </Button>
          )}
          {reporting && route !== 'Overview' && (
            <Button
              icon={Plus}
              onPress={() =>
                f.open({
                  type: 'entry',
                  ...(route === 'Reimbursements'
                    ? { claim: true, draft: blankDraft(f.bookData, f.month, 'expense') }
                    : {}),
                })
              }
            >
              {route === 'Reimbursements' ? 'Add claim' : 'Add entry'}
            </Button>
          )}
        </View>
        <View style={styles.row}>
          <View style={styles.grow}>
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
          </View>
        </View>
        {reporting && (
          <View style={[styles.between, { flexWrap: 'wrap' }]}>
            <Button secondary icon={SlidersHorizontal} onPress={() => setFiltering(true)}>
              {filterCount ? `Filters (${filterCount})` : 'Filters'}
            </Button>
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
        )}
        {reporting && (
          <Body muted size={12}>
            {f.mode === 'all'
              ? 'All time'
              : f.mode === 'year'
                ? f.month.slice(0, 4)
                : monthLabel(f.month)}
            {' \u00b7 '}
            {f.currency}
            {filterCount
              ? ` \u00b7 ${filterCount} active ${filterCount === 1 ? 'filter' : 'filters'}`
              : ''}
          </Body>
        )}
        {!!(error || exporting.error) && <ErrorNote>{error || exporting.error}</ErrorNote>}
        {!!error && (
          <Button secondary onPress={() => void store.refresh()}>
            Retry refresh
          </Button>
        )}
      </RevealGroup>
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
    <RouteToneProvider value={routeTones[route]}>
      <PageMotionProvider>
        <View testID="page-content" style={{ flex: 1 }}>
          <View
            testID="screen-safe-area"
            style={{
              flex: 1,
              paddingTop: insets.top,
              paddingLeft: insets.left,
              paddingRight: insets.right,
            }}
          >
            {filtering && (
              <Sheet
                title="Filters"
                onClose={() => {
                  setFiltering(false);
                  setDatePicker(false);
                }}
              >
                <View style={styles.stack}>
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
                        onPress={() =>
                          f.setMonth(shiftMonth(f.month, f.mode === 'year' ? -12 : -1))
                        }
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
                  <Select
                    label="Reporting currency"
                    value={f.currency}
                    onChange={(value) => f.setCurrency(value as Currency)}
                    options={(f.currencies.length ? f.currencies : [f.currency]).map((value) => ({
                      value,
                      label: value,
                    }))}
                  />
                  {filters}
                  <Button onPress={() => setFiltering(false)}>Show results</Button>
                </View>
              </Sheet>
            )}
            {scroll ? (
              <ScrollView
                testID="screen-scroll"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  padding: 17,
                  paddingBottom: screenBottomPadding(insets.bottom),
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={pull.refreshing}
                    tintColor={t.accent}
                    onRefresh={pull.onRefresh}
                  />
                }
              >
                {content}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, paddingHorizontal: 17, paddingTop: 17 }}>{content}</View>
            )}
          </View>
        </View>
      </PageMotionProvider>
    </RouteToneProvider>
  );
}
