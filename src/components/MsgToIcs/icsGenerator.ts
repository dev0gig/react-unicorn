import type { ParsedFields, AppointmentType } from './types';

const DURATION_MIN = 25;

function icsEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export interface GenerateIcsParams {
  parsed: ParsedFields;
  kundennummer: string;
  selectedType: AppointmentType;
  isStorno: boolean;
  mailBody: string;
}

/**
 * Builds and triggers download of an ICS calendar file.
 * Returns an error string if generation fails, or null on success.
 */
export function generateAndDownloadIcs(params: GenerateIcsParams): string | null {
  const { parsed, kundennummer, selectedType, isStorno, mailBody } = params;

  if (!parsed.name || !parsed.date || !parsed.time) {
    const missing: string[] = [];
    if (!parsed.name) missing.push('Mietername');
    if (!parsed.date) missing.push('Datum Mietvertragsabschluss');
    if (!parsed.time) missing.push('Zeit Mietvertragsabschluss');
    return `Folgende Felder konnten nicht erkannt werden:\n${missing.map((m) => '  • ' + m).join('\n')}\n\nBitte prüfe den eingefügten Text.`;
  }

  // Date/Time calculation
  const [day, month, year] = parsed.date.split('.').map((n) => n.padStart(2, '0'));
  const [hour, minute] = parsed.time.split(':').map((n) => n.padStart(2, '0'));
  const startDT = `${year}${month}${day}T${hour}${minute}00`;

  const startTotalMin = parseInt(hour) * 60 + parseInt(minute);
  const endTotalMin = startTotalMin + DURATION_MIN;
  const endHour = String(Math.floor(endTotalMin / 60) % 24).padStart(2, '0');
  const endMinute = String(endTotalMin % 60).padStart(2, '0');
  const endDT = `${year}${month}${day}T${endHour}${endMinute}00`;

  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `mietvertrag-${Date.now()}@msg-ics-converter`;

  // Try to extract mail headers (Von/Gesendet/An/Betreff) from text
  const headerLabels = ['Von', 'Gesendet', 'An', 'Betreff'];
  const headerPatterns = [
    /Von\s*:\s*([^\n\r]+)/i,
    /Gesendet\s*:\s*([^\n\r]+)/i,
    /An\s*:\s*([^\n\r]+)/i,
    /Betreff\s*:\s*([^\n\r]+)/i,
  ];
  const headerLines: string[] = [];
  headerPatterns.forEach((pat, i) => {
    const m = mailBody.match(pat);
    if (m) headerLines.push(`${headerLabels[i]}: ${m[1].trim()}`);
  });

  // Filter body to relevant lines
  const bodyKeywords = ['Obj', 'Mietername', 'Adresse', 'Datum', 'Zeit'];
  const bodyLines = mailBody
    .split(/\r?\n/)
    .filter((line) => bodyKeywords.some((k) => line.toLowerCase().includes(k.toLowerCase())));
  const mailContent = bodyLines.length > 0 ? bodyLines.join('\n') : mailBody;

  const separator = '------------';
  const descParts: string[] = isStorno
    ? ['STORNO', separator]
    : [`${kundennummer} - ${selectedType}`, separator];

  if (headerLines.length > 0) {
    descParts.push(...headerLines);
    descParts.push('');
  }
  descParts.push(mailContent);

  const descriptionRaw = descParts.join('\n');
  const description = icsEscape(descriptionRaw);
  const location = parsed.address ? icsEscape(parsed.address) : '';

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MSG to ICS Converter//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=Europe/Vienna:${startDT}`,
    `DTEND;TZID=Europe/Vienna:${endDT}`,
    `SUMMARY:${icsEscape(parsed.name)}`,
    `DESCRIPTION:${description}`,
    location ? `LOCATION:${location}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Erinnerung: Mietvertragsabschluss',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const safeName = parsed.name.replace(/[^a-zA-Z0-9äöüÄÖÜ\-_ ]/g, '_');
  downloadIcs(`Mietvertrag_${safeName}_${parsed.date.replace(/\./g, '-')}.ics`, icsLines);
  return null;
}
