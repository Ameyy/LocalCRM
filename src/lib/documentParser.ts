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
  { key: 'name', label: 'Contact / Lead Name', required: true, synonyms: ['name', 'full name', 'fullname', 'contact', 'client', 'customer', 'person', 'lead name', 'lead', 'client name', 'customer name', 'account name'] },
  { key: 'company', label: 'Company / Organization', required: false, synonyms: ['company', 'organization', 'org', 'account', 'business', 'employer', 'corp', 'firm', 'agency', 'enterprise', 'institution'] },
  { key: 'city', label: 'Location / City', required: false, synonyms: ['city', 'location', 'town', 'place', 'district', 'municipality', 'metro', 'address city', 'city name', 'current city', 'customer city', 'client city', 'branch city', 'office city', 'base city', 'territory', 'target city', 'lead city', 'destination', 'station', 'address', 'area', 'hq', 'branch', 'site', 'work location'] },
  { key: 'region', label: 'Region / State', required: false, synonyms: ['region', 'state', 'province', 'territory', 'zone', 'area', 'region state', 'state province', 'country state', 'state name', 'state / region', 'region / state'] },
  { key: 'email', label: 'Email Address', required: false, synonyms: ['email', 'mail', 'e-mail', 'email address', 'contact email', 'work email', 'official email'] },
  { key: 'phone', label: 'Phone Number', required: false, synonyms: ['phone', 'mobile', 'tel', 'telephone', 'cell', 'contact number', 'phone number', 'mobile number', 'call', 'whatsapp'] },
  { key: 'value', label: 'Deal Value / Amount ($)', required: false, synonyms: ['value', 'amount', 'deal', 'deal value', 'revenue', 'price', 'budget', 'cost', 'total', 'worth', 'quote', 'turnover', 'annual value', 'opportunity value'] },
  { key: 'stage', label: 'Status / Stage', required: false, synonyms: ['stage', 'status', 'pipeline stage', 'deal stage', 'phase', 'state', 'progress', 'lead status', 'pipeline'] },
  { key: 'priority', label: 'Priority', required: false, synonyms: ['priority', 'urgency', 'importance', 'level', 'rating', 'grade', 'tier'] },
  { key: 'assignedName', label: 'Assigned Sales Rep', required: false, synonyms: ['assigned', 'assigned to', 'assigned rep', 'sales rep', 'owner', 'agent', 'salesperson', 'rep', 'lead owner', 'executive'] },
  { key: 'notes', label: 'Notes / Details', required: false, synonyms: ['notes', 'note', 'details', 'description', 'comments', 'remarks', 'memo', 'summary', 'feedback', 'requirement'] },
];

/**
 * Dynamic City to Region / State Knowledge Base
 */
export const CITY_REGION_MAP: Record<string, string> = {
  // Maharashtra
  'pune': 'Maharashtra',
  'mumbai': 'Maharashtra',
  'bombay': 'Maharashtra',
  'navi mumbai': 'Maharashtra',
  'new mumbai': 'Maharashtra',
  'thane': 'Maharashtra',
  'nagpur': 'Maharashtra',
  'nashik': 'Maharashtra',
  'nasik': 'Maharashtra',
  'aurangabad': 'Maharashtra',
  'chhatrapati sambhajinagar': 'Maharashtra',
  'chhatrapati sambhaji nagar': 'Maharashtra',
  'sambhajinagar': 'Maharashtra',
  'kolhapur': 'Maharashtra',
  'solapur': 'Maharashtra',
  'sholapur': 'Maharashtra',
  'sangli': 'Maharashtra',
  'satara': 'Maharashtra',
  'jalgaon': 'Maharashtra',
  'akola': 'Maharashtra',
  'latur': 'Maharashtra',
  'dhule': 'Maharashtra',
  'ahmednagar': 'Maharashtra',
  'ahilyanagar': 'Maharashtra',
  'chandrapur': 'Maharashtra',
  'parbhani': 'Maharashtra',
  'jalna': 'Maharashtra',
  'ratnagiri': 'Maharashtra',
  'sindhudurg': 'Maharashtra',
  'wardha': 'Maharashtra',
  'gondia': 'Maharashtra',
  'bhandara': 'Maharashtra',
  'yavatmal': 'Maharashtra',
  'washim': 'Maharashtra',
  'buldhana': 'Maharashtra',
  'nandurbar': 'Maharashtra',
  'osmanabad': 'Maharashtra',
  'dharashiv': 'Maharashtra',
  'beed': 'Maharashtra',
  'palghar': 'Maharashtra',
  'raigad': 'Maharashtra',
  'kalyan': 'Maharashtra',
  'dombivli': 'Maharashtra',
  'dombivali': 'Maharashtra',
  'ulhasnagar': 'Maharashtra',
  'mira bhayandar': 'Maharashtra',
  'vasai': 'Maharashtra',
  'virar': 'Maharashtra',
  'panvel': 'Maharashtra',
  'pimpri': 'Maharashtra',
  'chinchwad': 'Maharashtra',
  'pimpri chinchwad': 'Maharashtra',
  'baramati': 'Maharashtra',
  'malegaon': 'Maharashtra',
  'ichalkaranji': 'Maharashtra',
  'alibag': 'Maharashtra',
  'karad': 'Maharashtra',
  'chiplun': 'Maharashtra',
  'bhiwandi': 'Maharashtra',

  // Karnataka
  'bengaluru': 'Karnataka',
  'bangalore': 'Karnataka',
  'mysore': 'Karnataka',
  'mysuru': 'Karnataka',
  'mangalore': 'Karnataka',
  'mangaluru': 'Karnataka',
  'hubli': 'Karnataka',
  'hubballi': 'Karnataka',
  'dharwad': 'Karnataka',
  'belgaum': 'Karnataka',
  'belagavi': 'Karnataka',
  'gulbarga': 'Karnataka',
  'kalaburagi': 'Karnataka',
  'davanagere': 'Karnataka',
  'davangere': 'Karnataka',
  'bellary': 'Karnataka',
  'ballari': 'Karnataka',
  'bijapur': 'Karnataka',
  'vijayapura': 'Karnataka',
  'shimoga': 'Karnataka',
  'shivamogga': 'Karnataka',
  'tumkur': 'Karnataka',
  'tumakuru': 'Karnataka',
  'raichur': 'Karnataka',
  'bidar': 'Karnataka',
  'hospet': 'Karnataka',
  'hosapete': 'Karnataka',
  'gadag': 'Karnataka',
  'udupi': 'Karnataka',
  'kolar': 'Karnataka',
  'mandya': 'Karnataka',
  'hassan': 'Karnataka',
  'chikmagalur': 'Karnataka',
  'chikkamagaluru': 'Karnataka',
  'bagalkot': 'Karnataka',
  'karwar': 'Karnataka',
  'ramanagara': 'Karnataka',
  'yadgir': 'Karnataka',
  'chitradurga': 'Karnataka',
  'bhadravati': 'Karnataka',

  // Telangana
  'hyderabad': 'Telangana',
  'secunderabad': 'Telangana',
  'warangal': 'Telangana',
  'nizamabad': 'Telangana',
  'khammam': 'Telangana',
  'karimnagar': 'Telangana',
  'ramagundam': 'Telangana',
  'mahbubnagar': 'Telangana',
  'nalgonda': 'Telangana',
  'adilabad': 'Telangana',
  'suryapet': 'Telangana',
  'miryalaguda': 'Telangana',
  'siddipet': 'Telangana',
  'jagtial': 'Telangana',
  'mancherial': 'Telangana',

  // Andhra Pradesh
  'visakhapatnam': 'Andhra Pradesh',
  'vizag': 'Andhra Pradesh',
  'vijayawada': 'Andhra Pradesh',
  'guntur': 'Andhra Pradesh',
  'nellore': 'Andhra Pradesh',
  'kurnool': 'Andhra Pradesh',
  'kakinada': 'Andhra Pradesh',
  'rajahmundry': 'Andhra Pradesh',
  'rajamahendravaram': 'Andhra Pradesh',
  'tirupati': 'Andhra Pradesh',
  'kadapa': 'Andhra Pradesh',
  'cuddapah': 'Andhra Pradesh',
  'anantapur': 'Andhra Pradesh',
  'vizianagaram': 'Andhra Pradesh',
  'eluru': 'Andhra Pradesh',
  'ongole': 'Andhra Pradesh',
  'nandyal': 'Andhra Pradesh',
  'machilipatnam': 'Andhra Pradesh',
  'adoni': 'Andhra Pradesh',
  'tenali': 'Andhra Pradesh',
  'chittoor': 'Andhra Pradesh',
  'amaravati': 'Andhra Pradesh',

  // Tamil Nadu
  'chennai': 'Tamil Nadu',
  'madras': 'Tamil Nadu',
  'coimbatore': 'Tamil Nadu',
  'madurai': 'Tamil Nadu',
  'tiruchirappalli': 'Tamil Nadu',
  'trichy': 'Tamil Nadu',
  'salem': 'Tamil Nadu',
  'tirunelveli': 'Tamil Nadu',
  'tiruppur': 'Tamil Nadu',
  'ranipet': 'Tamil Nadu',
  'nagercoil': 'Tamil Nadu',
  'thanjavur': 'Tamil Nadu',
  'dindigul': 'Tamil Nadu',
  'vellore': 'Tamil Nadu',
  'kancheepuram': 'Tamil Nadu',
  'kanchipuram': 'Tamil Nadu',
  'erode': 'Tamil Nadu',
  'tiruvannamalai': 'Tamil Nadu',
  'hosur': 'Tamil Nadu',
  'ooty': 'Tamil Nadu',
  'kumbakonam': 'Tamil Nadu',
  'cuddalore': 'Tamil Nadu',
  'tuticorin': 'Tamil Nadu',
  'thoothukudi': 'Tamil Nadu',

  // Gujarat
  'ahmedabad': 'Gujarat',
  'surat': 'Gujarat',
  'vadodara': 'Gujarat',
  'baroda': 'Gujarat',
  'rajkot': 'Gujarat',
  'bhavnagar': 'Gujarat',
  'jamnagar': 'Gujarat',
  'junagadh': 'Gujarat',
  'gandhinagar': 'Gujarat',
  'gandhidham': 'Gujarat',
  'anand': 'Gujarat',
  'navsari': 'Gujarat',
  'morbi': 'Gujarat',
  'nadiad': 'Gujarat',
  'surendranagar': 'Gujarat',
  'bharuch': 'Gujarat',
  'mehsana': 'Gujarat',
  'bhuj': 'Gujarat',
  'porbandar': 'Gujarat',
  'palanpur': 'Gujarat',
  'valsad': 'Gujarat',
  'vapi': 'Gujarat',
  'gondal': 'Gujarat',
  'veraval': 'Gujarat',
  'godhra': 'Gujarat',
  'patan': 'Gujarat',
  'kalol': 'Gujarat',
  'dahod': 'Gujarat',
  'ankleshwar': 'Gujarat',

  // Delhi / NCR
  'delhi': 'Delhi NCR',
  'new delhi': 'Delhi NCR',
  'central delhi': 'Delhi NCR',
  'east delhi': 'Delhi NCR',
  'north delhi': 'Delhi NCR',
  'south delhi': 'Delhi NCR',
  'west delhi': 'Delhi NCR',
  'noida': 'Uttar Pradesh',
  'greater noida': 'Uttar Pradesh',
  'gurgaon': 'Haryana',
  'gurugram': 'Haryana',
  'faridabad': 'Haryana',
  'ghaziabad': 'Uttar Pradesh',

  // Uttar Pradesh
  'lucknow': 'Uttar Pradesh',
  'kanpur': 'Uttar Pradesh',
  'agra': 'Uttar Pradesh',
  'meerut': 'Uttar Pradesh',
  'varanasi': 'Uttar Pradesh',
  'kashi': 'Uttar Pradesh',
  'banaras': 'Uttar Pradesh',
  'prayagraj': 'Uttar Pradesh',
  'allahabad': 'Uttar Pradesh',
  'bareilly': 'Uttar Pradesh',
  'aligarh': 'Uttar Pradesh',
  'moradabad': 'Uttar Pradesh',
  'saharanpur': 'Uttar Pradesh',
  'gorakhpur': 'Uttar Pradesh',
  'firozabad': 'Uttar Pradesh',
  'jhansi': 'Uttar Pradesh',
  'muzaffarnagar': 'Uttar Pradesh',
  'mathura': 'Uttar Pradesh',
  'rampur': 'Uttar Pradesh',
  'shahjahanpur': 'Uttar Pradesh',
  'ayodhya': 'Uttar Pradesh',
  'faizabad': 'Uttar Pradesh',
  'etawah': 'Uttar Pradesh',
  'mirzapur': 'Uttar Pradesh',
  'bulandshahr': 'Uttar Pradesh',
  'hapur': 'Uttar Pradesh',

  // Rajasthan
  'jaipur': 'Rajasthan',
  'jodhpur': 'Rajasthan',
  'kota': 'Rajasthan',
  'bikaner': 'Rajasthan',
  'ajmer': 'Rajasthan',
  'udaipur': 'Rajasthan',
  'bhilwara': 'Rajasthan',
  'alwar': 'Rajasthan',
  'bharatpur': 'Rajasthan',
  'sikar': 'Rajasthan',
  'pali': 'Rajasthan',
  'sri ganganagar': 'Rajasthan',
  'ganganagar': 'Rajasthan',
  'kishangarh': 'Rajasthan',
  'chittorgarh': 'Rajasthan',
  'jaisalmer': 'Rajasthan',
  'mount abu': 'Rajasthan',

  // West Bengal
  'kolkata': 'West Bengal',
  'calcutta': 'West Bengal',
  'howrah': 'West Bengal',
  'durgapur': 'West Bengal',
  'asansol': 'West Bengal',
  'siliguri': 'West Bengal',
  'bardhaman': 'West Bengal',
  'burdwan': 'West Bengal',
  'malda': 'West Bengal',
  'kharagpur': 'West Bengal',
  'haldia': 'West Bengal',
  'darjeeling': 'West Bengal',
  'kalimpong': 'West Bengal',

  // Madhya Pradesh
  'indore': 'Madhya Pradesh',
  'bhopal': 'Madhya Pradesh',
  'jabalpur': 'Madhya Pradesh',
  'gwalior': 'Madhya Pradesh',
  'ujjain': 'Madhya Pradesh',
  'sagar': 'Madhya Pradesh',
  'dewas': 'Madhya Pradesh',
  'satna': 'Madhya Pradesh',
  'ratlam': 'Madhya Pradesh',
  'rewa': 'Madhya Pradesh',
  'katni': 'Madhya Pradesh',
  'singrauli': 'Madhya Pradesh',
  'khandwa': 'Madhya Pradesh',
  'burhanpur': 'Madhya Pradesh',
  'chhindwara': 'Madhya Pradesh',
  'pithampur': 'Madhya Pradesh',

  // Kerala
  'kochi': 'Kerala',
  'cochin': 'Kerala',
  'ernakulam': 'Kerala',
  'thiruvananthapuram': 'Kerala',
  'trivandrum': 'Kerala',
  'kozhikode': 'Kerala',
  'calicut': 'Kerala',
  'thrissur': 'Kerala',
  'trichur': 'Kerala',
  'kollam': 'Kerala',
  'quilon': 'Kerala',
  'kannur': 'Kerala',
  'alappuzha': 'Kerala',
  'alleppey': 'Kerala',
  'kottayam': 'Kerala',
  'palakkad': 'Kerala',
  'malappuram': 'Kerala',
  'munnar': 'Kerala',
  'wayanad': 'Kerala',

  // Punjab
  'ludhiana': 'Punjab',
  'amritsar': 'Punjab',
  'jalandhar': 'Punjab',
  'patiala': 'Punjab',
  'bathinda': 'Punjab',
  'mohali': 'Punjab',
  'sas nagar': 'Punjab',
  'hoshiarpur': 'Punjab',
  'pathankot': 'Punjab',
  'phagwara': 'Punjab',

  // Haryana
  'panipat': 'Haryana',
  'ambala': 'Haryana',
  'rohtak': 'Haryana',
  'hisar': 'Haryana',
  'karnal': 'Haryana',
  'sonipat': 'Haryana',
  'panchkula': 'Haryana',
  'bhiwani': 'Haryana',
  'sirsa': 'Haryana',
  'rewari': 'Haryana',

  // Chandigarh
  'chandigarh': 'Chandigarh',

  // Bihar
  'patna': 'Bihar',
  'gaya': 'Bihar',
  'bhagalpur': 'Bihar',
  'muzaffarpur': 'Bihar',
  'purnia': 'Bihar',
  'darbhanga': 'Bihar',
  'bihar sharif': 'Bihar',
  'arrah': 'Bihar',
  'begusarai': 'Bihar',
  'katihar': 'Bihar',
  'chhapra': 'Bihar',
  'hajipur': 'Bihar',

  // Odisha
  'bhubaneswar': 'Odisha',
  'cuttack': 'Odisha',
  'rourkela': 'Odisha',
  'berhampur': 'Odisha',
  'sambalpur': 'Odisha',
  'puri': 'Odisha',
  'balasore': 'Odisha',

  // Jharkhand
  'ranchi': 'Jharkhand',
  'jamshedpur': 'Jharkhand',
  'tatanagar': 'Jharkhand',
  'dhanbad': 'Jharkhand',
  'bokaro': 'Jharkhand',
  'deoghar': 'Jharkhand',
  'hazaribagh': 'Jharkhand',

  // Assam & North East
  'guwahati': 'Assam',
  'gauhati': 'Assam',
  'silchar': 'Assam',
  'dibrugarh': 'Assam',
  'jorhat': 'Assam',
  'tezpur': 'Assam',
  'shillong': 'Meghalaya',
  'agartala': 'Tripura',
  'imphal': 'Manipur',
  'aizawl': 'Mizoram',
  'kohima': 'Nagaland',
  'dimapur': 'Nagaland',
  'gangtok': 'Sikkim',
  'itanagar': 'Arunachal Pradesh',

  // Uttarakhand
  'dehradun': 'Uttarakhand',
  'haridwar': 'Uttarakhand',
  'roorkee': 'Uttarakhand',
  'haldwani': 'Uttarakhand',
  'rudrapur': 'Uttarakhand',
  'rishikesh': 'Uttarakhand',
  'nainital': 'Uttarakhand',
  'mussoorie': 'Uttarakhand',

  // Himachal Pradesh
  'shimla': 'Himachal Pradesh',
  'dharamshala': 'Himachal Pradesh',
  'solan': 'Himachal Pradesh',
  'mandi': 'Himachal Pradesh',
  'kullu': 'Himachal Pradesh',
  'manali': 'Himachal Pradesh',
  'baddi': 'Himachal Pradesh',

  // Goa
  'panaji': 'Goa',
  'panjim': 'Goa',
  'margao': 'Goa',
  'madgaon': 'Goa',
  'vasco da gama': 'Goa',
  'vasco': 'Goa',
  'mapusa': 'Goa',
  'ponda': 'Goa',

  // Chhattisgarh
  'raipur': 'Chhattisgarh',
  'bhilai': 'Chhattisgarh',
  'bilaspur': 'Chhattisgarh',
  'korba': 'Chhattisgarh',
  'durg': 'Chhattisgarh',

  // Jammu & Kashmir & Ladakh
  'srinagar': 'Jammu & Kashmir',
  'jammu': 'Jammu & Kashmir',
  'leh': 'Ladakh',

  // Puducherry
  'puducherry': 'Puducherry',
  'pondicherry': 'Puducherry',

  // International / Global
  'dubai': 'UAE',
  'abu dhabi': 'UAE',
  'sharjah': 'UAE',
  'doha': 'Qatar',
  'riyadh': 'Saudi Arabia',
  'jeddah': 'Saudi Arabia',
  'muscat': 'Oman',
  'kuwait': 'Kuwait',
  'kuwait city': 'Kuwait',
  'manama': 'Bahrain',
  'london': 'United Kingdom',
  'manchester': 'United Kingdom',
  'birmingham': 'United Kingdom',
  'edinburgh': 'United Kingdom',
  'dublin': 'Ireland',
  'new york': 'New York, USA',
  'nyc': 'New York, USA',
  'san francisco': 'California, USA',
  'los angeles': 'California, USA',
  'chicago': 'Illinois, USA',
  'austin': 'Texas, USA',
  'houston': 'Texas, USA',
  'dallas': 'Texas, USA',
  'seattle': 'Washington, USA',
  'boston': 'Massachusetts, USA',
  'atlanta': 'Georgia, USA',
  'miami': 'Florida, USA',
  'singapore': 'Singapore',
  'tokyo': 'Japan',
  'sydney': 'Australia',
  'melbourne': 'Australia',
  'toronto': 'Canada',
  'vancouver': 'Canada',
  'paris': 'France',
  'berlin': 'Germany',
  'frankfurt': 'Germany',
  'amsterdam': 'Netherlands',
  'zurich': 'Switzerland',
};

/**
 * Dynamically resolves both City and Region wisely based on imported file contents
 */
export function resolveRegionAndCity(
  cityInput?: string | null,
  explicitRegion?: string | null
): { city: string; region: string } {
  let cleanCity = String(cityInput || '').trim();
  let cleanRegion = String(explicitRegion || '').trim();

  // If city string has comma (e.g. "Austin, Texas" or "Mumbai, Maharashtra" or "Bengaluru, Karnataka")
  if (cleanCity.includes(',') && !cleanRegion) {
    const parts = cleanCity.split(',').map((p) => p.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      cleanCity = parts[0];
      cleanRegion = parts[1];
    }
  } else if (cleanCity.includes('-') && !cleanRegion && cleanCity.split('-').length === 2) {
    const parts = cleanCity.split('-').map((p) => p.trim());
    if (parts[0] && parts[1] && parts[0].length > 2 && parts[1].length > 2) {
      cleanCity = parts[0];
      cleanRegion = parts[1];
    }
  }

  // If explicitRegion was provided and is meaningful, respect and use it
  if (
    cleanRegion &&
    cleanRegion.toLowerCase() !== 'n/a' &&
    cleanRegion.toLowerCase() !== 'none' &&
    cleanRegion.toLowerCase() !== 'undefined' &&
    cleanRegion.toLowerCase() !== 'null'
  ) {
    return {
      city: cleanCity || 'General City',
      region: cleanRegion,
    };
  }

  // If no city provided at all
  if (!cleanCity) {
    return {
      city: 'General',
      region: cleanRegion || 'General Territory',
    };
  }

  // Normalize key for lookup
  const normalizedKey = cleanCity
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Direct map check
  if (CITY_REGION_MAP[normalizedKey]) {
    return {
      city: cleanCity,
      region: CITY_REGION_MAP[normalizedKey],
    };
  }

  // Substring / fuzzy check for known major cities
  for (const [knownCity, region] of Object.entries(CITY_REGION_MAP)) {
    if (normalizedKey.includes(knownCity) && knownCity.length >= 4) {
      return {
        city: cleanCity,
        region,
      };
    }
  }

  // If city is specified but not in our dictionary, do NOT force Maharashtra
  return {
    city: cleanCity,
    region: cleanRegion || `${cleanCity} Area`,
  };
}

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
    
    // 1. Dynamic City extraction: check mapped column first, then inspect all row columns for city/location/town/district
    let rawCity = columnMapping['city'] ? String(row[columnMapping['city']] || '').trim() : '';
    if (!rawCity) {
      const cityKey = Object.keys(row).find((k) => {
        const lk = k.toLowerCase().replace(/[_\W]+/g, ' ').trim();
        return (
          lk === 'city' ||
          lk === 'location' ||
          lk === 'town' ||
          lk === 'district' ||
          lk === 'metro' ||
          lk === 'place' ||
          lk.includes('city') ||
          lk.includes('location') ||
          lk.includes('town')
        );
      });
      if (cityKey && row[cityKey]) {
        rawCity = String(row[cityKey]).trim();
      }
    }

    // 2. Dynamic Region extraction: check mapped column first, then inspect all row columns for state/region/zone
    let rawRegion = columnMapping['region'] ? String(row[columnMapping['region']] || '').trim() : '';
    if (!rawRegion) {
      const regionKey = Object.keys(row).find((k) => {
        const lk = k.toLowerCase().replace(/[_\W]+/g, ' ').trim();
        return (
          lk === 'region' ||
          lk === 'state' ||
          lk === 'province' ||
          lk === 'zone' ||
          lk.includes('region') ||
          lk.includes('state')
        );
      });
      if (regionKey && row[regionKey]) {
        rawRegion = String(row[regionKey]).trim();
      }
    }

    // 3. Wisely resolve Region and City dynamically based on input and knowledge dictionary
    const { city: standardCity, region: standardRegion } = resolveRegionAndCity(rawCity, rawRegion);
    
    // 4. Capture all original document columns dynamically into customFields
    const customFields: Record<string, any> = {};
    for (const [colName, val] of Object.entries(row)) {
      if (val !== undefined && val !== null) {
        const cleanVal = typeof val === 'string' ? val.trim() : val;
        if (cleanVal !== '') {
          customFields[colName] = cleanVal;
        }
      }
    }
    
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
      region: standardRegion,
      city: standardCity,
      location: standardCity,
      email: emailVal,
      phone: phoneVal,
      value: numValue,
      stage,
      priority,
      assignedTo,
      assignedName: assignedName || 'Sarah Jenkins',
      notes: notesVal || 'Imported via document template',
      tags: ['Document Import'],
      customFields,
      activities: [
        {
          id: 'act_imp_' + Date.now() + '_' + index,
          leadId: 'lead_imp_' + Date.now() + '_' + index,
          type: 'note',
          description: `Imported into fixed CRM table from document (${standardCity}, ${standardRegion}).`,
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
      'Region': 'Maharashtra',
      'Location / City': 'Pune',
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
      'Region': 'Maharashtra',
      'Location / City': 'Mumbai',
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
      'Region': 'Maharashtra',
      'Location / City': 'Pune',
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
  XLSX.writeFile(workbook, 'krew_mesh_crm_fixed_template.xlsx');
}

/**
 * Downloads a pre-formatted CSV template
 */
export function downloadCsvTemplate() {
  const csvContent = [
    'Contact Name,Company,Region,Location / City,Email,Phone,Deal Value,Status,Priority,Assigned Rep,Notes',
    '"Marcus Vance","Apex Industrial Tech","Maharashtra","Pune","marcus@apextech.example","+1 (555) 234-5678",48000,"Proposal","High","Sarah Jenkins","Fleet licensing review"',
    '"Elena Rostova","Nordic Wave Logistics","Maharashtra","Mumbai","elena@nordicwavelog.example","+1 (555) 876-5432",29500,"Qualified","Medium","Sarah Jenkins","Warehouse dispatch deployment"',
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'krew_mesh_crm_fixed_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
