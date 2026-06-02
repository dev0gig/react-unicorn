import type { ParsedFields, AppointmentType } from './types';

const DURATION_MIN = 25;

function icsEscape(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Convert a wall-clock time in Europe/Vienna to the corresponding UTC instant.
// This makes the ICS DST-aware and avoids the +1h shift Outlook applies when a
// TZID is referenced without an embedded VTIMEZONE definition.
function viennaLocalToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  // Treat the wall-clock components as if they were UTC to get a probe instant.
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Vienna',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(probe).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {} as Record<string, string>);
  const asTz = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  const offset = asTz - probe.getTime(); // how far Vienna is ahead of UTC
  return new Date(probe.getTime() - offset);
}

function utcToIcsString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  );
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
  zaehlerpunkt: string;
  selectedType: AppointmentType;
  isStorno: boolean;
  mailBody: string;
}

/**
 * Builds and triggers download of an ICS calendar file.
 * Returns an error string if generation fails, or null on success.
 */
export function generateAndDownloadIcs(params: GenerateIcsParams): string | null {
  const { parsed, kundennummer, zaehlerpunkt, selectedType, isStorno, mailBody } = params;

  if (!parsed.name || !parsed.date || !parsed.time) {
    const missing: string[] = [];
    if (!parsed.name) missing.push('Mietername');
    if (!parsed.date) missing.push('Datum Mietvertragsabschluss');
    if (!parsed.time) missing.push('Zeit Mietvertragsabschluss');
    return `Folgende Felder konnten nicht erkannt werden:\n${missing.map((m) => '  • ' + m).join('\n')}\n\nBitte prüfe den eingefügten Text.`;
  }

  // Date/Time calculation — interpret the parsed values as Europe/Vienna wall-clock
  // time and convert to UTC so calendars (Outlook etc.) display the correct hour.
  const [day, month, year] = parsed.date.split('.').map((n) => parseInt(n, 10));
  const [hour, minute] = parsed.time.split(':').map((n) => parseInt(n, 10));

  const startUtc = viennaLocalToUtc(year, month, day, hour, minute);
  const endUtc = new Date(startUtc.getTime() + DURATION_MIN * 60 * 1000);
  const startDT = utcToIcsString(startUtc);
  const endDT = utcToIcsString(endUtc);

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
    : [
        `${kundennummer} - ${selectedType}`,
        ...(zaehlerpunkt ? [`Zählerpunkt: ${zaehlerpunkt}`] : []),
        separator,
      ];

  if (headerLines.length > 0) {
    descParts.push(...headerLines);
    descParts.push('');
  }
  descParts.push(mailContent);

  const descriptionRaw = descParts.join('\n');
  const description = icsEscape(descriptionRaw);
  const location = parsed.address ? icsEscape(parsed.address) : '';

  // Build HTML description with Kundennummer (and EC/FWW) in 33pt red
  const bigRed = 'font-size:33pt;color:red;font-weight:bold;';
  const htmlDescParts: string[] = isStorno
    ? [`<span style="${bigRed}">STORNO</span>`, `<br>${separator}`]
    : [
        `<span style="${bigRed}">${kundennummer}</span> - <span style="${bigRed}">${selectedType}</span>`,
        ...(zaehlerpunkt ? [`<br>Zählerpunkt: ${zaehlerpunkt}`] : []),
        `<br>${separator}`,
      ];

  if (headerLines.length > 0) {
    htmlDescParts.push(...headerLines.map((l) => `<br>${l}`));
    htmlDescParts.push('<br>');
  }
  htmlDescParts.push(`<br>${mailContent.replace(/\n/g, '<br>')}`);

  const htmlBody = htmlDescParts.join('');
  const altDesc = icsEscape(
    `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 3.2//EN"><HTML><BODY>${htmlBody}</BODY></HTML>`,
  );

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MSG to ICS Converter//DE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startDT}`,
    `DTEND:${endDT}`,
    `SUMMARY:${icsEscape(parsed.name)}`,
    `DESCRIPTION:${description}`,
    `X-ALT-DESC;FMTTYPE=text/html:${altDesc}`,
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
