import { useState } from 'react';
import { View } from 'react-native';
import { HandCoins, Plus } from 'lucide-react-native';
import { money, reimbursementReport } from '../domain/ledger';
import { useReport } from '../state/finance';
import { Page } from '../components/Page';
import {
  Body,
  Button,
  Empty,
  Glyph,
  Panel,
  Segments,
  Select,
  Title,
  styles,
} from '../ui/primitives';
import { useTheme } from '../ui/theme';
export function Reimbursements() {
  const f = useReport('Reimbursements');
  const t = useTheme();
  const [status, setStatus] = useState('All');
  const [person, setPerson] = useState('');
  const report = reimbursementReport(f.workspace, f.period, person ? [person] : []);
  const rows = report.claims.filter((row) => status === 'All' || row.status === status);
  return (
    <Page
      route="Reimbursements"
      statementFilters={{ people: person ? [person] : [] }}
      filterCount={Number(status !== 'All') + Number(!!person)}
      filters={
        <View style={styles.stack}>
          <Segments
            value={status}
            onChange={setStatus}
            options={['All', 'Pending', 'Partial', 'Settled'].map((value) => ({
              value,
              label: value,
            }))}
          />
          <Select
            label="Filter by person"
            value={person}
            onChange={setPerson}
            options={[
              { value: '', label: 'All people' },
              ...reimbursementReport(f.workspace, f.period).people.map((value) => ({
                value,
                label: value,
              })),
            ]}
          />
          <Button
            quiet
            onPress={() => {
              setStatus('All');
              setPerson('');
            }}
          >
            Clear claim filters
          </Button>
        </View>
      }
    >
      <View style={styles.stack}>
        <Panel tone="amber">
          <View style={styles.row}>
            <Glyph icon={HandCoins} tone="amber" />
            <Title>Outstanding</Title>
          </View>
          <Title size={32}>{money(report.outstanding, f.currency)}</Title>
          <View style={styles.between}>
            <Body muted size={12}>
              New claims {money(report.newClaims, f.currency)}
            </Body>
            <Body muted size={12}>
              Collected {money(report.collected, f.currency)}
            </Body>
          </View>
        </Panel>
        {rows.map((row) => (
          <Panel key={row.key} tone="amber">
            <View style={styles.between}>
              <View style={styles.grow}>
                <Title>{row.entry.description}</Title>
                <Body muted size={12}>
                  {row.counterparty} · {row.entry.occurred_on}
                </Body>
              </View>
              <Body bold size={12} color={row.overdue ? t.danger : t.amber}>
                {row.overdue ? 'Overdue' : row.status}
              </Body>
            </View>
            <View style={styles.between}>
              <Body muted>Remaining</Body>
              <Title size={22}>{money(row.remaining, f.currency)}</Title>
            </View>
            <Body muted size={12}>
              {money(row.paid, f.currency)} received of {money(row.amount_minor, f.currency)}
              {row.due_on ? ' · Due ' + row.due_on : ''}
            </Body>
            <View style={{ height: 6, backgroundColor: t.control, borderRadius: 5 }}>
              <View
                style={{
                  height: 6,
                  borderRadius: 5,
                  backgroundColor: t.mint,
                  width: `${Math.min(100, (row.paid / row.amount_minor) * 100)}%`,
                }}
              />
            </View>
            <View style={styles.actions}>
              <Button secondary onPress={() => f.open({ type: 'entry', original: row.entry })}>
                View expense
              </Button>
              {row.remaining > 0 && (
                <Button
                  icon={Plus}
                  onPress={() =>
                    f.open({ type: 'receipt', expenseId: row.entry.id, claimId: row.id })
                  }
                >
                  Record payment
                </Button>
              )}
            </View>
            {row.receipts.map((receipt) => (
              <View
                key={receipt.id}
                style={[styles.between, { borderTopWidth: 1, borderColor: t.line, paddingTop: 10 }]}
              >
                <Body size={12}>{receipt.received_on}</Body>
                <Button
                  quiet
                  onPress={() =>
                    f.open({
                      type: 'detail',
                      collection: 'reimbursement_receipts',
                      original: receipt,
                    })
                  }
                >
                  {money(receipt.amount_minor, f.currency)}
                </Button>
              </View>
            ))}
          </Panel>
        ))}
        {!rows.length && (
          <Panel tone="amber">
            <Empty
              title="No claims in this view"
              description="Reimbursable expenses and received payments will appear here."
            />
          </Panel>
        )}
      </View>
    </Page>
  );
}
