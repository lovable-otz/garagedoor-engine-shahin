/**
 * Zero-dependency .xlsx reader.
 *
 * An .xlsx file is a ZIP of XML parts. We implement just enough to read the
 * shared-strings table and each worksheet's cells. This keeps the engine
 * install-free and fully offline - important for reproducible batch runs.
 *
 * Only the subset of the spec we need is supported: inline strings, shared
 * strings, numbers, and booleans. Formulas are read as their cached value.
 */

import fs from 'node:fs';
import zlib from 'node:zlib';

// ---- Minimal ZIP central-directory reader -------------------------------

function readZipEntries(buf) {
  // Locate End Of Central Directory (EOCD) record, scanning from the end.
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0 && i >= buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid .xlsx (no EOCD found)');
  const cdCount = buf.readUInt16LE(eocd + 10);
  let cdOffset = buf.readUInt32LE(eocd + 16);

  const entries = {};
  const CD_SIG = 0x02014b50;
  for (let n = 0; n < cdCount; n++) {
    if (buf.readUInt32LE(cdOffset) !== CD_SIG) break;
    const compMethod = buf.readUInt16LE(cdOffset + 10);
    const compSize = buf.readUInt32LE(cdOffset + 20);
    const nameLen = buf.readUInt16LE(cdOffset + 28);
    const extraLen = buf.readUInt16LE(cdOffset + 30);
    const commentLen = buf.readUInt16LE(cdOffset + 32);
    const localOffset = buf.readUInt32LE(cdOffset + 42);
    const name = buf.toString('utf8', cdOffset + 46, cdOffset + 46 + nameLen);

    // Read the local file header to find the actual data start.
    const lhNameLen = buf.readUInt16LE(localOffset + 26);
    const lhExtraLen = buf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    let content;
    if (compMethod === 0) content = raw; // stored
    else if (compMethod === 8) content = zlib.inflateRawSync(raw); // deflate
    else throw new Error(`Unsupported zip compression ${compMethod} for ${name}`);
    entries[name] = content;
    cdOffset += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

// ---- XML helpers ---------------------------------------------------------

function xmlDecode(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&');
}

function parseSharedStrings(xml) {
  const out = [];
  if (!xml) return out;
  const siRe = /<si[^>]*>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = siRe.exec(xml))) {
    const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let t, acc = '';
    while ((t = tRe.exec(m[1]))) acc += t[1];
    out.push(xmlDecode(acc));
  }
  return out;
}

function colLetters(ref) {
  const m = /^([A-Z]+)/.exec(ref);
  return m ? m[1] : '';
}

/**
 * Parse one worksheet into an array of row objects keyed by column letter.
 * @returns {Array<Record<string,string>>}
 */
function parseSheet(xml, shared) {
  const rows = [];
  if (!xml) return rows;
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>|<row[^>]*\/>/g;
  let r;
  while ((r = rowRe.exec(xml))) {
    const inner = r[1] || '';
    const cells = {};
    const cRe = /<c\s+r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let c;
    while ((c = cRe.exec(inner))) {
      const ref = c[1];
      const meta = c[2] || '';
      const body = c[3] || '';
      const tMatch = /t="([^"]+)"/.exec(meta);
      const type = tMatch ? tMatch[1] : 'n';
      let val = '';
      if (type === 'inlineStr') {
        const tRe = /<t[^>]*>([\s\S]*?)<\/t>/g;
        let t; while ((t = tRe.exec(body))) val += xmlDecode(t[1]);
      } else {
        const vMatch = /<v>([\s\S]*?)<\/v>/.exec(body);
        const raw = vMatch ? vMatch[1] : '';
        if (type === 's') val = shared[parseInt(raw, 10)] ?? '';
        else if (type === 'str') val = xmlDecode(raw);
        else if (type === 'b') val = raw === '1' ? 'TRUE' : 'FALSE';
        else val = xmlDecode(raw);
      }
      cells[colLetters(ref)] = val;
    }
    rows.push(cells);
  }
  return rows;
}

/**
 * Read a workbook. Returns { sheets: { <name>: rows[] }, order: [names] }.
 * Each rows[] element is a { A: 'val', B: 'val', ... } object.
 * @param {string} filePath
 */
export function readWorkbook(filePath) {
  const buf = fs.readFileSync(filePath);
  const entries = readZipEntries(buf);

  const workbookXml = entries['xl/workbook.xml']?.toString('utf8') || '';
  const relsXml = entries['xl/_rels/workbook.xml.rels']?.toString('utf8') || '';
  const shared = parseSharedStrings(entries['xl/sharedStrings.xml']?.toString('utf8'));

  // Map sheet name -> r:id
  const nameToRid = {};
  const sheetRe = /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"[^>]*\/?>/g;
  let s;
  while ((s = sheetRe.exec(workbookXml))) nameToRid[xmlDecode(s[1])] = s[2];

  // Map r:id -> target path
  const ridToTarget = {};
  const relRe = /<Relationship[^>]*Id="([^"]+)"[^>]*Target="([^"]+)"[^>]*\/?>/g;
  let rel;
  while ((rel = relRe.exec(relsXml))) ridToTarget[rel[1]] = rel[2];

  const sheets = {};
  const order = [];
  for (const [name, rid] of Object.entries(nameToRid)) {
    let target = ridToTarget[rid] || '';
    target = target.replace(/^\/?xl\//, '').replace(/^\//, '');
    const key = target.startsWith('worksheets/') ? `xl/${target}` : `xl/${target}`;
    const xml = entries[key]?.toString('utf8') || entries[`xl/${target}`]?.toString('utf8');
    sheets[name] = parseSheet(xml, shared);
    order.push(name);
  }
  return { sheets, order };
}

export default readWorkbook;
