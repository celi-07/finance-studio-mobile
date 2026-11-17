export const routeLabels = {
  Overview: 'Overview',
  Transactions: 'Entries',
  Reimbursements: 'Claims',
  Investments: 'Invest',
  Assistant: 'Assistant',
  Settings: 'Settings',
} as const;
export const fonts = { regular: 'FinanceRegular', bold: 'FinanceBold' };
export const tabBar = { margin: 16, maxWidth: 620, height: 66, radius: 33, itemRadius: 33 };
export const screenBottomPadding = (bottomInset: number) => 110 + bottomInset;
export const shouldDismissSheet = (distance: number, velocity: number) =>
  distance > 72 || (distance > 20 && velocity > 0.6);
