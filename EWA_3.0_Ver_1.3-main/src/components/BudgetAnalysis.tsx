import React, { useState } from 'react';
import { Company, Employee, FeeConfig } from '../types';

interface BudgetAnalysisProps {
  companies: Company[];
  employees: Employee[];
  feeConfig: FeeConfig;
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
}

export default function BudgetAnalysis({ companies, employees, feeConfig, setCompanies }: BudgetAnalysisProps) {
  const [toast, setToast] = useState<string | null>(null);

  const handleRequestIncrease = (company: Company, recommendedBudget: number) => {
    // Simulated approval process
    setToast(`Budget increase request for ${company.name} to ${recommendedBudget.toLocaleString()} MMK submitted to Risk Committee.`);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Corporate Budget & Exposure Analysis</h2>
          <p className="text-xs text-gray-500">Real-time capacity tracking based on whitelisted employees and max salary limits.</p>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-100 flex items-center space-x-2 text-xs font-semibold">
          <i className="fa-solid fa-circle-check" />
          <span>{toast}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map(company => {
          const compEmployees = employees.filter(e => e.companyId === company.id && e.status === 'Active');
          const whitelistedEmps = compEmployees.filter(e => e.trusted);
          
          const maxPercent = company.config?.maxPercentSalary || feeConfig.maxPercentSalary;
          
          let theoreticalMaxExposure = 0;
          whitelistedEmps.forEach(emp => {
            theoreticalMaxExposure += (emp.salary * maxPercent) / 100;
          });

          const utilizationPercent = company.budget > 0 ? (company.utilized / company.budget) * 100 : 0;
          const exposurePercent = company.budget > 0 ? (theoreticalMaxExposure / company.budget) * 100 : 0;
          
          const isOverExposed = exposurePercent > 100;

          // Compute cycle base period config
          const cycleCutoff = company.config?.payrollCutoffDay || feeConfig.freezeDay;
          const gapDays = company.config?.gapDaysAfterPayroll ?? feeConfig.gapDaysAfterPayroll;

          return (
            <div key={company.id} className="bg-white border border-gray-200 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{company.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[10px] text-gray-500">Limit: Max {maxPercent}%</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] text-gray-500">Cutoff: {cycleCutoff}th</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[10px] text-gray-500">Gap: {gapDays} Days</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isOverExposed ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {isOverExposed ? 'Exceeds Budget' : 'Within Limits'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Risk & Finance Approved Budget</div>
                  <div className="font-mono font-bold text-gray-900 text-sm">{company.budget.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase mb-1">Theoretical Max Exposure</div>
                  <div className={`font-mono font-bold text-sm ${isOverExposed ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {theoreticalMaxExposure.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-gray-500">Whitelist Exposure ({exposurePercent.toFixed(1)}%)</span>
                    <span className="text-gray-900">{whitelistedEmps.length} / {compEmployees.length} Employees</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${isOverExposed ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(exposurePercent, 100)}%` }}></div>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1 flex items-center">
                    <i className="fa-solid fa-circle-info mr-1" /> Cycle Period validation ensures employees who have already drawn EWA cannot be removed from the active budget calculation until next cycle.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-semibold">
                    <span className="text-gray-500">Current Cycle Utilization ({utilizationPercent.toFixed(1)}%)</span>
                    <span className="text-gray-900">{company.utilized.toLocaleString()} MMK</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(utilizationPercent, 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {isOverExposed && (
                <div className="pt-2">
                  <button 
                    onClick={() => handleRequestIncrease(company, Math.ceil(theoreticalMaxExposure * 1.1))}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded transition-colors"
                  >
                    Request Limit Increase (Finance Review)
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
