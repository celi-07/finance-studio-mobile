import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Currency, Workspace } from '../domain/ledger';
import { statementHtml, type StatementFilters } from '../domain/statement-html';
export async function shareStatement(
  workspace: Workspace,
  period: string,
  currency: Currency,
  title: string,
  filters?: StatementFilters,
  demo = false,
) {
  const html = statementHtml(workspace, period, currency, title, filters, demo);
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) throw Error('Sharing is unavailable on this device.');
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    UTI: '.pdf',
    dialogTitle: 'Finance Studio statement',
  });
}
