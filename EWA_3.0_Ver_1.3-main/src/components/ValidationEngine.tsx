import React, { useState } from 'react';
import { Company, Employee, ValidationRule, DMNInputField, DMNOperator, DMNAction } from '../types';

interface ValidationEngineProps {
  companies: Company[];
  employees: Employee[];
  rules: ValidationRule[];
  setRules: React.Dispatch<React.SetStateAction<ValidationRule[]>>;
  addAuditLog?: (
    category: 'Fee Configuration' | 'Validation Rules',
    action: string,
    previousValue: string,
    newValue: string,
    performedBy?: string
  ) => void;
}

export default function ValidationEngine({ companies, employees, rules, setRules, addAuditLog }: ValidationEngineProps) {
  // Navigation Tabs inside Validation Control Panel
  const [activeTab, setActiveTab] = useState<'decision-table' | 'playground' | 'freeze-config'>('decision-table');

  // New Rule Modal Form State
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleName, setRuleName] = useState('');
  const [ruleInputField, setRuleInputField] = useState<DMNInputField>('amount');
  const [ruleOperator, setRuleOperator] = useState<DMNOperator>('>');
  const [ruleValue, setRuleValue] = useState('');
  const [ruleAction, setRuleAction] = useState<DMNAction>('BLOCK');
  const [ruleErrorMsg, setRuleErrorMsg] = useState('');
  const [rulePriority, setRulePriority] = useState<number>(10);

  // Playground simulation states
  const [simEmployeeId, setSimEmployeeId] = useState<number>(employees[0]?.id || 1);
  const [simAmount, setSimAmount] = useState<number>(150000);
  const [simResults, setSimResults] = useState<{
    passed: boolean;
    finalAction: DMNAction;
    triggeredRule?: ValidationRule;
    evaluatedLogs: Array<{ rule: ValidationRule; matched: boolean; output: DMNAction; logMsg: string }>;
  } | null>(null);

  // Freeze period & global thresholds config
  const [payrollFreezeDay, setPayrollFreezeDay] = useState<number>(24);
  const [velocityLimitCount, setVelocityLimitCount] = useState<number>(3);
  const [globalMaxSalaryPercent, setGlobalMaxSalaryPercent] = useState<number>(50);

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const INPUT_FIELD_LABELS: Record<DMNInputField, string> = {
    amount: 'EWA Request Amount (MMK)',
    salary_percentage: '% of Base Monthly Salary',
    monthly_count: 'Monthly Withdrawals Count',
    utilization_percent: 'Company Budget Utilized %',
    nrc_verified: 'Employee NRC Verified (Boolean)',
    payroll_frozen: 'Payroll Block Active (Boolean)'
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName || !ruleValue || !ruleErrorMsg) {
      showToast('Error: All rule configurations are mandatory.');
      return;
    }

    const newRule: ValidationRule = {
      id: `rule-${Date.now()}`,
      name: ruleName,
      inputField: ruleInputField,
      operator: ruleOperator,
      value: ruleValue,
      action: ruleAction,
      errorMessage: ruleErrorMsg,
      enabled: true,
      priority: Number(rulePriority)
    };

    setRules(prev => [...prev, newRule].sort((a, b) => b.priority - a.priority));
    setShowAddRule(false);
    setRuleName('');
    setRuleValue('');
    setRuleErrorMsg('');
    showToast(`DMN Decision Rule "${ruleName}" successfully generated.`);
    if (addAuditLog) {
      addAuditLog(
        'Validation Rules',
        `Created decision validation rule "${newRule.name}"`,
        'Non-existent',
        `Field: ${newRule.inputField}, Op: ${newRule.operator}, Val: ${newRule.value}, Action: ${newRule.action}, Priority: ${newRule.priority}`
      );
    }
  };

  const handleDeleteRule = (id: string) => {
    const targetRule = rules.find(r => r.id === id);
    setRules(prev => prev.filter(r => r.id !== id));
    showToast('Rule deleted from decision matrix.');
    if (addAuditLog && targetRule) {
      addAuditLog(
        'Validation Rules',
        `Deleted decision validation rule "${targetRule.name}"`,
        `Field: ${targetRule.inputField}, Op: ${targetRule.operator}, Val: ${targetRule.value}, Action: ${targetRule.action}`,
        'Deleted'
      );
    }
  };

  const handleToggleRule = (id: string) => {
    const targetRule = rules.find(r => r.id === id);
    setRules(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    showToast('DMN Rule configuration status updated.');
    if (addAuditLog && targetRule) {
      addAuditLog(
        'Validation Rules',
        `${targetRule.enabled ? 'Disabled' : 'Enabled'} decision validation rule "${targetRule.name}"`,
        `Status: ${targetRule.enabled ? 'Enabled' : 'Disabled'}`,
        `Status: ${targetRule.enabled ? 'Disabled' : 'Enabled'}`
      );
    }
  };

  // Run sequential DMN Decision Logic
  const runDMNEngine = () => {
    const emp = employees.find(e => e.id === simEmployeeId);
    if (!emp) {
      showToast('Simulation Error: Select a valid employee profile.');
      return;
    }

    const comp = companies.find(c => c.id === emp.companyId);
    const mockMonthlyDisbCount = 2; // simulated monthly withdrawal history
    const companyUtilizedPct = comp ? (comp.utilized / comp.budget) * 100 : 0;
    const isPayrollFrozen = new Date().getDate() >= payrollFreezeDay;

    const evaluatedLogs: Array<{ rule: ValidationRule; matched: boolean; output: DMNAction; logMsg: string }> = [];
    let finalAction: DMNAction = 'ALLOW';
    let triggeredRule: ValidationRule | undefined = undefined;

    // Sort active rules by priority (highest priority fires first)
    const activeRules = rules.filter(r => r.enabled).sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      let inputValue: any = 0;
      switch (rule.inputField) {
        case 'amount':
          inputValue = simAmount;
          break;
        case 'salary_percentage':
          inputValue = (simAmount / emp.salary) * 100;
          break;
        case 'monthly_count':
          inputValue = mockMonthlyDisbCount;
          break;
        case 'utilization_percent':
          inputValue = companyUtilizedPct;
          break;
        case 'nrc_verified':
          inputValue = emp.status === 'Active' ? 'true' : 'false';
          break;
        case 'payroll_frozen':
          inputValue = isPayrollFrozen ? 'true' : 'false';
          break;
      }

      let matched = false;
      const ruleCompValue = Number(rule.value);

      if (rule.operator === '>') {
        matched = Number(inputValue) > ruleCompValue;
      } else if (rule.operator === '<') {
        matched = Number(inputValue) < ruleCompValue;
      } else if (rule.operator === '==') {
        matched = String(inputValue) === rule.value;
      } else if (rule.operator === '!=') {
        matched = String(inputValue) !== rule.value;
      } else if (rule.operator === 'contains') {
        matched = String(inputValue).includes(rule.value);
      }

      let outputAction: DMNAction = 'ALLOW';
      let errorFormatted = rule.errorMessage;

      if (matched) {
        outputAction = rule.action;
        // Format Error message dynamically
        errorFormatted = errorFormatted
          .replace('{{amount}}', simAmount.toLocaleString())
          .replace('{{employee}}', emp.name)
          .replace('{{salary}}', emp.salary.toLocaleString())
          .replace('{{company}}', comp?.name || 'Client Company')
          .replace('{{limit}}', rule.value);

        if (outputAction === 'BLOCK' || (outputAction === 'CHECKER_REQUIRED' && finalAction !== 'BLOCK')) {
          finalAction = outputAction;
          if (!triggeredRule || (rule.priority > (triggeredRule?.priority || 0))) {
            triggeredRule = rule;
          }
        }
      }

      evaluatedLogs.push({
        rule,
        matched,
        output: outputAction,
        logMsg: matched 
          ? `Rule Hit [Fire Action: ${outputAction}] - ${errorFormatted}` 
          : `Criteria Clean - Mapped Value (${inputValue}) cleared reference threshold.`
      });
    }

    setSimResults({
      passed: finalAction === 'ALLOW',
      finalAction,
      triggeredRule,
      evaluatedLogs
    });
  };

  const handleUpdateFreezeConfig = () => {
    showToast('Global pre-disbursement freeze policies synchronized.');
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 text-white border border-emerald-500/30 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-semibold animate-slide-up">
          <i className="fa-solid fa-bell text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <i className="fa-solid fa-diagram-project text-emerald-600" />
            <span>DMN Validation Rules Engine</span>
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Configure Decision Model Notation criteria to programmatically regulate real-time MMK advance payout blocks, Maker/Checker handoffs, and limits.
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-gray-100/60 p-1 rounded-lg border border-gray-200/50 mt-3 md:mt-0 max-w-xs">
          <button
            onClick={() => setActiveTab('decision-table')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'decision-table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-table-list mr-1" /> Decision Rules
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'playground' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-vial-circle-check mr-1" /> DMN Simulator
          </button>
          <button
            onClick={() => setActiveTab('freeze-config')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'freeze-config' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-calendar-freeze mr-1" /> Limit Cycles
          </button>
        </div>
      </div>

      {/* TAB 1: DMN Decision Table */}
      {activeTab === 'decision-table' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Sequential Rules Matrix</h3>
              <p className="text-xs text-gray-400 font-sans">Rules process in descending priority order. High priority fire outputs override lower priority allowances.</p>
            </div>
            <button
              onClick={() => setShowAddRule(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-circle-plus" />
              <span>Add DMN Rule</span>
            </button>
          </div>

          {/* Add Rule Form */}
          {showAddRule && (
            <form onSubmit={handleCreateRule} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 max-w-3xl">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
                  <i className="fa-solid fa-gears text-emerald-600" />
                  <span>New DMN Decision Matrix Entry</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="text-gray-400 hover:text-gray-900 cursor-pointer"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="block text-gray-600 font-semibold mb-1">Rule Descriptive Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prevent Excess Advance Ratio"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Processing Priority (Integer) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={rulePriority}
                    onChange={(e) => setRulePriority(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Recommended Action *</label>
                  <select
                    value={ruleAction}
                    onChange={(e) => setRuleAction(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="BLOCK">BLOCK (Hard Rejection)</option>
                    <option value="CHECKER_REQUIRED">CHECKER_REQUIRED (Maker-Checker Escalation)</option>
                    <option value="ALLOW">ALLOW (Bypass constraints)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">DMN Variable Input Target *</label>
                  <select
                    value={ruleInputField}
                    onChange={(e) => setRuleInputField(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    {Object.keys(INPUT_FIELD_LABELS).map((k) => (
                      <option key={k} value={k}>{INPUT_FIELD_LABELS[k as DMNInputField]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Condition Operator *</label>
                  <select
                    value={ruleOperator}
                    onChange={(e) => setRuleOperator(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value=">">Is Greater Than (&gt;)</option>
                    <option value="<">Is Less Than (&lt;)</option>
                    <option value="==">Is Equal To (==)</option>
                    <option value="!=">Is Not Equal To (!=)</option>
                    <option value="contains">Value Contains String</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Comparison Base Value *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 500000 or 50 or true"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-600 font-semibold">Custom Error Message Template *</label>
                  <span className="text-[10px] text-emerald-700 font-semibold font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                    Supported: {"{{amount}}"}, {"{{employee}}"}, {"{{salary}}"}, {"{{company}}"}, {"{{limit}}"}
                  </span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Dear {{employee}}, request of {{amount}} MMK is blocked because it exceeds your monthly salary allowance parameter limit of {{limit}}%."
                  value={ruleErrorMsg}
                  onChange={(e) => setRuleErrorMsg(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddRule(false)}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Compile & Append
                </button>
              </div>
            </form>
          )}

          {/* DMN table matrix layout */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                  <th className="p-3">Priority</th>
                  <th className="p-3">Rule Identity Name</th>
                  <th className="p-3">DMN Input Column</th>
                  <th className="p-3">Operator</th>
                  <th className="p-3">Condition Value</th>
                  <th className="p-3">Triggered Output Action</th>
                  <th className="p-3">Configured Custom Error Alert Text</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-600 font-sans">
                {rules.map((r) => (
                  <tr key={r.id} className={`hover:bg-gray-50/50 ${!r.enabled ? 'opacity-50' : ''}`}>
                    <td className="p-3 font-mono font-bold text-gray-400">#{r.priority}</td>
                    <td className="p-3">
                      <span className="font-bold text-gray-900 block">{r.name}</span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-800">{INPUT_FIELD_LABELS[r.inputField]}</td>
                    <td className="p-3 font-mono font-bold text-gray-700">{r.operator}</td>
                    <td className="p-3 font-mono font-bold text-gray-950">{r.value}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${
                        r.action === 'BLOCK' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        r.action === 'CHECKER_REQUIRED' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-100'
                      }`}>
                        {r.action}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs text-[10px] text-gray-500 italic truncate" title={r.errorMessage}>
                      "{r.errorMessage}"
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleRule(r.id)}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                          r.enabled ? 'bg-emerald-600' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          r.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteRule(r.id)}
                        className="text-gray-400 hover:text-rose-600 cursor-pointer text-xs"
                        title="Remove rule"
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Interactive DMN Simulator Playground */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Playground input params */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-xs">
            <span className="font-bold text-gray-800 text-xs block border-b border-gray-100 pb-2">Simulation Request Parameters</span>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Target Test Employee *</label>
                <select
                  value={simEmployeeId}
                  onChange={(e) => setSimEmployeeId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (Salary: {emp.salary.toLocaleString()} MMK - {emp.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-1">Advance Amount Request (MMK) *</label>
                <input
                  type="number"
                  step={5000}
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 space-y-1.5 text-[11px] text-emerald-950">
                <span className="font-bold"><i className="fa-solid fa-info-circle mr-1" /> Environmental Context:</span>
                <p className="font-sans leading-normal">
                  - Payroll block freeze day: <strong>{payrollFreezeDay}th</strong><br />
                  - Simulated Monthly Withdrawal Count: <strong>2 requests</strong><br />
                  - Active Whitelisted status: <strong>Enabled</strong>
                </p>
              </div>

              <button
                onClick={runDMNEngine}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-gears" />
                <span>Verify DMN Decision Rules</span>
              </button>
            </div>
          </div>

          {/* Playground DMN Engine Audit Output */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 min-h-[300px]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-800 text-xs flex items-center space-x-1.5">
                  <i className="fa-solid fa-receipt text-emerald-600" />
                  <span>DMN Engine Execution Audit Trails</span>
                </span>
                
                {simResults && (
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center space-x-1 ${
                    simResults.finalAction === 'ALLOW' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                    simResults.finalAction === 'CHECKER_REQUIRED' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                    'bg-rose-50 text-rose-800 border border-rose-100'
                  }`}>
                    <i className={`fa-solid ${
                      simResults.finalAction === 'ALLOW' ? 'fa-circle-check' :
                      simResults.finalAction === 'CHECKER_REQUIRED' ? 'fa-circle-exclamation' : 'fa-circle-xmark'
                    } mr-0.5`} />
                    <span>Decision Result: {simResults.finalAction}</span>
                  </span>
                )}
              </div>

              {simResults ? (
                <div className="space-y-4 text-xs">
                  {/* Summary Callout Banner */}
                  <div className={`p-3 rounded-lg border flex items-start space-x-2.5 leading-relaxed ${
                    simResults.finalAction === 'ALLOW' ? 'bg-emerald-50 border-emerald-100 text-emerald-950' :
                    simResults.finalAction === 'CHECKER_REQUIRED' ? 'bg-amber-50 border-amber-100 text-amber-950' :
                    'bg-rose-50 border-rose-100 text-rose-950'
                  }`}>
                    <i className={`fa-solid ${
                      simResults.finalAction === 'ALLOW' ? 'fa-circle-check text-emerald-600' :
                      simResults.finalAction === 'CHECKER_REQUIRED' ? 'fa-circle-exclamation text-amber-600' :
                      'fa-circle-xmark text-rose-600'
                    } text-base mt-0.5`} />
                    <div className="space-y-1">
                      <p className="font-bold">
                        {simResults.finalAction === 'ALLOW' && 'Approval Pass - request within policy tolerances.'}
                        {simResults.finalAction === 'CHECKER_REQUIRED' && 'Checker Authorization Escalated - Maker verification requested.'}
                        {simResults.finalAction === 'BLOCK' && 'Request REJECTED - DMN policy violation detected.'}
                      </p>
                      <p className="text-[11px] opacity-90 font-medium">
                        {simResults.triggeredRule 
                          ? `Triggered Rule: "${simResults.triggeredRule.name}" (Priority #${simResults.triggeredRule.priority})`
                          : 'No policy validation rules triggered. Transaction conforms perfectly to global schemas.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Rules audit log waterfall */}
                  <div className="space-y-2">
                    <span className="font-bold text-gray-700 block">Step-by-Step Rule Execution Log (Seq Flow):</span>
                    <div className="space-y-1.5">
                      {simResults.evaluatedLogs.map((log, idx) => (
                        <div key={idx} className="flex items-start justify-between p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50/50">
                          <div className="space-y-0.5 pr-2">
                            <span className="font-bold text-gray-800 text-[11px] flex items-center space-x-1">
                              <span className="text-gray-400 text-[10px] font-mono mr-1">#{log.rule.priority}</span>
                              <span>{log.rule.name}</span>
                            </span>
                            <p className="text-[10px] text-gray-500 font-sans">{log.logMsg}</p>
                          </div>
                          
                          <span className={`shrink-0 px-2 py-0.5 rounded text-[9px] font-bold font-mono ${
                            log.matched 
                              ? log.rule.action === 'BLOCK' ? 'bg-rose-50 text-rose-800 border border-rose-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            {log.matched ? `${log.rule.action} HIT` : 'PASSED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400 space-y-2">
                  <i className="fa-solid fa-square-poll-vertical text-3xl text-gray-200" />
                  <p className="text-xs font-semibold">No Simulation Executed</p>
                  <p className="text-[10px] text-gray-400 font-sans max-w-xs">Select an employee and enter a simulated MMK advance request, then trigger "Verify DMN Decision Rules" to test active models.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Limit cycles freeze dates configuration */}
      {activeTab === 'freeze-config' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 max-w-2xl shadow-xs text-xs">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Configure Limits & Cycle Variables</h3>
            <p className="text-xs text-gray-400 font-sans">Set default boundary conditions for EWA payouts that validation rule schemas reference during real-time evaluations.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="block text-gray-600 font-semibold">Monthly Payroll Freeze Day *</label>
              <input
                type="number"
                min={1}
                max={31}
                value={payrollFreezeDay}
                onChange={(e) => setPayrollFreezeDay(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">Days of the month equal or greater than this will cause the 'payroll_frozen' variable to evaluate to true.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-600 font-semibold">Maximum Allowed Withdrawals per Cycle *</label>
              <input
                type="number"
                min={1}
                max={10}
                value={velocityLimitCount}
                onChange={(e) => setVelocityLimitCount(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">Total processed payouts within the current month that trigger automatic high velocity blocks.</p>
            </div>

            <div className="space-y-1">
              <label className="block text-gray-600 font-semibold">Global Max Salary Percentage Limit (%) *</label>
              <input
                type="number"
                min={5}
                max={80}
                value={globalMaxSalaryPercent}
                onChange={(e) => setGlobalMaxSalaryPercent(Number(e.target.value))}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
              />
              <p className="text-[10px] text-gray-400">EWA request value as a fraction of monthly base salary that triggers automatic rule rejection schemas.</p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              onClick={handleUpdateFreezeConfig}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Update Bounds & Sync Rules
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
