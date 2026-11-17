import { View } from 'react-native';
import { LogOut, Plus } from 'lucide-react-native';
import { useAuth } from '../state/auth';
import { useWorkspace } from '../state/workspace';
import { useReport, type ManagementCollection } from '../state/finance';
import { Page } from '../components/Page';
import { Body, Button, ErrorNote, Panel, Title, styles, useSubmission } from '../ui/primitives';
import { accountCurrency } from '../domain/ledger';
export function Settings() {
  const auth = useAuth();
  const f = useReport('Settings');
  const { data, syncedAt, store } = useWorkspace();
  const task = useSubmission();
  const sections: {
    title: string;
    collection: ManagementCollection;
    rows: { id: string; label: string; hint: string; original: any }[];
  }[] = [
    {
      title: 'Financial accounts',
      collection: 'accounts',
      rows: f.bookData.accounts.map((row) => ({
        id: row.id,
        label: row.name,
        hint: row.kind + ' · ' + accountCurrency(row) + (row.archived ? ' · Archived' : ''),
        original: row,
      })),
    },
    {
      title: 'Categories',
      collection: 'categories',
      rows: f.bookData.categories.map((row) => ({
        id: row.id,
        label: row.name,
        hint: row.applicable_kind + (row.archived ? ' · Archived' : ''),
        original: row,
      })),
    },
    {
      title: 'Custom fields',
      collection: 'field_definitions',
      rows: f.bookData.field_definitions.map((row) => ({
        id: row.id,
        label: row.label,
        hint:
          row.field_type +
          (row.required ? ' · Required' : '') +
          (row.archived ? ' · Archived' : ''),
        original: row,
      })),
    },
    {
      title: 'Reimbursement people',
      collection: 'reimbursement_people',
      rows: f.bookData.reimbursement_people.map((row) => ({
        id: row.id,
        label: row.name,
        hint: row.archived ? 'Archived' : 'Saved person',
        original: row,
      })),
    },
    {
      title: 'Finance sheets',
      collection: 'finance_books',
      rows: data.finance_books.map((row) => ({
        id: row.id,
        label: row.name,
        hint: 'Separate accounts and records',
        original: row,
      })),
    },
  ];
  return (
    <Page route="Settings">
      <View style={styles.stack}>
        <Panel tone="mint">
          <Title>{auth.demo ? 'Demo workspace' : 'Your account'}</Title>
          <Body muted>
            {auth.demo ? 'Fictional data, saved only on this device.' : auth.session?.user.email}
          </Body>
          <Body size={12} muted>
            {syncedAt
              ? 'Last refreshed ' + new Date(syncedAt).toLocaleTimeString()
              : 'Waiting to sync'}
          </Body>
          <Button secondary onPress={() => void store.refresh()}>
            Refresh records
          </Button>
          <Button secondary onPress={() => f.open({ type: 'balance' })}>
            Record a balance update
          </Button>
          <Button
            icon={LogOut}
            quiet
            busy={task.busy}
            onPress={() =>
              task.run(async () => {
                if (auth.demo) auth.leaveDemo();
                else await auth.signOut();
              })
            }
          >
            {auth.demo ? 'Leave demo' : 'Sign out'}
          </Button>
          {!!task.error && <ErrorNote>{task.error}</ErrorNote>}
        </Panel>
        {sections.map((section) => (
          <Panel tone="mint" key={section.collection}>
            <View style={styles.between}>
              <Title>{section.title}</Title>
              <Button
                icon={Plus}
                quiet
                onPress={() => f.open({ type: 'manage', collection: section.collection })}
              >
                Add
              </Button>
            </View>
            {section.collection === 'finance_books' && (
              <Body muted size={12}>
                Personal is the default sheet.
              </Body>
            )}
            {section.rows.map((row) => (
              <View key={row.id} style={styles.between}>
                <View style={styles.grow}>
                  <Body bold size={13}>
                    {row.label}
                  </Body>
                  <Body size={11} muted>
                    {row.hint}
                  </Body>
                </View>
                <Button
                  secondary
                  onPress={() =>
                    f.open({
                      type: 'manage',
                      collection: section.collection,
                      original: row.original,
                    })
                  }
                >
                  Edit
                </Button>
              </View>
            ))}
            {!section.rows.length && (
              <Body muted size={13}>
                No {section.title.toLowerCase()} in this sheet yet.
              </Body>
            )}
          </Panel>
        ))}
        <Body muted size={11}>
          Finance Studio · Mobile 1.0.0{'\n'}Reporting dates use Asia/Jakarta. Currencies are never
          combined or converted.
        </Body>
      </View>
    </Page>
  );
}
