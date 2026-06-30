import React, { useState } from 'react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingSettlementsCount: number;
  pendingOnboardingCount: number;
  activeCompanyCount: number;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  pendingSettlementsCount,
  pendingOnboardingCount,
  activeCompanyCount,
  sidebarCollapsed,
  setSidebarCollapsed
}: SidebarProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    dashboard: false,
    reports: true, // Collapsed by default for a flatter look
    transactions: false,
    admin: false,
    onboarding: false,
    risk: false,
    production: true
  });

  const toggleGroup = (group: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false); // Auto expand if they click on a group while collapsed
    }
    setCollapsedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const navItem = (id: string, label: string, icon: string, badge?: number) => {
    const isActive = currentTab === id;
    return (
      <button
        id={`nav-item-${id}`}
        onClick={() => setCurrentTab(id)}
        title={sidebarCollapsed ? label : undefined}
        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all duration-150 text-left ${
          isActive
            ? 'bg-emerald-50 text-emerald-950 font-bold border-l-2 border-emerald-600 pl-2.5'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <i className={`${icon} text-emerald-700 w-4 text-center shrink-0 ${isActive ? 'text-emerald-800' : 'opacity-80'}`} />
          {!sidebarCollapsed && <span className="truncate">{label}</span>}
        </div>
        {!sidebarCollapsed && badge !== undefined && badge > 0 && (
          <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className={`bg-white border-r border-gray-100 flex flex-col h-full shrink-0 transition-all duration-200 ${
      sidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Brand Header */}
      <div className={`p-4 border-b border-gray-150 flex items-center justify-between ${
        sidebarCollapsed ? 'justify-center' : ''
      }`}>
        {!sidebarCollapsed ? (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0">
              <i className="fa-solid fa-leaf text-base" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-sans font-bold text-gray-900 tracking-tight leading-tight truncate">WageFlow v4</h1>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">EWA 3.0 Platform</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 cursor-pointer" onClick={() => setSidebarCollapsed(false)}>
            <i className="fa-solid fa-leaf text-base" />
          </div>
        )}
        
        {/* Collapse Trigger Button */}
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-50 cursor-pointer"
            title="Collapse Sidebar"
          >
            <i className="fa-solid fa-angles-left text-xs" />
          </button>
        )}
      </div>

      {/* Expand Trigger Button (only visible when collapsed) */}
      {sidebarCollapsed && (
        <div className="p-2 border-b border-gray-50 flex justify-center">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            title="Expand Sidebar"
          >
            <i className="fa-solid fa-angles-right text-xs" />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
        
        {/* Dashboard Group */}
        <div>
          {!sidebarCollapsed && (
            <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <span>Overview</span>
            </div>
          )}
          <div className="mt-1 space-y-0.5">
            {navItem('overview', 'Platform Overview', 'fa-solid fa-house')}
          </div>
        </div>

        {/* Reports Group */}
        <div>
          {!sidebarCollapsed ? (
            <button
              onClick={() => toggleGroup('reports')}
              className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left"
            >
              <span>Ledger Reports</span>
              <i className={`fa-solid ${collapsedGroups.reports ? 'fa-chevron-right' : 'fa-chevron-down'} text-[8px]`} />
            </button>
          ) : (
            <div className="border-t border-gray-100 my-2" />
          )}
          {(!collapsedGroups.reports || sidebarCollapsed) && (
            <div className={`mt-1 space-y-0.5 ${!sidebarCollapsed ? 'pl-1.5 border-l border-gray-100 ml-3' : ''}`}>
              {navItem('chart-accounts', 'Chart of Accounts', 'fa-solid fa-folder-tree')}
              {navItem('journal-entries', 'Journal Entries', 'fa-solid fa-book')}
              {navItem('general-ledger', 'General Ledger', 'fa-solid fa-list-check')}
              {navItem('trial-balance', 'Trial Balance', 'fa-solid fa-scale-balanced')}
              {navItem('balance-sheet', 'Balance Sheet', 'fa-solid fa-file-invoice-dollar')}
              {navItem('profit-loss', 'Profit & Loss', 'fa-solid fa-money-bill-trend-up')}
              {navItem('cash-flow', 'Cash Flow Statement', 'fa-solid fa-money-bill-transfer')}
              {navItem('overdue-aging', 'Overdue Aging', 'fa-solid fa-hourglass-half')}
            </div>
          )}
        </div>

        {/* Transactions Group */}
        <div>
          {!sidebarCollapsed ? (
            <button
              onClick={() => toggleGroup('transactions')}
              className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left"
            >
              <span>Transactions</span>
              <i className={`fa-solid ${collapsedGroups.transactions ? 'fa-chevron-right' : 'fa-chevron-down'} text-[8px]`} />
            </button>
          ) : (
            <div className="border-t border-gray-100 my-2" />
          )}
          {(!collapsedGroups.transactions || sidebarCollapsed) && (
            <div className={`mt-1 space-y-0.5 ${!sidebarCollapsed ? 'pl-1.5 border-l border-gray-100 ml-3' : ''}`}>
              {navItem('settlement-queue', 'Settlement Queue', 'fa-solid fa-clipboard-list', pendingSettlementsCount)}
              {navItem('disbursement-monitor', 'Disbursement Monitor', 'fa-solid fa-money-check-dollar')}
              {navItem('qr-processing', 'QR Code Processing', 'fa-solid fa-qrcode')}
              {navItem('disbursement-report', 'Disbursement Transactions', 'fa-solid fa-money-bill-wave')}
              {navItem('repayment-report', 'Repayment Transactions', 'fa-solid fa-rotate-left')}
              {navItem('overdue-transactions', 'Overdue / Late Fee Transactions', 'fa-solid fa-triangle-exclamation')}
              {navItem('account-statement', 'Account Statement', 'fa-solid fa-receipt')}
              {navItem('reconciliation-report', 'Payroll Reconciliation', 'fa-solid fa-list-check')}
            </div>
          )}
        </div>

        {/* Admin Group */}
        <div>
          {!sidebarCollapsed ? (
            <button
              onClick={() => toggleGroup('admin')}
              className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left"
            >
              <span>Admin & Config</span>
              <i className={`fa-solid ${collapsedGroups.admin ? 'fa-chevron-right' : 'fa-chevron-down'} text-[8px]`} />
            </button>
          ) : (
            <div className="border-t border-gray-100 my-2" />
          )}
          {(!collapsedGroups.admin || sidebarCollapsed) && (
            <div className={`mt-1 space-y-0.5 ${!sidebarCollapsed ? 'pl-1.5 border-l border-gray-100 ml-3' : ''}`}>
              {navItem('companies', 'Companies Manager', 'fa-solid fa-building', activeCompanyCount)}
              {navItem('employees', 'Employee Directory', 'fa-solid fa-users')}
              {navItem('users', 'System Users', 'fa-solid fa-user-gear')}
              {navItem('fee-config', 'Fee Configuration', 'fa-solid fa-sliders')}
              {navItem('system-audit', 'System Audit Log', 'fa-solid fa-clock-rotate-left')}
              {navItem('form-creator', 'Dynamic Form Creator', 'fa-solid fa-laptop-code')}
              {navItem('notifications', 'Bulk Notification Portal', 'fa-solid fa-paper-plane')}
            </div>
          )}
        </div>

        {/* Onboarding Group */}
        <div>
          {!sidebarCollapsed ? (
            <button
              onClick={() => toggleGroup('onboarding')}
              className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left"
            >
              <span>Onboarding</span>
              <i className={`fa-solid ${collapsedGroups.onboarding ? 'fa-chevron-right' : 'fa-chevron-down'} text-[8px]`} />
            </button>
          ) : (
            <div className="border-t border-gray-100 my-2" />
          )}
          {(!collapsedGroups.onboarding || sidebarCollapsed) && (
            <div className={`mt-1 space-y-0.5 ${!sidebarCollapsed ? 'pl-1.5 border-l border-gray-100 ml-3' : ''}`}>
              {navItem('company-onboarding', 'Company Onboarding', 'fa-solid fa-rocket', pendingOnboardingCount)}
            </div>
          )}
        </div>

        {/* Risk & Rules Group */}
        <div>
          {!sidebarCollapsed ? (
            <button
              onClick={() => toggleGroup('risk')}
              className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left"
            >
              <span>Risk & Rules</span>
              <i className={`fa-solid ${collapsedGroups.risk ? 'fa-chevron-right' : 'fa-chevron-down'} text-[8px]`} />
            </button>
          ) : (
            <div className="border-t border-gray-100 my-2" />
          )}
          {(!collapsedGroups.risk || sidebarCollapsed) && (
            <div className={`mt-1 space-y-0.5 ${!sidebarCollapsed ? 'pl-1.5 border-l border-gray-100 ml-3' : ''}`}>
              {navItem('budget-analysis', 'Budget & Exposure', 'fa-solid fa-scale-balanced')}
              {navItem('credit-assessment', 'Credit Scoring', 'fa-solid fa-gauge-high')}
              {navItem('ghost-employees', 'Ghost Employees', 'fa-solid fa-ghost')}
              {navItem('overdue-monitoring', 'Overdue Watch', 'fa-solid fa-triangle-exclamation')}
              {navItem('validation-engine', 'DMN Rules Engine', 'fa-solid fa-diagram-project')}
            </div>
          )}
        </div>

        {/* Production Group */}
        <div>
          {!sidebarCollapsed ? (
            <button
              onClick={() => toggleGroup('production')}
              className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left"
            >
              <span>Developer Hub</span>
              <i className={`fa-solid ${collapsedGroups.production ? 'fa-chevron-right' : 'fa-chevron-down'} text-[8px]`} />
            </button>
          ) : (
            <div className="border-t border-gray-100 my-2" />
          )}
          {(!collapsedGroups.production || sidebarCollapsed) && (
            <div className={`mt-1 space-y-0.5 ${!sidebarCollapsed ? 'pl-1.5 border-l border-gray-100 ml-3' : ''}`}>
            </div>
          )}
        </div>

      </div>

      {/* Logged in User Section */}
      <div className="p-3 border-t border-gray-150 bg-gray-55/40">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold shrink-0">
            KS
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-hidden">
              <h4 className="text-[11px] font-bold text-gray-900 truncate">Kaung Htet Min</h4>
              <p className="text-[9px] text-gray-500 truncate">kaunghtetmin.kght@gmail.com</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="mt-2 text-[9px] text-center text-gray-400 font-mono">
            Tenant: MYANMAR (MMK)
          </div>
        )}
      </div>
    </aside>
  );
}
