import {
  Company,
  Employee,
  FeeConfig,
  JournalEntry,
  DisbursementFeedItem,
  SettlementRequest,
  LateFeeSlab,
} from '../types';

// Simulated "today" for the demo dataset. Centralized here instead of being
// hardcoded inline across disbursement/settlement logic.
export const SIMULATED_TODAY = '2026-06-29';
export const SIMULATED_DAY_OF_MONTH = 29;

export interface DisburseResult {
  success: boolean;
  message: string;
  updatedCompany?: Company;
  disbursement?: DisbursementFeedItem;
  journalEntries?: JournalEntry[];
}

export interface SettleResult {
  success: boolean;
  message: string;
  updatedCompany?: Company;
  settlement?: SettlementRequest;
  journalEntries?: JournalEntry[];
}

const randomId = (prefix: string, digits = 5) => {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits;
  return `${prefix}-${Math.floor(min + Math.random() * (max - min))}`;
};

/**
 * Runs the BRD UC-22 7-point pre-disbursement validation, computes the fee
 * (flat / percentage / tiered), and returns the resulting disbursement +
 * balanced circle-ledger journal entries. Pure function: callers are
 * responsible for applying the returned state to React state.
 */
export function runDisbursement(
  amount: number,
  employee: Employee,
  company: Company,
  feeConfig: FeeConfig,
  existingDisbursements: DisbursementFeedItem[],
  channel: string = 'KBZ Pay'
): DisburseResult {
  // Check 1: Employee Active
  if (employee.status !== 'Active') {
    return { success: false, message: 'Validation Blocked [EWA-001]: Your account is not active. Contact HR.' };
  }

  // Check 2: Whitelisted Trusted Employee
  if (!employee.trusted) {
    return { success: false, message: 'Validation Blocked [EWA-002]: EWA access not enabled. Contact HR.' };
  }

  const effectiveFreezeDay = company.config?.payrollCutoffDay ?? feeConfig.freezeDay;
  const effectiveMaxPercent = company.config?.maxPercentSalary ?? feeConfig.maxPercentSalary;
  const effectiveFeeModel =
    company.config?.feeModel && company.config.feeModel !== 'system_default'
      ? company.config.feeModel
      : feeConfig.model;
  const effectiveMaxRequests = company.config?.maxMonthlyRequests ?? feeConfig.maxMonthlyRequests;

  // Check 3: Drawing Window
  if (SIMULATED_DAY_OF_MONTH >= effectiveFreezeDay) {
    return { success: false, message: 'Validation Blocked [EWA-003]: Request period has ended for this cycle (Payroll Frozen).' };
  }
  const gapEndDay = effectiveFreezeDay + (company.config?.gapDaysAfterPayroll ?? feeConfig.gapDaysAfterPayroll);
  if (SIMULATED_DAY_OF_MONTH > effectiveFreezeDay && SIMULATED_DAY_OF_MONTH <= gapEndDay) {
    return {
      success: false,
      message: `Validation Blocked [EWA-003]: We are currently in the ${company.config?.gapDaysAfterPayroll ?? feeConfig.gapDaysAfterPayroll}-day settlement gap period. EWA will resume shortly.`,
    };
  }

  // Check 4: Duplicate Pending Checks
  const hasPending = existingDisbursements.some(d => d.employeeName === employee.name && d.status === 'Pending');
  if (hasPending) {
    return { success: false, message: 'Validation Blocked [EWA-004]: You have a pending advance request.' };
  }

  // Check 5: Limit Checks
  const maxAllowed = (employee.salary * effectiveMaxPercent) / 100;
  if (amount > maxAllowed) {
    return {
      success: false,
      message: `Validation Blocked [EWA-005]: Amount exceeds available limit of ${maxAllowed.toLocaleString()} MMK (max ${effectiveMaxPercent}% of base salary).`,
    };
  }
  if (amount < feeConfig.minAmount || amount > feeConfig.maxAmount) {
    return {
      success: false,
      message: `Validation Blocked [EWA-005]: Amount must be between ${feeConfig.minAmount.toLocaleString()} and ${feeConfig.maxAmount.toLocaleString()} MMK.`,
    };
  }

  // Check 6: Velocity checks
  const empRequestsThisMonth = existingDisbursements.filter(d => d.employeeName === employee.name).length;
  if (empRequestsThisMonth >= effectiveMaxRequests) {
    return { success: false, message: `Validation Blocked [EWA-006]: Maximum monthly requests (${effectiveMaxRequests}) reached.` };
  }

  // Check 7: Budget Availability
  const potentialUtilized = company.utilized + amount;
  if (potentialUtilized > company.budget) {
    return { success: false, message: 'Validation Blocked [EWA-018]: Company budget exhausted. Contact administrator.' };
  }

  // All 7 checks passed — compute fee (flat / percentage / tiered)
  let fee = feeConfig.flatFee;
  if (effectiveFeeModel === 'percentage') {
    fee = Math.round((amount * feeConfig.percentage) / 100);
  } else if (effectiveFeeModel === 'tiered') {
    const matchingTier = feeConfig.tiers.find(t => amount > t.min && amount <= t.max);
    fee = matchingTier ? matchingTier.rate : 1500;
  }
  const netAmount = amount - fee;

  const txId = randomId('TX');
  const refCode = `EWA-${randomId('TX', 3)}`;

  const disbursement: DisbursementFeedItem = {
    id: txId,
    employeeName: employee.name,
    companyName: company.name,
    amount,
    fee,
    netAmount,
    channel,
    status: 'Success',
    timestamp: `${SIMULATED_TODAY} 15:45`,
    reference: refCode,
  };

  // Balanced circle-ledger journal entries (debits = credits)
  const journalEntries: JournalEntry[] = [
    {
      id: randomId('JE'),
      date: SIMULATED_TODAY,
      description: `EWA Advance Salary Disbursement - ${employee.code}`,
      debitAccount: '1200', // Receivable increases
      debitAmount: amount,
      creditAccount: '1100', // Cash decreases
      creditAmount: netAmount,
      reference: refCode,
      companyId: company.id,
      employeeId: employee.id,
    },
    {
      id: randomId('JE'),
      date: SIMULATED_TODAY,
      description: `EWA Service Fee Charged - ${employee.code}`,
      debitAccount: '1100', // Cash increases by the fee withheld
      debitAmount: fee,
      creditAccount: '4100', // Fee revenue
      creditAmount: fee,
      reference: refCode,
      companyId: company.id,
      employeeId: employee.id,
    },
  ];

  return {
    success: true,
    message: `SUCCESS! 7-Point pre-disbursement validation passed. Disbursed ${netAmount.toLocaleString()} MMK (Fee: ${fee.toLocaleString()} MMK) via ${channel}. EWA Ledger entries posted and balanced.`,
    updatedCompany: { ...company, utilized: company.utilized + amount },
    disbursement,
    journalEntries,
  };
}

/**
 * Clears a company's full outstanding utilized balance via corporate
 * settlement and posts the balancing circle-ledger entry.
 */
export function runSettlement(
  company: Company,
  repaymentMethod: SettlementRequest['repaymentMethod'] = 'Bank'
): SettleResult {
  const outstandingAmt = company.utilized;
  if (outstandingAmt <= 0) {
    return { success: false, message: `${company.name} has zero utilized outstanding balance. No settlement required.` };
  }

  const refCode = randomId('SET');
  const settlement: SettlementRequest = {
    id: Date.now(),
    companyId: company.id,
    companyName: company.name,
    amount: outstandingAmt,
    reference: refCode,
    repaymentMethod,
    source: 'Manual',
    status: 'Approved',
    submittedAt: `${SIMULATED_TODAY} 15:46`,
    verifiedAt: `${SIMULATED_TODAY} 15:46`,
    approvedAt: `${SIMULATED_TODAY} 15:46`,
  };

  const journalEntries: JournalEntry[] = [
    {
      id: randomId('JE'),
      date: SIMULATED_TODAY,
      description: `Corporate Repayment Clearing Outstanding - ${company.name}`,
      debitAccount: '1100', // Cash increases
      debitAmount: outstandingAmt,
      creditAccount: '1200', // Receivables decrease
      creditAmount: outstandingAmt,
      reference: refCode,
      companyId: company.id,
    },
  ];

  return {
    success: true,
    message: `SUCCESS! Cleared ${outstandingAmt.toLocaleString()} MMK outstanding utilized balance for ${company.name}. Circle Ledger posted DEBIT 1100 (Cash), CREDIT 1200 (Receivables).`,
    updatedCompany: { ...company, utilized: 0 },
    settlement,
    journalEntries,
  };
}

/**
 * Cumulative late fee for `daysOverdue` days against `amount`, walking the
 * slab schedule day-by-day. Verified against the BRD's own worked examples:
 * 2,000,000 MMK at day 3 -> 6,000 (0.1%/day x 3), at day 11 -> 24,000
 * (10 days at 0.1% = 20,000, plus day 11 at 0.2% = 4,000).
 */
export function calculateLateFee(
  amount: number,
  daysOverdue: number,
  slabs: LateFeeSlab[] = []
): number {
  if (daysOverdue <= 0 || amount <= 0 || slabs.length === 0) return 0;

  let totalFee = 0;
  for (let day = 1; day <= daysOverdue; day++) {
    const slab = slabs.find(s => day >= s.fromDay && (s.toDay === null || day <= s.toDay));
    if (slab) {
      totalFee += (amount * slab.ratePerDay) / 100;
    }
  }
  return Math.round(totalFee);
}

/** Applies a waiver selection on top of a computed late fee. */
export function applyLateFeeWaiver(
  computedFee: number,
  waiver: SettlementRequest['lateFeeWaiver'],
  waiverAmount: number = 0
): number {
  switch (waiver) {
    case 'Full':
      return 0;
    case 'Amount':
      return Math.max(0, computedFee - waiverAmount);
    case '1-Day':
    case '2-Day':
    case 'None':
    default:
      return computedFee;
  }
}
