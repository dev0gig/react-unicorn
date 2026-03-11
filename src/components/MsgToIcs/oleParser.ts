import type { OleResult } from './types';

/**
 * Extracts body text (and optionally subject) from an Outlook .msg file (OLE2 compound document).
 * Falls back to heuristic UTF-16LE sector scanning, then ASCII scan.
 */
export function extractTextFromMsg(buffer: ArrayBuffer): OleResult {
  const bytes = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  const SECTOR = 512;
  const MINI_SECTOR = 64;
  const MINI_CUTOFF = 4096;

  try {
    if (dv.getUint32(0, true) !== 0xe011cfd0) throw new Error('Not OLE');

    // Build regular FAT from DIFAT
    const fat = new Map<number, number>();
    for (let di = 0; di < 109; di++) {
      const fatSecNum = dv.getUint32(0x4c + di * 4, true);
      if (fatSecNum >= 0xfffffffd) break;
      const fatOff = (fatSecNum + 1) * SECTOR;
      for (let ei = 0; ei < SECTOR / 4; ei++)
        fat.set(fatSecNum * (SECTOR / 4) + ei, dv.getInt32(fatOff + ei * 4, true));
    }

    function walkFAT(start: number): number[] {
      const chain: number[] = [];
      let cur = start;
      const seen = new Set<number>();
      while (cur >= 0 && !seen.has(cur)) {
        seen.add(cur);
        chain.push(cur);
        cur = fat.has(cur) ? fat.get(cur)! : -1;
      }
      return chain;
    }

    function readRegular(start: number, size: number): Uint8Array {
      const out: number[] = [];
      for (const sec of walkFAT(start)) {
        const off = (sec + 1) * SECTOR;
        for (let b = 0; b < SECTOR && out.length < size; b++) out.push(bytes[off + b] || 0);
      }
      return new Uint8Array(out.slice(0, size));
    }

    // Build mini FAT
    const miniFATStart = dv.getInt32(0x3c, true);
    const miniFAT = new Map<number, number>();
    if (miniFATStart >= 0) {
      let mIdx = 0;
      for (const sec of walkFAT(miniFATStart)) {
        const off = (sec + 1) * SECTOR;
        for (let ei = 0; ei < SECTOR / 4; ei++) miniFAT.set(mIdx++, dv.getInt32(off + ei * 4, true));
      }
    }

    // Read mini stream container from root entry
    const firstDirSec = dv.getInt32(0x30, true);
    const rootOff = (firstDirSec + 1) * SECTOR;
    const rootStart = dv.getInt32(rootOff + 116, true);
    const rootSize = dv.getUint32(rootOff + 120, true);
    const miniContainer = readRegular(rootStart, rootSize);

    function readMini(start: number, size: number): Uint8Array {
      const out: number[] = [];
      let cur = start;
      const seen = new Set<number>();
      while (cur >= 0 && !seen.has(cur) && out.length < size) {
        seen.add(cur);
        const off = cur * MINI_SECTOR;
        for (let b = 0; b < MINI_SECTOR && out.length < size; b++) out.push(miniContainer[off + b] || 0);
        cur = miniFAT.has(cur) ? miniFAT.get(cur)! : -1;
      }
      return new Uint8Array(out.slice(0, size));
    }

    // Find PR_SUBJECT (0037001F) and PR_BODY_W (1000001F)
    let subjectText = '';
    const streams: [string, boolean][] = [
      ['__substg1.0_0037001F', false],
      ['__substg1.0_1000001F', true],
    ];
    for (const [sName, isBody] of streams) {
      const sNameBytes = new Uint8Array(sName.length * 2);
      for (let i = 0; i < sName.length; i++) {
        sNameBytes[i * 2] = sName.charCodeAt(i);
        sNameBytes[i * 2 + 1] = 0;
      }
      for (let off2 = 0; off2 + 128 <= buffer.byteLength; off2 += 128) {
        if (bytes[off2 + 66] !== 2) continue;
        let match2 = true;
        for (let k = 0; k < sNameBytes.length; k++) {
          if (bytes[off2 + k] !== sNameBytes[k]) {
            match2 = false;
            break;
          }
        }
        if (!match2) continue;
        const startSec = dv.getInt32(off2 + 116, true);
        const size = dv.getUint32(off2 + 120, true);
        if (startSec < 0 || size === 0) continue;
        const raw = size < MINI_CUTOFF ? readMini(startSec, size) : readRegular(startSec, size);
        const text = new TextDecoder('utf-16le')
          .decode(raw)
          .replace(/\x00/g, '')
          .replace(/\r\n/g, '\n')
          .trim();
        if (!isBody) {
          subjectText = text;
          break;
        }
        if (text.length > 10) return { body: text, subject: subjectText };
      }
    }
  } catch (_e) {
    /* fall through to heuristic */
  }

  // Fallback: sector-level UTF-16LE run collection
  const sectorSize = 512;
  const allRuns: string[] = [];
  for (let si = 0; si * sectorSize < bytes.length; si++) {
    const start = si * sectorSize;
    let run = '';
    for (let i = start; i < start + sectorSize - 1 && i < bytes.length - 1; i += 2) {
      const lo = bytes[i];
      const hi = bytes[i + 1];
      if (hi === 0 && lo >= 0x20 && lo < 0x7f) {
        run += String.fromCharCode(lo);
      } else if (hi === 0 && lo === 0x0a) {
        run += '\n';
      } else {
        if (run.length > 3) allRuns.push(run);
        run = '';
      }
    }
    if (run.length > 3) allRuns.push(run);
  }
  const kws = ['Obj.bez', 'Mietername', 'Datum Mietvertragsabschluss', 'Zeit Mietvertragsabschluss', 'Adresse'];
  const relevant = allRuns.filter((r) => kws.some((k) => r.includes(k)));
  if (relevant.length > 0) return relevant.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // Last resort: ASCII scan
  let ascii = '';
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 0x20 && bytes[i] < 0x7f) ascii += String.fromCharCode(bytes[i]);
    else if (bytes[i] === 0x0a || bytes[i] === 0x0d) ascii += '\n';
  }
  return ascii.replace(/\n{3,}/g, '\n\n').trim();
}
