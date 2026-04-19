'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Building2, FileText, Briefcase, ChevronRight, ChevronLeft, 
  Upload, CheckCircle2, ShieldCheck, DollarSign, BarChart3,
  Globe, Mail, Phone, MapPin, CreditCard, Plus, X
} from 'lucide-react';
import { Supplier, AnnualFinancials, ProjectHistory } from '@/types';

export default function VendorRegistrationForm({ onCancel }: { onCancel: () => void }) {
  const { addSupplier, addNotification } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    location: 'Dubai, UAE',
    address: '',
    taxRegNumber: '',
    category: 'Piping' as any,
  });

  const [financials, setFinancials] = useState<AnnualFinancials[]>([
    { year: (new Date().getFullYear() - 1).toString(), turnover: 0, currentAssets: 0, currentLiabilities: 0 },
    { year: (new Date().getFullYear() - 2).toString(), turnover: 0, currentAssets: 0, currentLiabilities: 0 },
  ]);

  const [projectDocs, setProjectDocs] = useState<string[]>([]);
  const [projectHistory, setProjectHistory] = useState<ProjectHistory[]>([]);
  const [newProject, setNewProject] = useState<ProjectHistory>({
    description: '',
    orderValue: 0,
    scope: '',
    supplyDescription: '',
    year: new Date().getFullYear().toString(),
    country: ''
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFinancialChange = (index: number, field: keyof AnnualFinancials, value: string) => {
    const newFinancials = [...financials];
    newFinancials[index] = { ...newFinancials[index], [field]: parseFloat(value) || 0 };
    setFinancials(newFinancials);
  };

  const addProjectToHistory = () => {
    if (!newProject.description || !newProject.country) return;
    setProjectHistory(prev => [...prev, newProject]);
    setNewProject({
      description: '',
      orderValue: 0,
      scope: '',
      supplyDescription: '',
      year: new Date().getFullYear().toString(),
      country: ''
    });
    setShowProjectForm(false);
  };

  const removeProject = (index: number) => {
    setProjectHistory(prev => prev.filter((_, i) => i !== index));
  };

  const simulateUpload = (type: string) => {
    setUploading(type);
    setTimeout(() => {
      setUploading(null);
      if (type === 'project') {
        setProjectDocs(prev => [...prev, `PROJ_DOC_${Date.now()}.pdf`]);
      } else if (type.startsWith('fin_')) {
        const index = parseInt(type.split('_')[1]);
        const newFin = [...financials];
        newFin[index].docId = `FIN_STMT_${newFin[index].year}.pdf`;
        setFinancials(newFin);
      }
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Prepare supplier object
    const newSupplier: Supplier = {
      id: `SUP-TEMP-${Date.now()}`,
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      address: formData.address,
      taxRegNumber: formData.taxRegNumber,
      status: 'Pending Approval',
      active: false,
      kpis: {
        priceVariation: 0,
        deliveryPerformance: 0,
        paymentTerms: 'Standard',
        onTimePayment: 0,
        responseTime: 0,
        deliveryTerms: 'EXW',
        rejectionRate: 0
      },
      financials: financials,
      projectExperienceDocs: projectDocs,
      projectHistory: projectHistory,
    };

    // Simulate API delay
    setTimeout(() => {
      addSupplier(newSupplier);
      addNotification({
        type: 'info',
        source: 'Document',
        title: 'New Vendor Registration',
        message: `Vendor '${formData.name}' has submitted a registration request. Review required.`,
        entityId: newSupplier.id,
        entityType: 'Supplier'
      });
      setLoading(false);
      setSubmitted(true);
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/10">
          <CheckCircle2 className="text-emerald-400" size={40} />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Registration Submitted</h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto leading-relaxed">
          Your application for **{formData.name}** has been received. Our procurement team will review your financial and project documentation within 3-5 business days.
        </p>
        <button
          onClick={onCancel}
          className="px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all font-semibold"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[640px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Become a Partner</h2>
          <p className="text-sm text-gray-400">Step {step} of 3: {step === 1 ? 'Company Profile' : step === 2 ? 'Financial Status' : 'Experience'}</p>
        </div>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          Cancel
        </button>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full mb-10 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="bg-[#111319]/80 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl overflow-hidden relative">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Building2 size={18} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Company Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Name</label>
                  <input
                    name="name" required
                    value={formData.name} onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/30 transition-all"
                    placeholder="e.g. Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tax ID (TRN)</label>
                  <input
                    name="taxRegNumber" required
                    value={formData.taxRegNumber} onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/30 transition-all"
                    placeholder="TRN-123456789"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Address</label>
                <textarea
                  name="address" rows={2} required
                  value={formData.address} onChange={handleInputChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/30 transition-all resize-none"
                  placeholder="Full office address..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-gray-500" />
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact Person</label>
                  </div>
                  <input
                    name="contactPerson" required
                    value={formData.contactPerson} onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white"
                  />
                </div>
                <div className="space-y-2 group">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail size={14} className="text-gray-500" />
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
                  </div>
                  <input
                    name="email" type="email" required
                    value={formData.email} onChange={handleInputChange}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <BarChart3 size={18} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Financial Dossier</h3>
              </div>

              {financials.map((fin, idx) => (
                <div key={idx} className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm font-bold text-white">Financial Year {fin.year}</span>
                    {fin.docId ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} /> {fin.docId}
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => simulateUpload(`fin_${idx}`)}
                        disabled={uploading === `fin_${idx}`}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-semibold transition-colors"
                      >
                        {uploading === `fin_${idx}` ? <div className="w-3 h-3 border border-t-transparent animate-spin rounded-full" /> : <Upload size={12} />}
                        Upload Statement
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Turnover ($)</label>
                      <input 
                        type="number" 
                        value={fin.turnover || ''} 
                        onChange={(e) => handleFinancialChange(idx, 'turnover', e.target.value)}
                        className="w-full bg-black/30 border border-white/5 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Current Assets</label>
                      <input 
                        type="number" 
                        value={fin.currentAssets || ''} 
                        onChange={(e) => handleFinancialChange(idx, 'currentAssets', e.target.value)}
                        className="w-full bg-black/30 border border-white/5 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Liabilities</label>
                      <input 
                        type="number" 
                        value={fin.currentLiabilities || ''} 
                        onChange={(e) => handleFinancialChange(idx, 'currentLiabilities', e.target.value)}
                        className="w-full bg-black/30 border border-white/5 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Briefcase size={18} className="text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Project Experience</h3>
                </div>
                {!showProjectForm && (
                  <button 
                    type="button"
                    onClick={() => setShowProjectForm(true)}
                    className="text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all font-bold flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Project Entry
                  </button>
                )}
              </div>

              {showProjectForm && (
                <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Project Description</label>
                      <input 
                        value={newProject.description} 
                        onChange={e => setNewProject({...newProject, description: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="e.g. EPC Contract for Terminal 2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Order Value ($)</label>
                      <input 
                        type="number"
                        value={newProject.orderValue || ''} 
                        onChange={e => setNewProject({...newProject, orderValue: parseFloat(e.target.value) || 0})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Scope of Supply</label>
                      <input 
                        value={newProject.scope} 
                        onChange={e => setNewProject({...newProject, scope: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="e.g. Design & Fabrication"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Supply Description</label>
                      <input 
                        value={newProject.supplyDescription} 
                        onChange={e => setNewProject({...newProject, supplyDescription: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="e.g. High Pressure Valves"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Year of Supply</label>
                      <input 
                        value={newProject.year} 
                        onChange={e => setNewProject({...newProject, year: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Country</label>
                      <input 
                        value={newProject.country} 
                        onChange={e => setNewProject({...newProject, country: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-white text-sm"
                        placeholder="e.g. United Arab Emirates"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={addProjectToHistory}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all"
                    >
                      Save Project Row
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowProjectForm(false)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {projectHistory.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="bg-white/5 text-gray-400 border-b border-white/10">
                        <th className="px-3 py-3 font-bold uppercase whitespace-nowrap">Description</th>
                        <th className="px-3 py-3 font-bold uppercase whitespace-nowrap">Order Value</th>
                        <th className="px-3 py-3 font-bold uppercase whitespace-nowrap">Scope</th>
                        <th className="px-3 py-3 font-bold uppercase whitespace-nowrap">Supply</th>
                        <th className="px-3 py-3 font-bold uppercase whitespace-nowrap">Year</th>
                        <th className="px-3 py-3 font-bold uppercase whitespace-nowrap">Country</th>
                        <th className="px-2 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {projectHistory.map((p, idx) => (
                        <tr key={idx} className="group hover:bg-white/5 transition-colors">
                          <td className="px-3 py-3 font-medium text-white max-w-[120px] truncate" title={p.description}>{p.description}</td>
                          <td className="px-3 py-3 font-mono text-emerald-400">${p.orderValue.toLocaleString()}</td>
                          <td className="px-3 py-3 text-gray-400 italic truncate max-w-[80px]" title={p.scope}>{p.scope}</td>
                          <td className="px-3 py-3 text-gray-300 truncate max-w-[100px]" title={p.supplyDescription}>{p.supplyDescription}</td>
                          <td className="px-3 py-3 text-white">{p.year}</td>
                          <td className="px-3 py-3 text-gray-400">{p.country}</td>
                          <td className="px-2 py-3 text-right">
                            <button 
                              type="button"
                              onClick={() => removeProject(idx)}
                              className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !showProjectForm && (
                <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl space-y-2">
                  <p className="text-sm text-gray-500 font-medium">No projects added yet.</p>
                  <p className="text-xs text-gray-600 max-w-[200px] mx-auto">Add your major project references to strengthen your profile.</p>
                </div>
              )}

              <div className="pt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Supporting Documents</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mx-auto">
                    <FileText className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Upload Reference Dossier</p>
                    <p className="text-xs text-gray-500">Provide certificates or completion reports</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => simulateUpload('project')}
                    disabled={uploading === 'project'}
                    className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white transition-all inline-flex items-center gap-2"
                  >
                    {uploading === 'project' ? <div className="w-4 h-4 border-2 border-t-transparent animate-spin rounded-full" /> : <Upload size={14} />}
                    Select Files
                  </button>
                </div>

                {projectDocs.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Uploaded Documents</label>
                    <div className="grid grid-cols-1 gap-2">
                      {projectDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 px-4 py-3 rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 size={16} className="text-emerald-400" />
                            <span className="text-sm text-gray-300">{doc}</span>
                          </div>
                          <button type="button" className="text-gray-500 hover:text-red-400 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 pt-6 border-t border-white/5">
            {step > 1 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setStep(step - 1); }}
                className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all border border-white/5"
              >
                <ChevronLeft size={18} /> Previous
              </button>
            )}
            
            {step < 3 ? (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setStep(step + 1); }}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.99]"
              >
                Continue <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Submit Registration <CheckCircle2 size={18} /></>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-gray-500 text-[10px] uppercase tracking-[0.2em]">
        Verified by <span className="text-blue-400 font-bold">ProcureIQ Trust Engine</span>
      </div>
    </div>
  );
}

function User({ className, size }: { className?: string; size?: number }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
