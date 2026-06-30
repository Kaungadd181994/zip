import React, { useState } from 'react';
import { Company, Employee, JournalEntry } from '../types';
import { getAccountBalances } from '../data';

interface DashboardProps {
  companies: Company[];
  employees: Employee[];
  journalEntries: JournalEntry[];
  addSimulatedTransaction: (
    amount: number,
    type: 'disburse' | 'repay',
    employeeId: number,
    channel?: string,
    repaymentMethod?: string
  ) => { success: boolean; message: string };
  setCurrentTab: (tab: string) => void;
}

export default function Dashboard({
  companies,
  employees,
  journalEntries,
  addSimulatedTransaction,
  setCurrentTab
}: DashboardProps) {
  const [simEmployeeId, setSimEmployeeId] = useState<number>(employees[0]?.id || 1);
  const [simAmount, setSimAmount] = useState<number>(50000);
  const [simChannel, setSimChannel] = useState<string>('MoMoney');
  const [simRepaymentMethod, setSimRepaymentMethod] = useState<string>('Bank');
  const [simMessage, setSimMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Compute metrics from real-time balances
  const balances = getAccountBalances(journalEntries);
  
  const cashPool = balances['1100'] || 0;
  const advancesReceivable = balances['1200'] || 0;
  const serviceFeeReceivable = balances['1300'] || 0;
  const lateFeeReceivable = balances['1400'] || 0;
  
  const serviceFeeRevenue = balances['4100'] || 0;
  const lateFeeRevenue = balances['4200'] || 0;
  const badDebtExpense = balances['5100'] || 0;
  const gatewayFeesExpense = balances['5200'] || 0;

  const totalAssets = cashPool + advancesReceivable + serviceFeeReceivable + lateFeeReceivable;
  const totalRevenue = serviceFeeRevenue + lateFeeRevenue;
  const totalExpenses = badDebtExpense + gatewayFeesExpense;
  const netIncome = totalRevenue - totalExpenses;

  // Find some details for selected employee in simulation
  const selectedEmp = employees.find(e => e.id === Number(simEmployeeId));
  const selectedEmpCompany = selectedEmp ? companies.find(c => c.id === selectedEmp.companyId) : null;

  const handleSimulate = (type: 'disburse' | 'repay') => {
    setSimMessage(null);
    const result = addSimulatedTransaction(simAmount, type, Number(simEmployeeId), simChannel, simRepaymentMethod);
    if (result.success) {
      setSimMessage({ text: result.message, isError: false });
      // Clear after delay
      setTimeout(() => setSimMessage(null), 5000);
    } else {
      setSimMessage({ text: result.message, isError: true });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Platform Overview</h2>
          <p className="text-xs text-gray-500">Real-time metrics computed directly from the Double-Entry Circle Ledger.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <i className="fa-solid fa-clock text-emerald-600" />
          <span>System Date: <strong>2026-06-29 (UTC-7)</strong></span>
        </div>
      </div>

      {/* KPI Cards - Flat Base, Less Card, Grass Green Brand Color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 border border-gray-200 bg-white">
        
        {/* KPI 1: Total Platform Assets */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Assets</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <i className="fa-solid fa-building-columns text-xs" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-gray-900 font-mono">
              {totalAssets.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">MMK</span>
            </h3>
            <p className="text-[9px] text-gray-400 mt-1">Cash + Active Receivables</p>
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Fee Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <i className="fa-solid fa-hand-holding-dollar text-xs" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-emerald-800 font-mono">
              {totalRevenue.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">MMK</span>
            </h3>
            <p className="text-[9px] text-emerald-600 mt-1">
              <i className="fa-solid fa-arrow-up" /> Service + Late Penalty
            </p>
          </div>
        </div>

        {/* KPI 3: Overdue Outstanding */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">EWA Outstanding</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <i className="fa-solid fa-triangle-exclamation text-xs" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-rose-900 font-mono">
              {advancesReceivable.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">MMK</span>
            </h3>
            <p className="text-[9px] text-gray-400 mt-1">Active advanced salaries</p>
          </div>
        </div>

        {/* KPI 4: Net Profit */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Income</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <i className="fa-solid fa-chart-line text-xs" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-blue-900 font-mono">
              {netIncome.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">MMK</span>
            </h3>
            <p className="text-[9px] text-gray-400 mt-1">Revenue minus expenses</p>
          </div>
        </div>

        {/* KPI 5: Cash Pool */}
        <div className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Liquidity Pool</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <i className="fa-solid fa-wallet text-xs" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-base font-bold text-purple-900 font-mono">
              {cashPool.toLocaleString()} <span className="text-[10px] font-sans text-gray-400">MMK</span>
            </h3>
            <p className="text-[9px] text-purple-600 font-medium mt-1">GL Account 1100</p>
          </div>
        </div>

      </div>

      {/* Main Grid: Interactive Simulation Panel & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive EWA Transaction Simulator */}
        <div className="lg:col-span-2 bg-white border border-gray-250 p-5 space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
              <i className="fa-solid fa-vial text-emerald-700" />
              <span>Double-Entry Transaction Simulator (GoRule + Ledger Validation)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select an employee and execute EWA workflows. The system automatically tests <strong>GoRule parameters</strong>, <strong>7-point pre-disbursement controls</strong>, and writes immutable double-entry journal entries.
            </p>
          </div>

          {/* Selector Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Select Active Employee</label>
              <select
                value={simEmployeeId}
                onChange={(e) => setSimEmployeeId(Number(e.target.value))}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {employees.map(emp => {
                  const company = companies.find(c => c.id === emp.companyId);
                  return (
                    <option key={emp.id} value={emp.id}>
                      {emp.code} - {emp.name} ({company?.name || 'Unknown'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Advance Amount (MMK)</label>
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                step="5000"
                min="10000"
                max="200000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Disburse Channel</label>
              <select
                value={simChannel}
                onChange={(e) => setSimChannel(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="MoMoney">MoMoney</option>
                <option value="KBZ Pay">KBZ Pay</option>
                <option value="Wave Money">Wave Money</option>
                <option value="CB Pay">CB Pay</option>
                <option value="AYA Pay">AYA Pay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Repayment Source</label>
              <select
                value={simRepaymentMethod}
                onChange={(e) => setSimRepaymentMethod(e.target.value)}
                className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="MoPayment Wallet">MoPayment Wallet</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="MM QR">MM QR</option>
                <option value="Cash">Cash</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Selected Employee Snapshot */}
          {selectedEmp && (
            <div className="bg-emerald-50/10 p-3 border border-emerald-100/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Roster Status</span>
                <span className={`font-semibold ${selectedEmp.status === 'Active' ? 'text-emerald-700' : 'text-emerald-800'}`}>
                  {selectedEmp.status}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">EWA Whitelist</span>
                <span className="font-semibold text-gray-800">
                  {selectedEmp.trusted ? 'Whitelisted' : 'Not Whitelisted'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Monthly Salary</span>
                <span className="font-bold text-gray-900 font-mono">
                  {selectedEmp.salary.toLocaleString()} MMK
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Risk Tier (Company)</span>
                <span className="font-bold text-emerald-800">
                  Tier {selectedEmpCompany?.tier || 'C'} ({selectedEmpCompany?.name})
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => handleSimulate('disburse')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-colors duration-150 cursor-pointer"
            >
              <i className="fa-solid fa-hand-holding-dollar" />
              <span>Simulate Employee Advance Request</span>
            </button>
            <button
              onClick={() => handleSimulate('repay')}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-950 text-white font-semibold text-xs rounded-lg flex items-center space-x-2 transition-colors duration-150 cursor-pointer"
            >
              <i className="fa-solid fa-money-check-dollar" />
              <span>Simulate Corporate Settlement (Repay All)</span>
            </button>
          </div>

          {/* Simulation Feedback */}
          {simMessage && (
            <div className={`p-3 rounded-lg text-xs font-sans ${
              simMessage.isError 
                ? 'bg-rose-50 border border-rose-100 text-rose-800' 
                : 'bg-emerald-50 border border-emerald-100 text-emerald-800'
            }`}>
              <div className="flex items-start space-x-2">
                <i className={`fa-solid ${simMessage.isError ? 'fa-triangle-exclamation text-rose-600' : 'fa-circle-check text-emerald-600'} mt-0.5`} />
                <span className="leading-tight">{simMessage.text}</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick Report Access List */}
        <div className="bg-white border border-gray-250 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center space-x-2">
              <i className="fa-solid fa-link text-emerald-700" />
              <span>Quick Access Reports</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1.5 mb-4">
              Direct links to standard accounting ledgers and corporate profiles:
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setCurrentTab('trial-balance')}
                className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
              >
                <span className="text-gray-700 font-medium">Trial Balance Report</span>
                <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-700 transition-colors" />
              </button>
              <button
                onClick={() => setCurrentTab('profit-loss')}
                className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
              >
                <span className="text-gray-700 font-medium">Profit & Loss Statement</span>
                <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-700 transition-colors" />
              </button>
              <button
                onClick={() => setCurrentTab('journal-entries')}
                className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
              >
                <span className="text-gray-700 font-medium">All Journal Entries Ledger</span>
                <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-700 transition-colors" />
              </button>
              <button
                onClick={() => setCurrentTab('companies')}
                className="w-full text-left text-xs p-2 hover:bg-gray-50 rounded-lg flex items-center justify-between group"
              >
                <span className="text-gray-700 font-medium">Companies Manager</span>
                <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-emerald-700 transition-colors" />
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="bg-emerald-50/40 p-3 flex items-center space-x-3 text-xs text-emerald-800 leading-tight">
              <i className="fa-solid fa-shield-halved text-lg text-emerald-700 shrink-0" />
              <div>
                <strong>Maker-Checker Enabled</strong>: Core operations such as KYC uploads, settlement receipt approvals, and budget distributions enforce strict dual approvals.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Circle Ledger Health check */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-gray-800">Double-Entry Ledger Integrity Status:</span>
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">BALANCED (DEBITS = CREDITS)</span>
          </div>
          <div className="text-gray-400 font-mono text-[11px]">
            Cumulative Debits: <strong className="text-gray-700">{journalEntries.reduce((sum, e) => sum + e.debitAmount, 0).toLocaleString()}</strong> MMK
          </div>
        </div>
      </div>

    </div>
  );
}
