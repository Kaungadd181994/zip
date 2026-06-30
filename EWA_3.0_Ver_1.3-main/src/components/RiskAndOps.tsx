import React, { useState } from 'react';
import { Company, Employee, JournalEntry, SettlementRequest, QRProcessingRequest, DisbursementFeedItem } from '../types';
import { getAccountBalances } from '../data';

interface RiskAndOpsProps {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  journalEntries: JournalEntry[];
  setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  settlements: SettlementRequest[];
  setSettlements: React.Dispatch<React.SetStateAction<SettlementRequest[]>>;
  qrRequests: QRProcessingRequest[];
  setQrRequests: React.Dispatch<React.SetStateAction<QRProcessingRequest[]>>;
  disbursements: DisbursementFeedItem[];
  setDisbursements: React.Dispatch<React.SetStateAction<DisbursementFeedItem[]>>;
  activeTab: string;
}

export default function RiskAndOps({
  companies,
  setCompanies,
  employees,
  setEmployees,
  journalEntries,
  setJournalEntries,
  settlements,
  setSettlements,
  qrRequests,
  setQrRequests,
  disbursements,
  setDisbursements,
  activeTab
}: RiskAndOpsProps) {
  
  const [toast, setToast] = useState<string | null>(null);

  // Manual QR input
  const [qrRejectReason, setQrRejectReason] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrReq, setActiveQrReq] = useState<QRProcessingRequest | null>(null);

  // Manual Settlement entry
  const [showManualSettlementModal, setShowManualSettlementModal] = useState(false);
  const [manualSettlementCompanyId, setManualSettlementCompanyId] = useState<number>(companies[0]?.id || 1);
  const [manualSettlementAmount, setManualSettlementAmount] = useState<number>(0);
  const [manualSettlementMethod, setManualSettlementMethod] = useState<string>('Cash');
  const [manualSettlementRef, setManualSettlementRef] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- 1. Settlement Queue (Maker-Checker) ---
  const handleSettlementMakerApprove = (id: number) => {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'Maker Approved', verifiedAt: '2026-06-29 15:30' } : s));
    triggerToast('Settlement verified by Maker. Forwarded to Finance Checker queue.');
  };

  const handleSettlementCheckerApprove = (id: number) => {
    const targetSettlement = settlements.find(s => s.id === id);
    if (!targetSettlement) return;

    // Checker approves -> Clear utilized budget, reset company utilized balance, write journal entry
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'Approved', approvedAt: '2026-06-29 15:35' } : s));
    
    // Clear utilized balance for target company
    setCompanies(prev => prev.map(c => c.id === targetSettlement.companyId ? { ...c, utilized: Math.max(0, c.utilized - targetSettlement.amount) } : c));

    // Post double-entry Circle Ledger records clearing EWA advance receivable (1200) and adding Cash (1100)
    const newJournalId = `JE-${Math.floor(10000 + Math.random() * 90000)}`;
    const newEntry: JournalEntry = {
      id: newJournalId,
      date: '2026-06-29',
      description: `EWA Corporate Settlement - Receipt ${targetSettlement.reference}`,
      debitAccount: '1100', // Cash Increases
      debitAmount: targetSettlement.amount,
      creditAccount: '1200', // EWA Receivables Decreases
      creditAmount: targetSettlement.amount,
      reference: targetSettlement.reference,
      companyId: targetSettlement.companyId
    };
    setJournalEntries(prev => [...prev, newEntry]);

    triggerToast(`Settlement cleared by Checker. Balance Sheet updated & ${targetSettlement.amount.toLocaleString()} MMK cash recovered.`);
  };

  const handleSettlementReject = (id: number) => {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'Rejected' } : s));
    triggerToast('Settlement request rejected.');
  };

  // --- 2. QR Processing ---
  const handleOpenQrProcess = (req: QRProcessingRequest) => {
    setActiveQrReq(req);
    setShowQrModal(true);
  };

  const handleQrComplete = () => {
    if (!activeQrReq) return;
    const reqId = activeQrReq.id;

    setQrRequests(prev => prev.map(q => q.id === reqId ? { ...q, status: 'Completed', processedAt: '2026-06-29 15:40' } : q));
    
    // Also append to disbursement feed as success
    const newFeed: DisbursementFeedItem = {
      id: `TX-${Math.floor(10000 + Math.random() * 90000)}`,
      employeeName: activeQrReq.employeeName,
      companyName: activeQrReq.companyName,
      amount: activeQrReq.amount,
      fee: 2000,
      netAmount: activeQrReq.amount - 2000,
      channel: 'QR Manual',
      status: 'Success',
      timestamp: '2026-06-29 15:40',
      reference: `QR-REF-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setDisbursements(prev => [newFeed, ...prev]);

    setShowQrModal(false);
    setActiveQrReq(null);
    triggerToast(`QR manual transfer completed. Disbursed ${activeQrReq.amount.toLocaleString()} MMK.`);
  };

  // --- 3. Ghost Employees (Active outstanding balance but missing from roster) ---
  // Seed ghost employees (Apex manager has outstanding balance and can be flagged)
  const handleFreezeEmployee = (empId: number) => {
    setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, status: 'Frozen' } : emp));
    triggerToast('Ghost employee access frozen successfully. Demanded payroll adjustment.');
  };

  const handleManualSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const company = companies.find(c => c.id === manualSettlementCompanyId);
    if (!company) return;

    if (manualSettlementAmount <= 0) {
      triggerToast('Amount must be greater than zero.');
      return;
    }

    const ref = manualSettlementRef || `MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSettlement: SettlementRequest = {
      id: Date.now(),
      companyId: company.id,
      companyName: company.name,
      amount: manualSettlementAmount,
      reference: ref,
      repaymentMethod: manualSettlementMethod as any,
      source: 'Manual',
      status: 'Pending',
      submittedAt: new Date().toISOString().slice(0,16).replace('T', ' ')
    };

    setSettlements(prev => [newSettlement, ...prev]);
    setShowManualSettlementModal(false);
    setManualSettlementAmount(0);
    setManualSettlementRef('');
    triggerToast(`Manual repayment of ${manualSettlementAmount.toLocaleString()} MMK recorded for ${company.name}`);
  };

  // --- Render Sections ---

  // 1. Settlement Queue View
  const renderSettlementQueue = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Maker-Checker Settlement Queue</h3>
            <p className="text-xs text-gray-500 font-sans">Dual verification pipeline for incoming corporate bank transfers and receipts clearing client outstanding.</p>
          </div>
          <button
            onClick={() => setShowManualSettlementModal(true)}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg flex items-center space-x-2 transition-colors"
          >
            <i className="fa-solid fa-plus" />
            <span>Record Manual Repayment</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <th className="p-3">Reference ID</th>
                <th className="p-3">Client Company</th>
                <th className="p-3">Submitted At</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Repay Amount (MMK)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Verification Flow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {settlements.map(s => (
                <tr key={s.id} className="hover:bg-amber-50/10">
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-amber-950 font-mono">{s.reference}</span>
                      <span className="text-[10px] text-gray-400 font-sans">ID {s.id}</span>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-gray-900">{s.companyName}</td>
                  <td className="p-3 font-sans text-gray-500">{s.submittedAt}</td>
                  <td className="p-3">
                    <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-medium block w-max">
                      {s.repaymentMethod || 'Bank'}
                    </span>
                    {s.source === 'Manual' && <span className="text-[9px] text-amber-600 block mt-0.5 font-semibold">Manual Record</span>}
                    {s.source === 'API' && <span className="text-[9px] text-blue-600 block mt-0.5 font-semibold">API Sync</span>}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-gray-950">{s.amount.toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      s.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      s.status === 'Maker Approved' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                      s.status === 'Rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1">
                    {s.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleSettlementMakerApprove(s.id)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          <i className="fa-solid fa-file-signature mr-1" /> Maker Verify
                        </button>
                        <button
                          onClick={() => handleSettlementReject(s.id)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {s.status === 'Maker Approved' && (
                      <>
                        <button
                          onClick={() => handleSettlementCheckerApprove(s.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          <i className="fa-solid fa-stamp mr-1" /> Checker Approve
                        </button>
                        <button
                          onClick={() => handleSettlementReject(s.id)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {s.status === 'Approved' && (
                      <span className="text-[10px] text-emerald-700 font-sans font-medium">
                        <i className="fa-solid fa-check-double mr-1" /> Cleared & Closed
                      </span>
                    )}
                    {s.status === 'Rejected' && (
                      <span className="text-[10px] text-rose-700 font-sans font-medium">
                        Disapproved
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showManualSettlementModal && (
          <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <form onSubmit={handleManualSettlementSubmit} className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full overflow-hidden text-xs">
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h4 className="font-bold text-gray-900"><i className="fa-solid fa-file-invoice-dollar mr-2" />Record Manual Repayment</h4>
                <button type="button" onClick={() => setShowManualSettlementModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
              
              <div className="p-4 space-y-4 font-sans">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Corporate Client</label>
                  <select 
                    value={manualSettlementCompanyId} 
                    onChange={e => setManualSettlementCompanyId(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Out: {c.utilized.toLocaleString()} MMK)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Repayment Method</label>
                  <select 
                    value={manualSettlementMethod} 
                    onChange={e => setManualSettlementMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none"
                  >
                    <option value="Cash">Cash (Manual)</option>
                    <option value="Bank">Bank Transfer (Manual)</option>
                    <option value="Cheque">Cheque (Manual)</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Repay Amount (MMK)</label>
                  <input 
                    type="number"
                    value={manualSettlementAmount}
                    onChange={e => setManualSettlementAmount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none font-mono"
                    min="1000"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Reference Code (Optional)</label>
                  <input 
                    type="text"
                    value={manualSettlementRef}
                    onChange={e => setManualSettlementRef(e.target.value)}
                    placeholder="E.g. KBZ-TRX-88219"
                    className="w-full bg-gray-50 border border-gray-200 rounded p-2 outline-none"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowManualSettlementModal(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-gray-900 text-white rounded font-semibold hover:bg-black cursor-pointer">
                  Submit to Maker Queue
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    );
  };

  // 2. Disbursement Monitor
  const renderDisbursementMonitor = () => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Real-Time Disbursement Monitor</h3>
          <p className="text-xs text-gray-500 font-sans">Live feed of active advanced salary transactions dispatched through KBZ Pay, Wave, and MoPayment APIs.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <th className="p-3">Disbursement ID</th>
                <th className="p-3">Employee</th>
                <th className="p-3">Client Company</th>
                <th className="p-3">Channel</th>
                <th className="p-3 text-right">Principal / Net (MMK)</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600 font-mono">
              {disbursements.map(d => (
                <tr key={d.id} className="hover:bg-amber-50/10">
                  <td className="p-3 font-semibold text-amber-950">{d.id}</td>
                  <td className="p-3 font-sans">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{d.employeeName}</span>
                      <span className="text-[10px] text-gray-400">Reference {d.reference}</span>
                    </div>
                  </td>
                  <td className="p-3 font-sans text-gray-800">{d.companyName}</td>
                  <td className="p-3 font-sans">
                    <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded font-medium">
                      {d.channel}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-semibold text-gray-900">{d.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 block">Net {d.netAmount.toLocaleString()} (Fee {d.fee})</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      d.status === 'Success' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="p-3 text-right font-sans text-gray-500">{d.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 3. QR Code Processing Queue
  const renderQrProcessing = () => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">QR Code Manual Processing Queue</h3>
          <p className="text-xs text-gray-500 font-sans">Process employee-submitted KBZ Pay/Wave QR transfers where instant APIs are degraded or bypassed.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <th className="p-3">Ticket ID</th>
                <th className="p-3">Employee Details</th>
                <th className="p-3">Employer Company</th>
                <th className="p-3 text-right">Request Amount (MMK)</th>
                <th className="p-3">Uploaded Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {qrRequests.map(qr => (
                <tr key={qr.id} className="hover:bg-amber-50/10">
                  <td className="p-3 font-semibold text-amber-950 font-mono">QR-{qr.id}</td>
                  <td className="p-3">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{qr.employeeName}</span>
                      <span className="text-[10px] text-gray-400 font-sans">{qr.employeeCode}</span>
                    </div>
                  </td>
                  <td className="p-3 font-sans text-gray-800">{qr.companyName}</td>
                  <td className="p-3 text-right font-mono font-bold text-gray-950">{qr.amount.toLocaleString()}</td>
                  <td className="p-3 font-sans text-gray-500">{new Date(qr.uploadedAt).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      qr.status === 'Completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {qr.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {qr.status === 'Pending' ? (
                      <button
                        onClick={() => handleOpenQrProcess(qr)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                      >
                        <i className="fa-solid fa-qrcode mr-1" /> Process Code
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-medium">
                        <i className="fa-solid fa-circle-check mr-1" /> Disbursed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 4. Credit Scoring / Assessment view
  const renderCreditAssessment = () => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Risk Credit Scoring & Budget Allocations</h3>
          <p className="text-xs text-gray-500 font-sans">Evaluate company credit scores, assign risk tiers (A to E), and set total exposure limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {companies.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3.5 text-xs font-sans">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{c.name}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">DICA No. {c.dica} &bull; {c.industry}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                  c.tier === 'A' ? 'bg-emerald-50 text-emerald-800' :
                  c.tier === 'B' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  Tier {c.tier}
                </span>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Allocated Budget</span>
                  <span className="font-bold text-gray-900 font-mono">{c.budget.toLocaleString()} MMK</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Risk Margin Multiplier</span>
                  <span className="font-bold text-amber-800">
                    {c.tier === 'A' ? '1.5x' : c.tier === 'B' ? '1.2x' : c.tier === 'C' ? '1.0x' : '0.7x'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const upTier = c.tier === 'C' ? 'B' : c.tier === 'B' ? 'A' : 'C';
                    setCompanies(prev => prev.map(comp => comp.id === c.id ? { ...comp, tier: upTier } : comp));
                    triggerToast(`Upgraded ${c.name} risk category rating.`);
                  }}
                  className="px-2.5 py-1 hover:bg-amber-50 border border-gray-100 rounded text-gray-700 font-medium cursor-pointer"
                >
                  Modify Score Card
                </button>
                <button
                  onClick={() => {
                    const freezeStatus = c.status === 'Frozen' ? 'Active' : 'Frozen';
                    setCompanies(prev => prev.map(comp => comp.id === c.id ? { ...comp, status: freezeStatus as any } : comp));
                    triggerToast(`Company EWA Status toggled to ${freezeStatus}.`);
                  }}
                  className={`px-2.5 py-1 rounded text-white font-medium cursor-pointer ${
                    c.status === 'Frozen' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {c.status === 'Frozen' ? 'Unfreeze Access' : 'Freeze Credit Access'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 5. Ghost Employees Detector
  const renderGhostEmployees = () => {
    // Filter employees with status "Frozen" (representing detected ghost employees with outstanding)
    const ghosts = employees.filter(emp => emp.id === 9 || emp.status === 'Frozen');
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Ghost Employee Detector Alerts</h3>
          <p className="text-xs text-gray-500 font-sans">Automatic system notifications flagging employees missing from current roster files but retaining active outstanding EWA advance sheets.</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                <th className="p-3">Employee Details</th>
                <th className="p-3">DICA Employer</th>
                <th className="p-3">Missing Days Threshold</th>
                <th className="p-3 text-right">Outstanding Advance (MMK)</th>
                <th className="p-3">Risk Level</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {ghosts.map(g => {
                const comp = companies.find(c => c.id === g.companyId);
                return (
                  <tr key={g.id} className="hover:bg-rose-50/10 bg-rose-50/5">
                    <td className="p-3 font-semibold text-gray-900">
                      <div className="flex items-center space-x-2">
                        <i className="fa-solid fa-ghost text-rose-600 animate-bounce" />
                        <div>
                          <span className="font-bold text-gray-900">{g.name}</span>
                          <span className="text-[10px] text-gray-400 block font-mono">{g.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-sans">{comp?.name || 'Apex Retail'}</td>
                    <td className="p-3 font-semibold text-rose-800 font-sans">14 Days Past Last Roster Upload</td>
                    <td className="p-3 text-right font-mono font-bold text-rose-900">120,000</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800">
                        High Priority Flag
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {g.status === 'Frozen' ? (
                        <span className="text-[10px] text-rose-800 font-bold">
                          <i className="fa-solid fa-lock mr-1" /> frozen
                        </span>
                      ) : (
                        <button
                          onClick={() => handleFreezeEmployee(g.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold cursor-pointer"
                        >
                          Freeze Account Access
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 6. Overdue watch
  const renderOverdueWatch = () => {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Repayment Overdue Watch & Trigger Warnings</h3>
          <p className="text-xs text-gray-500 font-sans">Consolidated views representing active warnings, daily late fee rate (0.15%), and defaulted accounts.</p>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start space-x-3 text-xs text-amber-900 max-w-2xl leading-normal">
          <i className="fa-solid fa-circle-exclamation text-lg text-amber-700 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">Active Late Fee Trigger Active</h4>
            <p className="mt-1">
              Late payment fee is currently configured at <strong>0.15% per day</strong> of the employee\'s advanced principal amount. It is charged immediately to the corporate balance sheet once payment cycles extend beyond freeze days.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-3.5 max-w-2xl">
          <h4 className="text-xs font-bold text-gray-900 uppercase">Defaulted Companies Alert</h4>
          <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/20 flex items-start justify-between text-xs font-sans">
            <div className="space-y-1">
              <h5 className="font-bold text-gray-900 flex items-center space-x-2">
                <i className="fa-solid fa-triangle-exclamation text-rose-600" />
                <span>Apex Retail Distribution</span>
              </h5>
              <p className="text-[10px] text-gray-500">
                120,000 MMK principal overdue by 30 days &bull; <strong>Late Fee: 5,400 MMK</strong>
              </p>
            </div>
            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
              Frozen Status
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'settlement-queue':
        return renderSettlementQueue();
      case 'disbursement-monitor':
        return renderDisbursementMonitor();
      case 'qr-processing':
        return renderQrProcessing();
      case 'credit-assessment':
        return renderCreditAssessment();
      case 'ghost-employees':
        return renderGhostEmployees();
      case 'overdue-monitoring':
        return renderOverdueWatch();
      default:
        return renderSettlementQueue();
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

      {renderActiveTab()}

      {/* QR Processing Action Modal */}
      {showQrModal && activeQrReq && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 text-xs font-sans">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-100 overflow-hidden shadow-xl">
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900">Process Manual QR Transfer</h4>
              <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-center">
              <p className="text-gray-600 leading-normal">
                Confirm you have executed manual transfer of <strong>{(activeQrReq.amount - 2000).toLocaleString()} MMK</strong> (net of 2,000 fee) to employee <strong>{activeQrReq.employeeName}</strong>\'s e-wallet as displayed in QR:
              </p>
              
              <div className="w-40 h-44 border bg-gray-50 flex items-center justify-center mx-auto rounded-lg font-mono p-2">
                <div className="text-center">
                  <i className="fa-solid fa-qrcode text-4xl text-gray-400 mb-2 block" />
                  <span className="text-[10px] block text-gray-500">{activeQrReq.employeeCode} QR</span>
                </div>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-lg border text-left font-mono text-[10px] space-y-1">
                <div>Emp Name: <strong>{activeQrReq.employeeName}</strong></div>
                <div>Amount: <strong>{activeQrReq.amount.toLocaleString()} MMK</strong></div>
                <div>Net Disburse: <strong>{(activeQrReq.amount - 2000).toLocaleString()} MMK</strong></div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
              <button onClick={() => setShowQrModal(false)} className="px-3 py-1.5 border hover:bg-gray-100 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button onClick={handleQrComplete} className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold cursor-pointer">
                Confirm Transfer Completed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
