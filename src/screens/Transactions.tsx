import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';
import { activity, accountName, kinds } from '../domain/ledger';
import { Page } from '../components/Page';
import { ActivityRow } from '../components/ActivityRow';
import { useReport } from '../state/finance';
import { useWorkspace } from '../state/workspace';
import { Body, Button, Empty, Input, Panel, Select, styles } from '../ui/primitives';
import { useTheme } from '../ui/theme';
export function Transactions() {
  const f = useReport('Transactions');
  const t = useTheme();
  const { refreshing, store } = useWorkspace();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [account, setAccount] = useState('');
  const rows = useMemo(
    () =>
      activity(f.workspace, f.period, f.currency).filter(
        (row) =>
          (!kind || row.kind === kind || (kind === 'balance_update' && row.balanceUpdate)) &&
          (!account ||
            row.accountId === account ||
            row.entry?.destination_account_id === account) &&
          (!search.trim() ||
            [
              row.title,
              row.category,
              accountName(f.workspace, row.accountId),
              row.entry?.notes,
              row.entry?.counterparty,
            ].some((text) => text?.toLowerCase().includes(search.trim().toLowerCase()))),
      ),
    [f.workspace, f.period, f.currency, search, kind, account],
  );
  return (
    <Page
      route="Transactions"
      scroll={false}
      statementFilters={search || kind || account ? { activity: rows } : undefined}
    >
      {(header) => (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.id}
          initialNumToRender={12}
          refreshing={refreshing}
          onRefresh={() => void store.refresh()}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 110 }}
          ListHeaderComponent={
            <View style={{ gap: 14, marginBottom: 10 }}>
              {header}
              <Panel tone="amber">
                <Input
                  label="Search transactions"
                  placeholder="Description, category, notes…"
                  value={search}
                  onChangeText={setSearch}
                />
                <View style={styles.row}>
                  <View style={styles.grow}>
                    <Select
                      label="Filter by type"
                      value={kind}
                      onChange={setKind}
                      options={[
                        { value: '', label: 'All types' },
                        ...Object.entries(kinds).map(([value, label]) => ({ value, label })),
                        { value: 'reimbursement_receipt', label: 'Reimbursement received' },
                        { value: 'balance_update', label: 'Balance updates' },
                      ]}
                    />
                  </View>
                  <View style={styles.grow}>
                    <Select
                      label="Filter by account"
                      value={account}
                      onChange={setAccount}
                      options={[
                        { value: '', label: 'All accounts' },
                        ...f.workspace.accounts.map((a) => ({ value: a.id, label: a.name })),
                      ]}
                    />
                  </View>
                </View>
                {!!(search || kind || account) && (
                  <Button
                    quiet
                    onPress={() => {
                      setSearch('');
                      setKind('');
                      setAccount('');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </Panel>
              <Body muted size={12}>
                {rows.length} {rows.length === 1 ? 'entry' : 'entries'}
              </Body>
            </View>
          }
          ListEmptyComponent={
            <Panel>
              <Empty
                title="No transactions found"
                description="Choose another period, clear the filters, or add an entry."
              />
            </Panel>
          }
          renderItem={({ item }) => (
            <View
              style={{
                paddingHorizontal: 13,
                backgroundColor: t.surface,
                borderRadius: 14,
                marginBottom: 5,
              }}
            >
              <ActivityRow row={item} workspace={f.workspace} currency={f.currency} />
            </View>
          )}
        />
      )}
    </Page>
  );
}
