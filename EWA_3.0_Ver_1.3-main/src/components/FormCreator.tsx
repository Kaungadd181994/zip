import React, { useState } from 'react';
import { FormSchema, FormField } from '../types';

interface FormCreatorProps {
  forms: FormSchema[];
  setForms: React.Dispatch<React.SetStateAction<FormSchema[]>>;
}

export default function FormCreator({ forms, setForms }: FormCreatorProps) {
  const [formName, setFormName] = useState('New Onboarding Form Schema');
  const [targetScope, setTargetScope] = useState<'corporate' | 'sme' | 'all'>('corporate');
  const [formFields, setFormFields] = useState<FormField[]>([
    { id: 'legal_name', type: 'text', label: 'Company Legal Name', required: true, placeholder: 'Enter legal name' },
    { id: 'dica_number', type: 'text', label: 'DICA Registration Code', required: true, placeholder: 'DICA-YYYY-XXXX' },
    { id: 'incorporation_cert', type: 'file', label: 'Incorp Certificate PDF', required: true }
  ]);

  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const selectedField = formFields.find(f => f.id === selectedFieldId);

  // Field Palette list
  const PALETTE_FIELDS = [
    { type: 'text', label: 'Text Input', icon: 'fa-font' },
    { type: 'number', label: 'Number Input', icon: 'fa-hashtag' },
    { type: 'email', label: 'Email Field', icon: 'fa-envelope' },
    { type: 'phone', label: 'Phone Field', icon: 'fa-phone' },
    { type: 'date', label: 'Date Selector', icon: 'fa-calendar' },
    { type: 'dropdown', label: 'Dropdown Options', icon: 'fa-list' },
    { type: 'checkbox', label: 'Checkbox Select', icon: 'fa-square-check' },
    { type: 'file', label: 'File/Doc Upload', icon: 'fa-file-arrow-up' },
    { type: 'nrc', label: 'NRC Card Scanner', icon: 'fa-address-card' },
    { type: 'selfie', label: 'Selfie Liveness Capture', icon: 'fa-camera' }
  ] as const;

  const handleAddField = (type: typeof PALETTE_FIELDS[number]['type']) => {
    const id = `${type}_${Math.floor(100 + Math.random() * 900)}`;
    const newField: FormField = {
      id,
      type,
      label: `Enter ${type.toUpperCase()} Label`,
      required: true,
      placeholder: `Enter value for ${type}`,
      options: type === 'dropdown' ? ['Option A', 'Option B', 'Option C'] : undefined
    };
    setFormFields(prev => [...prev, newField]);
    setSelectedFieldId(id);
    triggerToast(`Added ${type} field to form canvas.`);
  };

  const handleRemoveField = (id: string) => {
    setFormFields(prev => prev.filter(f => f.id !== id));
    if (selectedFieldId === id) setSelectedFieldId(null);
    triggerToast('Removed field from canvas.');
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...formFields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    // Swap elements
    const temp = newFields[index];
    newFields[index] = newFields[targetIndex];
    newFields[targetIndex] = temp;
    
    setFormFields(newFields);
  };

  const updateSelectedFieldProperty = (key: keyof FormField, value: any) => {
    if (!selectedFieldId) return;
    setFormFields(prev => prev.map(f => {
      if (f.id === selectedFieldId) {
        return { ...f, [key]: value };
      }
      return f;
    }));
  };

  const handlePublish = () => {
    if (!formName.trim()) {
      alert('Please provide a form schema name.');
      return;
    }
    const newSchema: FormSchema = {
      id: Date.now(),
      name: formName,
      target: targetScope,
      fields: formFields,
      published: true,
      version: '1.0.0'
    };
    setForms(prev => [newSchema, ...prev]);
    triggerToast(`Published "${formName}" v1.0.0 to Active Schemas successfully.`);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Dynamic Form Creator</h2>
          <p className="text-xs text-gray-500 font-sans">Build no-code KYC and onboarding forms instantly. Changes produce JSON draft schemas.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePublish}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg flex items-center space-x-2 transition-colors duration-150 cursor-pointer"
          >
            <i className="fa-solid fa-cloud-arrow-up" />
            <span>Publish Draft Form v1.0</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Fields Palette & Config (3 cols) */}
        <div className="lg:col-span-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-50">Fields Palette</h3>
            <p className="text-[10px] text-gray-400 mt-1">Click to add any component to the dynamic builder canvas:</p>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {PALETTE_FIELDS.map(pf => (
              <button
                key={pf.type}
                onClick={() => handleAddField(pf.type)}
                className="w-full p-2 hover:bg-amber-50/40 text-left border border-gray-100 hover:border-amber-400 rounded-lg text-xs text-gray-700 flex items-center space-x-2.5 transition-all duration-150 cursor-pointer"
              >
                <i className={`fa-solid ${pf.icon} text-amber-700 w-4 text-center`} />
                <span>{pf.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-50 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase">Schema Settings</h4>
            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-gray-500 mb-1">Form Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-gray-500 mb-1">Target Onboarding Type</label>
                <select
                  value={targetScope}
                  onChange={(e) => setTargetScope(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                >
                  <option value="corporate">Corporate Sign-ups Only</option>
                  <option value="sme">SME Sign-ups Only</option>
                  <option value="all">Universal Tenant Scope</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Live Form Canvas Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase">Live Canvas Preview</h3>
            <span className="text-[10px] bg-amber-50 text-amber-800 font-mono px-2 py-0.5 rounded uppercase">Draft Schema</span>
          </div>

          <div className="space-y-3.5 min-h-[300px] border-2 border-dashed border-gray-100 rounded-xl p-4 bg-gray-50/20">
            {formFields.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-xs">
                <i className="fa-solid fa-shapes text-3xl text-gray-300 block mb-3 animate-pulse" />
                No fields added yet. Choose a field type from palette on the left to begin compiling.
              </div>
            ) : (
              formFields.map((field, index) => {
                const isSelected = selectedFieldId === field.id;
                return (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldId(field.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer relative group ${
                      isSelected ? 'border-amber-500 bg-amber-50/20 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    
                    {/* Reorder Buttons & Delete */}
                    <div className="absolute right-2 top-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveField(index, 'up'); }}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-up text-[10px]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleMoveField(index, 'down'); }}
                        disabled={index === formFields.length - 1}
                        className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                      >
                        <i className="fa-solid fa-arrow-down text-[10px]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveField(field.id); }}
                        className="p-1 hover:bg-rose-50 rounded text-gray-400 hover:text-rose-600 cursor-pointer"
                      >
                        <i className="fa-solid fa-trash text-[10px]" />
                      </button>
                    </div>

                    {/* Field Visual Rendering */}
                    <div className="space-y-1 pr-14 text-xs font-sans">
                      <label className="block font-semibold text-gray-700">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>

                      {field.type === 'text' && (
                        <input type="text" placeholder={field.placeholder} disabled className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs text-gray-400" />
                      )}
                      {field.type === 'number' && (
                        <input type="number" placeholder={field.placeholder} disabled className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs text-gray-400" />
                      )}
                      {field.type === 'email' && (
                        <input type="email" placeholder={field.placeholder} disabled className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs text-gray-400" />
                      )}
                      {field.type === 'phone' && (
                        <input type="text" placeholder="+95 9 xxxxxxx" disabled className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs text-gray-400 font-mono" />
                      )}
                      {field.type === 'date' && (
                        <input type="date" disabled className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs text-gray-400" />
                      )}
                      {field.type === 'dropdown' && (
                        <select disabled className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 text-xs text-gray-400">
                          {field.options?.map((opt, i) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.type === 'checkbox' && (
                        <div className="flex items-center space-x-1.5 py-1">
                          <input type="checkbox" disabled className="rounded border-gray-300 text-amber-600 w-4 h-4" />
                          <span className="text-gray-400">Agree to terms</span>
                        </div>
                      )}
                      {field.type === 'file' && (
                        <div className="border border-dashed border-gray-200 bg-gray-50 p-2 text-center text-[10px] text-gray-400 rounded-lg flex items-center justify-center space-x-1">
                          <i className="fa-solid fa-file-arrow-up" />
                          <span>Drag and drop PDF/JPG document proof (max 10MB)</span>
                        </div>
                      )}
                      {field.type === 'nrc' && (
                        <div className="border border-dashed border-amber-200 bg-amber-50/20 p-2 text-center text-[10px] text-amber-800 rounded-lg flex items-center justify-center space-x-2">
                          <i className="fa-solid fa-address-card" />
                          <span>Myanmar NRC Scanner & OCR Auto-extraction Zone</span>
                        </div>
                      )}
                      {field.type === 'selfie' && (
                        <div className="border border-dashed border-purple-200 bg-purple-50/20 p-2 text-center text-[10px] text-purple-800 rounded-lg flex items-center justify-center space-x-2">
                          <i className="fa-solid fa-camera" />
                          <span>Liveness Facial Verification Camera Frame</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Properties Editor (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase">Property Inspector</h3>
            <p className="text-[10px] text-gray-400 mt-1">Configure parameters of the active canvas item.</p>
          </div>

          {selectedField ? (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-gray-500 mb-1">Field Token ID</label>
                <input
                  type="text"
                  value={selectedField.id}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded p-1.5 font-mono text-gray-500"
                />
              </div>

              <div>
                <label className="block text-gray-500 mb-1">Field Label / Name</label>
                <input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateSelectedFieldProperty('label', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                />
              </div>

              {['text', 'number', 'email'].includes(selectedField.type) && (
                <div>
                  <label className="block text-gray-500 mb-1">Input Placeholder</label>
                  <input
                    type="text"
                    value={selectedField.placeholder || ''}
                    onChange={(e) => updateSelectedFieldProperty('placeholder', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none"
                  />
                </div>
              )}

              {selectedField.type === 'dropdown' && (
                <div>
                  <label className="block text-gray-500 mb-1">Dropdown Options (Comma-separated)</label>
                  <textarea
                    value={selectedField.options?.join(', ') || ''}
                    onChange={(e) => updateSelectedFieldProperty('options', e.target.value.split(',').map(s => s.trim()))}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded p-1.5 focus:outline-none text-xs font-mono"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  id="prop_required"
                  checked={selectedField.required}
                  onChange={(e) => updateSelectedFieldProperty('required', e.target.checked)}
                  className="w-4 h-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="prop_required" className="font-semibold text-gray-700 cursor-pointer">
                  Strictly enforce required input check
                </label>
              </div>

              <div className="pt-2 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 block font-mono">Export format mapping:</span>
                <span className="text-[10px] text-amber-800 font-mono font-semibold">JSON_Schema_Draft_07 &bull; type: {selectedField.type}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400 text-xs">
              <i className="fa-solid fa-arrow-pointer text-2xl text-gray-300 block mb-2" />
              Select an item on the canvas preview to inspect and modify properties.
            </div>
          )}
        </div>

      </div>

      {/* Published Schemas Catalog */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-50">Active Published Schemas</h3>
          <p className="text-[10px] text-gray-400 mt-1">Available forms compiled in the tenant cache:</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map(form => (
            <div key={form.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/30 flex items-start justify-between text-xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-gray-900">{form.name}</h4>
                  <span className="bg-emerald-50 text-emerald-800 font-mono text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    v{form.version}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500">Target: <strong className="uppercase">{form.target}</strong> &bull; Fields: {form.fields.length}</p>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
