import React, { useState } from 'react';
import { Company, Employee, User, FeeConfig, DisbursementFeedItem, SystemAuditLog, CompanyProfile, CreditAssessment, PayrollPolicyRule, BudgetRule, LimitationRule, CompanyFeeSchedule, FeeRule, FeeRuleType, ChargeBearer } from '../types';

const defaultFeeRule = (overrides: Partial<FeeRule> = {}): FeeRule => ({
  enabled: true,
  type: 'flat',
  flatAmount: 1000,
  percentage: 1,
  tiers: [{ min: 0, max: 100000, rate: 1 }, { min: 100001, max: 500000, rate: 0.8 }, { min: 500001, max: 999999999, rate: 0.5 }],
  chargeBearer: 'employee',
  sharedSplitPercent: 50,
  ...overrides
});

const defaultCreditAssessment = (): CreditAssessment => ({
  score: 70,
  rating: 'C',
  annualRevenue: 0,
  employeeHeadcount: 0,
  yearsInOperation: 1,
  payrollStability: 'Moderate',
  lastReviewedDate: new Date().toISOString().slice(0, 10),
  reviewedBy: '',
  notes: ''
});

const defaultPayrollPolicy = (): PayrollPolicyRule => ({
  cycleStartDay: 1,
  cycleEndDay: 25,
  paydayDay: 28,
  repaymentDay: 28,
  gapDaysWithRepayment: 3,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: ''
});

const defaultBudgetRule = (totalBudget: number): BudgetRule => ({
  totalBudgetPool: totalBudget,
  perEmployeeCap: 1000000,
  reserveBufferPercent: 10,
  utilizationAlertThreshold: 80,
  autoFreezeOnBreach: true
});

const defaultLimitationRule = (): LimitationRule => ({
  maxPercentSalary: 50,
  minRequestAmount: 10000,
  maxRequestAmount: 1000000,
  maxMonthlyRequests: 3,
  minTenureMonths: 3,
  coolingOffHours: 24
});

const defaultFeeSchedule = (): CompanyFeeSchedule => ({
  disbursement: defaultFeeRule({ type: 'flat', flatAmount: 1000, chargeBearer: 'employee' }),
  repayment: defaultFeeRule({ type: 'flat', flatAmount: 0, chargeBearer: 'corporate' }),
  contractFee: defaultFeeRule({ type: 'percentage', percentage: 0.5, chargeBearer: 'corporate' }),
  lateFee: defaultFeeRule({ type: 'tiered', chargeBearer: 'employee' })
});

interface AdminCRUDProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  feeConfig: FeeConfig;
  setFeeConfig: (config: FeeConfig) => void;
  activeSubTab: string;
  disbursements?: DisbursementFeedItem[];
  auditLogs?: SystemAuditLog[];
  addAuditLog?: (
    category: 'Fee Configuration' | 'Validation Rules',
    action: string,
    previousValue: string,
    newValue: string,
    performedBy?: string
  ) => void;
}

export default function AdminCRUD({
  companies,
  setCompanies,
  employees,
  setEmployees,
  users,
  setUsers,
  feeConfig,
  setFeeConfig,
  activeSubTab,
  disbursements = [],
  auditLogs = [],
  addAuditLog
}: AdminCRUDProps) {
  
  // Track fee config snapshots for audit logs comparison
  const [lastSavedFeeConfig, setLastSavedFeeConfig] = useState<FeeConfig>({ ...feeConfig });
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);

  // Edit target state
  const [editCompanyId, setEditCompanyId] = useState<number | null>(null);
  const [editEmployeeId, setEditEmployeeId] = useState<number | null>(null);
  const [editUserId, setEditUserId] = useState<number | null>(null);

  // Search/Filters
  const [companySearch, setCompanySearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // Audit Log search, filter & page state
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState<'All' | 'Fee Configuration' | 'Validation Rules'>('All');
  const [auditPage, setAuditPage] = useState(1);

  // Toasts
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Company Form States ---
  const [compName, setCompName] = useState('');
  const [compType, setCompType] = useState<'Corporate' | 'SME'>('Corporate');
  const [compDica, setCompDica] = useState('');
  const [compIndustry, setCompIndustry] = useState('Oil & Gas');
  const [compContact, setCompContact] = useState('');
  const [compTier, setCompTier] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('C');
  const [compBudget, setCompBudget] = useState(50000000);
  const [compStatus, setCompStatus] = useState<'Active' | 'Inactive' | 'Frozen'>('Active');

  // Company Config States
  const [compConfigEnabled, setCompConfigEnabled] = useState(false);
  const [compFeeModel, setCompFeeModel] = useState<'system_default' | 'flat' | 'percentage' | 'tiered'>('system_default');
  const [compFeePayer, setCompFeePayer] = useState<'system_default' | 'employee' | 'corporate'>('system_default');
  const [compSettlementCycle, setCompSettlementCycle] = useState<'monthly' | 'bi_weekly' | 'weekly'>('monthly');
  const [compMaxPercent, setCompMaxPercent] = useState<number>(50);
  const [compCutoffDay, setCompCutoffDay] = useState<number>(25);
  const [compGapDays, setCompGapDays] = useState<number>(5);
  const [compLateReminder, setCompLateReminder] = useState<number>(3);
  const [compMaxRequests, setCompMaxRequests] = useState<number>(3);

  // --- Company 360 Profile States (new) ---
  const [companyModalTab, setCompanyModalTab] = useState<'profile' | 'credit' | 'payroll' | 'budget' | 'limitation' | 'fees' | 'employees'>('profile');
  const [compRegDate, setCompRegDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [compSignatoryName, setCompSignatoryName] = useState('');
  const [compSignatoryEmail, setCompSignatoryEmail] = useState('');
  const [compWebsite, setCompWebsite] = useState('');
  const [compAddress, setCompAddress] = useState('');

  const [credit, setCredit] = useState<CreditAssessment>(defaultCreditAssessment());
  const [payrollPolicy, setPayrollPolicy] = useState<PayrollPolicyRule>(defaultPayrollPolicy());
  const [budgetRule, setBudgetRule] = useState<BudgetRule>(defaultBudgetRule(50000000));
  const [limitationRule, setLimitationRule] = useState<LimitationRule>(defaultLimitationRule());
  const [feeSchedule, setFeeSchedule] = useState<CompanyFeeSchedule>(defaultFeeSchedule());
  const [activeFeeCategory, setActiveFeeCategory] = useState<'disbursement' | 'repayment' | 'contractFee' | 'lateFee'>('disbursement');

  const updateFeeRule = (category: keyof CompanyFeeSchedule, patch: Partial<FeeRule>) => {
    setFeeSchedule(prev => ({ ...prev, [category]: { ...prev[category], ...patch } }));
  };

  const openAddCompany = () => {
    setEditCompanyId(null);
    setCompName('');
    setCompType('Corporate');
    setCompDica('');
    setCompIndustry('Oil & Gas');
    setCompContact('');
    setCompTier('C');
    setCompBudget(50000000);
    setCompStatus('Active');
    
    setCompConfigEnabled(false);
    setCompFeeModel('system_default');
    setCompFeePayer('system_default');
    setCompSettlementCycle('monthly');
    setCompMaxPercent(50);
    setCompCutoffDay(25);
    setCompGapDays(5);
    setCompLateReminder(3);
    setCompMaxRequests(3);

    setCompanyModalTab('profile');
    setCompRegDate(new Date().toISOString().slice(0, 10));
    setCompSignatoryName('');
    setCompSignatoryEmail('');
    setCompWebsite('');
    setCompAddress('');
    setCredit(defaultCreditAssessment());
    setPayrollPolicy(defaultPayrollPolicy());
    setBudgetRule(defaultBudgetRule(50000000));
    setLimitationRule(defaultLimitationRule());
    setFeeSchedule(defaultFeeSchedule());
    setShowCompanyModal(true);
  };

  const openEditCompany = (c: Company) => {
    setEditCompanyId(c.id);
    setCompName(c.name);
    setCompType(c.type);
    setCompDica(c.dica);
    setCompIndustry(c.industry);
    setCompContact(c.contact);
    setCompTier(c.tier);
    setCompBudget(c.budget);
    setCompStatus(c.status === 'Onboarding' ? 'Active' : c.status as any);
    
    if (c.config) {
      setCompConfigEnabled(true);
      setCompFeeModel(c.config.feeModel);
      setCompFeePayer(c.config.feePayer);
      setCompSettlementCycle(c.config.settlementCycle);
      setCompMaxPercent(c.config.maxPercentSalary);
      setCompCutoffDay(c.config.payrollCutoffDay);
      setCompGapDays(c.config.gapDaysAfterPayroll || 5);
      setCompLateReminder(c.config.lateReminderDays || 3);
      setCompMaxRequests(c.config.maxMonthlyRequests || 3);
    } else {
      setCompConfigEnabled(false);
      setCompFeeModel('system_default');
      setCompFeePayer('system_default');
      setCompSettlementCycle('monthly');
      setCompMaxPercent(50);
      setCompCutoffDay(25);
      setCompGapDays(5);
      setCompLateReminder(3);
      setCompMaxRequests(3);
    }

    setCompanyModalTab('profile');
    const p = c.profile;
    setCompRegDate(p?.corporateProfile?.registrationDate || new Date().toISOString().slice(0, 10));
    setCompSignatoryName(p?.corporateProfile?.signatoryName || '');
    setCompSignatoryEmail(p?.corporateProfile?.signatoryEmail || '');
    setCompWebsite(p?.corporateProfile?.website || '');
    setCompAddress(p?.corporateProfile?.addressLine || '');
    setCredit(p?.creditAssessment || defaultCreditAssessment());
    setPayrollPolicy(p?.payrollPolicy || defaultPayrollPolicy());
    setBudgetRule(p?.budgetRule || defaultBudgetRule(c.budget));
    setLimitationRule(p?.limitationRule || defaultLimitationRule());
    setFeeSchedule(p?.feeSchedule || defaultFeeSchedule());
    setShowCompanyModal(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName || !compDica || !compContact) {
      alert('Please fill out all required fields.');
      return;
    }

    const newConfig = compConfigEnabled ? {
      feeModel: compFeeModel,
      feePayer: compFeePayer,
      settlementCycle: compSettlementCycle,
      maxPercentSalary: compMaxPercent,
      payrollCutoffDay: compCutoffDay,
      gapDaysAfterPayroll: compGapDays,
      lateReminderDays: compLateReminder,
      maxMonthlyRequests: compMaxRequests
    } : undefined;

    const newProfile: CompanyProfile = {
      corporateProfile: {
        registrationDate: compRegDate,
        signatoryName: compSignatoryName,
        signatoryEmail: compSignatoryEmail,
        website: compWebsite,
        addressLine: compAddress
      },
      creditAssessment: credit,
      payrollPolicy,
      budgetRule: { ...budgetRule, totalBudgetPool: compBudget },
      limitationRule,
      feeSchedule
    };

    if (editCompanyId !== null) {
      // Edit
      setCompanies(prev => prev.map(c => c.id === editCompanyId ? {
        ...c,
        name: compName,
        type: compType,
        dica: compDica,
        industry: compIndustry,
        contact: compContact,
        tier: compTier,
        budget: compBudget,
        status: compStatus as any,
        config: newConfig,
        profile: newProfile
      } : c));
      showToast('Company updated successfully.');
    } else {
      // Create new
      const newComp: Company = {
        id: Date.now(),
        name: compName,
        type: compType,
        dica: compDica,
        industry: compIndustry,
        contact: compContact,
        tier: compTier,
        budget: compBudget,
        utilized: 0,
        status: compStatus as any,
        branchesCount: compType === 'Corporate' ? 1 : 1,
        config: newConfig,
        profile: newProfile
      };
      setCompanies(prev => [...prev, newComp]);
      showToast('New Company registered successfully.');
    }
    setShowCompanyModal(false);
  };

  const handleDeleteCompany = (id: number) => {
    if (confirm('Are you sure you want to delete this company? This action is irreversible.')) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      showToast('Company deleted successfully.');
    }
  };

  // --- Employee Form States ---
  const [empCode, setEmpCode] = useState('');
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empNrc, setEmpNrc] = useState('');
  const [empDept, setEmpDept] = useState('');
  const [empPos, setEmpPos] = useState('');
  const [empBranch, setEmpBranch] = useState('Head Office');
  const [empSalary, setEmpSalary] = useState(500000);
  const [empJoinDate, setEmpJoinDate] = useState('2025-01-01');
  const [empTrusted, setEmpTrusted] = useState(true);
  const [empStatus, setEmpStatus] = useState<'Active' | 'Unverified' | 'Frozen' | 'Suspended' | 'Terminated'>('Active');
  const [empCompanyId, setEmpCompanyId] = useState(1);
  const [empEwaStage, setEmpEwaStage] = useState<'Verify Employment' | 'Allowed EWA'>('Verify Employment');
  const [empVerifyStatus, setEmpVerifyStatus] = useState<'Pending HR Invite' | 'Invited' | 'Self-Onboarded Request' | 'Verified'>('Pending HR Invite');
  const [empInviteMethod, setEmpInviteMethod] = useState<'SMS' | 'Viber' | 'Telegram'>('SMS');

  const openAddEmployee = () => {
    setEditEmployeeId(null);
    setEmpCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
    setEmpName('');
    setEmpPhone('');
    setEmpNrc('');
    setEmpDept('');
    setEmpPos('');
    setEmpBranch('Head Office');
    setEmpSalary(500000);
    setEmpJoinDate('2025-01-01');
    setEmpTrusted(false);
    setEmpStatus('Unverified');
    setEmpEwaStage('Verify Employment');
    setEmpVerifyStatus('Pending HR Invite');
    setEmpInviteMethod('SMS');
    setEmpCompanyId(companies[0]?.id || 1);
    setShowEmployeeModal(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditEmployeeId(emp.id);
    setEmpCode(emp.code);
    setEmpName(emp.name);
    setEmpPhone(emp.phone);
    setEmpNrc(emp.nrc);
    setEmpDept(emp.dept);
    setEmpPos(emp.position);
    setEmpBranch(emp.branch);
    setEmpSalary(emp.salary);
    setEmpJoinDate(emp.joinDate);
    setEmpTrusted(emp.trusted);
    setEmpStatus(emp.status);
    setEmpEwaStage(emp.ewaStage || (emp.trusted ? 'Allowed EWA' : 'Verify Employment'));
    setEmpVerifyStatus(emp.verifyStatus || 'Verified');
    setEmpInviteMethod(emp.inviteMethod || 'SMS');
    setEmpCompanyId(emp.companyId);
    setShowEmployeeModal(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empPhone || !empNrc) {
      alert('Please fill out all required fields.');
      return;
    }

    if (editEmployeeId !== null) {
      setEmployees(prev => prev.map(emp => emp.id === editEmployeeId ? {
        ...emp,
        code: empCode,
        name: empName,
        phone: empPhone,
        nrc: empNrc,
        dept: empDept,
        position: empPos,
        branch: empBranch,
        salary: empSalary,
        joinDate: empJoinDate,
        trusted: empEwaStage === 'Allowed EWA',
        status: empStatus,
        ewaStage: empEwaStage,
        verifyStatus: empEwaStage === 'Verify Employment' ? empVerifyStatus : 'Verified',
        inviteMethod: empEwaStage === 'Verify Employment' ? empInviteMethod : undefined,
        companyId: empCompanyId
      } : emp));
      showToast('Employee details updated successfully.');
    } else {
      const newEmp: Employee = {
        id: Date.now(),
        code: empCode,
        name: empName,
        phone: empPhone,
        nrc: empNrc,
        dept: empDept,
        position: empPos,
        branch: empBranch,
        salary: empSalary,
        joinDate: empJoinDate,
        trusted: empEwaStage === 'Allowed EWA',
        status: empStatus,
        ewaStage: empEwaStage,
        verifyStatus: empEwaStage === 'Verify Employment' ? empVerifyStatus : 'Verified',
        inviteMethod: empEwaStage === 'Verify Employment' ? empInviteMethod : undefined,
        companyId: empCompanyId
      };
      setEmployees(prev => [...prev, newEmp]);
      showToast('New employee profile created.');
    }
    setShowEmployeeModal(false);
  };

  const handleDeleteEmployee = (id: number) => {
    if (confirm('Are you sure you want to remove this employee from directory?')) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      showToast('Employee deleted successfully.');
    }
  };

  // --- Granular Permissions Definitions ---
  const ALL_PERMISSIONS = [
    { id: 'view_ledgers', label: 'Access Ledger System', desc: 'Read Trial Balance, General Ledger, and Balance Sheet statements.', icon: 'fa-solid fa-file-invoice-dollar' },
    { id: 'approve_ewa', label: 'Approve EWA Settlements', desc: 'Maker/Checker double-entry approval of company repayments.', icon: 'fa-solid fa-stamp' },
    { id: 'edit_whitelist', label: 'Workforce Roster Whitelists', desc: 'Direct access to whitelisting parameters and bulk CSV parsing.', icon: 'fa-solid fa-id-card-clip' },
    { id: 'configure_fees', label: 'Configure GoRules Fees', desc: 'Edit fee structure, minimum/maximum limits, and payroll freeze days.', icon: 'fa-solid fa-sliders' },
    { id: 'edit_forms', label: 'DICA Onboarding Forms', desc: 'Access and modify corporate registration KYC questionnaires.', icon: 'fa-solid fa-signature' },
  ];

  const getDefaultPermissions = (role: 'Admin HR' | 'Branch HR' | 'Finance' | 'Viewer'): string[] => {
    switch (role) {
      case 'Admin HR':
        return ['view_ledgers', 'edit_whitelist', 'edit_forms'];
      case 'Branch HR':
        return ['edit_whitelist'];
      case 'Finance':
        return ['view_ledgers', 'approve_ewa', 'configure_fees'];
      case 'Viewer':
      default:
        return ['view_ledgers'];
    }
  };

  // --- User Form States ---
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<'Admin HR' | 'Branch HR' | 'Finance' | 'Viewer'>('Viewer');
  const [userBranches, setUserBranches] = useState<string[]>(['All']);
  const [userStatus, setUserStatus] = useState<'Active' | 'Inactive' | 'Invited'>('Active');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // --- Whitelist Multi-view Controller ---
  const [employeeViewMode, setEmployeeViewMode] = useState<'list' | 'bulk' | 'payroll'>('list');

  // --- Bulk CSV Roster States ---
  const [csvText, setCsvText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<any[]>([]);
  const [bulkUploadStep, setBulkUploadStep] = useState<number>(0); // 0: upload/paste, 1: preview/verify
  const [selectedBulkCompanyId, setSelectedBulkCompanyId] = useState<number>(companies[0]?.id || 1);
  const [dragOver, setDragOver] = useState(false);

  // --- Payroll Export States ---
  const [payrollCompanyFilter, setPayrollCompanyFilter] = useState<number>(companies[0]?.id || 1);
  const [payrollTemplate, setPayrollTemplate] = useState<'standard' | 'workday' | 'sap'>('standard');

  const openAddUser = () => {
    setEditUserId(null);
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setUserRole('Viewer');
    setUserBranches(['All']);
    setUserStatus('Active');
    setUserPermissions(getDefaultPermissions('Viewer'));
    setShowUserModal(true);
  };

  const openEditUser = (u: User) => {
    setEditUserId(u.id);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPhone(u.phone);
    setUserRole(u.role);
    setUserBranches(u.branches);
    setUserStatus(u.status);
    setUserPermissions(u.permissions || getDefaultPermissions(u.role));
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) {
      alert('Please fill out name and email.');
      return;
    }

    if (editUserId !== null) {
      setUsers(prev => prev.map(u => u.id === editUserId ? {
        ...u,
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        branches: userBranches,
        status: userStatus,
        permissions: userPermissions
      } : u));
      showToast('User permissions modified successfully.');
    } else {
      const newUser: User = {
        id: Date.now(),
        name: userName,
        email: userEmail,
        phone: userPhone,
        role: userRole,
        branches: userBranches,
        status: userStatus,
        lastLogin: 'Never',
        permissions: userPermissions
      };
      setUsers(prev => [...prev, newUser]);
      showToast('New system user invited.');
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
      showToast('User removed.');
    }
  };

  // --- Render Sections ---

  // Companies Management
  const renderCompanies = () => {
    const filtered = companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()) || c.dica.toLowerCase().includes(companySearch.toLowerCase()));
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Registered Companies (Clients)</h3>
            <p className="text-xs text-gray-500 font-sans">Manage employer company data, risk tiers, and outstanding allocations.</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search companies..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
            <button
              onClick={openAddCompany}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
            >
              <i className="fa-solid fa-plus" /> <span>Add Company</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <th className="p-3">Company Details</th>
                <th className="p-3">DICA Reg</th>
                <th className="p-3">Risk Tier</th>
                <th className="p-3">Utilized / Credit Pool (MMK)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-amber-50/10">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{c.name}</span>
                      <span className="text-[10px] text-gray-400 font-sans">{c.industry} &bull; {c.type}</span>
                      <span className="text-[10px] text-gray-500 font-sans block mt-0.5">
                        <i className="fa-solid fa-phone text-amber-600/70 mr-1" />{c.contact} &bull; <i className="fa-solid fa-code-branch text-amber-600/70 mr-1" />{c.branchesCount || 1} Branches
                      </span>
                    </div>
                  </td>
                  <td className="p-3 font-mono">{c.dica}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.tier === 'A' ? 'bg-emerald-50 text-emerald-800' :
                      c.tier === 'B' ? 'bg-blue-50 text-blue-800' :
                      c.tier === 'C' ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                      Tier {c.tier}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className="font-semibold text-gray-800">{c.utilized.toLocaleString()}</span>
                    <span className="text-gray-400"> / {c.budget.toLocaleString()}</span>
                    <div className="w-32 bg-gray-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-amber-600 h-full" style={{ width: `${Math.min(100, (c.utilized / c.budget) * 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      c.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      c.status === 'Frozen' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button onClick={() => openEditCompany(c)} className="text-gray-500 hover:text-amber-700 cursor-pointer text-xs p-1">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button onClick={() => handleDeleteCompany(c.id)} className="text-gray-400 hover:text-rose-600 cursor-pointer text-xs p-1">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Employees Management with Multi-view (List, CSV Import, Payroll integration)
  const renderEmployees = () => {
    const filtered = employees.filter(emp => emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || emp.code.toLowerCase().includes(employeeSearch.toLowerCase()));

    // Simple robust CSV parser
    const handleParseCSV = (rawText: string) => {
      try {
        const rows = rawText.split('\n').map(r => r.trim()).filter(r => r.length > 0);
        if (rows.length < 2) {
          setBulkError('CSV file or payload must contain at least a header row followed by employee records.');
          return;
        }

        const headerRow = rows[0].split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
        
        const codeIdx = headerRow.findIndex(h => h.includes('code') || h.includes('id') || h.includes('pernr'));
        const nameIdx = headerRow.findIndex(h => h.includes('name') || h.includes('full') || h.includes('cname'));
        const phoneIdx = headerRow.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('contact'));
        const nrcIdx = headerRow.findIndex(h => h.includes('nrc') || h.includes('national') || h.includes('id_number'));
        const deptIdx = headerRow.findIndex(h => h.includes('dept') || h.includes('department') || h.includes('kostl'));
        const posIdx = headerRow.findIndex(h => h.includes('pos') || h.includes('designation') || h.includes('title') || h.includes('plans'));
        const salaryIdx = headerRow.findIndex(h => h.includes('salary') || h.includes('wage') || h.includes('monthly'));
        const branchIdx = headerRow.findIndex(h => h.includes('branch') || h.includes('location'));

        if (nameIdx === -1 || phoneIdx === -1 || nrcIdx === -1) {
          setBulkError('Invalid format: Columns for Name, Phone, and NRC ID are mandatory. Please label your CSV headers appropriately (e.g. Code, Name, Phone, NRC, Department, Designation, Salary, Branch).');
          return;
        }

        const parsed: any[] = [];
        for (let i = 1; i < rows.length; i++) {
          const cells = rows[i].split(',').map(c => c.trim().replace(/["']/g, ''));
          if (cells.length < 3) continue;

          const rawSalary = salaryIdx !== -1 ? Number(cells[salaryIdx]) : 500000;
          const salary = isNaN(rawSalary) ? 500000 : rawSalary;

          parsed.push({
            id: Date.now() + i,
            code: codeIdx !== -1 && cells[codeIdx] ? cells[codeIdx] : `EMP-B${Math.floor(100 + Math.random() * 900)}`,
            name: cells[nameIdx] || 'Employee Record',
            phone: cells[phoneIdx] || '+95 9 xxxxxxx',
            nrc: cells[nrcIdx] || '12/YAKANA(N)123456',
            dept: deptIdx !== -1 ? cells[deptIdx] : 'Operations',
            position: posIdx !== -1 ? cells[posIdx] : 'Associate',
            branch: branchIdx !== -1 ? cells[branchIdx] : 'Head Office',
            salary: salary,
            joinDate: '2026-06-29',
            trusted: true,
            status: 'Active',
            companyId: selectedBulkCompanyId
          });
        }

        setParsedEmployees(parsed);
        setBulkError(null);
        setBulkUploadStep(1); // Switch to mapping preview verification step
      } catch (err: any) {
        setBulkError(`CSV Parse Failure: ${err.message || 'Malformed structure detected.'}`);
      }
    };

    const handleLoadSampleCSV = () => {
      const sample = `Employee Code,Employee Name,Phone,NRC Number,Department,Job Title,Monthly Salary,Branch
EMP-391,Thura Aung,+95944512918,12/YAKANA(N)391823,Logistics,Senior Dispatcher,680000,Yangon Depot
EMP-392,May Thu,+95955182911,12/BAHANA(N)119283,HR,Compensation Officer,750000,Head Office
EMP-393,Aung Ko,+95977112839,12/SAYANA(N)229182,Maintenance,Senior Tech,620000,Mandalay Depot`;
      setCsvText(sample);
      setBulkError(null);
    };

    const handleCommitBulkUpload = () => {
      if (parsedEmployees.length === 0) return;
      setEmployees(prev => [...prev, ...parsedEmployees]);
      const activeComp = companies.find(c => c.id === selectedBulkCompanyId);
      showToast(`Successfully added ${parsedEmployees.length} employees to the whitelist roster for ${activeComp?.name || 'Client Company'}.`);
      
      // Reset bulk upload states
      setCsvText('');
      setParsedEmployees([]);
      setBulkUploadStep(0);
      setEmployeeViewMode('list');
    };

    const handleExportPayrollFile = () => {
      const comp = companies.find(c => c.id === payrollCompanyFilter);
      const companyName = comp ? comp.name : 'Client_Company';
      const compEmployees = employees.filter(emp => emp.companyId === payrollCompanyFilter);

      let csvContent = '';
      
      if (payrollTemplate === 'standard') {
        csvContent = 'Employee Code,Employee Name,NRC National ID,Department,Job Title,Base Salary (MMK),Total EWA Advanced (MMK),EWA Service Fees (MMK),Net Payable Salary (MMK)\n';
        compEmployees.forEach(emp => {
          const empDisb = disbursements.filter(d => d.employeeName === emp.name);
          const totalAdv = empDisb.reduce((sum, d) => sum + d.amount, 0);
          const totalFees = empDisb.length * (feeConfig.flatFee || 3500);
          const netPay = emp.salary - totalAdv - totalFees;
          csvContent += `"${emp.code}","${emp.name}","${emp.nrc}","${emp.dept}","${emp.position}",${emp.salary},${totalAdv},${totalFees},${netPay}\n`;
        });
      } else if (payrollTemplate === 'workday') {
        csvContent = 'WORKDAY_ID,EMP_LEGAL_NAME,GOVT_NRC,COST_CENTER,POSITION_ID,BASE_SAL_MMK,DEDUCTION_EWA_ADV,DEDUCTION_EWA_FEES,NET_PAYMENT_MMK\n';
        compEmployees.forEach(emp => {
          const empDisb = disbursements.filter(d => d.employeeName === emp.name);
          const totalAdv = empDisb.reduce((sum, d) => sum + d.amount, 0);
          const totalFees = empDisb.length * (feeConfig.flatFee || 3500);
          const netPay = emp.salary - totalAdv - totalFees;
          csvContent += `"${emp.code}","${emp.name}","${emp.nrc}","${emp.dept}","${emp.position}",${emp.salary},${totalAdv},${totalFees},${netPay}\n`;
        });
      } else {
        csvContent = 'SAP_PERNR,CNAME,ID_NUMBER,KOSTL,PLANS,SAP_LGART_BASE,SAP_LGART_EWA_PR,SAP_LGART_EWA_FE,SAP_LGART_NET\n';
        compEmployees.forEach(emp => {
          const empDisb = disbursements.filter(d => d.employeeName === emp.name);
          const totalAdv = empDisb.reduce((sum, d) => sum + d.amount, 0);
          const totalFees = empDisb.length * (feeConfig.flatFee || 3500);
          const netPay = emp.salary - totalAdv - totalFees;
          csvContent += `"${emp.code}","${emp.name}","${emp.nrc}","${emp.dept}","${emp.position}",${emp.salary},${totalAdv},${totalFees},${netPay}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `EWA_Payroll_Export_${companyName.replace(/\s+/g, '_')}_${payrollTemplate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast(`Success: Exported payroll settlements compatible with ${payrollTemplate.toUpperCase()} schemas.`);
    };

    return (
      <div className="space-y-4">
        {/* Navigation Mode Segmented Controls */}
        <div className="bg-gray-50 p-1 rounded-xl flex items-center space-x-1 border border-gray-200/50 max-w-lg">
          <button
            onClick={() => setEmployeeViewMode('list')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              employeeViewMode === 'list'
                ? 'bg-white text-amber-700 shadow-sm border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-900 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-id-card-clip" />
            <span>Whitelist Directory</span>
          </button>
          <button
            onClick={() => {
              setEmployeeViewMode('bulk');
              setBulkUploadStep(0);
              setBulkError(null);
              setParsedEmployees([]);
            }}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              employeeViewMode === 'bulk'
                ? 'bg-white text-amber-700 shadow-sm border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-900 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-file-csv" />
            <span>Bulk CSV Importer</span>
          </button>
          <button
            onClick={() => setEmployeeViewMode('payroll')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              employeeViewMode === 'payroll'
                ? 'bg-white text-amber-700 shadow-sm border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-900 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-file-invoice-dollar" />
            <span>Payroll Settlements</span>
          </button>
        </div>

        {/* VIEW 1: Standard whitelist table directory list */}
        {employeeViewMode === 'list' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
              <div>
                <h3 className="text-sm font-bold text-gray-900">EWA Workforce Whitelists</h3>
                <p className="text-xs text-gray-500 font-sans">Active directory of personnel pre-verified and whitelisted for real-time EWA withdrawals.</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white min-w-[160px]"
                />
                <button
                  onClick={openAddEmployee}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
                >
                  <i className="fa-solid fa-user-plus" /> <span>Add Employee</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                    <th className="p-3">Employee Details</th>
                    <th className="p-3">Employer & Branch</th>
                    <th className="p-3">Role & Dept</th>
                    <th className="p-3">Contact & ID</th>
                    <th className="p-3">Base Salary (MMK)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {filtered.map(emp => {
                    const comp = companies.find(c => c.id === emp.companyId);
                    return (
                      <tr key={emp.id} className="hover:bg-amber-50/10">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-gray-900">{emp.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                emp.trusted ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {emp.trusted ? 'Whitelisted' : 'Verify Pipeline'}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{emp.code}</span>
                            <span className="text-[10px] text-gray-500 font-sans mt-0.5">Joined: {emp.joinDate}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 font-sans">{comp ? comp.name : 'Unknown'}</span>
                            <span className="text-[10px] text-gray-500 font-sans mt-0.5">
                              <i className="fa-solid fa-code-branch text-amber-600/70 mr-1" />{emp.branch}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 font-sans">{emp.position}</span>
                            <span className="text-[10px] text-gray-400 font-sans mt-0.5">{emp.dept}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-gray-800">
                              <i className="fa-solid fa-phone text-amber-600/70 mr-1" />{emp.phone}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{emp.nrc}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono font-bold text-gray-950">{emp.salary.toLocaleString()}</td>
                        <td className="p-3">
                          <div className="flex flex-col space-y-1 items-start">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              emp.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {emp.status}
                            </span>
                            {!emp.trusted && emp.verifyStatus && (
                              <span className="text-[9px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                {emp.verifyStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <button onClick={() => openEditEmployee(emp)} className="text-gray-500 hover:text-amber-700 cursor-pointer text-xs p-1">
                            <i className="fa-solid fa-pen" />
                          </button>
                          <button onClick={() => handleDeleteEmployee(emp.id)} className="text-gray-400 hover:text-rose-600 cursor-pointer text-xs p-1">
                            <i className="fa-solid fa-trash" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 2: Bulk CSV Roster Importer */}
        {employeeViewMode === 'bulk' && (
          <div className="space-y-4 pt-1">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Workforce Whitelist CSV Import Engine</h3>
              <p className="text-xs text-gray-500 font-sans">Import bulk rosters securely into the whitelisted employee database using Excel, CSV, or raw payload arrays.</p>
            </div>

            {bulkUploadStep === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  {/* Select Employer Company */}
                  <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 shadow-xs">
                    <label className="block font-bold text-gray-700 text-[11px]">Select Target Client Company *</label>
                    <select
                      value={selectedBulkCompanyId}
                      onChange={(e) => setSelectedBulkCompanyId(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none text-xs"
                    >
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>

                  {/* Drag and Drop Zone or Text Paste */}
                  <div className="bg-white p-5 rounded-xl border border-gray-100 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-xs">Upload Roster Document or Paste Data</span>
                      <button
                        onClick={handleLoadSampleCSV}
                        className="text-[10px] text-amber-700 hover:underline font-semibold cursor-pointer"
                      >
                        <i className="fa-solid fa-vial mr-1" /> Load Sandbox Demo Data
                      </button>
                    </div>

                    {/* Drag and Drop */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            if (evt.target?.result) handleParseCSV(evt.target.result as string);
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                        dragOver ? 'border-amber-500 bg-amber-50/40' : 'border-gray-200 hover:border-amber-400 bg-gray-50/50'
                      }`}
                    >
                      <i className="fa-solid fa-cloud-arrow-up text-amber-600 text-xl" />
                      <span className="font-bold text-gray-800 text-[11px]">Drag & drop .csv / .xlsx file here</span>
                      <span className="text-[10px] text-gray-400">or click below to browse manual spreadsheet files</span>
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) handleParseCSV(evt.target.result as string);
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className="mt-2 text-[10px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-amber-100 file:text-amber-800 file:font-semibold hover:file:bg-amber-200 cursor-pointer"
                      />
                    </div>

                    {/* Raw Text area paste */}
                    <div className="space-y-1.5">
                      <label className="block text-gray-500 font-semibold text-[10px]">Or paste comma-separated database values below:</label>
                      <textarea
                        rows={5}
                        placeholder="Employee Code,Employee Name,Phone,NRC Number,Department,Job Title,Monthly Salary,Branch&#10;EMP-401,Aung Lin,+95922339918,12/YAKANA(N)281922,Logistics,Dispatcher,550000,Yangon Depot"
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {bulkError && (
                      <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg text-[11px] flex items-start space-x-2">
                        <i className="fa-solid fa-triangle-exclamation mt-0.5" />
                        <span>{bulkError}</span>
                      </div>
                    )}

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (!csvText.trim()) {
                            setBulkError('Please paste roster CSV rows or drop a file first.');
                            return;
                          }
                          handleParseCSV(csvText);
                        }}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles" />
                        <span>Verify & Map Fields</span>
                      </button>
                    </div>

                  </div>
                </div>

                {/* Left Side Mapping Schema info card */}
                <div className="bg-amber-50/50 border border-amber-100/60 rounded-xl p-4 text-xs space-y-3">
                  <h4 className="font-bold text-amber-900 flex items-center space-x-1">
                    <i className="fa-solid fa-circle-info" />
                    <span>Schema Header Mapping Guidelines</span>
                  </h4>
                  <p className="text-amber-800 leading-normal font-sans">
                    Our dynamic validation parser will scan and auto-map columns matching key user headers. Ensure headers include:
                  </p>
                  <ul className="space-y-1.5 text-amber-900 font-medium">
                    <li className="flex items-center space-x-1.5">
                      <i className="fa-solid fa-square-check text-amber-700" />
                      <span><strong>Name</strong> (Employee Full Name) *</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <i className="fa-solid fa-square-check text-amber-700" />
                      <span><strong>Phone</strong> (Mobile Network Code) *</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <i className="fa-solid fa-square-check text-amber-700" />
                      <span><strong>NRC</strong> (National ID Format) *</span>
                    </li>
                    <li className="flex items-center space-x-1.5 text-gray-500">
                      <i className="fa-solid fa-square text-gray-300" />
                      <span>Code / PerNr (Optional employee code)</span>
                    </li>
                    <li className="flex items-center space-x-1.5 text-gray-500">
                      <i className="fa-solid fa-square text-gray-300" />
                      <span>Salary (Base monthly wage in MMK)</span>
                    </li>
                    <li className="flex items-center space-x-1.5 text-gray-500">
                      <i className="fa-solid fa-square text-gray-300" />
                      <span>Branch / Cost Center (Optional map)</span>
                    </li>
                  </ul>
                  <p className="text-[10px] text-amber-700/80 italic font-sans">
                    Note: Employees parsed successfully will instantly be set with is_whitelisted = true.
                  </p>
                </div>
              </div>
            ) : (
              // Step 1: Preview and verification grid before committing
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm space-y-4 p-5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-700">Step 2: Preview & Validation Grid</span>
                    <h4 className="font-bold text-gray-900">
                      Found {parsedEmployees.length} Whitelist Records mapped to{' '}
                      <span className="text-amber-600 font-extrabold font-sans">
                        {companies.find(c => c.id === selectedBulkCompanyId)?.name}
                      </span>
                    </h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setBulkUploadStep(0)}
                      className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-medium cursor-pointer"
                    >
                      Re-upload
                    </button>
                    <button
                      onClick={handleCommitBulkUpload}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-circle-check" />
                      <span>Commit Workforce Whitelist</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                        <th className="p-3">Employee Code</th>
                        <th className="p-3">Full Name</th>
                        <th className="p-3">Contact No.</th>
                        <th className="p-3">National NRC ID</th>
                        <th className="p-3">Dept & Designation</th>
                        <th className="p-3">Salary Base</th>
                        <th className="p-3">Whitelisted Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600 font-sans">
                      {parsedEmployees.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-3 font-mono font-medium text-amber-800">{emp.code}</td>
                          <td className="p-3 font-bold text-gray-900">{emp.name}</td>
                          <td className="p-3 font-mono">{emp.phone}</td>
                          <td className="p-3 font-mono">{emp.nrc}</td>
                          <td className="p-3 text-gray-500">
                            {emp.dept} &bull; {emp.position}
                          </td>
                          <td className="p-3 font-mono font-bold text-gray-950">{emp.salary.toLocaleString()} MMK</td>
                          <td className="p-3">
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px] font-bold">
                              Verified Whitelisted
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: Payroll Settlement & Integrations */}
        {employeeViewMode === 'payroll' && (
          <div className="space-y-4 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Third-Party Payroll Export & Settlements</h3>
                <p className="text-xs text-gray-500 font-sans">Aggregate employee salaries, advanced EWA principal pools, and accrued service fees to export cleanly into ERP frameworks.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Select Company Filter */}
                <select
                  value={payrollCompanyFilter}
                  onChange={(e) => setPayrollCompanyFilter(Number(e.target.value))}
                  className="text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Template Layout Selection */}
                <select
                  value={payrollTemplate}
                  onChange={(e) => setPayrollTemplate(e.target.value as any)}
                  className="text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white font-bold text-gray-700"
                >
                  <option value="standard">Standard CSV payroll format</option>
                  <option value="workday">Workday Enterprise layout</option>
                  <option value="sap">SAP SuccessFactors Feed</option>
                </select>

                <button
                  onClick={handleExportPayrollFile}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-file-arrow-down" />
                  <span>Generate Export File</span>
                </button>
              </div>
            </div>

            {/* Payroll Calculation Breakdown Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                    <th className="p-3">Employee Name / Code</th>
                    <th className="p-3">Government ID</th>
                    <th className="p-3 text-right">Base salary (MMK)</th>
                    <th className="p-3 text-right text-amber-700">Total EWA Advanced (MMK)</th>
                    <th className="p-3 text-right text-amber-700">Accrued EWA Fees (MMK)</th>
                    <th className="p-3 text-right text-emerald-800">Net Payable Salary (MMK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600 font-sans">
                  {employees.filter(emp => emp.companyId === payrollCompanyFilter).map(emp => {
                    // Calculate real EWA advance principal from actual disbursements state!
                    const empDisb = disbursements.filter(d => d.employeeName === emp.name);
                    const totalAdv = empDisb.reduce((sum, d) => sum + d.amount, 0);
                    // Accrued fees calculated based on flat fee
                    const totalFees = empDisb.length * (feeConfig.flatFee || 3500);
                    const netSalary = emp.salary - totalAdv - totalFees;

                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5">{emp.code}</span>
                          </div>
                        </td>
                        <td className="p-3 font-mono text-gray-500">{emp.nrc}</td>
                        <td className="p-3 text-right font-mono font-medium">{emp.salary.toLocaleString()}</td>
                        <td className="p-3 text-right font-mono font-bold text-amber-700">
                          {totalAdv > 0 ? `-${totalAdv.toLocaleString()}` : '0'}
                        </td>
                        <td className="p-3 text-right font-mono text-amber-600">
                          {totalFees > 0 ? `-${totalFees.toLocaleString()}` : '0'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-800">
                          {netSalary.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {employees.filter(emp => emp.companyId === payrollCompanyFilter).length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        No whitelisted employees found under this client company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Users Management
  const renderUsers = () => {
    const filtered = users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-gray-900">System Operators & HR Users</h3>
            <p className="text-xs text-gray-500 font-sans">Role configuration matrix (Admin HR, Branch HR, Finance) and scoped branch maps.</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
            />
            <button
              onClick={openAddUser}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
            >
              <i className="fa-solid fa-plus" /> <span>Add User</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <th className="p-3">User</th>
                <th className="p-3">Role Designation</th>
                <th className="p-3">Scope assignment</th>
                <th className="p-3">Last Active</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-amber-50/10">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-gray-900">{u.name}</span>
                        {u.code && (
                          <span className="font-mono text-[9px] text-amber-800 bg-amber-50 px-1 py-0.5 rounded font-semibold">
                            {u.code}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-sans">{u.email}</span>
                      <span className="text-[10px] text-gray-500 font-sans mt-0.5">
                        <i className="fa-solid fa-phone text-amber-600/70 mr-1" />{u.phone || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col space-y-1">
                      <span className="font-bold text-gray-800 flex items-center">
                        <i className="fa-solid fa-user-shield text-amber-600/80 mr-1 text-xs" />
                        <span>{u.role}</span>
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(u.permissions || getDefaultPermissions(u.role)).map(pId => {
                          const permObj = ALL_PERMISSIONS.find(ap => ap.id === pId);
                          return (
                            <span key={pId} className="bg-amber-50 border border-amber-100/40 text-amber-900 text-[9px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center space-x-1" title={permObj?.desc}>
                              {permObj?.icon && <i className={`${permObj.icon} text-[8px]`} />}
                              <span>{permObj?.label || pId}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    {u.branches.map((b, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-[10px] px-1.5 py-0.5 rounded font-medium mr-1 flex-inline items-center space-x-1">
                        <i className="fa-solid fa-code-branch text-gray-400 mr-0.5" />
                        <span>{b}</span>
                      </span>
                    ))}
                  </td>
                  <td className="p-3 text-gray-500">{u.lastLogin}</td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5">
                    <button onClick={() => openEditUser(u)} className="text-gray-500 hover:text-amber-700 cursor-pointer text-xs p-1">
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button onClick={() => handleDeleteUser(u.id)} className="text-gray-400 hover:text-rose-600 cursor-pointer text-xs p-1">
                      <i className="fa-solid fa-trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Fee Configuration
  const handleSaveFeeConfig = () => {
    const changes: string[] = [];
    
    if (feeConfig.model !== lastSavedFeeConfig.model) {
      changes.push(`Fee Model: ${lastSavedFeeConfig.model} -> ${feeConfig.model}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Changed global EWA fee model',
          `Model: ${lastSavedFeeConfig.model}`,
          `Model: ${feeConfig.model}`
        );
      }
    }
    if (feeConfig.flatFee !== lastSavedFeeConfig.flatFee) {
      changes.push(`Flat Fee: ${lastSavedFeeConfig.flatFee} MMK -> ${feeConfig.flatFee} MMK`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Updated flat rate transaction fee',
          `${lastSavedFeeConfig.flatFee} MMK`,
          `${feeConfig.flatFee} MMK`
        );
      }
    }
    if (feeConfig.percentage !== lastSavedFeeConfig.percentage) {
      changes.push(`Fee Percentage: ${lastSavedFeeConfig.percentage}% -> ${feeConfig.percentage}%`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Updated fee percentage multiplier',
          `${lastSavedFeeConfig.percentage}%`,
          `${feeConfig.percentage}%`
        );
      }
    }
    if (feeConfig.minAmount !== lastSavedFeeConfig.minAmount) {
      changes.push(`Min EWA: ${lastSavedFeeConfig.minAmount.toLocaleString()} MMK -> ${feeConfig.minAmount.toLocaleString()} MMK`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Adjusted Minimum EWA advance limit',
          `${lastSavedFeeConfig.minAmount.toLocaleString()} MMK`,
          `${feeConfig.minAmount.toLocaleString()} MMK`
        );
      }
    }
    if (feeConfig.maxAmount !== lastSavedFeeConfig.maxAmount) {
      changes.push(`Max EWA: ${lastSavedFeeConfig.maxAmount.toLocaleString()} MMK -> ${feeConfig.maxAmount.toLocaleString()} MMK`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Adjusted Maximum EWA advance limit',
          `${lastSavedFeeConfig.maxAmount.toLocaleString()} MMK`,
          `${feeConfig.maxAmount.toLocaleString()} MMK`
        );
      }
    }
    if (feeConfig.applyStartDay !== lastSavedFeeConfig.applyStartDay) {
      changes.push(`Start Day: Day ${lastSavedFeeConfig.applyStartDay} -> Day ${feeConfig.applyStartDay}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Modified monthly drawing window start day',
          `Day ${lastSavedFeeConfig.applyStartDay}`,
          `Day ${feeConfig.applyStartDay}`
        );
      }
    }
    if (feeConfig.applyEndDay !== lastSavedFeeConfig.applyEndDay) {
      changes.push(`End Day: Day ${lastSavedFeeConfig.applyEndDay} -> Day ${feeConfig.applyEndDay}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Modified monthly drawing window end day',
          `Day ${lastSavedFeeConfig.applyEndDay}`,
          `Day ${feeConfig.applyEndDay}`
        );
      }
    }
    if (feeConfig.freezeDay !== lastSavedFeeConfig.freezeDay) {
      changes.push(`Freeze Day: Day ${lastSavedFeeConfig.freezeDay} -> Day ${feeConfig.freezeDay}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Adjusted Payroll Freeze Cut-off Day',
          `Day ${lastSavedFeeConfig.freezeDay}`,
          `Day ${feeConfig.freezeDay}`
        );
      }
    }
    if (feeConfig.gapDaysAfterPayroll !== lastSavedFeeConfig.gapDaysAfterPayroll) {
      changes.push(`Gap Days: ${lastSavedFeeConfig.gapDaysAfterPayroll} -> ${feeConfig.gapDaysAfterPayroll}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Updated gap days before next cycle',
          `${lastSavedFeeConfig.gapDaysAfterPayroll} days`,
          `${feeConfig.gapDaysAfterPayroll} days`
        );
      }
    }
    if (feeConfig.lateReminderDays !== lastSavedFeeConfig.lateReminderDays) {
      changes.push(`Reminder Days: ${lastSavedFeeConfig.lateReminderDays} -> ${feeConfig.lateReminderDays}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Modified Late Reminder Trigger days threshold',
          `${lastSavedFeeConfig.lateReminderDays} days`,
          `${feeConfig.lateReminderDays} days`
        );
      }
    }
    if (feeConfig.maxMonthlyRequests !== lastSavedFeeConfig.maxMonthlyRequests) {
      changes.push(`Max Monthly Requests: ${lastSavedFeeConfig.maxMonthlyRequests} -> ${feeConfig.maxMonthlyRequests}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Updated Max Monthly EWA requests allowed (Velocity limit)',
          `${lastSavedFeeConfig.maxMonthlyRequests} requests`,
          `${feeConfig.maxMonthlyRequests} requests`
        );
      }
    }
    if (feeConfig.payer !== lastSavedFeeConfig.payer) {
      changes.push(`Payer: ${lastSavedFeeConfig.payer} -> ${feeConfig.payer}`);
      if (addAuditLog) {
        addAuditLog(
          'Fee Configuration',
          'Switched EWA Fee Settlement Payer Model',
          `Payer: ${lastSavedFeeConfig.payer}`,
          `Payer: ${feeConfig.payer}`
        );
      }
    }

    // Bracket rate checks
    feeConfig.tiers.forEach((tier, i) => {
      const lastTier = lastSavedFeeConfig.tiers[i];
      if (lastTier && tier.rate !== lastTier.rate) {
        changes.push(`Bracket ${i+1} Rate: ${lastTier.rate} MMK -> ${tier.rate} MMK`);
        if (addAuditLog) {
          addAuditLog(
            'Fee Configuration',
            `Modified Tiered Bracket ${i+1} pricing rate`,
            `${lastTier.rate} MMK`,
            `${tier.rate} MMK`
          );
        }
      }
    });

    setLastSavedFeeConfig({ ...feeConfig });
    
    if (changes.length > 0) {
      showToast(`Fee configurations committed. Saved ${changes.length} sensitive updates in system audit log.`);
    } else {
      showToast('Fee parameters and configurations are already up-to-date.');
    }
  };

  const renderFeeConfig = () => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900">EWA Fee & GoRule Constraints Setup</h3>
          <p className="text-xs text-gray-500">Edit transaction fee rules, drawing windows, freeze days, and structural payer models.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm p-5 space-y-6 max-w-3xl">
          
          {/* Section: Fee Structure Model */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-gray-50 pb-2">Service Fee Formula</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setFeeConfig({ ...feeConfig, model: 'flat' })}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  feeConfig.model === 'flat' ? 'border-amber-600 bg-amber-50/40' : 'border-gray-200'
                }`}
              >
                <h5 className="text-xs font-bold text-gray-900">Flat Rate Model</h5>
                <p className="text-[10px] text-gray-500 mt-1">Charged as fixed MMK per transaction.</p>
              </button>
              
              <button
                onClick={() => setFeeConfig({ ...feeConfig, model: 'percentage' })}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  feeConfig.model === 'percentage' ? 'border-amber-600 bg-amber-50/40' : 'border-gray-200'
                }`}
              >
                <h5 className="text-xs font-bold text-gray-900">Percentage Model</h5>
                <p className="text-[10px] text-gray-500 mt-1">Charged as % multiplier of advance.</p>
              </button>

              <button
                onClick={() => setFeeConfig({ ...feeConfig, model: 'tiered' })}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  feeConfig.model === 'tiered' ? 'border-amber-600 bg-amber-50/40' : 'border-gray-200'
                }`}
              >
                <h5 className="text-xs font-bold text-gray-900">Tiered Bracket Model</h5>
                <p className="text-[10px] text-gray-500 mt-1">Bracketed pricing for progressive amounts.</p>
              </button>
            </div>
          </div>

          {/* Configuration Inputs based on Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {feeConfig.model === 'flat' && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Flat Rate Amount (MMK)</label>
                <input
                  type="number"
                  value={feeConfig.flatFee}
                  onChange={(e) => setFeeConfig({ ...feeConfig, flatFee: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
            )}

            {feeConfig.model === 'percentage' && (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Fee Percentage (%)</label>
                <input
                  type="number"
                  value={feeConfig.percentage}
                  onChange={(e) => setFeeConfig({ ...feeConfig, percentage: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  step="0.1"
                />
              </div>
            )}

            {feeConfig.model === 'tiered' && (
              <div className="col-span-2 space-y-2">
                <label className="block font-semibold text-gray-700">Tier Brackets Rules</label>
                <div className="space-y-2 max-w-lg">
                  {feeConfig.tiers.map((t, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <span className="text-gray-400 text-[10px] w-20">Bracket {i + 1}:</span>
                      <input
                        type="text"
                        value={`${t.min?.toLocaleString() ?? 0} to ${(t.max === Infinity || t.max === null) ? 'Max' : t.max?.toLocaleString() ?? 0}`}
                        disabled
                        className="bg-gray-100 border border-gray-200 rounded p-1.5 font-mono text-[10px] w-48 text-gray-500"
                      />
                      <span className="text-gray-500">Rate:</span>
                      <input
                        type="number"
                        value={t.rate}
                        onChange={(e) => {
                          const updated = [...feeConfig.tiers];
                          updated[i].rate = Number(e.target.value);
                          setFeeConfig({ ...feeConfig, tiers: updated });
                        }}
                        className="bg-gray-50 border border-gray-200 rounded p-1 font-mono text-[10px] w-24 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right"
                      />
                      <span className="text-gray-400 text-[10px]">MMK</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* General parameters */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Minimum Advance Allowed (MMK)</label>
              <input
                type="number"
                value={feeConfig.minAmount}
                onChange={(e) => setFeeConfig({ ...feeConfig, minAmount: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Maximum Advance Allowed (MMK)</label>
              <input
                type="number"
                value={feeConfig.maxAmount}
                onChange={(e) => setFeeConfig({ ...feeConfig, maxAmount: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Monthly Drawing window Start (Day)</label>
              <input
                type="number"
                value={feeConfig.applyStartDay}
                onChange={(e) => setFeeConfig({ ...feeConfig, applyStartDay: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                min="1"
                max="31"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Monthly Drawing window End (Day)</label>
              <input
                type="number"
                value={feeConfig.applyEndDay}
                onChange={(e) => setFeeConfig({ ...feeConfig, applyEndDay: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                min="1"
                max="31"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Payroll Freeze Cut-off Day</label>
              <input
                type="number"
                value={feeConfig.freezeDay}
                onChange={(e) => setFeeConfig({ ...feeConfig, freezeDay: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                min="1"
                max="31"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Gap Days Before Next Cycle</label>
              <input
                type="number"
                value={feeConfig.gapDaysAfterPayroll}
                onChange={(e) => setFeeConfig({ ...feeConfig, gapDaysAfterPayroll: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                min="0"
                max="10"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Late Reminder Trigger (Days)</label>
              <input
                type="number"
                value={feeConfig.lateReminderDays}
                onChange={(e) => setFeeConfig({ ...feeConfig, lateReminderDays: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                min="1"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Max Monthly Requests (Velocity)</label>
              <input
                type="number"
                value={feeConfig.maxMonthlyRequests}
                onChange={(e) => setFeeConfig({ ...feeConfig, maxMonthlyRequests: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                min="1"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Fee Settlement Model Payer</label>
              <select
                value={feeConfig.payer}
                onChange={(e) => setFeeConfig({ ...feeConfig, payer: e.target.value as any })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="employee">Employee Deducted (at Disbursement)</option>
                <option value="corporate">Corporate Covered (at Repayment)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={handleSaveFeeConfig}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs rounded-lg flex items-center space-x-2 transition-colors duration-150 cursor-pointer"
            >
              <i className="fa-solid fa-floppy-disk" />
              <span>Save Rules Configuration</span>
            </button>
          </div>

        </div>
      </div>
    );
  };

  // System Audit Logs Viewer
  const renderSystemAudit = () => {
    // 1. Filtering
    const filteredLogs = auditLogs.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.previousValue.toLowerCase().includes(auditSearch.toLowerCase()) ||
        log.newValue.toLowerCase().includes(auditSearch.toLowerCase());
      
      const matchesCategory = auditCategory === 'All' || log.category === auditCategory;
      
      return matchesSearch && matchesCategory;
    });

    // 2. Pagination details
    const itemsPerPage = 8;
    const totalItems = filteredLogs.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (auditPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const feeConfigCount = auditLogs.filter(l => l.category === 'Fee Configuration').length;
    const validationCount = auditLogs.filter(l => l.category === 'Validation Rules').length;
    const latestChange = auditLogs[0]?.timestamp || 'Never';

    const handleExportAuditCSV = () => {
      const headers = ['ID', 'Category', 'Action', 'Performed By', 'Previous Value', 'New Value', 'Timestamp'];
      const rows = filteredLogs.map(log => [
        log.id,
        log.category,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.performedBy.replace(/"/g, '""')}"`,
        `"${log.previousValue.replace(/"/g, '""')}"`,
        `"${log.newValue.replace(/"/g, '""')}"`,
        log.timestamp
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `system_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Successfully exported system audit trail to CSV format.');
    };

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Maker-Checker System Audit Trail Ledger</h3>
            <p className="text-xs text-gray-500">Immutable operations log tracking modifications made to system-wide transaction fee schedules, drawing windows, and DMN validation constraints.</p>
          </div>
          <button
            onClick={handleExportAuditCSV}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2 bg-emerald-750 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-file-csv" />
            <span>Export Trail to CSV</span>
          </button>
        </div>

        {/* Top summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => { setAuditCategory('All'); setAuditPage(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              auditCategory === 'All'
                ? 'border-emerald-600 bg-emerald-50/20 ring-1 ring-emerald-500'
                : 'bg-white border-gray-150 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Audit Logs</span>
              <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                <i className="fa-solid fa-list-ul text-xs" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-gray-950">{auditLogs.length}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">All configuration updates</span>
            </div>
          </button>

          <button
            onClick={() => { setAuditCategory('Fee Configuration'); setAuditPage(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              auditCategory === 'Fee Configuration'
                ? 'border-amber-600 bg-amber-50/20 ring-1 ring-amber-500'
                : 'bg-white border-gray-150 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fee Config Logs</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <i className="fa-solid fa-sliders text-xs" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-gray-950">{feeConfigCount}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">Fee & pricing tweaks</span>
            </div>
          </button>

          <button
            onClick={() => { setAuditCategory('Validation Rules'); setAuditPage(1); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              auditCategory === 'Validation Rules'
                ? 'border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-500'
                : 'bg-white border-gray-150 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Validation Rules</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <i className="fa-solid fa-shield-halved text-xs" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-gray-950">{validationCount}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">DMN validation rule updates</span>
            </div>
          </button>

          <div className="p-4 bg-white rounded-xl border border-gray-150 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Latest Activity</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <i className="fa-solid fa-clock text-xs" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs font-bold font-mono text-gray-950 truncate block mt-1">{latestChange}</span>
              <span className="text-[10px] text-gray-400 block mt-1">Last structural change</span>
            </div>
          </div>
        </div>

        {/* Filter controls panel */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <i className="fa-solid fa-magnifying-glass" />
            </span>
            <input
              type="text"
              placeholder="Search audit trail logs (e.g., modified, flat fee, Daw Mya)..."
              value={auditSearch}
              onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-all font-sans"
            />
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
            <span className="font-semibold text-gray-500 whitespace-nowrap">Filter Category:</span>
            <select
              value={auditCategory}
              onChange={(e) => { setAuditCategory(e.target.value as any); setAuditPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
            >
              <option value="All">All Categories</option>
              <option value="Fee Configuration">Fee Configuration</option>
              <option value="Validation Rules">Validation Rules</option>
            </select>
          </div>
        </div>

        {/* Table list of logs */}
        <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-40">Timestamp</th>
                  <th className="p-4 w-40">Category</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Previous Value</th>
                  <th className="p-4">New Value</th>
                  <th className="p-4 w-48">Authorized Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => {
                    const isFee = log.category === 'Fee Configuration';
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide inline-flex items-center space-x-1.5 ${
                            isFee 
                              ? 'bg-amber-50 text-amber-800 border border-amber-100' 
                              : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                          }`}>
                            <i className={`text-[10px] ${isFee ? 'fa-solid fa-sliders' : 'fa-solid fa-shield-halved'}`} />
                            <span>{log.category}</span>
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-gray-900">
                          {log.action}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-rose-800 max-w-xs break-all">
                          <div className="bg-rose-50/40 px-2 py-1.5 rounded-lg border border-rose-100/50 flex items-center space-x-1.5">
                            <i className="fa-solid fa-ban text-[10px]" />
                            <span className="line-through">{log.previousValue}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-emerald-800 max-w-xs break-all">
                          <div className="bg-emerald-50/40 px-2 py-1.5 rounded-lg border border-emerald-100/50 flex items-center space-x-1.5">
                            <i className="fa-solid fa-circle-check text-[10px]" />
                            <span className="font-bold">{log.newValue}</span>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-[10px] border border-emerald-100 uppercase">
                              {log.performedBy.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-700 text-xs">{log.performedBy}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="w-12 h-12 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-center text-gray-400 mx-auto text-lg shadow-inner">
                          <i className="fa-solid fa-clipboard-question" />
                        </div>
                        <p className="font-bold text-gray-700 text-sm">No Audit Logs Found</p>
                        <p className="text-xs text-gray-400">We couldn't find any configuration logs matching "{auditSearch}". Try broadening your query or choosing another category.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table pagination footer */}
          {totalItems > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-150 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
              <span className="text-gray-500 font-sans">
                Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to{' '}
                <span className="font-bold text-gray-800">{Math.min(startIndex + itemsPerPage, totalItems)}</span> of{' '}
                <span className="font-bold text-gray-800">{totalItems}</span> audit entries
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  disabled={auditPage === 1}
                  onClick={() => setAuditPage(p => p - 1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-colors font-bold flex items-center space-x-1"
                >
                  <i className="fa-solid fa-angle-left" />
                  <span>Prev</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setAuditPage(page)}
                    className={`px-3 py-1.5 rounded-lg border font-bold font-mono transition-colors cursor-pointer ${
                      auditPage === page
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={auditPage === totalPages}
                  onClick={() => setAuditPage(p => p + 1)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white cursor-pointer transition-colors font-bold flex items-center space-x-1"
                >
                  <span>Next</span>
                  <i className="fa-solid fa-angle-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActiveSubTab = () => {
    switch (activeSubTab) {
      case 'companies':
        return renderCompanies();
      case 'employees':
        return renderEmployees();
      case 'users':
        return renderUsers();
      case 'fee-config':
        return renderFeeConfig();
      case 'system-audit':
        return renderSystemAudit();
      default:
        return renderCompanies();
    }
  };

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2">
          <i className="fa-solid fa-circle-check" />
          <span>{toast}</span>
        </div>
      )}

      {renderActiveSubTab()}

      {/* MODAL 1: Add/Edit Company — full Company 360 Profile (period-based ledger setup) */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCompany} className="bg-white rounded-2xl max-w-5xl w-full shadow-xl border border-gray-100 overflow-hidden text-xs flex flex-col" style={{ maxHeight: '92vh' }}>
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-bold text-gray-900">{editCompanyId !== null ? (compName || 'Modify Company Profile') : 'Register New Client Company'}</h4>
                <p className="text-[10px] text-gray-500 mt-0.5">Company 360° setup — profile, credit, payroll policy, budget, limitation & fee rules</p>
              </div>
              <button type="button" onClick={() => setShowCompanyModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left vertical tab nav */}
              <div className="w-44 shrink-0 bg-gray-50 border-r border-gray-100 p-2 space-y-1 overflow-y-auto">
                {[
                  { id: 'profile', label: 'Corporate Profile', icon: 'fa-building' },
                  { id: 'credit', label: 'Credit Assessment', icon: 'fa-chart-line' },
                  { id: 'payroll', label: 'Rule · Payroll Policy', icon: 'fa-calendar-days' },
                  { id: 'budget', label: 'Rule · Budget', icon: 'fa-coins' },
                  { id: 'limitation', label: 'Rule · Limitation', icon: 'fa-gauge-high' },
                  { id: 'fees', label: 'Fee Configuration', icon: 'fa-sack-dollar' },
                  { id: 'employees', label: 'Employee Whitelist', icon: 'fa-users' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setCompanyModalTab(t.id as any)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center space-x-2 cursor-pointer transition-colors ${companyModalTab === t.id ? 'bg-amber-600 text-white font-semibold shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <i className={`fa-solid ${t.icon} w-3.5 text-center`} />
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* Right tab content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* TAB: Corporate Profile */}
                {companyModalTab === 'profile' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Company Legal Name *</label>
                      <input type="text" value={compName} onChange={(e) => setCompName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-amber-500 focus:outline-none" placeholder="e.g. Yoma Fleet Logistics" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Company Type</label>
                        <select value={compType} onChange={(e) => setCompType(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none">
                          <option value="Corporate">Corporate Model</option>
                          <option value="SME">SME Model</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">DICA Number *</label>
                        <input type="text" value={compDica} onChange={(e) => setCompDica(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" placeholder="DICA-YYYY-XXXX" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Industry Sector</label>
                        <select value={compIndustry} onChange={(e) => setCompIndustry(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none">
                          <option value="Oil & Gas">Oil & Gas</option>
                          <option value="Logistics">Logistics</option>
                          <option value="Retail">Retail</option>
                          <option value="Food & Beverage">Food & Beverage</option>
                          <option value="Manufacturing">Manufacturing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Registration Date</label>
                        <input type="date" value={compRegDate} onChange={(e) => setCompRegDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Signatory Name</label>
                        <input type="text" value={compSignatoryName} onChange={(e) => setCompSignatoryName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="Authorized signatory" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Signatory Email</label>
                        <input type="email" value={compSignatoryEmail} onChange={(e) => setCompSignatoryEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="name@company.com" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Signatory Authorized Contact *</label>
                      <input type="text" value={compContact} onChange={(e) => setCompContact(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="+95 9 xxxxxxxx" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Website</label>
                        <input type="text" value={compWebsite} onChange={(e) => setCompWebsite(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="https://" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Status</label>
                        <select value={compStatus} onChange={(e) => setCompStatus(e.target.value as any)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Frozen">Frozen</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Registered Address</label>
                      <input type="text" value={compAddress} onChange={(e) => setCompAddress(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="No., Street, Township, City" />
                    </div>
                  </div>
                )}

                {/* TAB: Credit Assessment */}
                {companyModalTab === 'credit' && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide">Internal Credit Score</div>
                        <div className="text-2xl font-bold text-amber-800">{credit.score}<span className="text-xs font-medium text-amber-600">/100</span></div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-amber-700 font-semibold uppercase tracking-wide">Resulting Tier</div>
                        <div className="text-2xl font-bold text-amber-800">{compTier}</div>
                      </div>
                    </div>
                    <input type="range" min="0" max="100" value={credit.score} onChange={e => setCredit({ ...credit, score: Number(e.target.value) })} className="w-full accent-amber-600" />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Credit Rating</label>
                        <select value={credit.rating} onChange={e => setCredit({ ...credit, rating: e.target.value as any })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-bold">
                          <option value="A">Tier A — Excellent</option>
                          <option value="B">Tier B — Good</option>
                          <option value="C">Tier C — Average</option>
                          <option value="D">Tier D — Weak</option>
                          <option value="E">Tier E — High Risk</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Payroll Stability</label>
                        <select value={credit.payrollStability} onChange={e => setCredit({ ...credit, payrollStability: e.target.value as any })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none">
                          <option value="Stable">Stable</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Volatile">Volatile</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Annual Revenue (MMK)</label>
                        <input type="number" value={credit.annualRevenue} onChange={e => setCredit({ ...credit, annualRevenue: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Headcount</label>
                        <input type="number" value={credit.employeeHeadcount} onChange={e => setCredit({ ...credit, employeeHeadcount: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Years in Operation</label>
                        <input type="number" value={credit.yearsInOperation} onChange={e => setCredit({ ...credit, yearsInOperation: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Last Reviewed Date</label>
                        <input type="date" value={credit.lastReviewedDate} onChange={e => setCredit({ ...credit, lastReviewedDate: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Reviewed By</label>
                        <input type="text" value={credit.reviewedBy} onChange={e => setCredit({ ...credit, reviewedBy: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="Risk Officer name" />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Assessment Notes</label>
                      <textarea value={credit.notes} onChange={e => setCredit({ ...credit, notes: e.target.value })} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none" placeholder="Underwriting commentary, financial health, references..." />
                    </div>
                  </div>
                )}

                {/* TAB: Rule - Payroll Policy */}
                {companyModalTab === 'payroll' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-500">Defines the company's payroll cycle and how it relates to EWA repayment timing.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Cycle Start Day</label>
                        <input type="number" min={1} max={31} value={payrollPolicy.cycleStartDay} onChange={e => setPayrollPolicy({ ...payrollPolicy, cycleStartDay: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Cycle End Day (Cutoff)</label>
                        <input type="number" min={1} max={31} value={payrollPolicy.cycleEndDay} onChange={e => setPayrollPolicy({ ...payrollPolicy, cycleEndDay: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Payday</label>
                        <input type="number" min={1} max={31} value={payrollPolicy.paydayDay} onChange={e => setPayrollPolicy({ ...payrollPolicy, paydayDay: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Repayment Day</label>
                        <input type="number" min={1} max={31} value={payrollPolicy.repaymentDay} onChange={e => setPayrollPolicy({ ...payrollPolicy, repaymentDay: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Gap Days with Repayment</label>
                        <input type="number" min={0} max={15} value={payrollPolicy.gapDaysWithRepayment} onChange={e => setPayrollPolicy({ ...payrollPolicy, gapDaysWithRepayment: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                        <p className="text-[10px] text-gray-400 mt-1">Buffer between repayment day and the next cycle's open.</p>
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Effective From</label>
                        <input type="date" value={payrollPolicy.effectiveFrom} onChange={e => setPayrollPolicy({ ...payrollPolicy, effectiveFrom: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Effective To <span className="font-normal text-gray-400">(optional)</span></label>
                      <input type="date" value={payrollPolicy.effectiveTo} onChange={e => setPayrollPolicy({ ...payrollPolicy, effectiveTo: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                    </div>

                    {/* Mini cycle preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">Start: Day {payrollPolicy.cycleStartDay}</span>
                      <i className="fa-solid fa-arrow-right text-gray-300" />
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded">Cutoff: Day {payrollPolicy.cycleEndDay}</span>
                      <i className="fa-solid fa-arrow-right text-gray-300" />
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Payday: Day {payrollPolicy.paydayDay}</span>
                      <i className="fa-solid fa-arrow-right text-gray-300" />
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">Repay: Day {payrollPolicy.repaymentDay} (+{payrollPolicy.gapDaysWithRepayment}d gap)</span>
                    </div>
                  </div>
                )}

                {/* TAB: Rule - Budget */}
                {companyModalTab === 'budget' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-500">Controls the company-level EWA budget pool and per-employee exposure caps.</p>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Total Budget Pool (MMK)</label>
                      <input type="number" step="1000000" value={compBudget} onChange={e => setCompBudget(Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      <p className="text-[10px] text-gray-400 mt-1">Currently utilized: {companies.find(c => c.id === editCompanyId)?.utilized?.toLocaleString() || 0} MMK</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Per-Employee Cap (MMK)</label>
                        <input type="number" step="50000" value={budgetRule.perEmployeeCap} onChange={e => setBudgetRule({ ...budgetRule, perEmployeeCap: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Reserve Buffer (%)</label>
                        <input type="number" value={budgetRule.reserveBufferPercent} onChange={e => setBudgetRule({ ...budgetRule, reserveBufferPercent: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Utilization Alert Threshold (%)</label>
                        <input type="number" value={budgetRule.utilizationAlertThreshold} onChange={e => setBudgetRule({ ...budgetRule, utilizationAlertThreshold: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div className="flex items-end pb-2.5">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input type="checkbox" checked={budgetRule.autoFreezeOnBreach} onChange={e => setBudgetRule({ ...budgetRule, autoFreezeOnBreach: e.target.checked })} className="rounded" />
                          <span className="font-semibold text-gray-700">Auto-freeze company on budget breach</span>
                        </label>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Math.min(100, ((companies.find(c => c.id === editCompanyId)?.utilized || 0) / (compBudget || 1)) * 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* TAB: Rule - Limitation */}
                {companyModalTab === 'limitation' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-500">Per-request and eligibility limits applied to every EWA withdrawal under this company.</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Max % of Salary per Cycle</label>
                        <input type="number" value={limitationRule.maxPercentSalary} onChange={e => setLimitationRule({ ...limitationRule, maxPercentSalary: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Max Monthly Requests</label>
                        <input type="number" value={limitationRule.maxMonthlyRequests} onChange={e => setLimitationRule({ ...limitationRule, maxMonthlyRequests: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Min Request Amount (MMK)</label>
                        <input type="number" value={limitationRule.minRequestAmount} onChange={e => setLimitationRule({ ...limitationRule, minRequestAmount: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Max Request Amount (MMK)</label>
                        <input type="number" value={limitationRule.maxRequestAmount} onChange={e => setLimitationRule({ ...limitationRule, maxRequestAmount: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Minimum Tenure (months)</label>
                        <input type="number" value={limitationRule.minTenureMonths} onChange={e => setLimitationRule({ ...limitationRule, minTenureMonths: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">Cooling-off Period (hours)</label>
                        <input type="number" value={limitationRule.coolingOffHours} onChange={e => setLimitationRule({ ...limitationRule, coolingOffHours: Number(e.target.value) })} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono" />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Fee Configuration */}
                {companyModalTab === 'fees' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-gray-500">Configure fees by category. Each category supports Flat, Percentage, or Tiered pricing, and a charge bearer.</p>
                    <div className="flex space-x-1.5 bg-gray-100 p-1 rounded-lg w-fit">
                      {([
                        { id: 'disbursement', label: 'Disbursement' },
                        { id: 'repayment', label: 'Repayment' },
                        { id: 'contractFee', label: 'Contract Fee' },
                        { id: 'lateFee', label: 'Late Fee' },
                      ] as { id: keyof CompanyFeeSchedule; label: string }[]).map(f => (
                        <button key={f.id} type="button" onClick={() => setActiveFeeCategory(f.id)} className={`px-3 py-1.5 rounded-md font-semibold cursor-pointer ${activeFeeCategory === f.id ? 'bg-white shadow-sm text-amber-700' : 'text-gray-500 hover:text-gray-700'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const rule = feeSchedule[activeFeeCategory];
                      const set = (patch: Partial<FeeRule>) => updateFeeRule(activeFeeCategory, patch);
                      return (
                        <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/50">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-gray-800">{activeFeeCategory === 'contractFee' ? 'Contract Fee' : activeFeeCategory === 'lateFee' ? 'Late Fee' : activeFeeCategory.charAt(0).toUpperCase() + activeFeeCategory.slice(1)} Rule</div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" checked={rule.enabled} onChange={e => set({ enabled: e.target.checked })} />
                              <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all relative"></div>
                            </label>
                          </div>

                          {rule.enabled && (
                            <>
                              <div>
                                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Fee Type</label>
                                <div className="flex space-x-1.5">
                                  {(['flat', 'percentage', 'tiered'] as FeeRuleType[]).map(t => (
                                    <button key={t} type="button" onClick={() => set({ type: t })} className={`flex-1 px-2 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer capitalize ${rule.type === t ? 'bg-amber-600 border-amber-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300'}`}>
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {rule.type === 'flat' && (
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Flat Amount (MMK)</label>
                                  <input type="number" value={rule.flatAmount} onChange={e => set({ flatAmount: Number(e.target.value) })} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:outline-none text-[11px] font-mono" />
                                </div>
                              )}
                              {rule.type === 'percentage' && (
                                <div>
                                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Percentage of Amount (%)</label>
                                  <input type="number" step="0.1" value={rule.percentage} onChange={e => set({ percentage: Number(e.target.value) })} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:outline-none text-[11px] font-mono" />
                                </div>
                              )}
                              {rule.type === 'tiered' && (
                                <div className="space-y-1.5">
                                  <label className="block text-[10px] font-semibold text-gray-700 mb-1">Tier Schedule (Min / Max / Rate %)</label>
                                  {rule.tiers.map((tier, idx) => (
                                    <div key={idx} className="grid grid-cols-3 gap-1.5">
                                      <input type="number" value={tier.min} onChange={e => { const tiers = [...rule.tiers]; tiers[idx] = { ...tier, min: Number(e.target.value) }; set({ tiers }); }} className="bg-white border border-gray-200 rounded p-1.5 text-[11px] font-mono focus:outline-none" placeholder="Min" />
                                      <input type="number" value={tier.max} onChange={e => { const tiers = [...rule.tiers]; tiers[idx] = { ...tier, max: Number(e.target.value) }; set({ tiers }); }} className="bg-white border border-gray-200 rounded p-1.5 text-[11px] font-mono focus:outline-none" placeholder="Max" />
                                      <input type="number" step="0.1" value={tier.rate} onChange={e => { const tiers = [...rule.tiers]; tiers[idx] = { ...tier, rate: Number(e.target.value) }; set({ tiers }); }} className="bg-white border border-gray-200 rounded p-1.5 text-[11px] font-mono focus:outline-none" placeholder="Rate %" />
                                    </div>
                                  ))}
                                  <div className="flex space-x-2 pt-1">
                                    <button type="button" onClick={() => set({ tiers: [...rule.tiers, { min: 0, max: 0, rate: 0 }] })} className="text-[10px] text-amber-700 font-semibold cursor-pointer hover:underline">+ Add Tier</button>
                                    {rule.tiers.length > 1 && (
                                      <button type="button" onClick={() => set({ tiers: rule.tiers.slice(0, -1) })} className="text-[10px] text-rose-600 font-semibold cursor-pointer hover:underline">Remove Last</button>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div>
                                <label className="block text-[10px] font-semibold text-gray-700 mb-1">Charge Bearer</label>
                                <div className="flex space-x-1.5">
                                  {(['employee', 'corporate', 'shared'] as ChargeBearer[]).map(b => (
                                    <button key={b} type="button" onClick={() => set({ chargeBearer: b })} className={`flex-1 px-2 py-1.5 rounded-md border text-[11px] font-semibold cursor-pointer capitalize ${rule.chargeBearer === b ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                                      {b}
                                    </button>
                                  ))}
                                </div>
                                {rule.chargeBearer === 'shared' && (
                                  <div className="mt-2">
                                    <label className="block text-[10px] font-semibold text-gray-700 mb-1">Employee Share of Fee (%) — remainder billed to corporate</label>
                                    <input type="number" min={0} max={100} value={rule.sharedSplitPercent} onChange={e => set({ sharedSplitPercent: Number(e.target.value) })} className="w-full bg-white border border-gray-200 rounded p-1.5 focus:outline-none text-[11px] font-mono" />
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {/* Summary of all 4 fee categories */}
                    <div className="grid grid-cols-4 gap-2">
                      {(['disbursement', 'repayment', 'contractFee', 'lateFee'] as (keyof CompanyFeeSchedule)[]).map(k => {
                        const r = feeSchedule[k];
                        return (
                          <div key={k} className={`border rounded-lg p-2 text-center ${r.enabled ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
                            <div className="text-[9px] uppercase font-semibold text-gray-500">{k === 'contractFee' ? 'Contract' : k === 'lateFee' ? 'Late' : k}</div>
                            <div className="text-[11px] font-bold text-gray-800 capitalize">{r.enabled ? r.type : 'Off'}</div>
                            <div className="text-[9px] text-gray-400 capitalize">{r.chargeBearer}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB: Employee Whitelist summary */}
                {companyModalTab === 'employees' && (() => {
                  const companyEmps = editCompanyId !== null ? employees.filter(e => e.companyId === editCompanyId) : [];
                  const verified = companyEmps.filter(e => e.ewaStage === 'Allowed EWA' || e.trusted).length;
                  const pending = companyEmps.filter(e => e.verifyStatus && e.verifyStatus !== 'Verified').length;
                  return (
                    <div className="space-y-4">
                      <p className="text-[11px] text-gray-500">Employee onboarding, verification status, and the Approved EWA (whitelist) roster for this company. Manage full records from the Employees tab.</p>
                      {editCompanyId === null ? (
                        <div className="text-center py-10 text-gray-400">
                          <i className="fa-solid fa-users-slash text-2xl mb-2" />
                          <p>Save the company first to manage its employee roster.</p>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-gray-800">{companyEmps.length}</div>
                              <div className="text-[10px] text-gray-500 font-semibold uppercase">Total Employees</div>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-emerald-700">{verified}</div>
                              <div className="text-[10px] text-emerald-600 font-semibold uppercase">Allowed EWA (Whitelist)</div>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                              <div className="text-xl font-bold text-amber-700">{pending}</div>
                              <div className="text-[10px] text-amber-600 font-semibold uppercase">Pending Verification</div>
                            </div>
                          </div>
                          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
                            {companyEmps.slice(0, 8).map(emp => (
                              <div key={emp.id} className="flex items-center justify-between px-3 py-2">
                                <div>
                                  <div className="font-semibold text-gray-800">{emp.name}</div>
                                  <div className="text-[10px] text-gray-400">{emp.code} · {emp.dept}</div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${emp.trusted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {emp.trusted ? 'Whitelisted' : (emp.verifyStatus || 'Unverified')}
                                </span>
                              </div>
                            ))}
                            {companyEmps.length === 0 && (
                              <div className="text-center py-6 text-gray-400">No employees added yet.</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2 shrink-0">
              <button type="button" onClick={() => setShowCompanyModal(false)} className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-medium cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium cursor-pointer">
                {editCompanyId !== null ? 'Save Changes' : 'Register Company'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: Add/Edit Employee */}
      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveEmployee} className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">{editEmployeeId !== null ? 'Modify Employee Profile' : 'Add Employee to Whitelist'}</h4>
              <button type="button" onClick={() => setShowEmployeeModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    value={empCode}
                    onChange={(e) => setEmpCode(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                    disabled={editEmployeeId !== null}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Parent Employer Company</label>
                  <select
                    value={empCompanyId}
                    onChange={(e) => setEmpCompanyId(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  placeholder="Enter name"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                    placeholder="+95 9 xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">NRC National ID *</label>
                  <input
                    type="text"
                    value={empNrc}
                    onChange={(e) => setEmpNrc(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                    placeholder="XX/XXX(N)XXXXXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                    placeholder="Operations"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={empPos}
                    onChange={(e) => setEmpPos(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                    placeholder="Senior Officer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly Salary (MMK) *</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Verification Status</label>
                  <select
                    value={empStatus}
                    onChange={(e) => setEmpStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Active">Active & Verified</option>
                    <option value="Unverified">Unverified</option>
                    <option value="Frozen">Frozen / Suspended</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">EWA Stage Pipeline</label>
                  <select
                    value={empEwaStage}
                    onChange={(e) => setEmpEwaStage(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Verify Employment">Verify Employment</option>
                    <option value="Allowed EWA">Allowed EWA (Whitelist)</option>
                  </select>
                </div>
                {empEwaStage === 'Verify Employment' && (
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Onboarding / Invite Status</label>
                    <select
                      value={empVerifyStatus}
                      onChange={(e) => setEmpVerifyStatus(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Pending HR Invite">Pending HR Invite</option>
                      <option value="Invited">Invited (Sent App Link)</option>
                      <option value="Self-Onboarded Request">Self-Onboarded Request</option>
                      <option value="Verified">Verified by HR</option>
                    </select>
                  </div>
                )}
              </div>

              {empEwaStage === 'Verify Employment' && empVerifyStatus === 'Pending HR Invite' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Invite Delivery Method</label>
                    <select
                      value={empInviteMethod}
                      onChange={(e) => setEmpInviteMethod(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="SMS">SMS / Text Message</option>
                      <option value="Viber">Viber</option>
                      <option value="Telegram">Telegram</option>
                    </select>
                  </div>
                </div>
              )}

              {empEwaStage === 'Verify Employment' && empVerifyStatus === 'Pending HR Invite' && (
                <div className="bg-blue-50 text-blue-800 p-2 text-[10px] rounded flex items-center space-x-2">
                  <i className="fa-solid fa-paper-plane shrink-0" />
                  <span>Upon saving, system will auto-dispatch app download link & invite code via {empInviteMethod} to {empPhone}.</span>
                </div>
              )}

            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowEmployeeModal(false)} className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-medium cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium cursor-pointer">
                {editEmployeeId !== null ? 'Save Changes' : 'Add Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Add/Edit User */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveUser} className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-gray-100 overflow-hidden text-xs">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">{editUserId !== null ? 'Modify System User Access' : 'Invite System/HR Operator'}</h4>
              <button type="button" onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">User Full Name *</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                  placeholder="user@unitedpetro.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none font-mono"
                    placeholder="+95 9 xxxxx"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">System Role Badge</label>
                  <select
                    value={userRole}
                    onChange={(e) => {
                      const newRole = e.target.value as any;
                      setUserRole(newRole);
                      setUserPermissions(getDefaultPermissions(newRole));
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="Admin HR">Admin HR (Full Company View)</option>
                    <option value="Branch HR">Branch HR (Scoped View)</option>
                    <option value="Finance">Finance Checker (Repay/Budget)</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Scoped Assigned Branch Map</label>
                <input
                  type="text"
                  value={userBranches.join(', ')}
                  onChange={(e) => setUserBranches(e.target.value.split(',').map(s => s.trim()))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  placeholder="All, Head Office, Mandalay Depot"
                />
                <p className="text-[10px] text-gray-400 mt-1">Comma-separated list of branches matching employee branches.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Operational Status</label>
                <select
                  value={userStatus}
                  onChange={(e) => setUserStatus(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Invited">Invited (Pending login)</option>
                </select>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="block font-bold text-gray-800 uppercase tracking-wide text-[10px] flex items-center space-x-1">
                  <i className="fa-solid fa-shield-halved text-amber-700" />
                  <span>Custom Granular Permissions</span>
                </label>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map(p => {
                    const checked = userPermissions.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-start space-x-2 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserPermissions([...userPermissions, p.id]);
                            } else {
                              setUserPermissions(userPermissions.filter(id => id !== p.id));
                            }
                          }}
                          className="mt-0.5 w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 rounded border-gray-300 cursor-pointer"
                        />
                        <div className="space-y-0.5 pl-1">
                          <span className="font-bold text-gray-800 text-[11px] flex items-center space-x-1">
                            {p.icon && <i className={`${p.icon} text-amber-600/80 mr-1`} />}
                            <span>{p.label}</span>
                          </span>
                          <p className="text-[9px] text-gray-400 leading-tight">{p.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              <button type="button" onClick={() => setShowUserModal(false)} className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-medium cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium cursor-pointer">
                {editUserId !== null ? 'Save User' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
