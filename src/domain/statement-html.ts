import {
  accountName,
  activity,
  activityLabel,
  cashLedger,
  money,
  periodLabel,
  periodReport,
  reimbursementReport,
  workspaceForCurrency,
  type Activity,
  type Currency,
  type Workspace,
} from './ledger';
export const escapeHtml = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
export type StatementFilters = { activity?: Activity[]; people?: string[] };
export function statementHtml(
  data: Workspace,
  period: string,
  currency: Currency,
  title: string,
  filters: StatementFilters = {},
  demo = false,
) {
  const workspace = workspaceForCurrency(data, currency);
  const report = periodReport(workspace, period, currency);
  const format = (value: number) => money(value, currency);
  const table = (heading: string, columns: string[], rows: unknown[][]) =>
    `<h2>${escapeHtml(heading)}</h2><table><thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${columns.length}">No activity in this view</td></tr>`}</tbody></table>`;
  const activityTable = (rows: Activity[]) =>
    table(
      'Transaction activity',
      ['Date', 'Description / account', 'Type', 'Amount'],
      rows.map((row) => [
        row.date,
        row.title + '\n' + accountName(workspace, row.accountId),
        activityLabel(row),
        format(row.amount),
      ]),
    );
  const claimsTable = () => {
    const r = reimbursementReport(workspace, period, filters.people);
    return (
      table(
        'Claims and balances',
        ['Expense / person', 'Claimed', 'Received', 'Outstanding'],
        r.claims.map((c) => [
          c.entry.description + '\n' + c.counterparty,
          format(c.amount_minor),
          format(c.paid),
          format(c.remaining),
        ]),
      ) +
      table(
        'Payments received',
        ['Date', 'Account / notes', 'Amount'],
        r.receipts.map((row) => [
          row.received_on,
          accountName(workspace, row.account_id) + '\n' + row.notes,
          format(row.amount_minor),
        ]),
      )
    );
  };
  const investmentTable = () =>
    table(
      'Investment holdings',
      ['Holding / last valuation', 'Contributed balance', 'Estimated value'],
      report.accounts
        .filter((row) => row.account.kind === 'investment')
        .map((row) => [
          row.account.name + (row.valuation ? '\nValued ' + row.valuation.valued_on : ''),
          format(row.basis),
          format(row.value),
        ]),
    );
  let content = '';
  if (title === 'Transactions') {
    const cash = cashLedger(workspace, period, currency);
    const included = filters.activity ? new Set(filters.activity.map((row) => row.id)) : null;
    content = filters.activity
      ? '<p>Filtered line items. Running balances and totals cover the full selected period and currency.</p>'
      : '';
    content += table(
      'Cash ledger',
      ['Date', 'Description / account', 'Recorded', 'Cash change', 'Balance'],
      [
        ['', 'Opening cash balance', '', '', format(cash.start)],
        ...cash.rows
          .filter((row) => !row.row || !included || included.has(row.row.id))
          .map((row) => [
            row.date,
            row.row ? row.row.title + '\n' + row.account : 'Account opening · ' + row.account,
            format(row.row ? Math.abs(row.row.amount) : row.opening),
            format(row.change),
            format(row.balance),
          ]),
        ['', 'Closing cash balance', '', '', format(cash.end)],
      ],
    );
  } else if (title === 'Reimbursements') content = claimsTable();
  else if (title === 'Investments')
    content =
      investmentTable() +
      activityTable(
        activity(workspace, period, currency).filter((row) => row.kind.startsWith('investment_')),
      );
  else
    content =
      table(
        'Financial summary',
        ['Measure', 'Amount'],
        [
          ['Income', format(report.income)],
          ['Gross expenses', format(report.gross)],
          ['Personal spending', format(report.spending)],
          ['Reimbursements received', format(report.collected)],
          ['Owed to you', format(report.receivable)],
          ['Investments', format(report.invested)],
          ['Cash in', format(report.cashIn)],
          ['Cash out', format(report.cashOut)],
          ['Net cash flow', format(report.netCashFlow)],
          ['Cash balance', format(report.cash)],
        ],
      ) +
      table(
        'Spending breakdown',
        ['Category', 'Personal share'],
        report.categories.map((row) => [row.name, format(row.amount)]),
      ) +
      activityTable(activity(workspace, period, currency)) +
      claimsTable() +
      investmentTable();
  return `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4;margin:16mm}body{font:11px -apple-system,Arial,sans-serif;color:#182033}h1{font-size:25px}h2{font-size:15px;margin-top:24px}p{color:#526079}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{padding:8px 4px;border-bottom:1px solid #e0e5ee;text-align:left;white-space:pre-wrap;overflow-wrap:anywhere}td:last-child,th:last-child{text-align:right}thead{display:table-header-group}tr{break-inside:avoid}</style></head><body><h1>Finance Studio · ${escapeHtml(title)}</h1><p>${escapeHtml(periodLabel(period))} · ${escapeHtml(currency)}${demo ? ' · DEMO DATA' : ''} · Reporting timezone: Asia/Jakarta</p>${content}<p>Investment estimates reflect manually entered valuations. Each currency is reported separately.</p></body></html>`;
}
