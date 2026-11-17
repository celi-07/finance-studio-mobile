import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  accountCurrency,
  today,
  workspaceForBook,
  workspaceForCurrency,
  type BalanceUpdate,
  type Collection,
  type Currency,
  type Entry,
  type EntryDraft,
  type Receipt,
  type SavingsGoal,
  type Valuation,
} from '../domain/ledger';
import type { Row } from '../data/repository';
import { useWorkspace } from './workspace';

export type Route =
  'Overview' | 'Transactions' | 'Reimbursements' | 'Investments' | 'Assistant' | 'Settings';
export type ManagementCollection =
  'accounts' | 'categories' | 'field_definitions' | 'finance_books' | 'reimbursement_people';
export type Editor =
  | { type: 'entry'; original?: Entry; draft?: EntryDraft; claim?: boolean }
  | { type: 'manage'; collection: ManagementCollection; original?: Row }
  | { type: 'goal'; original?: SavingsGoal }
  | { type: 'valuation'; accountId: string; original?: Valuation }
  | { type: 'balance'; accountId?: string; original?: BalanceUpdate }
  | { type: 'receipt'; expenseId: string; claimId: string; original?: Receipt }
  | { type: 'detail'; collection: Collection; original: Row };
type Finance = {
  book: string;
  setBook: (id: string) => void;
  currency: Currency;
  setCurrency: (value: Currency) => void;
  month: string;
  setMonth: (value: string) => void;
  mode: string;
  setMode: (value: string) => void;
  editor: Editor | null;
  open: (value: Editor) => void;
  close: () => void;
};
const Context = createContext<Finance>(null!);
export function FinanceProvider({ children }: { children: ReactNode }) {
  const [book, setBook] = useState('all');
  const [currency, setCurrency] = useState<Currency>('IDR');
  const [month, setMonth] = useState(today().slice(0, 7));
  const [mode, setMode] = useState('month');
  const [editor, setEditor] = useState<Editor | null>(null);
  return (
    <Context.Provider
      value={{
        book,
        setBook,
        currency,
        setCurrency,
        month,
        setMonth,
        mode,
        setMode,
        editor,
        open: setEditor,
        close: () => setEditor(null),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useFinance = () => useContext(Context);
export function useReport(route?: Route) {
  const { data } = useWorkspace();
  const f = useFinance();
  const sheetId = f.book === 'all' ? '' : f.book;
  const bookData = workspaceForBook(data, sheetId);
  const base = route === 'Overview' && f.book === 'all' ? data : bookData;
  const currencies = [...new Set(base.accounts.map(accountCurrency))].sort();
  const currency = currencies.includes(f.currency) ? f.currency : (currencies[0] ?? f.currency);
  const period = f.mode === 'all' ? 'all' : f.mode === 'year' ? f.month.slice(0, 4) : f.month;
  return {
    ...f,
    sheetId,
    bookData,
    base,
    currency,
    currencies,
    period,
    workspace: workspaceForCurrency(base, currency),
  };
}
