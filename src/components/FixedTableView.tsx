import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  UploadCloud, 
  Download, 
  Trash2, 
  Edit3, 
  Phone, 
  Mail, 
  Building2, 
  DollarSign, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  ArrowUpDown,
  User as UserIcon,
  HelpCircle,
  PlusCircle,
  MessageSquare,
  Star,
  Flame,
  X,
  Zap,
  SlidersHorizontal,
  ArrowRightLeft,
  Users,
  Check,
  MapPin
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Lead, User, PipelineStage, Priority } from '../types';
import { downloadExcelTemplate, downloadCsvTemplate } from '../lib/documentParser';
import { AddNoteReviewModal } from './AddNoteReviewModal';

interface FixedTableViewProps {
  leads: Lead[];
  users: User[];
  currentUser: User;
  onUpdateLead: (updatedLead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onBulkDeleteLeads?: (leadIds: string[]) => void;
  onOpenImporter: () => void;
  onOpenAddLead: () => void;
  onAddNoteReview: (leadId: string, type: 'note' | 'remark' | 'review', content: string, rating?: number) => void;
  onBulkReassignPipelinedLeads?: (
    targetUserId: string,
    options?: {
      leadIds?: string[];
      stage?: string;
      fromUserId?: string;
      pipelinedOnly?: boolean;
      customTargetName?: string;
    }
  ) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const FixedTableView: React.FC<FixedTableViewProps> = ({
  leads,
  users,
  currentUser,
  onUpdateLead,
  onDeleteLead,
  onBulkDeleteLeads,
  onOpenImporter,
  onOpenAddLead,
  onAddNoteReview,
  onBulkReassignPipelinedLeads,
  searchQuery,
  onSearchChange,
}) => {
  const [repFilter, setRepFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'company' | 'value' | 'updatedAt'>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Multi-row selection state for batch assignment & deletion
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Safe In-App Delete Confirmation Modal State (strictly for Admin)
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);

  // 1-Click quick target user ID (defaults to first non-admin employee if available)
  const nonAdminUser = users.find((u) => u.role !== 'admin');
  const [quickAssignTargetUserId, setQuickAssignTargetUserId] = useState<string>(
    nonAdminUser?.id || users[0]?.id || ''
  );

  // Advanced Bulk Reassignment Modal State
  const [showBulkReassignModal, setShowBulkReassignModal] = useState<boolean>(false);
  const [modalTargetUserId, setModalTargetUserId] = useState<string>(
    nonAdminUser?.id || users[0]?.id || ''
  );
  const [modalStageScope, setModalStageScope] = useState<string>('all_pipeline');
  const [modalFromUserId, setModalFromUserId] = useState<string>('all');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  // Row edit drawer state
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Note/Review modal state
  const [noteModalLead, setNoteModalLead] = useState<Lead | null>(null);

  // Active records: UNIVERSAL VISIBILITY - Same data everywhere viewed by everyone
  const activeLeads = leads.filter((l) => !l.deleted);

  // Available regions list for filtering
  const availableRegions = Array.from(
    new Set(activeLeads.map((l) => l.region || 'Maharashtra').filter(Boolean))
  ) as string[];

  // Filtering
  const filteredLeads = activeLeads.filter((lead) => {
    const q = searchQuery.toLowerCase().trim();
    const cityOrLoc = (lead.city || lead.location || '').toLowerCase();
    const regionName = (lead.region || '').toLowerCase();

    const matchesSearch =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.company.toLowerCase().includes(q) ||
      cityOrLoc.includes(q) ||
      regionName.includes(q) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.notes && lead.notes.toLowerCase().includes(q)) ||
      (lead.notesLog && lead.notesLog.some(n => n.content.toLowerCase().includes(q)));

    const matchesRep =
      repFilter === 'all' ||
      lead.assignedTo === repFilter ||
      (repFilter === 'me' && (lead.assignedTo === currentUser.id || lead.assignedTo === currentUser.employeeId));
    const matchesStage = stageFilter === 'all' || lead.stage === stageFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    const matchesRegion = regionFilter === 'all' || (lead.region || 'Maharashtra').toLowerCase() === regionFilter.toLowerCase();

    return matchesSearch && matchesRep && matchesStage && matchesPriority && matchesRegion;
  });

  // Sorting
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    let comp = 0;
    if (sortField === 'name') comp = a.name.localeCompare(b.name);
    else if (sortField === 'company') comp = a.company.localeCompare(b.company);
    else if (sortField === 'value') comp = (a.value || 0) - (b.value || 0);
    else if (sortField === 'updatedAt') comp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();

    return sortAsc ? comp : -comp;
  });

  const totalValue = sortedLeads.reduce((sum, l) => sum + (l.value || 0), 0);
  const totalWon = sortedLeads.filter((l) => l.stage === 'won').reduce((sum, l) => sum + (l.value || 0), 0);

  // All active pipelined leads across the CRM (stages: new, contacted, qualified, proposal)
  const allPipelinedLeads = leads.filter(
    (l) => !l.deleted && l.stage !== 'won' && l.stage !== 'lost'
  );
  const totalPipelineValue = allPipelinedLeads.reduce((sum, l) => sum + (l.value || 0), 0);

  // Filtered pipelined leads matching current search and filters
  const filteredPipelinedLeads = sortedLeads.filter(
    (l) => l.stage !== 'won' && l.stage !== 'lost'
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // 1-Click execute reassignment handler
  const handleExecuteQuickAssign = async (targetId: string, customLeadIds?: string[]) => {
    if (!onBulkReassignPipelinedLeads || !targetId) return;
    const targetUser = users.find((u) => u.id === targetId);
    if (!targetUser) return;

    setIsReassigning(true);
    try {
      if (customLeadIds && customLeadIds.length > 0) {
        await onBulkReassignPipelinedLeads(targetId, {
          leadIds: customLeadIds,
          customTargetName: targetUser.name,
          pipelinedOnly: false,
        });
        setSelectedLeadIds([]);
      } else {
        await onBulkReassignPipelinedLeads(targetId, {
          pipelinedOnly: true,
          customTargetName: targetUser.name,
        });
      }
    } finally {
      setIsReassigning(false);
      setShowBulkReassignModal(false);
    }
  };

  // Advanced filtered modal execution
  const handleExecuteModalAssign = async () => {
    if (!onBulkReassignPipelinedLeads || !modalTargetUserId) return;
    const targetUser = users.find((u) => u.id === modalTargetUserId);
    if (!targetUser) return;

    setIsReassigning(true);
    try {
      await onBulkReassignPipelinedLeads(modalTargetUserId, {
        pipelinedOnly: modalStageScope === 'all_pipeline',
        stage: modalStageScope !== 'all_pipeline' && modalStageScope !== 'all' ? modalStageScope : undefined,
        fromUserId: modalFromUserId !== 'all' ? modalFromUserId : undefined,
        customTargetName: targetUser.name,
      });
      setSelectedLeadIds([]);
    } finally {
      setIsReassigning(false);
      setShowBulkReassignModal(false);
    }
  };

  // Export current filtered table to Excel
  const handleExportExcel = () => {
    const rows = sortedLeads.map((l) => ({
      'Contact Name': l.name,
      'Company': l.company,
      'Region': l.region || 'Maharashtra',
      'Location / City': l.city || l.location || 'Pune',
      'Email': l.email || '',
      'Phone': l.phone || '',
      'Deal Value ($)': l.value || 0,
      'Status / Stage': l.stage.toUpperCase(),
      'Priority': l.priority.toUpperCase(),
      'Assigned Rep': l.assignedName || '',
      'Notes & Remarks': l.notes || '',
      'Notes & Reviews Count': l.notesLog?.length || 0,
      'Last Updated': new Date(l.updatedAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Krew Mesh CRM Leads');
    XLSX.writeFile(workbook, `krew_mesh_crm_leads_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleToggleSort = (field: 'name' | 'company' | 'value' | 'updatedAt') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;

    // For employees, preserve original assignment so employee cannot alter assignedTo
    const originalLead = leads.find((l) => l.id === editingLead.id);
    const assignedToId = currentUser.role === 'admin' 
      ? editingLead.assignedTo 
      : (originalLead ? originalLead.assignedTo : editingLead.assignedTo);

    const assignedUser = users.find((u) => u.id === assignedToId);
    const updated: Lead = {
      ...editingLead,
      region: (editingLead.region || '').trim() || 'Maharashtra',
      city: (editingLead.city || editingLead.location || '').trim() || 'Pune',
      location: (editingLead.city || editingLead.location || '').trim() || 'Pune',
      assignedTo: assignedToId,
      assignedName: assignedUser ? assignedUser.name : (originalLead?.assignedName || editingLead.assignedName),
      updatedAt: new Date().toISOString(),
      version: editingLead.version + 1,
    };

    onUpdateLead(updated);
    setEditingLead(null);
  };

  return (
    <div id="fixed-table-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Top Banner & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-white tracking-tight">
              Krew Mesh CRM Fixed Table
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {currentUser.role === 'admin' ? 'Master Admin Control' : 'Universal View • Employee Edit Access'}
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            {currentUser.role === 'admin'
              ? 'Complete company database with cross-team sync, 1-click reassignment, export, and audit logs'
              : 'Universal leads database viewed by all employees. You can edit lead and task data; lead assignments and exports are restricted to Admin.'}
          </p>
        </div>

        {/* Action Buttons: Add Lead + Import + Export (strictly Admin managed) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* New Lead manual button (Admin only) */}
          {currentUser.role === 'admin' && (
            <button
              id="open-add-lead-btn"
              onClick={onOpenAddLead}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-semibold rounded-xl border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>Add Lead</span>
            </button>
          )}

          {/* Import document button (Admin only) */}
          {currentUser.role === 'admin' && (
            <button
              id="open-import-data-btn"
              onClick={onOpenImporter}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Import Document</span>
            </button>
          )}

          {/* Export & Template buttons (strictly Admin only) */}
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                title="Export to Excel Spreadsheet (Admin only)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export</span>
              </button>
              <button
                onClick={downloadExcelTemplate}
                className="px-2.5 py-1.5 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 cursor-pointer"
                title="Download Fixed Template File (Admin only)"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Template</span>
              </button>
            </div>
          )}

          {/* Employee status indicator */}
          {currentUser.role !== 'admin' && (
            <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Universal Access • Export &amp; Assigning Admin-Only</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="text-[11px] text-neutral-400 font-medium">Total Records</div>
          <div className="text-lg font-bold text-white mt-0.5">{sortedLeads.length}</div>
        </div>
        <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="text-[11px] text-neutral-400 font-medium">Pipeline Value</div>
          <div className="text-lg font-bold text-white mt-0.5">${totalValue.toLocaleString()}</div>
        </div>
        <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="text-[11px] text-neutral-400 font-medium">Closed Won</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">${totalWon.toLocaleString()}</div>
        </div>
        <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl">
          <div className="text-[11px] text-neutral-400 font-medium">Active Session</div>
          <div className="text-xs font-bold text-neutral-200 mt-1 truncate">
            {currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : 'Sales Rep'})
          </div>
        </div>
      </div>

      {/* 1-Click Pipeline Reassignment Bar (Exclusively for Admin) */}
      {currentUser.role === 'admin' && (
        <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-neutral-900 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 fill-amber-400/30 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>1-Click Pipeline Reassignment</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                      Admin Feature
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-neutral-300 mt-0.5">
                  Reassign all <span className="font-semibold text-amber-300">{allPipelinedLeads.length} pipelined leads</span> ({formatCurrency(totalPipelineValue)}) to another employee in a single click.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dropdown + 1-Click Button */}
              <div className="flex items-center gap-1.5 bg-neutral-950/80 border border-neutral-700/70 p-1 rounded-xl">
                <select
                  value={quickAssignTargetUserId}
                  onChange={(e) => setQuickAssignTargetUserId(e.target.value)}
                  className="px-2.5 py-1.5 bg-transparent text-xs text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="" disabled className="bg-neutral-900 text-neutral-400">Choose Employee...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-neutral-900 text-white">
                      {u.name} ({u.employeeId || u.username})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleExecuteQuickAssign(quickAssignTargetUserId)}
                  disabled={!quickAssignTargetUserId || allPipelinedLeads.length === 0 || isReassigning}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-neutral-950 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs"
                  title="Reassign all active pipelined leads in a single click"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>{isReassigning ? 'Reassigning...' : 'Assign All (1-Click)'}</span>
                </button>
              </div>

              {/* Direct 1-Click buttons for individual employees */}
              <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-neutral-800">
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Fast:</span>
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleExecuteQuickAssign(u.id)}
                    disabled={isReassigning || allPipelinedLeads.length === 0}
                    className="px-2.5 py-1.5 bg-neutral-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 text-neutral-200 hover:text-amber-200 border border-neutral-700/60 text-xs font-medium rounded-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    title={`1-Click: Transfer all ${allPipelinedLeads.length} pipelined leads to ${u.name}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${u.avatarColor || 'bg-neutral-500'}`} />
                    <span>{u.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>

              {/* Advanced Modal Button */}
              <button
                type="button"
                onClick={() => setShowBulkReassignModal(true)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-medium rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
                <span>Filters &amp; Scope</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search contact, company, email, phone, notes, remarks..."
            className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Rep filter (Universal table filtering for all team members) */}
          <select
            value={repFilter}
            onChange={(e) => setRepFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Sales Reps</option>
            <option value="me">My Assigned Leads</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.employeeId || u.username})
              </option>
            ))}
          </select>

          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Stages</option>
            <option value="new">New Inquiries</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="proposal">Proposal</option>
            <option value="won">Closed Won</option>
            <option value="lost">Closed Lost</option>
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {/* Region / State filter */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">All Regions</option>
            {availableRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          {/* Quick Selection Shortcuts (Admin only) */}
          {currentUser.role === 'admin' && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-800 text-xs">
              <span className="text-neutral-500 text-[11px]">Select:</span>
              <button
                type="button"
                onClick={() => setSelectedLeadIds(filteredPipelinedLeads.map((l) => l.id))}
                className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-amber-300 border border-neutral-800 rounded-lg transition cursor-pointer text-[11px]"
                title="Select all leads currently in the sales pipeline"
              >
                Pipeline ({filteredPipelinedLeads.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedLeadIds(sortedLeads.map((l) => l.id))}
                className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded-lg transition cursor-pointer text-[11px]"
              >
                All ({sortedLeads.length})
              </button>
              {selectedLeadIds.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg transition cursor-pointer text-[11px] font-semibold flex items-center gap-1"
                    title="Delete all selected leads (Admin only)"
                  >
                    <Trash2 className="w-3 h-3 text-rose-400" />
                    <span>Delete ({selectedLeadIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLeadIds([])}
                    className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 border border-neutral-800 rounded-lg transition cursor-pointer text-[11px]"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Admin Multi-Select Action Banner */}
      {currentUser.role === 'admin' && selectedLeadIds.length > 0 && (
        <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold text-white">
              {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Lead' : 'Leads'} Selected
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Total Deal Value: <strong className="text-emerald-400">{formatCurrency(sortedLeads.filter((l) => selectedLeadIds.includes(l.id)).reduce((s, l) => s + (l.value || 0), 0))}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedLeadIds([])}
              className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-950 border border-neutral-800 rounded-xl transition cursor-pointer"
            >
              Deselect All
            </button>
            <button
              type="button"
              onClick={() => setShowBulkReassignModal(true)}
              className="px-3 py-1.5 text-xs font-semibold text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Bulk Reassign ({selectedLeadIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteModal(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 border border-rose-500 rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              title="Bulk delete all selected leads"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bulk Delete ({selectedLeadIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Fixed Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-950/70 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                {currentUser.role === 'admin' && (
                  <th className="py-3 px-3 w-10 text-center select-none">
                    <input
                      type="checkbox"
                      checked={sortedLeads.length > 0 && selectedLeadIds.length === sortedLeads.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLeadIds(sortedLeads.map((l) => l.id));
                        } else {
                          setSelectedLeadIds([]);
                        }
                      }}
                      className="rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-0 cursor-pointer"
                      title="Select or deselect all"
                    />
                  </th>
                )}
                <th
                  onClick={() => handleToggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Contact Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleToggleSort('company')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Company / Account</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>Location &amp; Region</span>
                  </div>
                </th>
                <th className="py-3 px-4">Contact Info</th>
                <th
                  onClick={() => handleToggleSort('value')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Deal Value</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Status / Stage</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Rep</th>
                <th className="py-3 px-4">Notes &amp; Remarks</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-xs">
              {sortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={currentUser.role === 'admin' ? 11 : 10} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto">
                        <UploadCloud className="w-6 h-6 text-emerald-400" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No records matching query</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Import contacts from Excel/CSV/PDF or add a new lead manually. All records sync in real time across dashboards.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          onClick={onOpenAddLead}
                          className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Add Lead</span>
                        </button>
                        <button
                          onClick={onOpenImporter}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Import Document</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedLeads.map((lead) => {
                  const rep = users.find((u) => u.id === lead.assignedTo);
                  const notesCount = lead.notesLog?.length || 0;
                  const latestReview = lead.notesLog?.find(n => n.type === 'review');
                  const isSelected = selectedLeadIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-neutral-800/40 transition group ${
                        isSelected ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {/* Checkbox for Admin selection */}
                      {currentUser.role === 'admin' && (
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeadIds((prev) => [...prev, lead.id]);
                              } else {
                                setSelectedLeadIds((prev) => prev.filter((id) => id !== lead.id));
                              }
                            }}
                            className="rounded border-neutral-700 bg-neutral-950 text-emerald-500 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <span>{lead.name}</span>
                          {lead.tags?.includes('Document Import') && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                              DOC
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Company */}
                      <td className="py-3 px-4 text-neutral-300 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{lead.company || '—'}</span>
                        </div>
                      </td>

                      {/* Location & Region */}
                      <td className="py-3 px-4 text-xs whitespace-nowrap">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-white block">
                              {lead.city || lead.location || 'Pune'}
                            </span>
                            <span className="text-[10px] text-neutral-400 block font-medium">
                              {lead.region || 'Maharashtra'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Email & Phone */}
                      <td className="py-3 px-4 text-neutral-400 text-[11px] space-y-0.5">
                        {lead.email && (
                          <div className="flex items-center gap-1.5 font-mono truncate max-w-[160px]">
                            <Mail className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1.5 font-mono">
                            <Phone className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                        {!lead.email && !lead.phone && <span className="text-neutral-600">—</span>}
                      </td>

                      {/* Deal Value */}
                      <td className="py-3 px-4 font-semibold text-emerald-400">
                        ${(lead.value || 0).toLocaleString()}
                      </td>

                      {/* Status / Stage */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            lead.stage === 'won'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : lead.stage === 'lost'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : lead.stage === 'proposal'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : lead.stage === 'qualified'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {lead.stage}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 w-fit ${
                            lead.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : lead.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {lead.priority === 'high' && <Flame className="w-3 h-3 text-rose-400" />}
                          <span>{lead.priority}</span>
                        </span>
                      </td>

                      {/* Assigned Rep */}
                      <td className="py-3 px-4 text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-5 h-5 rounded-md ${
                              rep?.avatarColor || 'bg-neutral-700'
                            } flex items-center justify-center text-[10px] font-bold text-white`}
                          >
                            {(lead.assignedName || 'S').slice(0, 1)}
                          </div>
                          <span>{lead.assignedName || rep?.name || 'Unassigned'}</span>
                        </div>
                      </td>

                      {/* Notes & Remarks button + preview */}
                      <td className="py-3 px-4 text-neutral-400 text-[11px] max-w-[220px]">
                        <button
                          onClick={() => setNoteModalLead(lead)}
                          className="text-left w-full hover:bg-neutral-800/80 p-1 rounded-lg transition group/note flex items-start justify-between gap-1"
                          title="Click to view or add notes, remarks & reviews"
                        >
                          <div className="truncate flex-1">
                            {lead.notes || 'No remarks recorded'}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {latestReview && (
                              <span className="text-amber-400 text-[10px] font-bold flex items-center">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{latestReview.rating}</span>
                              </span>
                            )}
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 group-hover/note:bg-neutral-700 text-neutral-300">
                              {notesCount}
                            </span>
                          </div>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Add Note / Review */}
                          <button
                            onClick={() => setNoteModalLead(lead)}
                            className="p-1.5 text-neutral-400 hover:text-sky-400 hover:bg-neutral-800 rounded-lg transition"
                            title="Add Note, Remark, or Review"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Row */}
                          <button
                            onClick={() => setEditingLead(lead)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
                            title="Edit row details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Row (Admin only) */}
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => setLeadToDelete(lead)}
                              className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                              title="Delete record (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row Edit Modal Drawer */}
      {editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Edit Record Details</h3>
                <p className="text-xs text-neutral-400">Edits sync live to Admin &amp; Sales dashboards</p>
              </div>
              <button
                onClick={() => setEditingLead(null)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={editingLead.name}
                    onChange={(e) => setEditingLead({ ...editingLead, name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Company *</label>
                  <input
                    type="text"
                    required
                    value={editingLead.company}
                    onChange={(e) => setEditingLead({ ...editingLead, company: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Region / State (e.g. Maharashtra) *</label>
                  <input
                    type="text"
                    required
                    list="drawer-region-suggestions"
                    value={editingLead.region || 'Maharashtra'}
                    onChange={(e) => setEditingLead({ ...editingLead, region: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <datalist id="drawer-region-suggestions">
                    <option value="Maharashtra" />
                    <option value="Karnataka" />
                    <option value="Gujarat" />
                    <option value="Delhi NCR" />
                    <option value="Tamil Nadu" />
                    <option value="Telangana" />
                    <option value="Uttar Pradesh" />
                    <option value="Rajasthan" />
                  </datalist>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Location / City (e.g. Pune) *</label>
                  <input
                    type="text"
                    required
                    list="drawer-city-suggestions"
                    value={editingLead.city || editingLead.location || 'Pune'}
                    onChange={(e) => setEditingLead({ ...editingLead, city: e.target.value, location: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  />
                  <datalist id="drawer-city-suggestions">
                    <option value="Pune" />
                    <option value="Mumbai" />
                    <option value="Nagpur" />
                    <option value="Nashik" />
                    <option value="Thane" />
                    <option value="Navi Mumbai" />
                    <option value="Aurangabad (Chhatrapati Sambhaji Nagar)" />
                    <option value="Solapur" />
                    <option value="Kolhapur" />
                    <option value="Bengaluru" />
                    <option value="Hyderabad" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingLead.email || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, email: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editingLead.phone || ''}
                    onChange={(e) => setEditingLead({ ...editingLead, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Deal Value ($)</label>
                  <input
                    type="number"
                    value={editingLead.value || 0}
                    onChange={(e) => setEditingLead({ ...editingLead, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden font-semibold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Status / Stage</label>
                  <select
                    value={editingLead.stage}
                    onChange={(e) => setEditingLead({ ...editingLead, stage: e.target.value as PipelineStage })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="new">New Inquiry</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="proposal">Proposal</option>
                    <option value="won">Closed Won</option>
                    <option value="lost">Closed Lost</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Priority</label>
                  <select
                    value={editingLead.priority}
                    onChange={(e) => setEditingLead({ ...editingLead, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {currentUser.role === 'admin' ? (
                <div className="space-y-1.5">
                  <label className="block font-semibold text-neutral-300 mb-1">Assigned Sales Rep</label>
                  <select
                    value={editingLead.assignedTo}
                    onChange={(e) => setEditingLead({ ...editingLead, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.employeeId || u.username})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 bg-neutral-950/70 p-2 rounded-xl border border-neutral-800/80 mt-1">
                    <span>Transfer all pipeline leads instead?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setModalFromUserId(editingLead.assignedTo);
                        setShowBulkReassignModal(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>1-Click Reassign All Pipelined</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Assigned Sales Rep</label>
                  <div className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-300 font-medium flex items-center justify-between">
                    <span>
                      {users.find((u) => u.id === editingLead.assignedTo)?.name || editingLead.assignedName || 'Unassigned'}
                    </span>
                    <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-mono">
                      Admin Assigning Only
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Latest Notes / Summary</label>
                <textarea
                  rows={3}
                  value={editingLead.notes || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    setNoteModalLead(editingLead);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 rounded-xl transition font-medium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Add Remark / Review</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLead(null)}
                    className="px-4 py-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-sm transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note / Remark / Review Modal */}
      <AddNoteReviewModal
        isOpen={!!noteModalLead}
        onClose={() => setNoteModalLead(null)}
        lead={noteModalLead}
        currentUser={currentUser}
        onSubmit={onAddNoteReview}
      />

      {/* Floating Bulk Reassignment Bar (Admin only) */}
      {currentUser.role === 'admin' && selectedLeadIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-neutral-900/95 backdrop-blur-md border border-amber-500/40 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-3.5 text-xs text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-white">{selectedLeadIds.length}</span>
            <span className="text-neutral-400">leads selected</span>
          </div>

          <div className="h-4 w-px bg-neutral-700" />

          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Assign to:</span>
            <select
              value={quickAssignTargetUserId}
              onChange={(e) => setQuickAssignTargetUserId(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-700 rounded-xl text-white focus:outline-hidden"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.employeeId || u.username})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleExecuteQuickAssign(quickAssignTargetUserId, selectedLeadIds)}
              disabled={isReassigning}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isReassigning ? 'Reassigning...' : 'Reassign Selected (1-Click)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedLeadIds([])}
              className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Advanced Bulk Reassign Modal (Admin only) */}
      {showBulkReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700/80 rounded-3xl shadow-2xl p-6 text-xs text-white max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>1-Click Pipeline Lead Reassignment</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  </h3>
                  <p className="text-neutral-400 text-xs mt-0.5">
                    Transfer all open sales pipeline leads to another employee in a single click
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkReassignModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Step 1: Choose Pipeline Scope to Reassign
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalStageScope('all_pipeline')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      modalStageScope === 'all_pipeline'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>All Active Pipeline</span>
                      <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono">
                        {allPipelinedLeads.length} leads
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Includes New, Contacted, Qualified, and Proposal stages. ({formatCurrency(totalPipelineValue)})
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStageScope('all')}
                    className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                      modalStageScope === 'all'
                        ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>All Records (Including Won/Lost)</span>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-mono">
                        {leads.filter(l => !l.deleted).length} leads
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Full book of business transfer across all stages.
                    </p>
                  </button>
                </div>
              </div>

              {/* Filter by current representative */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Filter by Current Assignee:
                  </label>
                  <select
                    value={modalFromUserId}
                    onChange={(e) => setModalFromUserId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                  >
                    <option value="all">Any Current Assignee (All Reps)</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        Only leads with: {u.name} ({u.employeeId || u.username})
                      </option>
                    ))}
                  </select>
                </div>

                {modalStageScope !== 'all_pipeline' && modalStageScope !== 'all' && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Filter by Specific Stage:
                    </label>
                    <select
                      value={modalStageScope}
                      onChange={(e) => setModalStageScope(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="new">New Inquiries</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Target Employee Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider">
                  Step 2: Select Destination Employee
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-neutral-950/60 rounded-2xl border border-neutral-800">
                  {users.map((u) => {
                    const isSelected = modalTargetUserId === u.id;
                    const employeeLeadsCount = leads.filter(l => !l.deleted && l.assignedTo === u.id).length;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => setModalTargetUserId(u.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500/60 text-white'
                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${u.avatarColor || 'bg-neutral-700'} flex items-center justify-center font-bold text-white text-xs shrink-0`}>
                            {u.name.slice(0, 1)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">{u.name}</div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {u.employeeId || u.username} • {u.role === 'admin' ? 'Admin' : 'Sales Rep'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-mono text-neutral-400">{employeeLeadsCount} deals</div>
                          {isSelected && (
                            <span className="inline-flex items-center text-amber-400 text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowBulkReassignModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteModalAssign}
                  disabled={!modalTargetUserId || isReassigning}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer text-xs"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    {isReassigning
                      ? 'Reassigning...'
                      : `⚡ Transfer Pipeline to ${users.find(u => u.id === modalTargetUserId)?.name || 'Employee'} in 1-Click`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Single Lead Delete Confirmation Modal */}
      {leadToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Delete Lead Record</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete this lead? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Lead Contact:</span>
                <span className="font-bold text-white">{leadToDelete.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Company:</span>
                <span className="text-neutral-200">{leadToDelete.company}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Location & Region:</span>
                <span className="text-neutral-200">
                  {leadToDelete.city || leadToDelete.location || 'Pune'}, {leadToDelete.region || 'Maharashtra'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Deal Value:</span>
                <span className="text-emerald-400 font-mono font-bold">{formatCurrency(leadToDelete.value || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Stage / Rep:</span>
                <span className="text-neutral-300 capitalize">{leadToDelete.stage} • {leadToDelete.assignedName}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setLeadToDelete(null)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteLead(leadToDelete.id);
                  setSelectedLeadIds(prev => prev.filter(id => id !== leadToDelete.id));
                  setLeadToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Lead</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Bulk Lead Delete Confirmation Modal */}
      {showBulkDeleteModal && selectedLeadIds.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">
                  Bulk Delete {selectedLeadIds.length} {selectedLeadIds.length === 1 ? 'Lead' : 'Leads'}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  You are about to permanently delete <strong className="text-rose-300">{selectedLeadIds.length} leads</strong> from the CRM table. All associated notes, activity records, and remarks will be removed.
                </p>
              </div>
            </div>

            {/* Preview of selected leads */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 px-1">
                <span>Selected Leads ({selectedLeadIds.length})</span>
                <span className="font-mono text-emerald-400">
                  Total: {formatCurrency(sortedLeads.filter(l => selectedLeadIds.includes(l.id)).reduce((s, l) => s + (l.value || 0), 0))}
                </span>
              </div>
              <div className="max-h-52 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-3 space-y-2 divide-y divide-neutral-900">
                {sortedLeads
                  .filter((l) => selectedLeadIds.includes(l.id))
                  .slice(0, 10)
                  .map((l) => (
                    <div key={l.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-white truncate">{l.name}</div>
                        <div className="text-[11px] text-neutral-400 truncate">
                          {l.company} • {l.city || l.location || 'Pune'}, {l.region || 'Maharashtra'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-emerald-400 font-semibold">{formatCurrency(l.value || 0)}</div>
                        <div className="text-[10px] text-neutral-400">{l.assignedName}</div>
                      </div>
                    </div>
                  ))}
                {selectedLeadIds.length > 10 && (
                  <div className="pt-2 text-center text-neutral-400 text-xs italic">
                    + {selectedLeadIds.length - 10} more leads selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onBulkDeleteLeads) {
                    onBulkDeleteLeads(selectedLeadIds);
                  } else {
                    selectedLeadIds.forEach(id => onDeleteLead(id));
                  }
                  setSelectedLeadIds([]);
                  setShowBulkDeleteModal(false);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Bulk Delete ({selectedLeadIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
