export type CompanyType = 'Corporate' | 'SME';

export interface CompanyConfig {
  feeModel: 'system_default' | 'flat' | 'percentage' | 'tiered';
  feePayer: 'system_default' | 'employee' | 'corporate';
  settlementCycle: 'monthly' | 'bi_weekly' | 'weekly';
  maxPercentSalary: number; // e.g. 50 (50% max limit)
  payrollCutoffDay: number;
  applyStartDay?: number;
  applyEndDay?: number;
  gapDaysAfterPayroll?: number;
  lateReminderDays?: number;
  maxMonthlyRequests?: number;
}

// --- Company 360 Profile: Credit Assessment ---
export interface CreditAssessment {
  score: number; // 0-100 internal credit score
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
  annualRevenue?: number; // MMK
  employeeHeadcount?: number;
  yearsInOperation?: number;
  payrollStability: 'Stable' | 'Moderate' | 'Volatile';
  lastReviewedDate?: string;
  reviewedBy?: string;
  notes?: string;
}

// --- Company 360 Profile: Payroll Policy Rule ---
export interface PayrollPolicyRule {
  cycleStartDay: number; // 1-31, day payroll cycle opens
  cycleEndDay: number; // 1-31, day payroll cycle closes / cutoff
  paydayDay: number; // 1-31, official salary payday
  repaymentDay: number; // 1-31, day EWA repayment is deducted/settled
  gapDaysWithRepayment: number; // buffer days required between payday and next cycle open
  effectiveFrom: string; // ISO date the policy takes effect
  effectiveTo?: string; // optional end date
}

// --- Company 360 Profile: Budget Rule ---
export interface BudgetRule {
  totalBudgetPool: number; // MMK ceiling for the company
  perEmployeeCap: number; // MMK max per employee outstanding
  reserveBufferPercent: number; // % held back / not allocatable
  utilizationAlertThreshold: number; // % utilization that triggers alert
  autoFreezeOnBreach: boolean;
}

// --- Company 360 Profile: Limitation Rule ---
export interface LimitationRule {
  maxPercentSalary: number; // % of salary withdrawable per cycle
  minRequestAmount: number;
  maxRequestAmount: number;
  maxMonthlyRequests: number;
  minTenureMonths: number; // minimum employment tenure to be eligible
  coolingOffHours: number; // hours between consecutive requests
}

// --- Fee Rule (per fee category) ---
export type FeeRuleType = 'flat' | 'percentage' | 'tiered';
export type ChargeBearer = 'employee' | 'corporate' | 'shared';

export interface FeeRule {
  enabled: boolean;
  type: FeeRuleType;
  flatAmount: number;
  percentage: number;
  tiers: FeeTier[];
  chargeBearer: ChargeBearer;
  sharedSplitPercent?: number; // employee share % when chargeBearer === 'shared'
}

export interface CompanyFeeSchedule {
  disbursement: FeeRule;
  repayment: FeeRule;
  contractFee: FeeRule;
  lateFee: FeeRule;
}

export interface CompanyProfile {
  corporateProfile?: {
    registrationDate?: string;
    signatoryName?: string;
    signatoryEmail?: string;
    website?: string;
    addressLine?: string;
  };
  creditAssessment?: CreditAssessment;
  payrollPolicy?: PayrollPolicyRule;
  budgetRule?: BudgetRule;
  limitationRule?: LimitationRule;
  feeSchedule?: CompanyFeeSchedule;
}

export interface Company {
  id: number;
  name: string;
  type: CompanyType;
  dica: string;
  industry: string;
  contact: string;
  tier: 'A' | 'B' | 'C' | 'D' | 'E';
  budget: number;
  utilized: number;
  status: 'Active' | 'Inactive' | 'Frozen' | 'Onboarding';
  branchesCount: number;
  config?: CompanyConfig;
  profile?: CompanyProfile;
}

export interface Employee {
  id: number;
  code: string;
  name: string;
  phone: string;
  nrc: string;
  dept: string;
  position: string;
  branch: string;
  salary: number;
  joinDate: string;
  trusted: boolean; // Same as Allowed EWA (Whitelist)
  ewaStage?: 'Verify Employment' | 'Allowed EWA';
  verifyStatus?: 'Pending HR Invite' | 'Invited' | 'Self-Onboarded Request' | 'Verified';
  inviteMethod?: 'SMS' | 'Viber' | 'Telegram';
  status: 'Active' | 'Unverified' | 'Frozen' | 'Suspended' | 'Terminated';
  companyId: number;
}

export interface User {
  id: number;
  code?: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin HR' | 'Branch HR' | 'Finance' | 'Viewer';
  branches: string[]; // ['All'] or specific branch names
  status: 'Active' | 'Inactive' | 'Invited';
  lastLogin: string;
  permissions?: string[];
}

export interface FeeTier {
  min: number;
  max: number;
  rate: number; // For tiered fee computation
}

export interface FeeConfig {
  model: 'flat' | 'percentage' | 'tiered';
  flatFee: number;
  percentage: number;
  tiers: FeeTier[];
  minAmount: number;
  maxAmount: number;
  maxPercentSalary: number;
  applyStartDay: number;
  applyEndDay: number;
  freezeDay: number;
  gapDaysAfterPayroll: number;
  lateReminderDays: number;
  maxMonthlyRequests: number;
  payer: 'employee' | 'corporate';
}

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'date' | 'dropdown' | 'radio' | 'checkbox' | 'file' | 'nrc' | 'selfie';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // for dropdown or radio
  validationRegex?: string;
}

export interface FormSchema {
  id: number;
  name: string;
  target: 'all' | 'corporate' | 'sme' | string; // target scope
  fields: FormField[];
  published: boolean;
  version: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
  reference: string;
  companyId?: number;
  employeeId?: number;
}

export interface GLAccount {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Income' | 'Expense' | 'Equity';
  openingBalance: number;
}

export interface OnboardingStep {
  name: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  description: string;
  date?: string;
}

export interface CompanyOnboarding {
  id: number;
  companyName: string;
  type: CompanyType;
  dica: string;
  contact: string;
  currentStep: number; // 0 to 5 for Corporate, 0 to 2 for SME
  steps: OnboardingStep[];
  submittedData: Record<string, any>;
  riskScore?: number;
  assignedTier?: 'A' | 'B' | 'C' | 'D' | 'E';
  approvedBudget?: number;
  signatoryName?: string;
  signatoryEmail?: string;
  companyConfig?: CompanyConfig;
}

export interface SettlementRequest {
  id: number;
  companyId: number;
  companyName: string;
  amount: number;
  reference: string;
  proofUrl?: string; // Simulated base64 or URL
  repaymentMethod?: 'MoPayment Wallet' | 'Bank' | 'Card' | 'MM QR' | 'Cash' | 'Other';
  source?: 'API' | 'Manual';
  status: 'Pending' | 'Maker Approved' | 'Approved' | 'Rejected';
  submittedAt: string;
  verifiedAt?: string;
  approvedAt?: string;
  dueDate?: string; // Predefined repayment date set by MO officer (loan unit portal)
  daysOverdue?: number; // Actual repayment date - dueDate, when positive
  lateFee?: number; // Computed via the slab schedule in LateFeeSlab[]
  lateFeeWaiver?: 'None' | 'Full' | '1-Day' | '2-Day' | 'Amount';
  lateFeeWaiverAmount?: number; // Only when lateFeeWaiver === 'Amount'
}

// --- Late Fee Management (BRD: EWA Late Fees Management) ---
export interface LateFeeSlab {
  fromDay: number;
  toDay: number | null; // null = open-ended ("day 11 onward")
  ratePerDay: number; // percent per day, e.g. 0.1 = 0.1%/day
}

export interface DisbursementFeedItem {
  id: string;
  employeeName: string;
  companyName: string;
  amount: number;
  fee: number;
  netAmount: number;
  channel: string;
  status: 'Success' | 'Pending' | 'Failed' | 'Processing';
  timestamp: string;
  reference: string;
}

export interface QRProcessingRequest {
  id: number;
  employeeName: string;
  employeeCode: string;
  companyName: string;
  amount: number;
  qrCodeUrl: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  uploadedAt: string;
  processedAt?: string;
}

// --- Notification Center Types ---
export type NotificationChannel = 'sms' | 'email' | 'push';

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  content: string; // supports {{name}}, {{amount}}, {{fee}}, {{company}}, {{reference}}
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  recipientName: string;
  recipientContact: string; // phone, email, or user token
  channel: NotificationChannel;
  subject?: string;
  content: string;
  status: 'Sent' | 'Failed' | 'Scheduled';
  scheduledTime?: string;
  createdAt: string;
}

// --- DMN Validation Rules Types ---
export type DMNInputField = 'amount' | 'salary_percentage' | 'monthly_count' | 'utilization_percent' | 'nrc_verified' | 'payroll_frozen';
export type DMNOperator = '>' | '<' | '==' | '!=' | 'matches' | 'contains';
export type DMNAction = 'ALLOW' | 'BLOCK' | 'CHECKER_REQUIRED';

export interface ValidationRule {
  id: string;
  name: string;
  inputField: DMNInputField;
  operator: DMNOperator;
  value: string;
  action: DMNAction;
  errorMessage: string;
  enabled: boolean;
  priority: number;
}

export interface SystemAuditLog {
  id: string;
  category: 'Fee Configuration' | 'Validation Rules';
  action: string; // e.g. 'Changed Flat Rate Amount', 'Created Validation Rule'
  performedBy: string; // user name, e.g. 'Daw Mya Sandar'
  previousValue: string; // serialized previous state or description
  newValue: string; // serialized new state or description
  timestamp: string;
}

// --- Payroll Reconciliation (BRD UC-29) ---
export type ReconciliationStatus = 'Reconciled' | 'Partial' | 'Over' | 'Missing';

export interface ReconciliationRecord {
  companyId: number;
  companyName: string;
  period: string; // e.g. '2026-06'
  expectedAmount: number; // sum of disbursed advances + fees for the period
  actualAmount: number; // sum of settled/repaid amounts for the period
  variance: number; // expected - actual
  status: ReconciliationStatus;
}

