import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import LedgerReports from './components/LedgerReports';
import AdminCRUD from './components/AdminCRUD';
import FormCreator from './components/FormCreator';
import OnboardingWizard from './components/OnboardingWizard';
import RiskAndOps from './components/RiskAndOps';
import BudgetAnalysis from './components/BudgetAnalysis';
import NotificationCenter from './components/NotificationCenter';
import ValidationEngine from './components/ValidationEngine';

import {
  Company,
  Employee,
  User,
  FeeConfig,
  JournalEntry,
  FormSchema,
  CompanyOnboarding,
  SettlementRequest,
  QRProcessingRequest,
  DisbursementFeedItem,
  ValidationRule,
  SystemAuditLog,
} from './types';
import {
  SEED_COMPANIES,
  SEED_EMPLOYEES,
  SEED_USERS,
  DEFAULT_FEE_CONFIG,
  SEED_JOURNAL_ENTRIES,
  SEED_FORMS,
  SEED_ONBOARDINGS,
  SEED_SETTLEMENTS,
  SEED_QR_REQUESTS,
} from './data';
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { sectionFor } from './routes';
import { runDisbursement, runSettlement } from './lib/ewaEngine';

const DEFAULT_VALIDATION_RULES: ValidationRule[] = [
  { id: 'rule-1', name: 'Freeze Day Cap Check', inputField: 'payroll_frozen', operator: '==', value: 'true', action: 'BLOCK', errorMessage: 'Validation Blocked [DMN-001]: Period has closed for this cycle (Payroll Frozen).', enabled: true, priority: 100 },
  { id: 'rule-2', name: 'Active Whitelisted Status', inputField: 'nrc_verified', operator: '==', value: 'false', action: 'BLOCK', errorMessage: 'Validation Blocked [DMN-002]: Access restricted. Contact employer HR department.', enabled: true, priority: 90 },
  { id: 'rule-3', name: 'Daily Maximum EWA limit (MMK)', inputField: 'amount', operator: '>', value: '500000', action: 'BLOCK', errorMessage: 'Validation Blocked [DMN-003]: Advance request exceeding daily MMK transaction limit of {{limit}} MMK.', enabled: true, priority: 80 },
  { id: 'rule-4', name: 'Draw Cap Base Salary Limit (%)', inputField: 'salary_percentage', operator: '>', value: '50', action: 'BLOCK', errorMessage: 'Validation Blocked [DMN-004]: Request is capped at maximum {{limit}}% of employee monthly salary.', enabled: true, priority: 70 },
  { id: 'rule-5', name: 'Maker Checker Double Verification', inputField: 'amount', operator: '>', value: '300000', action: 'CHECKER_REQUIRED', errorMessage: 'Escalated [DMN-005]: High-amount transaction (> {{limit}} MMK) requires Maker-Checker secondary audit approval.', enabled: true, priority: 60 },
];

const DEFAULT_AUDIT_LOGS: SystemAuditLog[] = [
  { id: 'audit-1', category: 'Fee Configuration', action: 'Modified global EWA fee model', performedBy: 'Daw Mya Sandar (Admin HR)', previousValue: 'Percentage Model (2.5%)', newValue: 'Flat Rate Model (3,500 MMK)', timestamp: '2026-06-25 10:32:15' },
  { id: 'audit-2', category: 'Validation Rules', action: 'Enabled Maker Checker Double Verification rule', performedBy: 'Daw Mya Sandar (Admin HR)', previousValue: 'Rule Disabled', newValue: 'Rule Enabled (Trigger limit > 300,000 MMK)', timestamp: '2026-06-26 14:15:00' },
  { id: 'audit-3', category: 'Fee Configuration', action: 'Adjusted Payroll Freeze Cut-off Day', performedBy: 'U Tin Aung (Branch HR)', previousValue: 'Freeze Day: 25th', newValue: 'Freeze Day: 24th', timestamp: '2026-06-28 09:44:12' },
];

const DEFAULT_DISBURSEMENTS: DisbursementFeedItem[] = [
  { id: 'TX-44829', employeeName: 'Mg Kyaw', companyName: 'United Petro Co., Ltd', amount: 100000, fee: 2000, netAmount: 98000, channel: 'KBZ Pay', status: 'Success', timestamp: '2026-06-10 10:00', reference: 'EWA-TX-001' },
  { id: 'TX-55102', employeeName: 'Ma Thu Thu', companyName: 'United Petro Co., Ltd', amount: 150000, fee: 3000, netAmount: 147000, channel: 'Wave Money', status: 'Success', timestamp: '2026-06-12 12:30', reference: 'EWA-TX-002' },
  { id: 'TX-99381', employeeName: 'Ko Naing', companyName: 'Yoma Fleet Logistics', amount: 50000, fee: 1000, netAmount: 49000, channel: 'CB Pay', status: 'Success', timestamp: '2026-06-15 15:45', reference: 'EWA-TX-003' },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Core State — each slice is now a single line: load, persist, expose.
  const [companies, setCompanies] = useLocalStorageState<Company[]>('ewa_companies', SEED_COMPANIES);
  const [employees, setEmployees] = useLocalStorageState<Employee[]>('ewa_employees', SEED_EMPLOYEES);
  const [users, setUsers] = useLocalStorageState<User[]>('ewa_users', SEED_USERS);
  const [feeConfig, setFeeConfig] = useLocalStorageState<FeeConfig>(
    'ewa_fee_config',
    DEFAULT_FEE_CONFIG,
    loaded => {
      if (loaded && Array.isArray(loaded.tiers)) {
        loaded.tiers.forEach(t => {
          if (t.max === null) t.max = Infinity;
        });
      }
      return loaded;
    }
  );
  const [journalEntries, setJournalEntries] = useLocalStorageState<JournalEntry[]>('ewa_journal_entries', SEED_JOURNAL_ENTRIES);
  const [forms, setForms] = useLocalStorageState<FormSchema[]>('ewa_forms', SEED_FORMS);
  const [onboardings, setOnboardings] = useLocalStorageState<CompanyOnboarding[]>('ewa_onboardings', SEED_ONBOARDINGS);
  const [settlements, setSettlements] = useLocalStorageState<SettlementRequest[]>('ewa_settlements', SEED_SETTLEMENTS);
  const [qrRequests, setQrRequests] = useLocalStorageState<QRProcessingRequest[]>('ewa_qr_requests', SEED_QR_REQUESTS);
  const [rules, setRules] = useLocalStorageState<ValidationRule[]>('ewa_validation_rules', DEFAULT_VALIDATION_RULES);
  const [auditLogs, setAuditLogs] = useLocalStorageState<SystemAuditLog[]>('ewa_audit_logs', DEFAULT_AUDIT_LOGS);
  const [disbursements, setDisbursements] = useLocalStorageState<DisbursementFeedItem[]>('ewa_disbursements', DEFAULT_DISBURSEMENTS);

  const addAuditLog = (
    category: 'Fee Configuration' | 'Validation Rules',
    action: string,
    previousValue: string,
    newValue: string,
    performedBy: string = 'Daw Mya Sandar (Admin HR)'
  ) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const newLog: SystemAuditLog = {
      id: `audit-${Date.now()}`,
      category,
      action,
      performedBy,
      previousValue,
      newValue,
      timestamp,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Counting badges
  const pendingSettlementsCount = settlements.filter(s => s.status === 'Pending' || s.status === 'Maker Approved').length;
  const pendingOnboardingCount = onboardings.filter(o => o.currentStep < o.steps.length).length;
  const activeCompanyCount = companies.filter(c => c.status === 'Active').length;

  // Thin React adapter over the pure engine in lib/ewaEngine.ts — applies
  // the returned state diffs and nothing more. All BRD UC-22 validation,
  // fee math, and GL posting logic now lives in that one testable module.
  const addSimulatedTransaction = (
    amount: number,
    type: 'disburse' | 'repay',
    employeeId: number,
    channel: string = 'MoMoney',
    repaymentMethod: SettlementRequest['repaymentMethod'] = 'Bank'
  ): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return { success: false, message: 'Employee profile not found.' };

    const company = companies.find(c => c.id === emp.companyId);
    if (!company) return { success: false, message: 'Employer company not registered.' };

    if (type === 'disburse') {
      const result = runDisbursement(amount, emp, company, feeConfig, disbursements, channel);
      if (result.success) {
        if (result.updatedCompany) {
          const updated = result.updatedCompany;
          setCompanies(prev => prev.map(c => (c.id === company.id ? updated : c)));
        }
        if (result.disbursement) {
          const disb = result.disbursement;
          setDisbursements(prev => [disb, ...prev]);
        }
        if (result.journalEntries) {
          const entries = result.journalEntries;
          setJournalEntries(prev => [...prev, ...entries]);
        }
      }
      return { success: result.success, message: result.message };
    }

    const result = runSettlement(company, repaymentMethod);
    if (result.success) {
      if (result.updatedCompany) {
        const updated = result.updatedCompany;
        setCompanies(prev => prev.map(c => (c.id === company.id ? updated : c)));
      }
      if (result.settlement) {
        const settlement = result.settlement;
        setSettlements(prev => [settlement, ...prev]);
      }
      if (result.journalEntries) {
        const entries = result.journalEntries;
        setJournalEntries(prev => [...prev, ...entries]);
      }
    }
    return { success: result.success, message: result.message };
  };

  const section = sectionFor(currentTab);

  return (
    <div className="flex h-screen bg-gray-50/50 font-sans text-gray-800 antialiased overflow-hidden">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        pendingSettlementsCount={pendingSettlementsCount}
        pendingOnboardingCount={pendingOnboardingCount}
        activeCompanyCount={activeCompanyCount}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-150 flex items-center justify-between px-6 shrink-0 z-20">
          <div className="flex items-center space-x-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span className="text-gray-400">Section</span>
            <i className="fa-solid fa-chevron-right text-[10px] text-gray-300" />
            <span className="text-emerald-950 font-bold">{currentTab.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-100">
              BUILD v4.0.0
            </span>
            <span className="text-xs text-gray-400 font-medium">Kaung Htet Min (kaunghtetmin.kght@gmail.com)</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-50/30 p-6">
          <div className="max-w-7xl mx-auto">
            {section === 'dashboard' && (
              <Dashboard
                companies={companies}
                employees={employees}
                journalEntries={journalEntries}
                addSimulatedTransaction={addSimulatedTransaction}
                setCurrentTab={setCurrentTab}
              />
            )}

            {section === 'ledgerReports' && (
              <LedgerReports
                companies={companies}
                employees={employees}
                journalEntries={journalEntries}
                disbursements={disbursements}
                settlements={settlements}
                currentReportTab={currentTab}
              />
            )}

            {section === 'riskAndOps' && (
              <RiskAndOps
                companies={companies}
                setCompanies={setCompanies}
                employees={employees}
                setEmployees={setEmployees}
                journalEntries={journalEntries}
                setJournalEntries={setJournalEntries}
                settlements={settlements}
                setQrRequests={setQrRequests}
                setSettlements={setSettlements}
                qrRequests={qrRequests}
                disbursements={disbursements}
                setDisbursements={setDisbursements}
                activeTab={currentTab}
              />
            )}

            {section === 'budgetAnalysis' && (
              <BudgetAnalysis
                companies={companies}
                employees={employees}
                feeConfig={feeConfig}
                setCompanies={setCompanies}
              />
            )}

            {section === 'adminCRUD' && (
              <AdminCRUD
                companies={companies}
                setCompanies={setCompanies}
                employees={employees}
                setEmployees={setEmployees}
                users={users}
                setUsers={setUsers}
                feeConfig={feeConfig}
                setFeeConfig={setFeeConfig}
                activeSubTab={currentTab}
                disbursements={disbursements}
                auditLogs={auditLogs}
                addAuditLog={addAuditLog}
              />
            )}

            {section === 'formCreator' && <FormCreator forms={forms} setForms={setForms} />}

            {section === 'onboardingWizard' && (
              <OnboardingWizard
                onboardings={onboardings}
                setOnboardings={setOnboardings}
                companies={companies}
                setCompanies={setCompanies}
              />
            )}

            {section === 'notifications' && <NotificationCenter companies={companies} employees={employees} />}

            {section === 'validationEngine' && (
              <ValidationEngine
                companies={companies}
                employees={employees}
                rules={rules}
                setRules={setRules}
                addAuditLog={addAuditLog}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
