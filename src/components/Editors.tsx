import { useRef, useState, type ReactNode } from 'react';
import { Switch, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import {
  accountCurrency,
  activeFields,
  amountExample,
  amountText,
  balanceBeforeUpdate,
  blankDraft,
  claims,
  currencies,
  currencyForAccount,
  draftFrom,
  editableAccounts,
  historicalAccounts,
  kinds,
  money,
  needsDestination,
  newId,
  parseDate,
  parseMoney,
  today,
  validateFormEntry,
  workspaceForBook,
  type Currency,
  type EntryDraft,
  type ReimbursementMode,
} from '../domain/ledger';
import { useFinance, useReport, type Editor } from '../state/finance';
import { useWorkspace } from '../state/workspace';
import {
  Body,
  Button,
  ErrorNote,
  Input,
  Select,
  Sheet,
  Title,
  styles,
  useSubmission,
} from '../ui/primitives';
import { useTheme } from '../ui/theme';

function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <View style={styles.between}>
      <Body style={styles.grow}>{label}</Body>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: t.accent }}
      />
    </View>
  );
}
function Actions({
  task,
  save,
  remove,
  label = 'Save',
  children,
}: {
  task: ReturnType<typeof useSubmission>;
  save?: () => Promise<void>;
  remove?: () => Promise<void>;
  label?: string;
  children?: ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <View style={{ gap: 12, marginTop: 18 }}>
      {!!task.error && <ErrorNote>{task.error}</ErrorNote>}
      {children}
      {save && (
        <Button busy={task.busy} onPress={() => task.run(save)}>
          {label}
        </Button>
      )}
      {remove &&
        (!confirm ? (
          <Button quiet danger icon={Trash2} disabled={task.busy} onPress={() => setConfirm(true)}>
            Delete
          </Button>
        ) : (
          <>
            <ErrorNote>Delete this record permanently?</ErrorNote>
            <Button secondary danger busy={task.busy} onPress={() => task.run(remove)}>
              Confirm deletion
            </Button>
            <Button quiet disabled={task.busy} onPress={() => setConfirm(false)}>
              Keep record
            </Button>
          </>
        ))}
    </View>
  );
}

function EntryForm({ editor }: { editor: Extract<Editor, { type: 'entry' }> }) {
  const f = useReport();
  const t = useTheme();
  const { data, store } = useWorkspace();
  const { original } = editor;
  const [sheetId] = useState(() =>
    original
      ? (data.accounts.find((a) => a.id === original.account_id)?.ledger_id ?? '')
      : f.sheetId,
  );
  const workspace = workspaceForBook(data, sheetId);
  const [draft, setDraft] = useState<EntryDraft>(() =>
    original
      ? draftFrom(original, currencyForAccount(data, original.account_id))
      : (editor.draft ?? blankDraft(workspace, f.month)),
  );
  const [mode, setMode] = useState<ReimbursementMode>(() =>
    original?.reimbursement_claims
      ? 'split'
      : original?.reimbursable_minor
        ? original.amount_minor === original.reimbursable_minor
          ? 'full'
          : 'partial'
        : editor.claim
          ? 'full'
          : 'none',
  );
  const initial = useRef(JSON.stringify({ draft, mode }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const task = useSubmission();
  const currency = currencyForAccount(data, draft.account_id);
  const patch = (change: Partial<EntryDraft>) => setDraft((current) => ({ ...current, ...change }));
  const source = editableAccounts(workspace, draft.kind, false, original?.account_id);
  const destination = editableAccounts(
    workspace,
    draft.kind,
    true,
    original?.destination_account_id,
  ).filter((a) => a.id !== draft.account_id && accountCurrency(a) === currency);
  const field = (key: keyof EntryDraft, label: string, extra: any = {}) => (
    <Input
      label={label}
      value={String(draft[key] ?? '')}
      onChangeText={(value) => patch({ [key]: value })}
      error={errors[key]}
      editable={!task.busy}
      {...extra}
    />
  );
  return (
    <Sheet
      title={original ? 'Edit entry' : editor.claim ? 'Add reimbursement' : 'Add entry'}
      dirty={initial.current !== JSON.stringify({ draft, mode })}
      onClose={f.close}
      locked={task.busy}
    >
      <View style={styles.stack} pointerEvents={task.busy ? 'none' : 'auto'}>
        <Body muted size={12}>
          {sheetId ? data.finance_books.find((b) => b.id === sheetId)?.name : 'Personal'} ·{' '}
          {currency}
        </Body>
        {editor.claim && (
          <Body muted>
            Record the expense you paid, then choose how much is owed back and by whom.
          </Body>
        )}
        {!editor.claim && (
          <Select
            label="Entry type"
            value={draft.kind}
            onChange={(kind) => {
              const accounts = editableAccounts(workspace, kind);
              patch({
                kind,
                account_id: accounts.some((a) => a.id === draft.account_id)
                  ? draft.account_id
                  : (accounts[0]?.id ?? ''),
                destination_account_id: null,
                category_id: null,
              });
            }}
            options={Object.entries(kinds).map(([value, label]) => ({ value, label }))}
            disabled={task.busy}
          />
        )}
        {field('description', 'Description', { maxLength: 160, placeholder: 'What was this for?' })}
        {field('amount', 'Amount (' + currency + ')', {
          keyboardType: 'decimal-pad',
          placeholder: amountExample(currency),
          style: { fontSize: 28, fontWeight: '600' },
        })}
        {field('occurred_on', 'Date', { placeholder: 'YYYY-MM-DD', autoCapitalize: 'none' })}
        <Select
          label="Account"
          value={draft.account_id}
          onChange={(account_id) => patch({ account_id, destination_account_id: null })}
          options={source.map((a) => ({ value: a.id, label: a.name + ' · ' + accountCurrency(a) }))}
          disabled={task.busy}
        />
        {!!errors.account_id && <ErrorNote>{errors.account_id}</ErrorNote>}
        {!source.length && (
          <Button secondary onPress={() => f.open({ type: 'manage', collection: 'accounts' })}>
            Create a financial account first
          </Button>
        )}
        {needsDestination(draft.kind) && (
          <>
            <Select
              label="Destination account"
              value={draft.destination_account_id ?? ''}
              onChange={(destination_account_id) => patch({ destination_account_id })}
              options={[
                { value: '', label: 'Choose destination' },
                ...destination.map((a) => ({ value: a.id, label: a.name })),
              ]}
              disabled={task.busy}
            />
            {!!errors.destination_account_id && (
              <ErrorNote>{errors.destination_account_id}</ErrorNote>
            )}
          </>
        )}
        {(draft.kind === 'expense' || draft.kind === 'income') && (
          <Select
            label="Category"
            value={draft.category_id ?? ''}
            onChange={(value) => patch({ category_id: value || null })}
            options={[
              { value: '', label: 'Uncategorized' },
              ...workspace.categories
                .filter(
                  (c) =>
                    c.applicable_kind === draft.kind &&
                    (!c.archived || c.id === original?.category_id),
                )
                .map((c) => ({ value: c.id, label: c.name })),
            ]}
            disabled={task.busy}
          />
        )}
        {!!historicalAccounts(workspace, draft).length && (
          <Body muted size={12}>
            This entry predates account tracking. It appears in reports and leaves the tracked
            opening balance unchanged.
          </Body>
        )}
        {draft.kind === 'expense' && (
          <>
            <Select
              label="Reimbursement"
              value={mode}
              onChange={(value) => {
                setMode(value as ReimbursementMode);
                if (value === 'split' && !draft.people?.length)
                  patch({
                    people: [
                      {
                        id: original?.id ?? newId(),
                        amount: draft.reimbursable,
                        counterparty: draft.counterparty,
                        due_on: draft.due_on,
                      },
                    ],
                  });
              }}
              options={[
                ...(!editor.claim ? [{ value: 'none', label: 'None' }] : []),
                { value: 'partial', label: 'Partial' },
                { value: 'full', label: 'Full' },
                { value: 'split', label: 'Split between people' },
              ]}
              disabled={task.busy}
            />
            {mode !== 'none' && mode !== 'split' && (
              <>
                {mode === 'partial' &&
                  field('reimbursable', 'Amount owed back', { keyboardType: 'decimal-pad' })}
                {field('counterparty', 'Owed by')}
                {workspace.reimbursement_people.filter((p) => !p.archived).length > 0 && (
                  <Select
                    label="Saved people"
                    value=""
                    onChange={(value) => patch({ counterparty: value })}
                    options={[
                      { value: '', label: 'Choose a saved person' },
                      ...workspace.reimbursement_people
                        .filter((p) => !p.archived)
                        .map((p) => ({ value: p.name, label: p.name })),
                    ]}
                  />
                )}
                {field('due_on', 'Due date (optional)', { placeholder: 'YYYY-MM-DD' })}
              </>
            )}
            {mode === 'split' && (
              <>
                {draft.people?.map((person, index) => {
                  const update = (change: Partial<typeof person>) =>
                    patch({
                      people: draft.people!.map((p) =>
                        p.id === person.id ? { ...p, ...change } : p,
                      ),
                    });
                  return (
                    <View
                      key={person.id}
                      style={{
                        padding: 12,
                        borderWidth: 1,
                        borderColor: t.strongLine,
                        borderRadius: 12,
                        gap: 10,
                      }}
                    >
                      <Title>Person {index + 1}</Title>
                      <Input
                        label="Owed by"
                        value={person.counterparty}
                        onChangeText={(counterparty) => update({ counterparty })}
                        error={errors[person.id + '-person']}
                      />
                      <Input
                        label="Amount owed"
                        keyboardType="decimal-pad"
                        value={person.amount}
                        onChangeText={(amount) => update({ amount })}
                        error={errors[person.id + '-amount']}
                      />
                      <Input
                        label="Due date (optional)"
                        placeholder="YYYY-MM-DD"
                        value={person.due_on ?? ''}
                        onChangeText={(due_on) => update({ due_on: due_on || null })}
                        error={errors[person.id + '-date']}
                      />
                      <Button
                        quiet
                        danger
                        onPress={() =>
                          patch({ people: draft.people!.filter((p) => p.id !== person.id) })
                        }
                      >
                        Remove person
                      </Button>
                    </View>
                  );
                })}
                <Button
                  secondary
                  icon={Plus}
                  disabled={(draft.people?.length ?? 0) >= 30}
                  onPress={() =>
                    patch({
                      people: [
                        ...(draft.people ?? []),
                        { id: newId(), amount: '', counterparty: '', due_on: null },
                      ],
                    })
                  }
                >
                  Add person
                </Button>
              </>
            )}
            {!!errors.reimbursable && <ErrorNote>{errors.reimbursable}</ErrorNote>}
          </>
        )}
        {field('notes', 'Notes (optional)', { multiline: true })}
        {activeFields(workspace).map((def) => (
          <View key={def.id}>
            {def.field_type === 'checkbox' ? (
              <Toggle
                label={def.label + (def.required ? ' *' : '')}
                value={draft.custom[def.id] === true}
                onChange={(value) => patch({ custom: { ...draft.custom, [def.id]: value } })}
              />
            ) : def.field_type === 'select' ? (
              <Select
                label={def.label + (def.required ? ' *' : '')}
                value={String(draft.custom[def.id] ?? '')}
                onChange={(value) => patch({ custom: { ...draft.custom, [def.id]: value } })}
                options={[
                  { value: '', label: 'Choose ' + def.label },
                  ...def.options.map((value) => ({ value, label: value })),
                ]}
              />
            ) : (
              <Input
                label={def.label + (def.required ? ' *' : '')}
                value={String(draft.custom[def.id] ?? '')}
                onChangeText={(value) => patch({ custom: { ...draft.custom, [def.id]: value } })}
                keyboardType={def.field_type === 'number' ? 'decimal-pad' : 'default'}
                placeholder={def.field_type === 'date' ? 'YYYY-MM-DD' : ''}
              />
            )}
            {!!errors[def.id] && <ErrorNote>{errors[def.id]}</ErrorNote>}
          </View>
        ))}
        <Actions
          task={task}
          save={async () => {
            const result = validateFormEntry(workspace, draft, mode);
            if (result.errors) {
              setErrors(result.errors);
              throw Error('Review the highlighted fields before saving.');
            }
            await store.save('transactions', result.entry, original);
            f.close();
          }}
          remove={
            original
              ? async () => {
                  if (
                    data.reimbursement_receipts.some(
                      (row) =>
                        row.expense_id === original.id || row.income_entry_id === original.id,
                    )
                  )
                    throw Error(
                      'Remove or unlink the associated reimbursement payments before deleting this entry.',
                    );
                  await store.remove('transactions', original);
                  f.close();
                }
              : undefined
          }
        />
      </View>
    </Sheet>
  );
}

function ManagementForm({ editor }: { editor: Extract<Editor, { type: 'manage' }> }) {
  const f = useReport();
  const { store } = useWorkspace();
  const collection = editor.collection;
  const original = editor.original as any;
  const [id] = useState(original?.id ?? newId);
  const [name, setName] = useState<string>(original?.name ?? original?.label ?? '');
  const [kind, setKind] = useState(original?.kind ?? original?.applicable_kind ?? 'bank');
  const [currency, setCurrency] = useState<Currency>(original?.currency ?? f.currency);
  const [opening, setOpening] = useState(
    original ? amountText(original.opening_minor ?? 0, currency) : '',
  );
  const [date, setDate] = useState(original?.opening_date ?? today());
  const [archived, setArchived] = useState(original?.archived ?? false);
  const [required, setRequired] = useState(original?.required ?? false);
  const [type, setType] = useState(original?.field_type ?? 'text');
  const [options, setOptions] = useState(original?.options?.join('\n') ?? '');
  const [color, setColor] = useState(original?.color ?? 'green');
  const [sheetId] = useState(original?.ledger_id ?? f.sheetId);
  const values = { name, kind, currency, opening, date, archived, required, type, options, color };
  const initial = useRef(JSON.stringify(values));
  const task = useSubmission();
  const titles = {
    accounts: 'account',
    categories: 'category',
    field_definitions: 'custom field',
    finance_books: 'finance sheet',
    reimbursement_people: 'person',
  };
  const max =
    collection === 'finance_books' ? 60 : collection === 'reimbursement_people' ? 160 : 70;
  return (
    <Sheet
      title={(original ? 'Edit ' : 'Add ') + titles[collection]}
      dirty={initial.current !== JSON.stringify(values)}
      onClose={f.close}
      locked={task.busy}
    >
      <View style={styles.stack} pointerEvents={task.busy ? 'none' : 'auto'}>
        <Input
          label={collection === 'field_definitions' ? 'Label' : 'Name'}
          value={name}
          onChangeText={setName}
          maxLength={max}
        />
        {collection === 'accounts' && (
          <>
            <Select
              label="Account type"
              value={kind}
              onChange={setKind}
              disabled={!!original}
              options={['bank', 'wallet', 'cash', 'investment'].map((value) => ({
                value,
                label: value[0].toUpperCase() + value.slice(1),
              }))}
            />
            <Select
              label="Currency"
              value={currency}
              onChange={(value) => setCurrency(value as Currency)}
              disabled={!!original}
              options={Object.entries(currencies).map(([value, label]) => ({
                value,
                label: value + ' · ' + label,
              }))}
            />
            <Input
              label={'Starting balance (' + currency + ')'}
              value={opening}
              onChangeText={setOpening}
              keyboardType="decimal-pad"
              placeholder={amountExample(currency)}
            />
            <Input
              label="Start tracking from"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </>
        )}
        {collection === 'categories' && (
          <>
            <Select
              label="Applies to"
              value={['income', 'expense'].includes(kind) ? kind : 'expense'}
              onChange={setKind}
              options={[
                { value: 'expense', label: 'Expenses' },
                { value: 'income', label: 'Income' },
              ]}
            />
            <Select
              label="Color"
              value={color}
              onChange={setColor}
              options={[
                'green',
                'blue',
                'amber',
                'violet',
                'rose',
                'teal',
                'cyan',
                'indigo',
                'plum',
                'peach',
                'lime',
                'slate',
                'gold',
              ].map((value) => ({ value, label: value }))}
            />
          </>
        )}
        {collection === 'field_definitions' && (
          <>
            <Select
              label="Field type"
              value={type}
              onChange={setType}
              options={['text', 'number', 'date', 'select', 'checkbox'].map((value) => ({
                value,
                label: value,
              }))}
            />
            {type === 'select' && (
              <Input
                label="Options (one per line)"
                value={options}
                onChangeText={setOptions}
                multiline
              />
            )}
            <Toggle label="Required" value={required} onChange={setRequired} />
          </>
        )}
        {original && collection !== 'finance_books' && (
          <Toggle label="Archived" value={archived} onChange={setArchived} />
        )}
        <Actions
          task={task}
          save={async () => {
            const clean = name.trim();
            if (!clean || clean.length > max)
              throw Error('Enter a name up to ' + max + ' characters.');
            let row: any = { id, name: clean, ledger_id: sheetId || null, archived };
            if (collection === 'accounts') {
              const amount = parseMoney(opening || '0', currency);
              const openingDate = parseDate(date);
              if (amount === null) throw Error('Enter a valid starting balance.');
              if (!openingDate || openingDate > today())
                throw Error('Choose an opening date through today.');
              row = { ...row, kind, currency, opening_minor: amount, opening_date: openingDate };
            } else if (collection === 'categories')
              row = { ...row, applicable_kind: kind === 'income' ? 'income' : 'expense', color };
            else if (collection === 'field_definitions') {
              const choices = [
                ...new Set(
                  options
                    .split('\n')
                    .map((s: string) => s.trim())
                    .filter(Boolean),
                ),
              ];
              if (
                type === 'select' &&
                (!choices.length ||
                  choices.length > 40 ||
                  choices.some((s) => (s as string).length > 100))
              )
                throw Error('Enter 1 to 40 options, up to 100 characters each.');
              row = {
                id,
                ledger_id: sheetId || null,
                label: clean,
                field_type: type,
                options: type === 'select' ? choices : [],
                required,
                archived,
                position: original?.position ?? f.bookData.field_definitions.length,
              };
            } else if (collection === 'finance_books') {
              if (clean.toLowerCase() === 'personal')
                throw Error('Personal is the default sheet. Choose another name.');
              row = { id, name: clean };
            }
            await store.save(collection, row, original);
            if (collection === 'finance_books' && !original) f.setBook(id);
            f.close();
          }}
        />
      </View>
    </Sheet>
  );
}

function GoalForm({ editor }: { editor: Extract<Editor, { type: 'goal' }> }) {
  const f = useReport();
  const { store } = useWorkspace();
  const { original } = editor;
  const [id] = useState(() => original?.id ?? newId());
  const [sheetId] = useState(original?.ledger_id ?? f.sheetId);
  const [name, setName] = useState(original?.name ?? '');
  const [currency, setCurrency] = useState<Currency>(original?.currency ?? f.currency);
  const [target, setTarget] = useState(original ? amountText(original.target_minor, currency) : '');
  const [reserved, setReserved] = useState(
    original ? amountText(original.reserved_minor, currency) : '',
  );
  const [date, setDate] = useState(original?.target_on ?? '');
  const task = useSubmission();
  return (
    <Sheet
      title={original ? 'Edit savings goal' : 'Add savings goal'}
      onClose={f.close}
      locked={task.busy}
    >
      <View style={styles.stack} pointerEvents={task.busy ? 'none' : 'auto'}>
        <Input label="Goal name" value={name} onChangeText={setName} maxLength={70} />
        <Select
          label="Currency"
          value={currency}
          disabled={!!original}
          onChange={(value) => setCurrency(value as Currency)}
          options={Object.entries(currencies).map(([value, label]) => ({
            value,
            label: value + ' · ' + label,
          }))}
        />
        <Input
          label="Target amount"
          value={target}
          onChangeText={setTarget}
          keyboardType="decimal-pad"
        />
        <Input
          label="Amount set aside"
          value={reserved}
          onChangeText={setReserved}
          keyboardType="decimal-pad"
        />
        <Input
          label="Target date (optional)"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
        <Actions
          task={task}
          save={async () => {
            const targetMinor = parseMoney(target, currency),
              reservedMinor = parseMoney(reserved || '0', currency);
            if (!name.trim() || name.trim().length > 70)
              throw Error('Enter a goal name up to 70 characters.');
            if (!targetMinor || reservedMinor === null)
              throw Error('Set a positive target and a valid amount to set aside.');
            const targetOn = date ? parseDate(date) : null;
            if (date && !targetOn) throw Error('Enter a valid target date.');
            await store.save(
              'savings_goals',
              {
                id,
                ledger_id: sheetId || null,
                name: name.trim(),
                currency,
                target_minor: targetMinor,
                reserved_minor: reservedMinor,
                target_on: targetOn,
              },
              original,
            );
            f.close();
          }}
          remove={
            original
              ? async () => {
                  await store.remove('savings_goals', original);
                  f.close();
                }
              : undefined
          }
        />
      </View>
    </Sheet>
  );
}

function BalanceForm({ editor }: { editor: Extract<Editor, { type: 'balance' | 'valuation' }> }) {
  const f = useReport();
  const { data, store } = useWorkspace();
  const valuation = editor.type === 'valuation';
  const original = editor.original;
  const [id] = useState(() => original?.id ?? newId());
  const [accountId, setAccountId] = useState(() =>
    valuation
      ? editor.accountId
      : (editor.original?.account_id ??
        editor.accountId ??
        f.bookData.accounts.find((a) => !a.archived)?.id ??
        ''),
  );
  const [date, setDate] = useState(() =>
    original ? ('valued_on' in original ? original.valued_on : original.recorded_on) : today(),
  );
  const account = data.accounts.find((a) => a.id === accountId);
  const currency = accountCurrency(account);
  const [amount, setAmount] = useState(() =>
    original
      ? amountText(
          'value_minor' in original ? original.value_minor : original.balance_minor,
          currency,
        ) || '0'
      : '',
  );
  const [frequency, setFrequency] = useState(() =>
    original && 'frequency' in original ? original.frequency : 'monthly',
  );
  const task = useSubmission();
  const normalizedDate = parseDate(date);
  const before =
    normalizedDate && accountId ? balanceBeforeUpdate(data, accountId, normalizedDate) : 0;
  return (
    <Sheet
      title={valuation ? 'Investment valuation' : 'Balance update'}
      onClose={f.close}
      locked={task.busy}
    >
      <View style={styles.stack} pointerEvents={task.busy ? 'none' : 'auto'}>
        <Select
          label="Account"
          value={accountId}
          onChange={setAccountId}
          disabled={!!original || valuation}
          options={data.accounts
            .filter((a) => !a.archived || a.id === accountId)
            .map((a) => ({ value: a.id, label: a.name + ' · ' + accountCurrency(a) }))}
        />
        <Input
          label="Date"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          editable={!original}
        />
        {!valuation && (
          <Select
            label="Frequency"
            value={frequency}
            onChange={(value) => setFrequency(value as 'weekly' | 'monthly')}
            options={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
        )}
        <Input
          label={
            (valuation ? 'End-of-day value' : 'Actual end-of-day balance') + ' (' + currency + ')'
          }
          value={amount}
          onChangeText={setAmount}
          keyboardType="numbers-and-punctuation"
        />
        {!valuation && (
          <Body muted size={12}>
            Tracked before this check: {money(before, currency)}. The difference is reflected in
            reports.
          </Body>
        )}
        <Actions
          task={task}
          save={async () => {
            const parsed = parseDate(date);
            const negative = amount.trim().startsWith('-');
            const value = parseMoney(negative ? amount.trim().slice(1) : amount, currency);
            if (
              !account ||
              account.archived ||
              !parsed ||
              parsed < account.opening_date ||
              parsed > today()
            )
              throw Error('Choose an active account and a date from its opening through today.');
            if (value === null || (negative && (valuation || account.kind === 'investment')))
              throw Error('Enter a valid balance. Investment values must be zero or more.');
            if (valuation)
              await store.save(
                'investment_valuations',
                { id, investment_account_id: accountId, valued_on: parsed, value_minor: value },
                editor.type === 'valuation' ? editor.original : undefined,
              );
            else
              await store.save(
                'balance_updates',
                {
                  id,
                  account_id: accountId,
                  recorded_on: parsed,
                  frequency: frequency as 'weekly' | 'monthly',
                  balance_minor: negative ? -value : value,
                },
                editor.type === 'balance' ? editor.original : undefined,
              );
            f.close();
          }}
          remove={
            original && !valuation
              ? async () => {
                  if (editor.type === 'balance' && editor.original)
                    await store.remove('balance_updates', editor.original);
                  f.close();
                }
              : undefined
          }
        />
      </View>
    </Sheet>
  );
}

function ReceiptForm({ editor }: { editor: Extract<Editor, { type: 'receipt' }> }) {
  const f = useReport();
  const { data, store } = useWorkspace();
  const [id] = useState(newId);
  const claim = claims(data).find(
    (c) => c.entry.id === editor.expenseId && c.id === editor.claimId,
  );
  const currency = claim ? currencyForAccount(data, claim.entry.account_id) : f.currency;
  const sheet = data.accounts.find((a) => a.id === claim?.entry.account_id)?.ledger_id ?? '';
  const workspace = workspaceForBook(data, sheet);
  const accounts = workspace.accounts.filter(
    (a) => !a.archived && a.kind !== 'investment' && accountCurrency(a) === currency,
  );
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState(() => amountText(claim?.remaining ?? 0, currency));
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [incomeId, setIncomeId] = useState('');
  const used = new Set(data.reimbursement_receipts.map((r) => r.income_entry_id));
  const income = workspace.transactions.filter(
    (e) =>
      e.kind === 'income' &&
      !used.has(e.id) &&
      currencyForAccount(data, e.account_id) === currency &&
      e.amount_minor <= (claim?.remaining ?? 0) &&
      e.occurred_on >= (claim?.entry.occurred_on ?? '') &&
      e.occurred_on <= today(),
  );
  const task = useSubmission();
  return (
    <Sheet title="Record reimbursement" onClose={f.close} locked={task.busy}>
      <View style={styles.stack} pointerEvents={task.busy ? 'none' : 'auto'}>
        <Title>{claim?.entry.description ?? 'Claim no longer available'}</Title>
        <Body muted>
          {claim?.counterparty} · Remaining {money(claim?.remaining ?? 0, currency)}
        </Body>
        <Select
          label="Payment source"
          value={incomeId}
          onChange={(value) => {
            setIncomeId(value);
            const row = income.find((e) => e.id === value);
            if (row) {
              setAccountId(row.account_id);
              setAmount(amountText(row.amount_minor, currency));
              setDate(row.occurred_on);
            }
          }}
          options={[
            { value: '', label: 'Record a new deposit' },
            ...income.map((e) => ({
              value: e.id,
              label: 'Link income: ' + e.description + ' · ' + money(e.amount_minor, currency),
            })),
          ]}
        />
        <Select
          label="Deposit account"
          value={accountId}
          onChange={setAccountId}
          disabled={!!incomeId}
          options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        />
        <Input
          label={'Amount received (' + currency + ')'}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!incomeId}
        />
        <Input
          label="Date received"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          editable={!incomeId}
        />
        <Input label="Notes (optional)" value={notes} onChangeText={setNotes} />
        <Actions
          task={task}
          save={async () => {
            const value = parseMoney(amount, currency),
              parsed = parseDate(date);
            if (!claim || claim.remaining <= 0) throw Error('This claim has already been settled.');
            if (!value || value > claim.remaining)
              throw Error('Enter an amount up to the remaining claim.');
            const account = accounts.find((a) => a.id === accountId);
            if (!account || !parsed || parsed < claim.entry.occurred_on || parsed > today())
              throw Error(
                'Choose a valid deposit account and a date from the expense through today.',
              );
            await store.save('reimbursement_receipts', {
              id,
              expense_id: claim.entry.id,
              claim_id: claim.id,
              income_entry_id: incomeId || null,
              account_id: accountId,
              amount_minor: value,
              received_on: parsed,
              notes: notes.trim(),
            });
            f.close();
          }}
        />
      </View>
    </Sheet>
  );
}

function Detail({ editor }: { editor: Extract<Editor, { type: 'detail' }> }) {
  const f = useFinance();
  const { store } = useWorkspace();
  const task = useSubmission();
  const row = editor.original as any;
  const grouped = !!row.payment_group_id;
  return (
    <Sheet title="Payment details" onClose={f.close} locked={task.busy}>
      <View style={styles.stack} pointerEvents={task.busy ? 'none' : 'auto'}>
        <Body>Date: {row.received_on}</Body>
        <Body>Notes: {row.notes || '—'}</Body>
        {grouped && (
          <Body muted>Part of a combined payment. Manage the whole payment on the website.</Body>
        )}
        <Actions
          task={task}
          remove={
            !grouped
              ? async () => {
                  await store.remove(editor.collection, editor.original);
                  f.close();
                }
              : undefined
          }
        />
      </View>
    </Sheet>
  );
}

export function Editors() {
  const { editor } = useFinance();
  if (!editor) return null;
  switch (editor.type) {
    case 'entry':
      return <EntryForm editor={editor} />;
    case 'manage':
      return <ManagementForm editor={editor} />;
    case 'goal':
      return <GoalForm editor={editor} />;
    case 'balance':
    case 'valuation':
      return <BalanceForm editor={editor} />;
    case 'receipt':
      return <ReceiptForm editor={editor} />;
    case 'detail':
      return <Detail editor={editor} />;
  }
}
