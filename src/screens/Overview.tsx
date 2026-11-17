import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowDownLeft,
  ArrowRight,
  HandCoins,
  Landmark,
  Plus,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import { activity, balances, money, periodReport, today } from '../domain/ledger';
import { Page } from '../components/Page';
import { ActivityRow } from '../components/ActivityRow';
import { Trends } from '../components/Trends';
import { ActivityCalendar } from '../components/ActivityCalendar';
import { useReport } from '../state/finance';
import { Body, Button, Empty, Glyph, Panel, Title, styles } from '../ui/primitives';
import { useTheme, type Tone } from '../ui/theme';

export function Overview() {
  const f = useReport('Overview');
  const t = useTheme();
  const navigation = useNavigation<any>();
  const report = periodReport(f.workspace, f.period, f.currency);
  const recent = activity(f.workspace, f.period, f.currency).slice(0, 5);
  const format = (value: number) => money(value, f.currency);
  const current = balances(f.workspace, today() + 'Z')
    .filter((row) => row.account.kind !== 'investment')
    .reduce((sum, row) => sum + row.value, 0);
  const goals = f.workspace.savings_goals.filter((g) => g.currency === f.currency);
  const reserved = goals.reduce((sum, row) => sum + row.reserved_minor, 0);
  const metrics = [
    {
      title: 'Income',
      amount: report.income,
      hint: 'Income earned this period',
      icon: ArrowDownLeft,
      tone: 'mint' as Tone,
    },
    {
      title: 'Personal spending',
      amount: report.spending,
      hint: format(report.gross) + ' paid before claims',
      icon: ShoppingBag,
      tone: 'coral' as Tone,
    },
    {
      title: 'Owed to you',
      amount: report.receivable,
      hint: report.claims.filter((c) => c.remaining > 0).length + ' open claims at period end',
      icon: HandCoins,
      tone: 'amber' as Tone,
    },
  ];
  return (
    <Page route="Overview">
      <View style={styles.stack}>
        {f.currencies.length > 1 && (
          <Panel>
            <Title>Balances by currency</Title>
            <Body muted size={12}>
              Each currency has its own totals.
            </Body>
            {f.currencies.map((currency) => {
              const r = periodReport(f.base, f.period, currency);
              return (
                <View key={currency} style={styles.between}>
                  <Button quiet onPress={() => f.setCurrency(currency)}>
                    {currency}
                  </Button>
                  <Title>{money(r.cash, currency)}</Title>
                </View>
              );
            })}
          </Panel>
        )}
        <Panel tone="orchid">
          <View style={styles.row}>
            <Glyph icon={Wallet} tone="orchid" />
            <Body bold>Cash balance</Body>
          </View>
          <Title size={35}>{format(report.cash)}</Title>
          <Body muted size={12}>
            Across your cash accounts at the reporting date
          </Body>
          <View
            style={[styles.between, { borderTopWidth: 1, borderColor: t.line, paddingTop: 14 }]}
          >
            <Body muted size={13}>
              Net cash flow
            </Body>
            <Body bold color={report.netCashFlow >= 0 ? t.positive : t.danger}>
              {format(report.netCashFlow)}
            </Body>
          </View>
          <View style={styles.between}>
            <Body muted size={12}>
              Cash in {format(report.cashIn)}
            </Body>
            <Body muted size={12}>
              Cash out {format(report.cashOut)}
            </Body>
          </View>
        </Panel>
        <Panel tone="mint">
          <Title>Period summary</Title>
          {metrics.map((metric) => (
            <View
              key={metric.title}
              style={{ gap: 5, borderTopWidth: 1, borderColor: t.line, paddingTop: 12 }}
            >
              <View style={styles.between}>
                <View style={styles.row}>
                  <Glyph icon={metric.icon} tone={metric.tone} />
                  <Body bold size={13}>
                    {metric.title}
                  </Body>
                </View>
                <Body bold size={14}>
                  {format(metric.amount)}
                </Body>
              </View>
              <Body muted size={11}>
                {metric.hint}
              </Body>
            </View>
          ))}
        </Panel>
        <Panel tone="amber">
          <Title>Spending breakdown</Title>
          <Body muted size={12}>
            Excludes amounts owed to you
          </Body>
          {report.categories.length ? (
            report.categories.map((row, i) => (
              <View key={row.id ?? ''} style={{ gap: 7 }}>
                <View style={styles.between}>
                  <Body size={13}>{row.name}</Body>
                  <Body size={13} bold>
                    {format(row.amount)}
                  </Body>
                </View>
                <View style={{ height: 7, backgroundColor: t.control, borderRadius: 6 }}>
                  <View
                    style={{
                      width: `${Math.min(100, (row.amount / Math.max(1, report.spending)) * 100)}%`,
                      height: 7,
                      backgroundColor: [t.mint, t.blue, t.orchid, t.coral, t.amber][i % 5],
                      borderRadius: 6,
                    }}
                  />
                </View>
              </View>
            ))
          ) : (
            <Empty
              title="No spending yet"
              description="Expenses for this period will appear here."
            />
          )}
        </Panel>
        <Panel tone="coral">
          <View style={styles.between}>
            <Title>Recent activity</Title>
            <Button quiet icon={ArrowRight} onPress={() => navigation.navigate('Transactions')}>
              View all
            </Button>
          </View>
          <View>
            {recent.length ? (
              recent.map((row) => (
                <ActivityRow key={row.id} row={row} currency={f.currency} workspace={f.workspace} />
              ))
            ) : (
              <Empty
                title="No activity this period"
                description="Record income or expenses from Entries."
              />
            )}
          </View>
        </Panel>
        <Panel tone="mint">
          <Title>Cash by account</Title>
          {report.accounts
            .filter(
              (r) => r.account.kind !== 'investment' && (!r.account.archived || r.value !== 0),
            )
            .map((row) => (
              <View key={row.account.id} style={styles.row}>
                <Glyph
                  icon={row.account.kind === 'investment' ? TrendingUp : Landmark}
                  tone={row.account.kind === 'investment' ? 'orchid' : 'blue'}
                />
                <View style={styles.grow}>
                  <Body bold size={13}>
                    {row.account.name}
                  </Body>
                  <Body muted size={11}>
                    {row.account.kind}
                  </Body>
                </View>
                <Body bold size={13}>
                  {format(row.value)}
                </Body>
              </View>
            ))}
          {!report.accounts.some(
            (r) => r.account.kind !== 'investment' && (!r.account.archived || r.value !== 0),
          ) && (
            <Empty
              title="No accounts yet"
              action={
                <Button secondary onPress={() => navigation.navigate('Settings')}>
                  Set up an account
                </Button>
              }
            />
          )}
        </Panel>
        <Panel tone="mint">
          <View style={styles.between}>
            <Title>Savings goals</Title>
            <Button quiet icon={Plus} onPress={() => f.open({ type: 'goal' })}>
              Add
            </Button>
          </View>
          <Body muted size={12}>
            Allocations as of today. Your bank balance stays the same.
          </Body>
          <View style={styles.between}>
            <Body>Available to spend</Body>
            <Title>{format(current - reserved)}</Title>
          </View>
          {goals.map((goal) => (
            <View
              key={goal.id}
              style={{ gap: 6, paddingTop: 10, borderTopWidth: 1, borderColor: t.line }}
            >
              <View style={styles.between}>
                <Title>{goal.name}</Title>
                <Button quiet onPress={() => f.open({ type: 'goal', original: goal })}>
                  Edit
                </Button>
              </View>
              <Body muted size={12}>
                {format(goal.reserved_minor)} of {format(goal.target_minor)}
                {goal.target_on ? ' · ' + goal.target_on : ''}
              </Body>
              <View style={{ height: 7, backgroundColor: t.control, borderRadius: 5 }}>
                <View
                  style={{
                    height: 7,
                    borderRadius: 5,
                    backgroundColor: t.mint,
                    width: `${Math.min(100, (goal.reserved_minor / Math.max(1, goal.target_minor)) * 100)}%`,
                  }}
                />
              </View>
            </View>
          ))}
          {!goals.length && (
            <Body muted size={13}>
              Set something aside for what matters next.
            </Body>
          )}
        </Panel>
        {f.mode === 'month' && (
          <ActivityCalendar workspace={f.workspace} month={f.month} currency={f.currency} />
        )}
        <Trends workspace={f.workspace} period={f.period} currency={f.currency} />
      </View>
    </Page>
  );
}
