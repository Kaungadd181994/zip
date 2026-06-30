/**
 * Maps each sidebar tab id to the section that renders it. Replaces the
 * five separate `[...].includes(currentTab)` arrays that used to live
 * inline in App.tsx's JSX.
 */
export type SectionKey =
  | 'dashboard'
  | 'ledgerReports'
  | 'riskAndOps'
  | 'budgetAnalysis'
  | 'adminCRUD'
  | 'formCreator'
  | 'onboardingWizard'
  | 'notifications'
  | 'validationEngine';

export const TAB_SECTION_MAP: Record<string, SectionKey> = {
  overview: 'dashboard',

  'chart-accounts': 'ledgerReports',
  'journal-entries': 'ledgerReports',
  'general-ledger': 'ledgerReports',
  'trial-balance': 'ledgerReports',
  'balance-sheet': 'ledgerReports',
  'profit-loss': 'ledgerReports',
  'cash-flow': 'ledgerReports',
  'overdue-aging': 'ledgerReports',
  'disbursement-report': 'ledgerReports',
  'repayment-report': 'ledgerReports',
  'overdue-transactions': 'ledgerReports',
  'account-statement': 'ledgerReports',
  'reconciliation-report': 'ledgerReports',

  'settlement-queue': 'riskAndOps',
  'disbursement-monitor': 'riskAndOps',
  'qr-processing': 'riskAndOps',
  'credit-assessment': 'riskAndOps',
  'ghost-employees': 'riskAndOps',
  'overdue-monitoring': 'riskAndOps',

  'budget-analysis': 'budgetAnalysis',

  companies: 'adminCRUD',
  employees: 'adminCRUD',
  users: 'adminCRUD',
  'fee-config': 'adminCRUD',
  'system-audit': 'adminCRUD',

  'form-creator': 'formCreator',
  'company-onboarding': 'onboardingWizard',
  notifications: 'notifications',
  'validation-engine': 'validationEngine',
};

export function sectionFor(tab: string): SectionKey | undefined {
  return TAB_SECTION_MAP[tab];
}
