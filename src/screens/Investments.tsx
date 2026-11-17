import { View } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { blankDraft, money, periodReport } from '../domain/ledger';
import { Page } from '../components/Page';
import { useReport } from '../state/finance';
import { Body, Button, Empty, Glyph, Panel, Title, styles } from '../ui/primitives';
import { ActivityRow } from '../components/ActivityRow';
import { activity } from '../domain/ledger';
export function Investments() {
  const f = useReport('Investments');
  const report = periodReport(f.workspace, f.period, f.currency);
  const rows = report.accounts.filter(
    (row) => row.account.kind === 'investment' && (!row.account.archived || row.value),
  );
  return (
    <Page route="Investments">
      <View style={styles.stack}>
        <Panel tone="orchid">
          <View style={styles.row}>
            <Glyph icon={TrendingUp} tone="orchid" />
            <Title>Investment estimate</Title>
          </View>
          <Title fit size={34}>
            {money(report.invested, f.currency)}
          </Title>
          <Body muted size={12}>
            Latest manually entered value plus later contributions, less withdrawals.
          </Body>
          <View style={styles.between}>
            <Body muted size={12}>
              Contributed {money(report.contribution, f.currency)}
            </Body>
            <Body muted size={12}>
              Withdrawn {money(report.withdrawal, f.currency)}
            </Body>
          </View>
        </Panel>
        {rows.map((row) => (
          <Panel tone="orchid" key={row.account.id}>
            <Title>{row.account.name}</Title>
            <Title fit size={27}>
              {money(row.value, f.currency)}
            </Title>
            <Body muted size={12}>
              Contributed basis {money(row.basis, f.currency)}
              {row.valuation ? ' · Valued ' + row.valuation.valued_on : ' · No valuation yet'}
            </Body>
            <Button
              secondary
              onPress={() => f.open({ type: 'valuation', accountId: row.account.id })}
            >
              Update valuation
            </Button>
            <View style={styles.row}>
              <Button
                quiet
                onPress={() =>
                  f.open({
                    type: 'entry',
                    draft: blankDraft(
                      f.bookData,
                      f.month,
                      'investment_contribution',
                      row.account.id,
                    ),
                  })
                }
              >
                Contribute
              </Button>
              <Button
                quiet
                onPress={() =>
                  f.open({
                    type: 'entry',
                    draft: blankDraft(f.bookData, f.month, 'investment_withdrawal', row.account.id),
                  })
                }
              >
                Withdraw
              </Button>
            </View>
            {f.workspace.investment_valuations
              .filter((v) => v.investment_account_id === row.account.id)
              .toSorted((a, b) => b.valued_on.localeCompare(a.valued_on))
              .slice(0, 6)
              .map((value) => (
                <View key={value.id} style={styles.between}>
                  <Body muted size={12}>
                    {value.valued_on} · {money(value.value_minor, f.currency)}
                  </Body>
                  <Button
                    quiet
                    onPress={() =>
                      f.open({ type: 'valuation', accountId: row.account.id, original: value })
                    }
                  >
                    Edit
                  </Button>
                </View>
              ))}
          </Panel>
        ))}
        {!rows.length && (
          <Panel tone="orchid">
            <Empty
              title="No investments yet"
              action={
                <Button
                  secondary
                  onPress={() => f.open({ type: 'manage', collection: 'accounts' })}
                >
                  Add investment account
                </Button>
              }
            />
          </Panel>
        )}
        <Panel tone="orchid">
          <Title>Investment movements</Title>
          {activity(f.workspace, f.period, f.currency)
            .filter((row) => row.kind.startsWith('investment_'))
            .map((row) => (
              <ActivityRow key={row.id} row={row} currency={f.currency} workspace={f.workspace} />
            ))}
          {!report.contribution && !report.withdrawal && (
            <Body muted>No movements this period.</Body>
          )}
        </Panel>
      </View>
    </Page>
  );
}
