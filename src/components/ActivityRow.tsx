import { Pressable, View } from 'react-native';
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  ChevronRight,
  ReceiptText,
  TicketCheck,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native';
import {
  accountName,
  activityMoney,
  dayLabel,
  type Activity,
  type Currency,
  type Workspace,
} from '../domain/ledger';
import { Body, Glyph, styles } from '../ui/primitives';
import { useTheme, type Tone } from '../ui/theme';
import { useFinance } from '../state/finance';
export function ActivityRow({
  row,
  workspace,
  currency,
}: {
  row: Activity;
  workspace: Workspace;
  currency: Currency;
}) {
  const t = useTheme();
  const f = useFinance();
  const icons = {
    expense: ReceiptText,
    income: Wallet,
    transfer: ArrowLeftRight,
    investment_contribution: TrendingUp,
    investment_withdrawal: TrendingDown,
    reimbursement_receipt: TicketCheck,
    balance_update: ChartNoAxesCombined,
  };
  const tones: Record<string, Tone> = {
    expense: 'coral',
    income: 'mint',
    transfer: 'blue',
    investment_contribution: 'orchid',
    investment_withdrawal: 'blue',
    reimbursement_receipt: 'mint',
    balance_update: 'orchid',
  };
  function open() {
    f.setBook(workspace.accounts.find((a) => a.id === row.accountId)?.ledger_id ?? '');
    if (row.balanceUpdate) f.open({ type: 'balance', original: row.balanceUpdate });
    else if (row.entry) f.open({ type: 'entry', original: row.entry });
    else if (row.receipt)
      f.open({ type: 'detail', collection: 'reimbursement_receipts', original: row.receipt });
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.title}, ${activityMoney(row, currency)}`}
      onPress={open}
      style={({ pressed }) => [
        { paddingVertical: 13, borderTopWidth: 1, borderColor: t.line, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.row}>
        <Glyph icon={icons[row.kind]} tone={tones[row.kind]} />
        <View style={styles.grow}>
          <Body bold size={13} lines={2}>
            {row.title}
          </Body>
          <Body muted size={11} lines={1}>
            {row.category} · {accountName(workspace, row.accountId)}
          </Body>
        </View>
        <ChevronRight size={14} color={t.muted} />
      </View>
      <View style={[styles.between, { marginLeft: 50, marginTop: 4 }]}>
        <Body muted size={11}>
          {dayLabel(row.date)}
        </Body>
        <Body bold size={13} color={row.amount > 0 && row.kind !== 'transfer' ? t.positive : t.ink}>
          {activityMoney(row, currency)}
        </Body>
      </View>
    </Pressable>
  );
}
