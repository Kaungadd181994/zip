import React, { useState } from 'react';
import { CompanyOnboarding, Company, CompanyType } from '../types';

interface OnboardingWizardProps {
  onboardings: CompanyOnboarding[];
  setOnboardings: React.Dispatch<React.SetStateAction<CompanyOnboarding[]>>;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
}

export default function OnboardingWizard({
  onboardings,
  setOnboardings,
  companies,
  setCompanies
}: OnboardingWizardProps) {
  const [selectedOnboardingId, setSelectedOnboardingId] = useState<number | null>(onboardings[0]?.id || null);
  const [wizardType, setWizardType] = useState<CompanyType>('Corporate');
  const [toast, setToast] = useState<string | null>(null);

  // States for new onboarding creation
  const [newCompName, setNewCompName] = useState('');
  const [newDica, setNewDica] = useState('');
  const [newContact, setNewContact] = useState('');

  // States for Risk Officer Maker assessment (Step 3 Corporate)
  const [riskScore, setRiskScore] = useState<number>(75);
  const [allocatedBudget, setAllocatedBudget] = useState<number>(50000000);

  // States for Integration Config (Step 5 Corporate)
  const [configFeeModel, setConfigFeeModel] = useState<'system_default' | 'flat' | 'percentage' | 'tiered'>('system_default');
  const [configFeePayer, setConfigFeePayer] = useState<'system_default' | 'employee' | 'corporate'>('system_default');
  const [configSettlementCycle, setConfigSettlementCycle] = useState<'monthly' | 'bi_weekly' | 'weekly'>('monthly');
  const [configMaxPercent, setConfigMaxPercent] = useState<number>(50);
  const [configCutoffDay, setConfigCutoffDay] = useState<number>(25);
  const [configGapDays, setConfigGapDays] = useState<number>(5);
  const [configLateReminder, setConfigLateReminder] = useState<number>(3);
  const [configMaxRequests, setConfigMaxRequests] = useState<number>(3);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const currentOnboarding = onboardings.find(o => o.id === selectedOnboardingId);

  const handleStartOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName || !newDica) {
      alert('Please fill out name and DICA code.');
      return;
    }

    const steps = wizardType === 'Corporate' ? [
      { name: 'Submit Company Details', status: 'completed', description: 'Company details submitted with DICA verification.', date: '2026-06-29' },
      { name: 'KYC & Document Review', status: 'current', description: 'DICA, business license and authorized signatory files required.' },
      { name: 'Credit Assessment', status: 'pending', description: 'Risk Officer assessing bank statements and financial documents.' },
      { name: 'Budget Approval', status: 'pending', description: 'Finance Officer checker approval of allocated credit pool.' },
      { name: 'Integration & Go-Live', status: 'pending', description: 'Setup e-money pools and trigger welcome HR credentials.' }
    ] : [
      { name: 'SME Registration', status: 'completed', description: 'Completed SME onboarding form.', date: '2026-06-29' },
      { name: 'Verify & Auto-Approve', status: 'current', description: 'Ops verifying owner phone and auto-assigning Tier C budget.' },
      { name: 'Active Summary', status: 'pending', description: 'Activate default Head Office and dispatch SMS instructions.' }
    ];

    const newOnboarding: CompanyOnboarding = {
      id: Date.now(),
      companyName: newCompName,
      type: wizardType,
      dica: newDica,
      contact: newContact || '+95 9 xxxxxxx',
      currentStep: 1, // Start on second step (step index 1)
      steps: steps as any,
      submittedData: {
        company_legal_name: newCompName,
        dica_number: newDica,
        contact_person: 'U Aung Ko',
        contact_email: 'aung.ko@company.com'
      }
    };

    setOnboardings(prev => [newOnboarding, ...prev]);
    setSelectedOnboardingId(newOnboarding.id);
    setNewCompName('');
    setNewDica('');
    setNewContact('');
    triggerToast(`Created Onboarding pipeline for ${newCompName}.`);
  };

  const handleAdvanceStep = () => {
    if (!currentOnboarding) return;

    const nextStepIndex = currentOnboarding.currentStep + 1;
    const isSME = currentOnboarding.type === 'SME';
    const maxSteps = isSME ? 3 : 5;

    // Allocate default risk values if entering final active checks
    let assignedTier: any = currentOnboarding.assignedTier;
    let approvedBudget: any = currentOnboarding.approvedBudget;

    if (!isSME && currentOnboarding.currentStep === 2) {
      // Completed Credit Assessment
      assignedTier = riskScore >= 85 ? 'A' : riskScore >= 70 ? 'B' : riskScore >= 55 ? 'C' : riskScore >= 40 ? 'D' : 'E';
      approvedBudget = allocatedBudget;
    }

    if (nextStepIndex >= maxSteps) {
      // Completed last step -> Activate the company!
      const newComp: Company = {
        id: Date.now(),
        name: currentOnboarding.companyName,
        type: currentOnboarding.type,
        dica: currentOnboarding.dica,
        industry: (currentOnboarding.submittedData.industry_type) || 'Logistics',
        contact: currentOnboarding.contact,
        tier: assignedTier || 'C',
        budget: approvedBudget || (isSME ? 20000000 : 50000000),
        utilized: 0,
        status: 'Active',
        branchesCount: 1,
        config: !isSME ? {
          feeModel: configFeeModel,
          feePayer: configFeePayer,
          settlementCycle: configSettlementCycle,
          maxPercentSalary: configMaxPercent,
          payrollCutoffDay: configCutoffDay,
          gapDaysAfterPayroll: configGapDays,
          lateReminderDays: configLateReminder,
          maxMonthlyRequests: configMaxRequests
        } : undefined
      };
      setCompanies(prev => [...prev, newComp]);
      
      // Update Onboarding status to complete
      setOnboardings(prev => prev.map(o => o.id === currentOnboarding.id ? {
        ...o,
        currentStep: maxSteps,
        steps: o.steps.map(s => ({ ...s, status: 'completed' }))
      } : o));

      triggerToast(`Pipeline completed! ${currentOnboarding.companyName} is now ACTIVE.`);
    } else {
      // Go to next step
      setOnboardings(prev => prev.map(o => o.id === currentOnboarding.id ? {
        ...o,
        currentStep: nextStepIndex,
        assignedTier,
        approvedBudget,
        steps: o.steps.map((s, i) => {
          if (i < nextStepIndex) return { ...s, status: 'completed', date: '2026-06-29' };
          if (i === nextStepIndex) return { ...s, status: 'current' };
          return s;
        }) as any
      } : o));
      triggerToast('Moved to next onboarding pipeline phase.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center space-x-2">
          <i className="fa-solid fa-circle-check" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Onboarding Pipelines</h2>
        <p className="text-xs text-gray-500 font-sans">Multi-step visual wizards to transition Corporate & SME clients from KYC review to live liquidity status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Create New & Pipeline Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Form: Start Onboarding */}
          <form onSubmit={handleStartOnboarding} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3.5 text-xs">
            <h3 className="font-bold text-gray-950 uppercase border-b border-gray-50 pb-2">Start Onboarding Pipeline</h3>
            <div>
              <label className="block text-gray-600 mb-1">Company legal name *</label>
              <input
                type="text"
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none"
                placeholder="e.g. Mandalay Marine Services"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-600 mb-1">Company Type</label>
                <select
                  value={wizardType}
                  onChange={(e) => setWizardType(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none"
                >
                  <option value="Corporate">Corporate (5 Steps)</option>
                  <option value="SME">SME (3 Steps)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 mb-1">DICA Reg No. *</label>
                <input
                  type="text"
                  value={newDica}
                  onChange={(e) => setNewDica(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none font-mono"
                  placeholder="DICA-2026-xxxx"
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Contact Phone</label>
              <input
                type="text"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded p-2 focus:outline-none font-mono"
                placeholder="+95 9 xxxxxxx"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center justify-center space-x-2 cursor-pointer"
            >
              <i className="fa-solid fa-play" />
              <span>Initiate Pipeline</span>
            </button>
          </form>

          {/* Active Pipelines list */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 text-xs">
            <h3 className="font-bold text-gray-950 uppercase border-b border-gray-50 pb-2">Active Onboarding Tickets</h3>
            <div className="space-y-2">
              {onboardings.map(o => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOnboardingId(o.id)}
                  className={`w-full p-3 rounded-lg border text-left flex items-start justify-between cursor-pointer ${
                    o.id === selectedOnboardingId ? 'border-amber-600 bg-amber-50/20' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="space-y-1 pr-2 overflow-hidden">
                    <h4 className="font-bold text-gray-900 truncate">{o.companyName}</h4>
                    <p className="text-[10px] text-gray-500 font-sans">
                      {o.type} &bull; DICA {o.dica}
                    </p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${
                    o.currentStep >= o.steps.length ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {o.currentStep >= o.steps.length ? 'Active' : `Phase ${o.currentStep + 1}`}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Visual Onboarding Wizard Steps (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
          {currentOnboarding ? (
            <div className="space-y-6 font-sans text-xs">
              
              {/* Pipeline details banner */}
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-[10px] text-amber-700 font-semibold uppercase tracking-widest">{currentOnboarding.type} ONBOARDING FLOW</span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5">{currentOnboarding.companyName}</h3>
                </div>
                <div className="text-right sm:text-right font-mono text-[10px] text-gray-400">
                  Ref ID: ONB-{currentOnboarding.id} &bull; Reg: {currentOnboarding.dica}
                </div>
              </div>

              {/* Steps Progress Gauge */}
              <div className="relative">
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                <div className="relative z-10 flex items-center justify-between">
                  {currentOnboarding.steps.map((step, idx) => {
                    const isCompleted = currentOnboarding.currentStep > idx;
                    const isCurrent = currentOnboarding.currentStep === idx;
                    return (
                      <div key={idx} className="flex flex-col items-center space-y-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isCompleted ? 'bg-emerald-600 text-white shadow-sm' :
                          isCurrent ? 'bg-amber-600 text-white ring-4 ring-amber-100' : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                          {isCompleted ? <i className="fa-solid fa-check text-[10px]" /> : idx + 1}
                        </div>
                        <span className="text-[9px] text-gray-500 font-semibold max-w-[80px] text-center leading-tight">
                          {step.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Phase Render Space */}
              <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                
                {/* Active Step Header */}
                <div className="border-b border-gray-100 pb-2">
                  <h4 className="font-bold text-gray-900 text-sm">
                    {currentOnboarding.steps[currentOnboarding.currentStep]?.name || 'Pipeline Completed'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {currentOnboarding.steps[currentOnboarding.currentStep]?.description || 'This company onboarding pipeline has successfully concluded and the record is now Active.'}
                  </p>
                </div>

                {/* Simulated Data form sheet per Step */}
                {currentOnboarding.currentStep < currentOnboarding.steps.length && (
                  <div className="space-y-4 pt-2">
                    
                    {/* CORPORATE FLOW DETAILS */}
                    {currentOnboarding.type === 'Corporate' && (
                      <>
                        {/* Step 2: KYC & Document Review */}
                        {currentOnboarding.currentStep === 1 && (
                          <div className="space-y-3">
                            <p className="text-gray-600">Simulate verifying uploaded corporate compliance documents:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center space-x-2.5">
                                <i className="fa-solid fa-file-pdf text-rose-700 text-lg shrink-0" />
                                <div className="overflow-hidden">
                                  <h5 className="font-semibold text-gray-900 truncate">DICA_Cert.pdf</h5>
                                  <span className="text-[9px] text-emerald-700 font-medium font-sans">Verified &bull; Clear</span>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center space-x-2.5">
                                <i className="fa-solid fa-file-pdf text-rose-700 text-lg shrink-0" />
                                <div className="overflow-hidden">
                                  <h5 className="font-semibold text-gray-900 truncate">Business_License.pdf</h5>
                                  <span className="text-[9px] text-emerald-700 font-medium font-sans">Verified &bull; Clear</span>
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200 flex items-center space-x-2.5">
                                <i className="fa-solid fa-file-image text-blue-700 text-lg shrink-0" />
                                <div className="overflow-hidden">
                                  <h5 className="font-semibold text-gray-900 truncate">Signatory_NRC.png</h5>
                                  <span className="text-[9px] text-emerald-700 font-medium font-sans">Verified &bull; OCR Scanned</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 3: Credit Assessment (Maker Mode) */}
                        {currentOnboarding.currentStep === 2 && (
                          <div className="space-y-4">
                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 flex items-start space-x-3">
                              <i className="fa-solid fa-triangle-exclamation text-amber-700 text-sm mt-0.5 shrink-0" />
                              <p className="text-amber-900 leading-tight">
                                <strong>Risk Officer Maker Assessment Required:</strong> Input the evaluated credit score metrics to calculate risk tiers (A-E) and designate credit pool boundaries.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-gray-600 mb-1">Evaluated Credit Score (0 - 100)</label>
                                <input
                                  type="number"
                                  value={riskScore}
                                  onChange={(e) => setRiskScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                                  className="w-full bg-white border border-gray-200 rounded p-2 font-mono font-bold"
                                  min="0"
                                  max="100"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Score &gt;85 is Tier A, &gt;70 Tier B, &gt;55 Tier C, &gt;40 Tier D, &lt;40 Tier E
                                </p>
                              </div>
                              <div>
                                <label className="block text-gray-600 mb-1">Designated Credit Pool Allocation (MMK)</label>
                                <input
                                  type="number"
                                  value={allocatedBudget}
                                  onChange={(e) => setAllocatedBudget(Number(e.target.value))}
                                  className="w-full bg-white border border-gray-200 rounded p-2 font-mono font-bold"
                                  step="5000000"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 4: Budget Approval (Checker Mode) */}
                        {currentOnboarding.currentStep === 3 && (
                          <div className="space-y-3 text-xs leading-normal">
                            <p className="text-gray-600">Checker dual approval for credit allocation parameters before deployment:</p>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase">Allocated Budget</span>
                                <span className="font-bold text-gray-900 font-mono text-sm">{currentRetainedValue().toLocaleString()} MMK</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[10px] uppercase">Determined Risk Tier</span>
                                <span className="font-bold text-amber-800 text-sm">Tier {currentOnboarding.assignedTier || 'C'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Step 5: Integration & Go-Live */}
                        {currentOnboarding.currentStep === 4 && (
                          <div className="space-y-4">
                            <p className="text-gray-600 leading-normal text-xs">
                              Configure company-specific Circle Ledger & Settlement parameters before final deployment. Leave as default to inherit system-wide settings.
                            </p>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Fee Model override</label>
                                <select 
                                  value={configFeeModel} 
                                  onChange={e => setConfigFeeModel(e.target.value as any)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none"
                                >
                                  <option value="system_default">Inherit System Default</option>
                                  <option value="flat">Flat Rate</option>
                                  <option value="percentage">Percentage</option>
                                  <option value="tiered">Tiered</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Fee Payer</label>
                                <select 
                                  value={configFeePayer} 
                                  onChange={e => setConfigFeePayer(e.target.value as any)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none"
                                >
                                  <option value="system_default">Inherit System Default</option>
                                  <option value="employee">Employee Deducted</option>
                                  <option value="corporate">Corporate Covered</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Settlement Cycle</label>
                                <select 
                                  value={configSettlementCycle} 
                                  onChange={e => setConfigSettlementCycle(e.target.value as any)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none"
                                >
                                  <option value="monthly">Monthly</option>
                                  <option value="bi_weekly">Bi-Weekly</option>
                                  <option value="weekly">Weekly</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Max % Salary Allowed</label>
                                <input 
                                  type="number" 
                                  value={configMaxPercent} 
                                  onChange={e => setConfigMaxPercent(Number(e.target.value))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none font-mono"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Payroll Cutoff Day</label>
                                <input 
                                  type="number" 
                                  value={configCutoffDay} 
                                  onChange={e => setConfigCutoffDay(Number(e.target.value))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none font-mono"
                                  min="1" max="31"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Gap Days (Next Cycle)</label>
                                <input 
                                  type="number" 
                                  value={configGapDays} 
                                  onChange={e => setConfigGapDays(Number(e.target.value))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none font-mono"
                                  min="0" max="10"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Late Reminder Trigger (Days)</label>
                                <input 
                                  type="number" 
                                  value={configLateReminder} 
                                  onChange={e => setConfigLateReminder(Number(e.target.value))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none font-mono"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="block font-semibold text-gray-700 mb-1">Max Monthly Requests</label>
                                <input 
                                  type="number" 
                                  value={configMaxRequests} 
                                  onChange={e => setConfigMaxRequests(Number(e.target.value))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none font-mono"
                                  min="1"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* SME Flows */}
                    {currentStepSME() && (
                      <div className="space-y-3">
                        <p className="text-gray-600 font-sans leading-tight">
                          SME pipeline bypasses financial checks and enforces streamlined auto-onboarding:
                        </p>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                          <p className="font-semibold text-gray-900 flex items-center space-x-2">
                            <i className="fa-solid fa-check text-emerald-600" />
                            <span>Auto-assigned Risk Tier C (1.0x Multiplier)</span>
                          </p>
                          <p className="font-semibold text-gray-900 flex items-center space-x-2">
                            <i className="fa-solid fa-check text-emerald-600" />
                            <span>Auto-allocated 20,000,000 MMK liquidity buffer</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons to proceed */}
                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                      <button
                        onClick={handleAdvanceStep}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg flex items-center space-x-2 cursor-pointer"
                      >
                        <span>
                          {currentOnboarding.currentStep === currentOnboarding.steps.length - 1 
                            ? 'Complete Pipeline & Go Live' 
                            : 'Approve & Move to Next Phase'
                          }
                        </span>
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </div>

                  </div>
                )}

                {currentOnboarding.currentStep >= currentOnboarding.steps.length && (
                  <div className="text-center py-10 space-y-3">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-lg shadow-sm">
                      <i className="fa-solid fa-circle-check" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">Onboarding Pipeline Complete</h4>
                    <p className="text-gray-500 font-sans leading-relaxed max-w-sm mx-auto">
                      All KYC checkpoints met and double approvals completed. {currentOnboarding.companyName} is fully active. Default branches and HR credentials have been dispatched.
                    </p>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="text-center py-24 text-gray-400 text-xs">
              <i className="fa-solid fa-network-wired text-4xl text-gray-300 block mb-3 animate-pulse" />
              Please select or create an onboarding ticket to manage steps.
            </div>
          )}
        </div>

      </div>

    </div>
  );

  function currentStepSME() {
    if (!currentOnboarding) return false;
    return currentOnboarding.type === 'SME';
  }

  function currentRetainedValue() {
    if (!currentOnboarding) return 0;
    return currentOnboarding.approvedBudget || 50000000;
  }
}
