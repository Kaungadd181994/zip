import { Company, Employee, User, FeeConfig, JournalEntry, GLAccount, CompanyOnboarding, SettlementRequest, DisbursementFeedItem, QRProcessingRequest, FormSchema, LateFeeSlab } from './types';

// Late fee slab schedule — sourced from "EWA Late Fees Management" BRD:
// Day 1-10: 0.1% per day, Day 11 onward: 0.2% per day, slab-based and
// configurable per corporate (officers can override in the loan unit portal).
export const DEFAULT_LATE_FEE_SLABS: LateFeeSlab[] = [
  { fromDay: 1, toDay: 10, ratePerDay: 0.1 },
  { fromDay: 11, toDay: null, ratePerDay: 0.2 },
];

// Standard Chart of Accounts
export const CHART_OF_ACCOUNTS: GLAccount[] = [
  { code: '1100', name: 'Cash & Bank (E-Wallet Pool)', type: 'Asset', openingBalance: 500000000 },
  { code: '1200', name: 'EWA Advance Receivable', type: 'Asset', openingBalance: 0 },
  { code: '1300', name: 'EWA Service Fee Receivable', type: 'Asset', openingBalance: 0 },
  { code: '1400', name: 'Late Fee Penalty Receivable', type: 'Asset', openingBalance: 0 },
  { code: '2100', name: 'Disbursement Suspense Clearing', type: 'Liability', openingBalance: 0 },
  { code: '2200', name: 'Corporate Settlement Payable', type: 'Liability', openingBalance: 0 },
  { code: '3000', name: 'Operator Capital Reserve', type: 'Equity', openingBalance: 500000000 },
  { code: '4100', name: 'EWA Service Fee Revenue', type: 'Income', openingBalance: 0 },
  { code: '4200', name: 'Late Penalty Revenue', type: 'Income', openingBalance: 0 },
  { code: '5100', name: 'Bad Debt Write-off Expense', type: 'Expense', openingBalance: 0 },
  { code: '5200', name: 'Disbursement Gateway Fees', type: 'Expense', openingBalance: 0 }
];

// Seed Companies
export const SEED_COMPANIES: Company[] = [
  { id: 1, name: 'United Petro Co., Ltd', type: 'Corporate', dica: 'DICA-2024-001', industry: 'Oil & Gas', contact: '+95 9 123 4567', tier: 'A', budget: 480000000, utilized: 312000000, status: 'Active', branchesCount: 3 },
  { id: 2, name: 'Yoma Fleet Logistics', type: 'Corporate', dica: 'DICA-2023-884', industry: 'Logistics', contact: '+95 9 777 5566', tier: 'B', budget: 150000000, utilized: 45000000, status: 'Active', branchesCount: 2 },
  { id: 3, name: 'Shwe Lar Bakery', type: 'SME', dica: 'DICA-2025-992', industry: 'Food & Beverage', contact: '+95 9 444 1122', tier: 'C', budget: 20000000, utilized: 4500000, status: 'Active', branchesCount: 1 },
  { id: 4, name: 'Apex Retail Distribution', type: 'Corporate', dica: 'DICA-2022-105', industry: 'Retail', contact: '+95 9 222 3344', tier: 'D', budget: 80000000, utilized: 64000000, status: 'Frozen', branchesCount: 4 }
];

// Seed Employees
export const SEED_EMPLOYEES: Employee[] = [
  { id: 1, code: 'EMP-001', name: 'Mg Kyaw', phone: '+95 9 501 2345', nrc: '12/ABC(N)123456', dept: 'Operations', position: 'Fuel Dispatcher', branch: 'Head Office', salary: 850000, joinDate: '2024-01-15', trusted: true, status: 'Active', companyId: 1 },
  { id: 2, code: 'EMP-002', name: 'Ma Thu Thu', phone: '+95 9 501 9876', nrc: '12/DEC(N)654321', dept: 'Finance', position: 'Accountant', branch: 'Head Office', salary: 750000, joinDate: '2024-03-10', trusted: true, status: 'Active', companyId: 1 },
  { id: 3, code: 'EMP-003', name: 'Mg Zaw Win', phone: '+95 9 402 1122', nrc: '09/YAK(N)098123', dept: 'Logistics', position: 'Delivery Driver', branch: 'Thilawa Hub', salary: 550000, joinDate: '2023-08-01', trusted: true, status: 'Active', companyId: 1 },
  { id: 4, code: 'EMP-004', name: 'Mg Hlaing', phone: '+95 9 450 9988', nrc: '14/MAM(N)456789', dept: 'Operations', position: 'Silo Supervisor', branch: 'Mandalay Depot', salary: 600000, joinDate: '2024-02-20', trusted: false, status: 'Unverified', companyId: 1 },
  
  { id: 5, code: 'EMP-201', name: 'Ko Naing', phone: '+95 9 789 0011', nrc: '12/LAK(N)112233', dept: 'Logistics', position: 'Fleet Supervisor', branch: 'Yangon Station', salary: 950000, joinDate: '2023-05-12', trusted: true, status: 'Active', companyId: 2 },
  { id: 6, code: 'EMP-202', name: 'Ma Ei Phyu', phone: '+95 9 789 2233', nrc: '05/KAB(N)332211', dept: 'Customer Care', position: 'Support Specialist', branch: 'Yangon Station', salary: 450000, joinDate: '2024-05-01', trusted: true, status: 'Active', companyId: 2 },
  
  { id: 7, code: 'EMP-301', name: 'Ko Htike', phone: '+95 9 231 4455', nrc: '11/TAY(N)445566', dept: 'Kitchen', position: 'Head Baker', branch: 'Head Office', salary: 400000, joinDate: '2025-01-05', trusted: true, status: 'Active', companyId: 3 },
  { id: 8, code: 'EMP-302', name: 'Ma Su Mon', phone: '+95 9 231 6677', nrc: '12/AHT(N)665544', dept: 'Sales', position: 'Cashier', branch: 'Head Office', salary: 320000, joinDate: '2025-02-01', trusted: true, status: 'Active', companyId: 3 },

  { id: 9, code: 'EMP-401', name: 'Ko Chit', phone: '+95 9 111 2233', nrc: '12/KAY(N)778899', dept: 'Retail', position: 'Store Manager', branch: 'Junction Square', salary: 900000, joinDate: '2022-11-01', trusted: true, status: 'Frozen', companyId: 4 }
];

// Seed Users
export const SEED_USERS: User[] = [
  { id: 1, name: 'Daw Mya Sandar', email: 'mya.sandar@unitedpetro.com', phone: '+95 9 112 3456', role: 'Admin HR', branches: ['All'], status: 'Active', lastLogin: '2026-06-29 14:20' },
  { id: 2, code: 'HR-02', name: 'U Tin Aung', email: 'tin.aung@unitedpetro.com', phone: '+95 9 112 7788', role: 'Branch HR', branches: ['Mandalay Depot'], status: 'Active', lastLogin: '2026-06-28 09:15' },
  { id: 3, name: 'Daw Nwe Nwe', email: 'nwe.nwe@unitedpetro.com', phone: '+95 9 112 9900', role: 'Finance', branches: ['All'], status: 'Active', lastLogin: '2026-06-29 15:05' },
  { id: 4, name: 'Maung Maung', email: 'maung.maung@shwelar.com', phone: '+95 9 444 1111', role: 'Admin HR', branches: ['All'], status: 'Active', lastLogin: '2026-06-29 11:30' }
];

// Default global and company specific configs
export const DEFAULT_FEE_CONFIG: FeeConfig = {
  model: 'tiered',
  flatFee: 1500,
  percentage: 2.5,
  tiers: [
    { min: 0, max: 50000, rate: 1000 },
    { min: 50000, max: 100000, rate: 2000 },
    { min: 100000, max: Infinity, rate: 3000 }
  ],
  minAmount: 10000,
  maxAmount: 200000,
  maxPercentSalary: 50,
  applyStartDay: 1,
  applyEndDay: 23,
  freezeDay: 24,
  gapDaysAfterPayroll: 5,
  lateReminderDays: 3,
  maxMonthlyRequests: 3,
  payer: 'employee'
};

// Seed Journal Entries (Double Entry Circle Ledger)
export const SEED_JOURNAL_ENTRIES: JournalEntry[] = [
  // 1. Initial Operator Capital Funding
  { id: 'JE-00001', date: '2026-06-01', description: 'Initial Equity Capital Funding', debitAccount: '1100', debitAmount: 500000000, creditAccount: '3000', creditAmount: 500000000, reference: 'CAP-2026-001' },
  
  // 2. Disbursement for Mg Kyaw (EMP-001) - United Petro Co (100,000 MMK, Tiered Fee 2000)
  { id: 'JE-00002', date: '2026-06-10', description: 'EWA Advance Salary Disbursement - EMP-001', debitAccount: '1200', debitAmount: 100000, creditAccount: '1100', creditAmount: 98000, reference: 'EWA-TX-001', companyId: 1, employeeId: 1 },
  { id: 'JE-00003', date: '2026-06-10', description: 'EWA Service Fee Charged - EMP-001', debitAccount: '1300', debitAmount: 2000, creditAccount: '4100', creditAmount: 2000, reference: 'EWA-TX-001', companyId: 1, employeeId: 1 },
  { id: 'JE-00004', date: '2026-06-10', description: 'Clear EWA Fee against Pool', debitAccount: '1100', debitAmount: 2000, creditAccount: '1300', creditAmount: 2000, reference: 'EWA-TX-001', companyId: 1, employeeId: 1 },
  
  // 3. Disbursement for Ma Thu Thu (EMP-002) (150,000 MMK, Tiered Fee 3000)
  { id: 'JE-00005', date: '2026-06-12', description: 'EWA Advance Salary Disbursement - EMP-002', debitAccount: '1200', debitAmount: 150000, creditAccount: '1100', creditAmount: 147000, reference: 'EWA-TX-002', companyId: 1, employeeId: 2 },
  { id: 'JE-00006', date: '2026-06-12', description: 'EWA Service Fee Charged - EMP-002', debitAccount: '1300', debitAmount: 3000, creditAccount: '4100', creditAmount: 3000, reference: 'EWA-TX-002', companyId: 1, employeeId: 2 },
  { id: 'JE-00007', date: '2026-06-12', description: 'Clear EWA Fee against Pool', debitAccount: '1100', debitAmount: 3000, creditAccount: '1300', creditAmount: 3000, reference: 'EWA-TX-002', companyId: 1, employeeId: 2 },
  
  // 4. Disbursement for Ko Naing (EMP-201) - Yoma Fleet (50,000 MMK, Flat Fee 1500, but let\'s use standard Tiered 1000)
  { id: 'JE-00008', date: '2026-06-15', description: 'EWA Advance Salary Disbursement - EMP-201', debitAccount: '1200', debitAmount: 50000, creditAccount: '1100', creditAmount: 49000, reference: 'EWA-TX-003', companyId: 2, employeeId: 5 },
  { id: 'JE-00009', date: '2026-06-15', description: 'EWA Service Fee Charged - EMP-201', debitAccount: '1300', debitAmount: 1000, creditAccount: '4100', creditAmount: 1000, reference: 'EWA-TX-003', companyId: 2, employeeId: 5 },
  { id: 'JE-00010', date: '2026-06-15', description: 'Clear EWA Fee against Pool', debitAccount: '1100', debitAmount: 1000, creditAccount: '1300', creditAmount: 1000, reference: 'EWA-TX-003', companyId: 2, employeeId: 5 },

  // 5. Overdue late fee accrual for Apex Retail Distribution (Frozen company has some overdue items)
  { id: 'JE-00011', date: '2026-06-25', description: 'Late Payment Penalty Accrual - Apex Retail', debitAccount: '1400', debitAmount: 5400, creditAccount: '4200', creditAmount: 5400, reference: 'LATE-APX-001', companyId: 4, employeeId: 9 },
  // Apex employee outstanding
  { id: 'JE-00012', date: '2026-06-05', description: 'EWA Advance Salary Disbursement - EMP-401', debitAccount: '1200', debitAmount: 120000, creditAccount: '1100', creditAmount: 117000, reference: 'EWA-TX-004', companyId: 4, employeeId: 9 },
  { id: 'JE-00013', date: '2026-06-05', description: 'EWA Service Fee Charged - EMP-401', debitAccount: '1300', debitAmount: 3000, creditAccount: '4100', creditAmount: 3000, reference: 'EWA-TX-004', companyId: 4, employeeId: 9 },
  { id: 'JE-00014', date: '2026-06-05', description: 'Clear EWA Fee against Pool', debitAccount: '1100', debitAmount: 3000, creditAccount: '1300', creditAmount: 3000, reference: 'EWA-TX-004', companyId: 4, employeeId: 9 }
];

// Seed Form Creators
export const SEED_FORMS: FormSchema[] = [
  {
    id: 1,
    name: 'Corporate Sign-up KYC Form v1',
    target: 'corporate',
    published: true,
    version: '1.0.0',
    fields: [
      { id: 'company_legal_name', type: 'text', label: 'Company Legal Name', required: true, placeholder: 'Enter official name' },
      { id: 'dica_number', type: 'text', label: 'DICA Registration No.', required: true, placeholder: 'DICA-YYYY-XXXX' },
      { id: 'industry_type', type: 'dropdown', label: 'Industry Sector', required: true, options: ['Oil & Gas', 'Logistics', 'Retail', 'F&B', 'Banking', 'Manufacturing'] },
      { id: 'signatory_nrc', type: 'nrc', label: 'Signatory NRC', required: true },
      { id: 'signatory_selfie', type: 'selfie', label: 'Signatory Liveness Photo', required: true },
      { id: 'dica_cert_file', type: 'file', label: 'Upload DICA Certificate of Incorporation', required: true }
    ]
  },
  {
    id: 2,
    name: 'SME Quick Register Form',
    target: 'sme',
    published: true,
    version: '1.1.0',
    fields: [
      { id: 'shop_name', type: 'text', label: 'Shop/Business Name', required: true, placeholder: 'Enter name' },
      { id: 'business_license', type: 'text', label: 'Local Business License Number', required: true },
      { id: 'owner_phone', type: 'phone', label: 'Owner Mobile Number', required: true },
      { id: 'shop_photo', type: 'file', label: 'Upload Front of Shop Photo', required: true }
    ]
  }
];

// Seed Company Onboardings
export const SEED_ONBOARDINGS: CompanyOnboarding[] = [
  {
    id: 1,
    companyName: 'Mandalay Marine Services',
    type: 'Corporate',
    dica: 'DICA-2026-991',
    contact: '+95 9 333 4445',
    currentStep: 2, // KYC Done, Credit Assessment current
    steps: [
      { name: 'Submit Company Details', status: 'completed', description: 'Company details submitted with DICA verification.', date: '2026-06-25' },
      { name: 'KYC & Document Review', status: 'completed', description: 'DICA, business license and authorized signatory files approved.', date: '2026-06-26' },
      { name: 'Credit Assessment', status: 'current', description: 'Risk Officer assessing bank statements and financial documents.' },
      { name: 'Budget Approval', status: 'pending', description: 'Finance Officer checker approval of allocated credit pool.' },
      { name: 'Integration & Go-Live', status: 'pending', description: 'Setup e-money pools and trigger welcome HR credentials.' }
    ],
    submittedData: {
      company_legal_name: 'Mandalay Marine Services',
      dica_number: 'DICA-2026-991',
      industry_type: 'Manufacturing',
      contact_person: 'U Kyaw Swar',
      contact_email: 'kyaw.swar@mandalaymarine.com'
    }
  },
  {
    id: 2,
    companyName: 'Ruby Gems Wholesale',
    type: 'SME',
    dica: 'DICA-2026-552',
    contact: '+95 9 445 6677',
    currentStep: 1, // Verification current
    steps: [
      { name: 'SME Registration', status: 'completed', description: 'Completed SME onboarding form.', date: '2026-06-28' },
      { name: 'Verify & Auto-Approve', status: 'current', description: 'Ops verifying owner phone and auto-assigning Tier C budget.' },
      { name: 'Active Summary', status: 'pending', description: 'Activate default Head Office and dispatch SMS instructions.' }
    ],
    submittedData: {
      shop_name: 'Ruby Gems Wholesale',
      business_license: 'MDY-LICENSE-9923',
      owner_phone: '+95 9 445 6677'
    }
  }
];

// Seed Settlement Requests
export const SEED_SETTLEMENTS: SettlementRequest[] = [
  { id: 1, companyId: 1, companyName: 'United Petro Co., Ltd', amount: 250000, reference: 'REF-BANK-99882', status: 'Pending', submittedAt: '2026-06-29 09:12' },
  { id: 2, companyId: 2, companyName: 'Yoma Fleet Logistics', amount: 50000, reference: 'REF-BANK-33451', status: 'Approved', submittedAt: '2026-06-28 10:30', verifiedAt: '2026-06-28 11:15', approvedAt: '2026-06-28 13:00' }
];

// Seed QR Manual Processings
export const SEED_QR_REQUESTS: QRProcessingRequest[] = [
  { id: 1, employeeName: 'Mg Zaw Win', employeeCode: 'EMP-003', companyName: 'United Petro Co., Ltd', amount: 50000, qrCodeUrl: 'https://via.placeholder.com/250?text=KBZPay_QR_MgZawWin', status: 'Pending', uploadedAt: '2026-06-29T14:35:00Z' }
];

// Helper to calculate balances for all accounts
export function getAccountBalances(entries: JournalEntry[]): Record<string, number> {
  const balances: Record<string, number> = {};
  
  // Start with opening balances
  CHART_OF_ACCOUNTS.forEach(acc => {
    balances[acc.code] = acc.openingBalance;
  });

  // Apply journal entries
  entries.forEach(entry => {
    // Debit increases assets and expenses, decreases liabilities, equity, income
    const debType = CHART_OF_ACCOUNTS.find(a => a.code === entry.debitAccount)?.type;
    if (debType === 'Asset' || debType === 'Expense') {
      balances[entry.debitAccount] = (balances[entry.debitAccount] || 0) + entry.debitAmount;
    } else {
      balances[entry.debitAccount] = (balances[entry.debitAccount] || 0) - entry.debitAmount;
    }

    // Credit increases liabilities, equity, income, decreases assets and expenses
    const credType = CHART_OF_ACCOUNTS.find(a => a.code === entry.creditAccount)?.type;
    if (credType === 'Liability' || credType === 'Equity' || credType === 'Income') {
      balances[entry.creditAccount] = (balances[entry.creditAccount] || 0) + entry.creditAmount;
    } else {
      balances[entry.creditAccount] = (balances[entry.creditAccount] || 0) - entry.creditAmount;
    }
  });

  return balances;
}

// Persist / Load functions for UI State
export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveState<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error saving state', e);
  }
}
