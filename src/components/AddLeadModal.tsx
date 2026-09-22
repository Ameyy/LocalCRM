import React, { useState } from 'react';
import { X, PlusCircle, UserPlus, Building2, Mail, Phone, DollarSign, Tag, CheckCircle2 } from 'lucide-react';
import { Lead, User, PipelineStage, Priority } from '../types';
import { resolveRegionAndCity } from '../lib/documentParser';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onAddLead: (leadData: Partial<Lead>) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onAddLead,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState<string>('15000');
  const [stage, setStage] = useState<PipelineStage>('new');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignedTo, setAssignedTo] = useState<string>(currentUser.id);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    const assignedUser = users.find((u) => u.id === assignedTo);
    const resolved = resolveRegionAndCity(city.trim(), region.trim());

    onAddLead({
      name: name.trim(),
      company: company.trim(),
      region: region.trim() || resolved.region,
      city: city.trim() || resolved.city,
      location: city.trim() || resolved.city,
      email: email.trim(),
      phone: phone.trim(),
      value: parseFloat(value) || 0,
      stage,
      priority,
      assignedTo,
      assignedName: assignedUser ? assignedUser.name : currentUser.name,
      notes: notes.trim(),
      tags: ['Manual Entry'],
    });

    // Reset form & close
    setName('');
    setCompany('');
    setRegion('');
    setCity('');
    setEmail('');
    setPhone('');
    setValue('15000');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="add-lead-modal"
        className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Add New Lead</h3>
              <p className="text-xs text-neutral-400">Adds record to the fixed table and syncs to both Admin &amp; Sales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Contact Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Company / Organization <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Quantum Analytics"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Region / State <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                list="region-suggestions"
                placeholder="e.g. Maharashtra, Karnataka, Gujarat..."
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden"
              />
              <datalist id="region-suggestions">
                <option value="Maharashtra" />
                <option value="Karnataka" />
                <option value="Gujarat" />
                <option value="Delhi NCR" />
                <option value="Tamil Nadu" />
                <option value="Telangana" />
                <option value="Uttar Pradesh" />
                <option value="Rajasthan" />
                <option value="Madhya Pradesh" />
                <option value="West Bengal" />
                <option value="Kerala" />
                <option value="Punjab" />
                <option value="Haryana" />
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Location / City <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                list="city-suggestions"
                placeholder="e.g. Pune, Bengaluru, Mumbai, Delhi..."
                value={city}
                onChange={(e) => {
                  const newCity = e.target.value;
                  setCity(newCity);
                  const resolved = resolveRegionAndCity(newCity, region);
                  if (newCity.trim() && (!region || region === 'Maharashtra' || region === 'General Territory')) {
                    setRegion(resolved.region);
                  }
                }}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden"
              />
              <datalist id="city-suggestions">
                <option value="Pune" />
                <option value="Mumbai" />
                <option value="Bengaluru" />
                <option value="Hyderabad" />
                <option value="Chennai" />
                <option value="Delhi" />
                <option value="Ahmedabad" />
                <option value="Kolkata" />
                <option value="Nagpur" />
                <option value="Nashik" />
                <option value="Jaipur" />
                <option value="Surat" />
                <option value="Lucknow" />
                <option value="Indore" />
                <option value="Thane" />
                <option value="Navi Mumbai" />
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="jordan@quantumanalytics.example"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 019-2834"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Deal Value ($)</label>
              <input
                type="number"
                min="0"
                step="500"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-hidden font-semibold text-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as PipelineStage)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="new">New Inquiry</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal Sent</option>
                <option value="won">Closed Won</option>
                <option value="lost">Closed Lost</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Assigned Sales Rep</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'admin' ? 'Admin' : 'Sales Rep'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1">Initial Note / Remark</label>
            <textarea
              rows={2}
              placeholder="e.g. Inquired via website contact form regarding enterprise deployment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-hidden resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Save &amp; Broadcast</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
