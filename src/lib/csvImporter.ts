import type { Category } from '../types/vault';

export interface ParsedCsvItem {
  website: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  category: Category;
}

/**
 * Parses CSV lines respecting quoted fields containing commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

export function parsePasswordCsv(csvContent: string): ParsedCsvItem[] {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase());

  // Locate column indices
  const nameIdx = headers.findIndex(h => ['name', 'title', 'website', 'service'].includes(h));
  const userIdx = headers.findIndex(h => ['username', 'login_username', 'email', 'login'].includes(h));
  const passIdx = headers.findIndex(h => ['password', 'login_password', 'secret', 'pass'].includes(h));
  const urlIdx = headers.findIndex(h => ['url', 'login_uri', 'website_url', 'uri'].includes(h));
  const notesIdx = headers.findIndex(h => ['notes', 'note', 'comment'].includes(h));

  if (passIdx === -1) {
    throw new Error('CSV must contain a "password" column.');
  }

  const items: ParsedCsvItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const password = cols[passIdx] || '';
    if (!password.trim()) continue;

    const rawWebsite = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : 'Imported Account';
    const rawUser = userIdx !== -1 && cols[userIdx] ? cols[userIdx] : '';
    const rawUrl = urlIdx !== -1 && cols[urlIdx] ? cols[urlIdx] : undefined;
    const rawNotes = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx] : undefined;

    items.push({
      website: rawWebsite,
      username: rawUser,
      password: password,
      url: rawUrl,
      notes: rawNotes,
      category: 'Other',
    });
  }

  return items;
}
