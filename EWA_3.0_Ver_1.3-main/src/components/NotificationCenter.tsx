import React, { useState } from 'react';
import { Company, Employee, NotificationTemplate, NotificationLog, NotificationChannel } from '../types';

interface NotificationCenterProps {
  companies: Company[];
  employees: Employee[];
}

export default function NotificationCenter({ companies, employees }: NotificationCenterProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'templates' | 'broadcast' | 'logs'>('templates');

  // Templates State
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: 'temp-1',
      name: 'EWA Disbursement Instant Confirmation',
      channel: 'sms',
      content: 'Dear {{name}}, your EWA payout of {{amount}} MMK is successfully processed. A fee of {{fee}} MMK was applied. Thank you, {{company}}.',
      createdAt: '2026-06-20 14:00'
    },
    {
      id: 'temp-2',
      name: 'Monthly Salary Reconciliation Invoice',
      channel: 'email',
      subject: 'EWA Reconciliation Notice - {{company}}',
      content: 'Hello {{name}},\n\nThis is a reconciliation report for your upcoming paycheck. Your base salary is {{salary}} MMK. EWA advances taken total {{amount}} MMK, with accrued fees of {{fee}} MMK. The net payable paycheck is {{net}} MMK.\n\nWarm regards,\nPayroll Team',
      createdAt: '2026-06-25 09:30'
    },
    {
      id: 'temp-3',
      name: 'Payroll Cycle Closing Warning',
      channel: 'push',
      content: 'Hey {{name}}! The EWA drawing window for {{company}} closes in 24 hours. Request your advance before the payroll freeze!',
      createdAt: '2026-06-26 18:15'
    }
  ]);

  // Logs State
  const [logs, setLogs] = useState<NotificationLog[]>([
    {
      id: 'log-1',
      recipientName: 'Thura Aung',
      recipientContact: '+95944512918',
      channel: 'sms',
      content: 'Dear Thura Aung, your EWA payout of 100,000 MMK is successfully processed. A fee of 3,000 MMK was applied. Thank you, United Petro Co., Ltd.',
      status: 'Sent',
      createdAt: '2026-06-29 10:22'
    },
    {
      id: 'log-2',
      recipientName: 'May Thu',
      recipientContact: 'maythu@headway.com',
      channel: 'email',
      subject: 'EWA Reconciliation Notice - Headway Co.',
      content: 'Hello May Thu,\n\nThis is a reconciliation report for your upcoming paycheck. Your base salary is 750,000 MMK. EWA advances taken total 150,000 MMK, with accrued fees of 4,000 MMK. The net payable paycheck is 596,000 MMK.\n\nWarm regards,\nPayroll Team',
      status: 'Sent',
      createdAt: '2026-06-29 11:45'
    }
  ]);

  // Create Template States
  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [tempName, setTempName] = useState('');
  const [tempChannel, setTempChannel] = useState<NotificationChannel>('sms');
  const [tempSubject, setTempSubject] = useState('');
  const [tempContent, setTempContent] = useState('');

  // Bulk Broadcast States
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('temp-1');
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [step, setStep] = useState<number>(0); // 0: Input, 1: Field Mapping, 2: Preview & Schedule
  
  // Field mapping states (mapping column headers to dynamic placeholders)
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: '',
    amount: '',
    fee: '',
    company: '',
    salary: '',
    net: '',
    contact: ''
  });

  // Scheduling state
  const [scheduleType, setScheduleType] = useState<'instant' | 'later'>('instant');
  const [scheduleTime, setScheduleTime] = useState('2026-06-30 08:00');

  // Notification Alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Template CRUD actions
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName || !tempContent) {
      showToast('Error: Template name and content are required.');
      return;
    }
    const newTemp: NotificationTemplate = {
      id: `temp-${Date.now()}`,
      name: tempName,
      channel: tempChannel,
      subject: tempChannel === 'email' ? tempSubject : undefined,
      content: tempContent,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    setTemplates(prev => [...prev, newTemp]);
    setShowAddTemplate(false);
    setTempName('');
    setTempSubject('');
    setTempContent('');
    showToast(`Template "${tempName}" saved successfully.`);
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    showToast('Template deleted.');
  };

  // Parsing CSV for bulk notification
  const handleParseCsv = () => {
    try {
      if (!bulkCsvText.trim()) {
        setBulkError('Please enter comma-separated CSV content first.');
        return;
      }
      const lines = bulkCsvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length < 2) {
        setBulkError('Invalid CSV: Must include at least a header row followed by recipient records.');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/["']/g, ''));
      setCsvHeaders(headers);

      const rows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',').map(c => c.trim().replace(/["']/g, ''));
        if (cells.length < headers.length) continue;
        
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cells[idx];
        });
        rows.push(rowObj);
      }

      setParsedRows(rows);
      setBulkError(null);

      // Auto-suggest map mappings
      const initialMap: Record<string, string> = {};
      const fields = ['name', 'amount', 'fee', 'company', 'salary', 'net', 'contact'];
      fields.forEach(f => {
        const exactMatch = headers.find(h => h.toLowerCase() === f.toLowerCase());
        const fuzzyMatch = headers.find(h => h.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(h.toLowerCase()));
        initialMap[f] = exactMatch || fuzzyMatch || headers[0] || '';
      });
      
      // Auto mapping contact column based on typical headers
      const contactHeader = headers.find(h => 
        h.toLowerCase().includes('phone') || 
        h.toLowerCase().includes('mobile') || 
        h.toLowerCase().includes('email') || 
        h.toLowerCase().includes('contact') || 
        h.toLowerCase().includes('recipient')
      );
      if (contactHeader) {
        initialMap['contact'] = contactHeader;
      }

      setMapping(initialMap);
      setStep(1); // Proceed to Field Mapping Selection
    } catch (err: any) {
      setBulkError(`CSV Parse Error: ${err.message || 'Malformed csv structure'}`);
    }
  };

  const handleLoadBulkSample = () => {
    const sample = `Full Name,Contact No,Base Salary,EWA Paid,Service Fee,Net Disbursed,Company Employer
Thura Aung,+95944512918,680000,100000,3000,97000,United Petro Co., Ltd
May Thu,maythu@headway.com,750000,150000,4000,146000,Headway Co.
Aung Ko,+95977112839,620000,50000,2000,48000,Mandalay Depot`;
    setBulkCsvText(sample);
    setBulkError(null);
  };

  // Apply mapped parameters to templates dynamically
  const renderMessageText = (template: NotificationTemplate, row: any) => {
    let result = template.content;
    const fields = ['name', 'amount', 'fee', 'company', 'salary', 'net'];
    
    fields.forEach(f => {
      const colName = mapping[f];
      const value = colName && row[colName] !== undefined ? row[colName] : `[${f.toUpperCase()}]`;
      result = result.replace(new RegExp(`{{${f}}}`, 'g'), value);
    });

    return result;
  };

  const renderSubjectText = (template: NotificationTemplate, row: any) => {
    if (!template.subject) return '';
    let result = template.subject;
    const fields = ['name', 'amount', 'fee', 'company', 'salary', 'net'];
    
    fields.forEach(f => {
      const colName = mapping[f];
      const value = colName && row[colName] !== undefined ? row[colName] : `[${f.toUpperCase()}]`;
      result = result.replace(new RegExp(`{{${f}}}`, 'g'), value);
    });

    return result;
  };

  // Triggering the broadcast
  const handleSendBroadcast = () => {
    if (parsedRows.length === 0) return;

    const newLogs: NotificationLog[] = parsedRows.map((row, idx) => {
      const recName = row[mapping['name']] || 'Subscriber';
      const recContact = row[mapping['contact']] || '+95 9 xxxxxxx';
      const body = renderMessageText(activeTemplate, row);
      const subj = renderSubjectText(activeTemplate, row);

      return {
        id: `log-${Date.now()}-${idx}`,
        recipientName: recName,
        recipientContact: recContact,
        channel: activeTemplate.channel,
        subject: activeTemplate.subject ? subj : undefined,
        content: body,
        status: scheduleType === 'instant' ? 'Sent' : 'Scheduled',
        scheduledTime: scheduleType === 'later' ? scheduleTime : undefined,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
    });

    setLogs(prev => [...newLogs, ...prev]);
    showToast(`Successfully ${scheduleType === 'instant' ? 'dispatched' : 'scheduled'} ${parsedRows.length} bulk dynamic notifications!`);
    
    // Clear Wizard
    setBulkCsvText('');
    setParsedRows([]);
    setStep(0);
    setActiveTab('logs');
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 text-white border border-emerald-500/30 px-4 py-3 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-semibold animate-slide-up">
          <i className="fa-solid fa-bell text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center space-x-2">
            <i className="fa-solid fa-paper-plane text-emerald-600" />
            <span>Bulk Notification Portal</span>
          </h2>
          <p className="text-xs text-gray-500 font-sans mt-0.5">
            Personalize and broadcast automated SMS, Email, and Mobile Push alerts mapped directly to payroll ledgers.
          </p>
        </div>
        <div className="flex items-center space-x-1 bg-gray-100/60 p-1 rounded-lg border border-gray-200/50 mt-3 md:mt-0 max-w-xs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'templates' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-shapes mr-1" /> Templates
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'broadcast' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-upload mr-1" /> Bulk Send
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'logs' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-500 hover:text-gray-950 cursor-pointer'
            }`}
          >
            <i className="fa-solid fa-list mr-1" /> Delivery Logs
          </button>
        </div>
      </div>

      {/* TAB 1: Templates Manager */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Drafted Dynamic Message Schemas</h3>
              <p className="text-xs text-gray-400 font-sans">Placeholders like {"{{name}}"}, {"{{amount}}"}, {"{{fee}}"}, {"{{company}}"}, {"{{salary}}"}, {"{{net}}"} are replaced row-by-row during bulk processing.</p>
            </div>
            <button
              onClick={() => setShowAddTemplate(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <i className="fa-solid fa-plus-circle" />
              <span>Create Template</span>
            </button>
          </div>

          {/* Create Modal Form */}
          {showAddTemplate && (
            <form onSubmit={handleAddTemplate} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 max-w-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="font-bold text-gray-800 text-xs flex items-center space-x-1">
                  <i className="fa-solid fa-pen-nib text-emerald-600" />
                  <span>New Notification Template</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddTemplate(false)}
                  className="text-gray-400 hover:text-gray-900 cursor-pointer"
                >
                  <i className="fa-solid fa-times" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Template Label Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekly Remittance Notification"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Transmission Channel *</label>
                  <select
                    value={tempChannel}
                    onChange={(e) => setTempChannel(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none"
                  >
                    <option value="sms">SMS Gateway</option>
                    <option value="email">SMTP Email Client</option>
                    <option value="push">Mobile App Push Notification</option>
                  </select>
                </div>
              </div>

              {tempChannel === 'email' && (
                <div className="text-xs">
                  <label className="block text-gray-600 font-semibold mb-1">Subject Title *</label>
                  <input
                    type="text"
                    required={tempChannel === 'email'}
                    placeholder="e.g. Your EWA Payment summary - {{company}}"
                    value={tempSubject}
                    onChange={(e) => setTempSubject(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              <div className="text-xs">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-gray-600 font-semibold">Message Body Script *</label>
                  <span className="text-[10px] text-emerald-600 font-medium font-mono bg-emerald-50 px-1.5 py-0.5 rounded">
                    Supported: {"{{name}}"}, {"{{amount}}"}, {"{{fee}}"}, {"{{company}}"}, {"{{salary}}"}, {"{{net}}"}
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  placeholder="Dear {{name}}, your EWA payout of {{amount}} MMK was successfully processed. A flat service fee of {{fee}} MMK was applied. Regards, {{company}}."
                  value={tempContent}
                  onChange={(e) => setTempContent(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddTemplate(false)}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-medium cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Template
                </button>
              </div>
            </form>
          )}

          {/* Grid list of templates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between transition-all hover:border-emerald-300 shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase flex items-center space-x-1 ${
                      t.channel === 'sms' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      t.channel === 'email' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {t.channel === 'sms' && <i className="fa-solid fa-message text-[8px] mr-1" />}
                      {t.channel === 'email' && <i className="fa-solid fa-envelope text-[8px] mr-1" />}
                      {t.channel === 'push' && <i className="fa-solid fa-mobile-screen-button text-[8px] mr-1" />}
                      <span>{t.channel}</span>
                    </span>
                    <button
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="text-gray-400 hover:text-rose-600 cursor-pointer text-xs"
                      title="Delete template"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>

                  <h4 className="font-bold text-gray-900 text-xs leading-tight">{t.name}</h4>
                  {t.subject && (
                    <p className="text-[10px] font-semibold text-gray-500 truncate">
                      <span className="text-gray-400">Subject:</span> {t.subject}
                    </p>
                  )}
                  
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100/50">
                    <p className="text-[10px] text-gray-600 font-sans whitespace-pre-line leading-relaxed italic">
                      "{t.content}"
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between text-[10px] text-gray-400 font-mono">
                  <span>Created: {t.createdAt}</span>
                  <button
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setStep(0);
                      setBulkCsvText('');
                      setParsedRows([]);
                      setActiveTab('broadcast');
                    }}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Use in Broadcast <i className="fa-solid fa-circle-chevron-right ml-0.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Bulk Sending CSV Processing portal */}
      {activeTab === 'broadcast' && (
        <div className="space-y-4">
          {/* Dynamic Step Header */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/50 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-800 flex items-center space-x-1">
              <i className="fa-solid fa-circle-nodes text-emerald-600" />
              <span>Current Config Workflow:</span>
            </span>
            <div className="flex items-center space-x-4 text-[11px] font-semibold">
              <span className={`${step === 0 ? 'text-emerald-700' : 'text-gray-400'}`}>1. Input Dataset</span>
              <i className="fa-solid fa-chevron-right text-[9px] text-gray-300" />
              <span className={`${step === 1 ? 'text-emerald-700' : 'text-gray-400'}`}>2. Map Headers</span>
              <i className="fa-solid fa-chevron-right text-[9px] text-gray-300" />
              <span className={`${step === 2 ? 'text-emerald-700' : 'text-gray-400'}`}>3. Review & Dispatch</span>
            </div>
          </div>

          {/* STEP 0: Input Dataset */}
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-gray-800">Select Template Scheme</label>
                    <button
                      onClick={handleLoadBulkSample}
                      className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                    >
                      <i className="fa-solid fa-file-invoice-dollar mr-1" /> Load Demo Payroll CSV Rows
                    </button>
                  </div>
                  
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 focus:outline-none text-xs text-gray-800"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        [{t.channel.toUpperCase()}] {t.name}
                      </option>
                    ))}
                  </select>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-600">CSV Spreadsheet Input Body</span>
                      <span className="text-[10px] text-gray-400">Ensure the first row defines unique header titles</span>
                    </div>
                    <textarea
                      rows={8}
                      placeholder="e.g. Name, Phone, Base Salary, Amount Taken, Charge, netAmount, Organization..."
                      value={bulkCsvText}
                      onChange={(e) => setBulkCsvText(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  {bulkError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg text-xs flex items-start space-x-2">
                      <i className="fa-solid fa-triangle-exclamation mt-0.5 text-rose-600" />
                      <span>{bulkError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleParseCsv}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles" />
                      <span>Parse and Map Parameters</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Template Parameters Reference */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-xs space-y-4 h-fit">
                <h4 className="font-bold text-emerald-900 flex items-center space-x-1">
                  <i className="fa-solid fa-circle-question" />
                  <span>Dynamic Integration Help</span>
                </h4>
                <p className="text-emerald-800 font-sans leading-relaxed">
                  Bulk messaging requires matching spreadsheet columns to template placeholders. Select a template and verify its variables:
                </p>
                <div className="bg-white p-3 rounded-lg border border-emerald-100 space-y-1">
                  <span className="font-bold text-[11px] text-gray-800">Current Template Schema:</span>
                  <p className="font-mono text-[9px] text-emerald-700 font-semibold italic">"{activeTemplate.content}"</p>
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-emerald-950 block">Placeholder tags mapped:</span>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span className="bg-white border border-emerald-100/50 text-emerald-800 p-1 rounded font-mono">{"{{name}}"}</span>
                    <span className="bg-white border border-emerald-100/50 text-emerald-800 p-1 rounded font-mono">{"{{amount}}"}</span>
                    <span className="bg-white border border-emerald-100/50 text-emerald-800 p-1 rounded font-mono">{"{{fee}}"}</span>
                    <span className="bg-white border border-emerald-100/50 text-emerald-800 p-1 rounded font-mono">{"{{company}}"}</span>
                    <span className="bg-white border border-emerald-100/50 text-emerald-800 p-1 rounded font-mono">{"{{salary}}"}</span>
                    <span className="bg-white border border-emerald-100/50 text-emerald-800 p-1 rounded font-mono">{"{{net}}"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Field Mapping Form */}
          {step === 1 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800">Assign Column Parameters to Placeholders</h3>
                <p className="text-xs text-gray-400 font-sans">Map which CSV columns represent each dynamic variable inside the "{activeTemplate.name}" template.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Parameter Maps */}
                <div className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <span className="font-bold text-gray-800 block border-b border-gray-200 pb-1.5 mb-2">Variables Mapping</span>
                  
                  {Object.keys(mapping).map((paramKey) => (
                    <div key={paramKey} className="flex items-center justify-between space-x-2">
                      <span className="font-mono text-emerald-800 font-semibold text-[11px] w-1/3">
                        {"{{"}{paramKey}{"}}"} {paramKey === 'contact' ? '*' : ''}
                      </span>
                      <select
                        value={mapping[paramKey]}
                        onChange={(e) => setMapping(prev => ({ ...prev, [paramKey]: e.target.value }))}
                        className="w-2/3 bg-white border border-gray-200 rounded-lg p-1.5 focus:outline-none"
                      >
                        <option value="">-- Ignore / No Map --</option>
                        {csvHeaders.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 italic font-sans">* "contact" is required to know where to transmit the notification.</p>
                </div>

                {/* Right mapping preview */}
                <div className="space-y-3 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100/40">
                  <span className="font-bold text-emerald-950 block border-b border-emerald-100/50 pb-1.5">Row 1 Personalization Preview</span>
                  
                  {parsedRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-gray-500">First Recipient:</span>
                        <span className="font-mono font-bold text-emerald-800">{parsedRows[0][mapping['name']] || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-gray-500">Destination contact:</span>
                        <span className="font-mono text-gray-600">{parsedRows[0][mapping['contact']] || 'N/A'}</span>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border border-emerald-100/60 text-xs">
                        <span className="font-bold text-[10px] text-emerald-800 uppercase block mb-1">Rendered Message Output:</span>
                        <p className="font-sans text-gray-700 leading-normal bg-gray-50 p-2 rounded text-[10px] whitespace-pre-line italic">
                          {renderMessageText(activeTemplate, parsedRows[0])}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(0)}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Back to Data
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>Review Broadcast Pipeline</span>
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Schedule config */}
          {step === 2 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Define Transmission Schedule & Dispatch Channel</h3>
                <p className="text-xs text-gray-500 font-sans">Final verification before queueing dynamic notifications.</p>
              </div>

              {/* Delivery Scheduler Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-2">
                  <span className="font-bold text-gray-800 block">Queue Pipeline Mode</span>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={scheduleType === 'instant'}
                        onChange={() => setScheduleType('instant')}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <span>Instant Bulk Broadcast</span>
                    </label>
                    <label className="flex items-center space-x-2 font-semibold text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        checked={scheduleType === 'later'}
                        onChange={() => setScheduleType('later')}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                      />
                      <span>Delayed Scheduled Release</span>
                    </label>
                  </div>
                </div>

                {scheduleType === 'later' && (
                  <div className="space-y-1">
                    <label className="block text-gray-600 font-semibold">Release Date & Time (UTC/MMT)</label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD HH:MM"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg p-2 w-full focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Dynamic spreadsheet Preview list of all rows */}
              <div className="space-y-2">
                <span className="font-bold text-gray-800">Dynamic Personalization Preview Grid ({parsedRows.length} Rows)</span>
                
                <div className="max-h-60 overflow-y-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                        <th className="p-3">Contact Destination</th>
                        <th className="p-3">Mapped Content Preview</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-600 font-sans">
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-emerald-50/10">
                          <td className="p-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{row[mapping['name']]}</span>
                              <span className="font-mono text-gray-400 mt-0.5">{row[mapping['contact']]}</span>
                            </div>
                          </td>
                          <td className="p-3 font-sans text-gray-500 max-w-lg leading-relaxed whitespace-pre-line italic text-[10px]">
                            "{renderMessageText(activeTemplate, row)}"
                          </td>
                          <td className="p-3">
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-mono font-semibold text-[9px] uppercase border border-amber-100">
                              {scheduleType === 'instant' ? 'Ready' : 'Will Queue'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-100 rounded-lg font-semibold cursor-pointer"
                >
                  Back to Mapping
                </button>
                <button
                  onClick={handleSendBroadcast}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center space-x-1.5 cursor-pointer"
                >
                  <i className="fa-solid fa-circle-check" />
                  <span>
                    {scheduleType === 'instant' ? 'Confirm Instant Dispatch' : 'Confirm Delayed Schedule'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Delivery Logs */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-800">Automated Notification Transmission History</h3>
              <p className="text-xs text-gray-400 font-sans">Audit trail of SMS, emails, and device push alerts dispatched to workforce recipients.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-gray-400 font-mono">Total Dispatched: {logs.length}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase">
                  <th className="p-3">Recipient Name / Target</th>
                  <th className="p-3">Transmission Type</th>
                  <th className="p-3">Delivered Message Text</th>
                  <th className="p-3 text-right">Status</th>
                  <th className="p-3 text-right">Processed Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-600 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50">
                    <td className="p-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{log.recipientName}</span>
                        <span className="font-mono text-gray-400 text-[10px] mt-0.5">{log.recipientContact}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        log.channel === 'sms' ? 'bg-indigo-50 text-indigo-700' :
                        log.channel === 'email' ? 'bg-rose-50 text-rose-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {log.channel}
                      </span>
                    </td>
                    <td className="p-3 max-w-md">
                      <p className="text-[10px] text-gray-600 whitespace-pre-line leading-relaxed italic">
                        "{log.content}"
                      </p>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
                        log.status === 'Sent' ? 'bg-emerald-50 text-emerald-800' :
                        log.status === 'Scheduled' ? 'bg-amber-50 text-amber-800' :
                        'bg-rose-50 text-rose-800'
                      }`}>
                        <i className={`fa-solid ${
                          log.status === 'Sent' ? 'fa-circle-check' :
                          log.status === 'Scheduled' ? 'fa-clock' : 'fa-circle-xmark'
                        } mr-0.5`} />
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400 text-[10px]">
                      {log.createdAt}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">
                      No notifications have been dispatched yet. Use the "Bulk Send" utility to broadcast alert feeds.
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
}
