import * as XLSX from 'xlsx';
import { Lead, PipelineStage, Priority, User } from '../types';

export interface ParsedDocumentResult {
  fileName: string;
  fileType: 'excel' | 'csv' | 'pdf' | 'json' | 'text';
  headers: string[];
  rawRows: Record<string, any>[];
  suggestedMapping: Record<string, string>; // fixedKey -> detectedHeader
}

export const FIXED_TEMPLATE_FIELDS = [
  { key: 'name', label: 'Contact / Lead Name', required: true, synonyms: ['name', 'full name', 'fullname', 'contact', 'client', 'customer', 'person', 'lead name', 'lead'] },
  { key: 'company', label: 'Company / Organization', required: false, synonyms: ['company', 'organization', 'org', 'account', 'business', 'employer', 'corp', 'firm', 'agency'] },
  { key: 'email', label: 'Email Address', required: false, synonyms: ['email', 'mail', 'e-mail', 'email address', 'contact email'] },
  { key: 'phone', label: 'Phone Number', required: false, synonyms: ['phone', 'mobile', 'tel', 'telephone', 'cell', 'contact number', 'phone number'] },
  { key: 'value', label: 'Deal Value / Amount ($)', required: false, synonyms: ['value', 'amount', 'deal', 'deal value', 'revenue', 'price', 'budget', 'cost', 'total', 'worth', 'quote'] },
  { key: 'stage', label: 'Status / Stage', required: false, synonyms: ['stage', 'status', 'pipeline stage', 'deal stage', 'phase', 'state', 'progress'] },
  { key: 'priority', label: 'Priority', required: false, synonyms: ['priority', 'urgency', 'importance', 'level', 'rating'] },
  { key: 'assignedName', label: 'Assigned Sales Rep', required: false, synonyms: ['assigned', 'assigned to', 'assigned rep', 'sales rep', 'owner', 'agent', 'salesperson', 'rep'] },
  { key: 'notes', label: 'Notes / Details', required: false, synonyms: ['notes', 'note', 'details', 'description', 'comments', 'remarks', 'memo', 'summary'] },
];

/**
 * Intelligent Column Detection: finds the best matching column for each fixed template field
 */
export function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => ({
    original: h,
    normalized: h.toLowerCase().trim().replace(/[_\W]+/g, ' '),
  }));

  for (const field of FIXED_TEMPLATE_FIELDS) {
    // 1. Exact match
    const exact = lowerHeaders.find((h) => h.normalized === field.key.toLowerCase());
    if (exact) {
      mapping[field.key] = exact.original;
      continue;
    }

    // 2. Synonyms match
    const synMatch = lowerHeaders.find((h) =>
      field.synonyms.some((syn) => h.normalized === syn || h.normalized.includes(syn))
    );
    if (synMatch) {
      mapping[field.key] = synMatch.original;
    }
  }

  return mapping;
}

/**
 * Parse any document format: CSV, Excel (.xlsx, .xls), PDF, or Text/JSON
 */
export async function parseDocumentFile(file: File): Promise<ParsedDocumentResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv' || ext === 'tsv') {
    return parseSpreadsheetFile(file);
  } else if (ext === 'pdf') {
    return parsePdfDocument(file);
  } else if (ext === 'json') {
    return parseJsonDocument(file);
  } else {
    // Attempt text/csv parsing
    return parseSpreadsheetFile(file);
  }
}

/**
 * Parses Excel (.xlsx, .xls) and CSV spreadsheets
 */
async function parseSpreadsheetFile(file: File): Promise<ParsedDocumentResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error('No readable sheet found in the document.');
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('The spreadsheet contains no data rows.');
  }

  const headers = Object.keys(rawRows[0]);
  const suggestedMapping = detectColumnMapping(headers);

  return {
    fileName: file.name,
    fileType: file.name.endsWith('.csv') ? 'csv' : 'excel',
    headers,
    rawRows,
    suggestedMapping,
  };
}

/**
 * Parses PDF documents by extracting text streams, detecting tabular layouts or key-value structures
 */
async function parsePdfDocument(file: File): Promise<ParsedDocumentResult> {
  let extractedText = '';

  try {
    const pdfjsLib = await import('pdfjs-dist');
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(pageStrings);
    }
    extractedText = pageTexts.join('\n');
  } catch (err) {
    console.warn('PDF.js worker/extractor notice, attempting text stream reader fallback', err);
    // Fallback text reader from PDF buffer
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawBuffer = await file.arrayBuffer();
    extractedText = textDecoder.decode(rawBuffer);
  }

  return parseTextToRows(extractedText, file.name);
}

/**
 * Parses plain text or JSON documents
 */
async function parseJsonDocument(file: File): Promise<ParsedDocumentResult> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const rows = Array.isArray(parsed) ? parsed : parsed.data || [parsed];
  const headers = Object.keys(rows[0] || {});

  return {
    fileName: file.name,
    fileType: 'json',
    headers,
    rawRows: rows,
    suggestedMapping: detectColumnMapping(headers),
  };
}

/**
 * Converts extracted raw text (from PDF or text reports) into structured rows
 */
function parseTextToRows(text: string, fileName: string): ParsedDocumentResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('%PDF'));

  const potentialDelimiters = [',', '\t', '|', ';'];
  let bestDelimiter = ',';
  let maxCols = 0;

  // Detect delimiter if tabular
  for (const line of lines.slice(0, 10)) {
    for (const d of potentialDelimiters) {
      const count = line.split(d).length;
      if (count > maxCols && count >= 2) {
        maxCols = count;
        bestDelimiter = d;
      }
    }
  }

  const rawRows: Record<string, any>[] = [];
  let headers: string[] = [];

  if (maxCols >= 2) {
    // Delimited tabular text found in PDF
    const firstLineCols = lines[0].split(bestDelimiter).map((c, i) => c.trim() || `Column_${i + 1}`);
    headers = firstLineCols;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(bestDelimiter);
      if (parts.length > 1) {
        const row: Record<string, any> = {};
        headers.forEach((h, colIdx) => {
          row[h] = parts[colIdx]?.trim() || '';
        });
        rawRows.push(row);
      }
    }
  }

  // If table wasn't cleanly delimited, try line-by-line entity extraction (e.g. Lead, Email, Phone, Company)
  if (rawRows.length === 0) {
    headers = ['Contact Name', 'Company', 'Email', 'Phone', 'Value', 'Notes'];
    
    // Group chunks of lines or find emails/phones
    let currentRow: Record<string, any> = {
      'Contact Name': '',
      'Company': '',
      'Email': '',
      'Phone': '',
      'Value': '',
      'Notes': '',
    };

    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const phoneRegex = /(\+?[\d\s().-]{8,20})/;
    const dollarRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;

    for (const line of lines) {
      if (emailRegex.test(line)) {
        currentRow['Email'] = line.match(emailRegex)?.[1] || '';
      } else if (phoneRegex.test(line) && !currentRow['Phone']) {
        currentRow['Phone'] = line.match(phoneRegex)?.[1] || '';
      } else if (line.includes('$') && !currentRow['Value']) {
        currentRow['Value'] = line.match(dollarRegex)?.[1]?.replace(/,/g, '') || '';
      } else if (!currentRow['Contact Name'] && line.split(' ').length <= 4) {
        currentRow['Contact Name'] = line;
      } else if (!currentRow['Company'] && line.length > 2) {
        currentRow['Company'] = line;
      } else {
        currentRow['Notes'] = (currentRow['Notes'] ? currentRow['Notes'] + ' ' : '') + line;
      }

      // If we got at least an email or name + company, push row
      if (currentRow['Email'] || (currentRow['Contact Name'] && currentRow['Company'])) {
        rawRows.push({ ...currentRow });
        currentRow = {
          'Contact Name': '',
          'Company': '',
          'Email': '',
          'Phone': '',
          'Value': '',
          'Notes': '',
        };
      }
    }

    // Push trailing
    if (currentRow['Contact Name'] || currentRow['Email']) {
      rawRows.push(currentRow);
    }
  }

  if (rawRows.length === 0) {
    // Fallback: at least create a row with the text content
    headers = ['Contact Name', 'Content / Text'];
    rawRows.push({
      'Contact Name': 'Extracted PDF Record',
      'Content / Text': lines.slice(0, 10).join(' '),
    });
  }

  return {
    fileName,
    fileType: 'pdf',
    headers,
    rawRows,
    suggestedMapping: detectColumnMapping(headers),
  };
}

/**
 * Maps raw imported rows into our standardized CRM Lead / Contact records
 */
export function mapRowsToFixedTemplate(
  rawRows: Record<string, any>[],
  columnMapping: Record<string, string>,
  defaultAssignedUser?: User | null
): Lead[] {
  const now = new Date().toISOString();

  return rawRows.map((row, index) => {
    const nameVal = columnMapping['name'] ? String(row[columnMapping['name']] || '').trim() : '';
    const companyVal = columnMapping['company'] ? String(row[columnMapping['company']] || '').trim() : '';
    const emailVal = columnMapping['email'] ? String(row[columnMapping['email']] || '').trim() : '';
    const phoneVal = columnMapping['phone'] ? String(row[columnMapping['phone']] || '').trim() : '';
    
    // Value sanitization
    let numValue = 0;
    if (columnMapping['value']) {
      const rawVal = String(row[columnMapping['value']] || '').replace(/[^0-9.-]+/g, '');
      numValue = parseFloat(rawVal) || 0;
    }

    // Stage sanitization
    let stage: PipelineStage = 'new';
    if (columnMapping['stage']) {
      const rawStage = String(row[columnMapping['stage']] || '').toLowerCase();
      if (rawStage.includes('won') || rawStage.includes('closed won') || rawStage.includes('contract')) {
        stage = 'won';
      } else if (rawStage.includes('lost')) {
        stage = 'lost';
      } else if (rawStage.includes('prop')) {
        stage = 'proposal';
      } else if (rawStage.includes('qual')) {
        stage = 'qualified';
      } else if (rawStage.includes('contact')) {
        stage = 'contacted';
      }
    }

    // Priority sanitization
    let priority: Priority = 'medium';
    if (columnMapping['priority']) {
      const rawPri = String(row[columnMapping['priority']] || '').toLowerCase();
      if (rawPri.includes('hi') || rawPri.includes('urgent') || rawPri.includes('hot')) {
        priority = 'high';
      } else if (rawPri.includes('lo')) {
        priority = 'low';
      }
    }

    // Assigned rep
    const assignedName = columnMapping['assignedName']
      ? String(row[columnMapping['assignedName']] || '').trim()
      : defaultAssignedUser?.name || 'Sarah Jenkins';

    const assignedTo = defaultAssignedUser?.id || 'user_sales';

    const notesVal = columnMapping['notes'] ? String(row[columnMapping['notes']] || '').trim() : '';

    return {
      id: 'lead_imp_' + Date.now() + '_' + index + '_' + Math.random().toString(36).substring(2, 6),
      name: nameVal || `Imported Contact ${index + 1}`,
      company: companyVal || 'N/A',
      email: emailVal,
      phone: phoneVal,
      value: numValue,
      stage,
      priority,
      assignedTo,
      assignedName: assignedName || 'Sarah Jenkins',
      notes: notesVal || 'Imported via document template',
      tags: ['Document Import'],
      activities: [
        {
          id: 'act_imp_' + Date.now() + '_' + index,
          leadId: 'lead_imp_' + Date.now() + '_' + index,
          type: 'note',
          description: `Imported into fixed CRM table from document.`,
          performedBy: defaultAssignedUser?.id || 'system',
          performedByName: defaultAssignedUser?.name || 'System',
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
  });
}

/**
 * Downloads a pre-formatted Excel template matching the fixed table schema
 */
export function downloadExcelTemplate() {
  const sampleData = [
    {
      'Contact Name': 'Alexander Wright',
      'Company': 'Apex Global Logistics',
      'Email': 'a.wright@apexlog.example',
      'Phone': '+1 (555) 432-8765',
      'Deal Value': 35000,
      'Status': 'Proposal',
      'Priority': 'High',
      'Assigned Rep': 'Sarah Jenkins',
      'Notes': 'Needs fleet dispatch licensing. Follow-up next Thursday.',
    },
    {
      'Contact Name': 'Sophia Martinez',
      'Company': 'Catalyst Energy Inc',
      'Email': 'smartinez@catalystenergy.example',
      'Phone': '+1 (555) 876-1234',
      'Deal Value': 52000,
      'Status': 'Qualified',
      'Priority': 'Medium',
      'Assigned Rep': 'Alex Mitchell',
      'Notes': 'Evaluated requirements for 80 field laptops.',
    },
    {
      'Contact Name': 'Liam O Connor',
      'Company': 'Vanguard Engineering',
      'Email': 'liam@vanguardeng.example',
      'Phone': '+1 (555) 234-9876',
      'Deal Value': 74000,
      'Status': 'Won',
      'Priority': 'High',
      'Assigned Rep': 'Sarah Jenkins',
      'Notes': 'Closed annual enterprise contract.',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'CRM Fixed Template');
  XLSX.writeFile(workbook, 'local_crm_fixed_template.xlsx');
}

/**
 * Downloads a pre-formatted CSV template
 */
export function downloadCsvTemplate() {
  const csvContent = [
    'Contact Name,Company,Email,Phone,Deal Value,Status,Priority,Assigned Rep,Notes',
    '"Marcus Vance","Apex Industrial Tech","marcus@apextech.example","+1 (555) 234-5678",48000,"Proposal","High","Sarah Jenkins","Fleet licensing review"',
    '"Elena Rostova","Nordic Wave Logistics","elena@nordicwavelog.example","+1 (555) 876-5432",29500,"Qualified","Medium","Sarah Jenkins","Warehouse dispatch deployment"',
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'local_crm_fixed_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
