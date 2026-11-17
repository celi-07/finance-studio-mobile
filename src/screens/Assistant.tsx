import { useState } from 'react';
import { View } from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { quickEntry, reviseQuickEntry, type QuickDraft } from '../domain/quick-entry';
import { money, parseMoney } from '../domain/ledger';
import { Page } from '../components/Page';
import { useReport } from '../state/finance';
import {
  Body,
  Button,
  ErrorNote,
  Glyph,
  Input,
  Panel,
  Title,
  styles,
  useSubmission,
} from '../ui/primitives';
export function Assistant() {
  const f = useReport('Assistant');
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<QuickDraft | null>(null);
  const [scope, setScope] = useState('');
  const task = useSubmission();
  const current = scope === f.sheetId ? draft : null;
  return (
    <Page route="Assistant">
      <View style={styles.stack}>
        <Panel tone="orchid">
          <View style={styles.row}>
            <Glyph icon={Sparkles} tone="orchid" />
            <Title>Entry assistant</Title>
          </View>
          <Body muted>
            Describe one income or expense. The same local rules as the website prepare a draft for
            you to review.
          </Body>
          <Body size={13}>Try “Beli nasi goreng Rp47.900 hari ini”, then “pakai Main bank”.</Body>
          <Input
            label="Your message"
            placeholder="What did you spend or earn?"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Button
            icon={Send}
            onPress={() =>
              task.run(async () => {
                const next = current
                  ? reviseQuickEntry(f.bookData, current, text)
                  : quickEntry(f.bookData, text, f.currency);
                setDraft(next);
                setScope(f.sheetId);
                setText('');
              })
            }
          >
            Prepare draft
          </Button>
          {!!task.error && <ErrorNote>{task.error}</ErrorNote>}
        </Panel>
        {current && (
          <Panel tone="amber">
            <Title>Review your draft</Title>
            <Title fit size={27}>
              {money(parseMoney(current.draft.amount, current.currency) ?? 0, current.currency)}
            </Title>
            <Body bold>{current.draft.description || 'Add a description'}</Body>
            <Body muted>
              {current.draft.kind} · {current.draft.occurred_on}
            </Body>
            <Body muted>
              {f.bookData.accounts.find((a) => a.id === current.draft.account_id)?.name ??
                'Choose an account'}
            </Body>
            <Button onPress={() => f.open({ type: 'entry', draft: current.draft })}>
              Review and save
            </Button>
            <Button
              quiet
              onPress={() => {
                setDraft(null);
                setText('');
              }}
            >
              Start a new draft
            </Button>
          </Panel>
        )}
      </View>
    </Page>
  );
}
