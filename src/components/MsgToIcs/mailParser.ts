import type { ParsedFields } from './types';

/**
 * Normalizes email text before parsing.
 * Handles cases where OLE sector runs break keyword lines across chunks.
 */
export function normalizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Re-join broken keyword lines: if a line ends with keyword (no colon+value), join with next
    .replace(
      /(Mietername|Adresse|Obj\.bez\.?|Datum Mietvertragsabschluss|Zeit Mietvertragsabschluss)\s*\n\s*/gi,
      '$1 ',
    )
    .trim();
}

/**
 * Parses the normalized email body and extracts appointment fields.
 */
export function parseMailText(rawText: string): ParsedFields {
  const text = normalizeText(rawText);
  const r: ParsedFields = { objbez: null, name: null, date: null, time: null, address: null };

  // OBJ.BEZ
  const objMatch = text.match(/Obj\.?bez\.?\s*:\s*(.+?)(?=\s*(?:Mietername|Adresse|Datum|Zeit)|$)/i);
  if (objMatch) r.objbez = objMatch[1].trim();

  // MIETERNAME — stops at next keyword
  const nameMatch = text.match(/Mietername\s*:\s*(.+?)(?=\s*(?:Adresse|Datum|Zeit|Obj\.)|$)/i);
  if (nameMatch) r.name = nameMatch[1].trim();

  // ADRESSE — stops at next keyword
  const addrMatch = text.match(/Adresse\s*:\s*(.+?)(?=\s*(?:Datum|Zeit|Mietername|Obj\.)|$)/i);
  if (addrMatch) r.address = addrMatch[1].trim();

  // DATUM — DD.MM.YYYY
  const dateMatch = text.match(/Datum[^:\n]*:\s*(\d{1,2}\.\d{1,2}\.\d{4})/i);
  if (dateMatch) r.date = dateMatch[1].trim();

  // ZEIT — HH:MM (optional "Uhr")
  const timeMatch = text.match(/Zeit[^:\n]*:\s*(\d{1,2}:\d{2})(?:\s*Uhr)?/i);
  if (timeMatch) r.time = timeMatch[1].trim();

  return r;
}

/**
 * Strips email headers from plain text files (.eml) to get just the body.
 */
export function cleanEmailText(text: string): string {
  const bodyStart = text.indexOf('\n\n');
  if (bodyStart > 0 && text.substring(0, bodyStart).includes(':'))
    return text.substring(bodyStart + 2).trim();
  return text.trim();
}

/**
 * Checks whether the mail subject contains "STORNO" (fuzzy, handles obfuscation).
 */
export function isStornoSubject(subject: string): boolean {
  return /s[\s._-]*t[\s._-]*o[\s._-]*r[\s._-]*n[\s._-]*o/i.test(subject);
}

/**
 * Formats raw obj.bez. value like "0821302 - 003 012" → "984/0821302/003 012"
 */
export function formatObjbez(objbez: string): string {
  const fmtMatch = objbez.match(/^(\S+)\s*-\s*(.+)$/);
  return fmtMatch ? `984/${fmtMatch[1]}/${fmtMatch[2].trim()}` : objbez;
}
