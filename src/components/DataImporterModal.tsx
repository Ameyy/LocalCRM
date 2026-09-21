import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText, 
  File, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  X, 
  Download, 
  Layers, 
  Sparkles,
  HelpCircle,
  Table as TableIcon
} from 'lucide-react';
import { 
  parseDocumentFile, 
  ParsedDocumentResult, 
  FIXED_TEMPLATE_FIELDS, 
  mapRowsToFixedTemplate,
  downloadExcelTemplate,
  downloadCsvTemplate
} from '../lib/documentParser';
import { Lead, User } from '../types';

interface DataImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (leads: Lead[], mode: 'append' | 'replace', fileName: string) => void;
  users: User[];
  currentUser: User;
}

export const DataImporterModal: React.FC<DataImporterModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  users,
  currentUser,
}) => {
  const [step, setStep] = useState<'upload' | 'mapping'>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedDoc, setParsedDoc] = useState<ParsedDocumentResult | null>(null);

  // Mapping state: fixedFieldKey -> selectedHeader
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  // Import mode
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [defaultRepId, setDefaultRepId] = useState<string>(currentUser.id);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelected = async (file: File) => {
    setParseError(null);
    setIsParsing(true);
    try {
      const result = await parseDocumentFile(file);
      setParsedDoc(result);
      setColumnMapping(result.suggestedMapping);
      setStep('mapping');
    } catch (err: any) {
      console.error('File parsing error', err);
      setParseError(err.message || 'Failed to parse file. Please verify format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelected(file);
  };

  const handleMappingChange = (fieldKey: string, headerValue: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [fieldKey]: headerValue,
    }));
  };

  const handleConfirmImport = () => {
    if (!parsedDoc) return;
    const defaultUser = users.find((u) => u.id === defaultRepId) || currentUser;
    const generatedLeads = mapRowsToFixedTemplate(parsedDoc.rawRows, columnMapping, defaultUser);
    onImportComplete(generatedLeads, importMode, parsedDoc.fileName);
    onClose();
  };

  // Preview generated rows
  const previewLeads = parsedDoc
    ? mapRowsToFixedTemplate(
        parsedDoc.rawRows.slice(0, 4),
        columnMapping,
        users.find((u) => u.id === defaultRepId) || currentUser
      )
    : [];

  return (
    <div
      id="data-importer-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs"
    >
      <div
        id="data-importer-container"
        className="w-full max-w-3xl max-h-[92vh] bg-neutral-900 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Import Data into Fixed CRM Tables</h2>
              <p className="text-xs text-neutral-400">
                Universal parser for CSV, Excel (.xlsx/.xls), PDF, or Text documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: UPLOAD DROPZONE */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-700 hover:border-emerald-500/70 bg-neutral-950/50 hover:bg-neutral-950/90 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 group-hover:border-emerald-500/40 flex items-center justify-center text-neutral-300 group-hover:text-emerald-400 mb-4 transition">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <h3 className="text-sm font-bold text-white mb-1">
                  Drag and drop any document here, or <span className="text-emerald-400 underline">browse files</span>
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto mb-4">
                  Accepts <span className="text-neutral-200 font-semibold">CSV</span>,{' '}
                  <span className="text-neutral-200 font-semibold">Excel (.xlsx, .xls)</span>,{' '}
                  <span className="text-neutral-200 font-semibold">PDF documents</span>, or tabular text
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-300">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    Excel (.xlsx, .xls)
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-300">
                    <FileText className="w-3.5 h-3.5 text-sky-400" />
                    CSV &amp; Delimited
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-300">
                    <File className="w-3.5 h-3.5 text-rose-400" />
                    PDF Documents
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.tsv,.txt,.pdf,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelected(f);
                  }}
                  className="hidden"
                />
              </div>

              {/* Parsing Indicator */}
              {isParsing && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center gap-3 text-xs text-neutral-300">
                  <span className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  <span>Analyzing document structure and mapping columns...</span>
                </div>
              )}

              {/* Error Banner */}
              {parseError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Download Standard Templates Section */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
                    <TableIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Need a Pre-Formatted Template?</h4>
                    <p className="text-[11px] text-neutral-400">
                      Download our fixed CRM template headers to easily prepare and organize contact records
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadExcelTemplate}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-emerald-400" />
                    <span>Download Excel Template</span>
                  </button>
                  <button
                    onClick={downloadCsvTemplate}
                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <Download className="w-3 h-3 text-sky-400" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & PREVIEW */}
          {step === 'mapping' && parsedDoc && (
            <div className="space-y-6">
              {/* Document Summary Bar */}
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-semibold text-white">{parsedDoc.fileName}</span>
                    <span className="text-neutral-400 ml-2">
                      ({parsedDoc.rawRows.length} rows parsed • {parsedDoc.headers.length} headers detected)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setStep('upload');
                    setParsedDoc(null);
                  }}
                  className="text-xs text-neutral-400 hover:text-white underline"
                >
                  Choose another file
                </button>
              </div>

              {/* Column Mapping Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fixed Template Column Mapping</span>
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Auto-matched based on detected document headers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-neutral-950/70 border border-neutral-800 rounded-2xl">
                  {FIXED_TEMPLATE_FIELDS.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                          <span>{field.label}</span>
                          {field.required && <span className="text-rose-400">*</span>}
                        </label>
                        {columnMapping[field.key] && (
                          <span className="text-[10px] text-emerald-400 font-medium">Matched</span>
                        )}
                      </div>

                      <select
                        value={columnMapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                      >
                        <option value="">-- None / Skip --</option>
                        {parsedDoc.headers.map((hdr) => (
                          <option key={hdr} value={hdr}>
                            {hdr}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-neutral-950/60 border border-neutral-800 rounded-2xl text-xs">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Import Destination</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-medium transition ${
                        importMode === 'append'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Append to Table
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`flex-1 py-1.5 px-3 rounded-xl border text-xs font-medium transition ${
                        importMode === 'replace'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Replace Existing Table
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-300 mb-1.5">Default Sales Person</label>
                  <select
                    value={defaultRepId}
                    onChange={(e) => setDefaultRepId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role === 'admin' ? 'Admin' : 'Sales'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Data Preview Table */}
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>Fixed Table Preview (Top Records)</span>
                </h3>

                <div className="border border-neutral-800 rounded-xl overflow-hidden overflow-x-auto bg-neutral-950">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-semibold text-neutral-400">
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Company</th>
                        <th className="py-2 px-3">Location &amp; Region</th>
                        <th className="py-2 px-3">Email</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3">Value</th>
                        <th className="py-2 px-3">Stage</th>
                        <th className="py-2 px-3">Rep</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850">
                      {previewLeads.map((item, idx) => (
                        <tr key={idx} className="text-neutral-300">
                          <td className="py-2 px-3 font-semibold text-white">{item.name}</td>
                          <td className="py-2 px-3 text-neutral-400">{item.company}</td>
                          <td className="py-2 px-3 text-neutral-300 font-medium">
                            <span className="text-white">{item.city || item.location || 'Pune'}</span>
                            <span className="text-neutral-500 text-[11px]">, {item.region || 'Maharashtra'}</span>
                          </td>
                          <td className="py-2 px-3 text-neutral-400 font-mono text-[11px]">{item.email || '—'}</td>
                          <td className="py-2 px-3 text-neutral-400">{item.phone || '—'}</td>
                          <td className="py-2 px-3 text-emerald-400 font-semibold">${item.value.toLocaleString()}</td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-neutral-300">{item.stage}</td>
                          <td className="py-2 px-3 text-neutral-400">{item.assignedName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            Cancel
          </button>

          {step === 'mapping' && (
            <button
              id="confirm-import-btn"
              onClick={handleConfirmImport}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-2"
            >
              <span>Import {parsedDoc?.rawRows.length} Records to Fixed Table</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
