/**
 * Zero-dependency .xlsx writer.
 *
 * Supports exactly what the generation-control sheet needs: text + number
 * cells, and cells with a solid background FILL (used to paint the actual
 * primary/secondary/accent/background colors into their columns, as the spec
 * asks). Produces a valid workbook readable by Excel / LibreOffice / Sheets.
 *
 * Implementation notes:
 *  - We build a small style table where each distinct fill color becomes one
 *    <fill> + one <xf>; colored cells reference that xf via the `s` attribute.
 *  - Files are packaged with our own minimal ZIP writer (DEFLATE via zlib,
 *    CRC-32 computed here) so there are no runtime dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// ---- CRC-32 --------------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---- minimal ZIP (deflate) ----------------------------------------------
function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBuf = Buffer.from(name, 'utf8');
    const content = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const comp = zlib.deflateRawSync(content);
    const crc = crc32(content);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);      // version needed
    local.writeUInt16LE(0, 6);       // flags
    local.writeUInt16LE(8, 8);       // method: deflate
    local.writeUInt16LE(0, 10);      // time
    local.writeUInt16LE(0x21, 12);   // date (arbitrary fixed)
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18);
    local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    chunks.push(local, nameBuf, comp);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(8, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt16LE(0x21, 14);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(comp.length, 20);
    cd.writeUInt32LE(content.length, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30); cd.writeUInt16LE(0, 32); cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36); cd.writeUInt16LE(0, 38);
    cd.writeUInt32LE(0, 40);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, nameBuf);

    offset += local.length + nameBuf.length + comp.length;
  }
  const centralBuf = Buffer.concat(central);
  const cdStart = offset;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(cdStart, 16);
  return Buffer.concat([...chunks, centralBuf, eocd]);
}

// ---- XML helpers ---------------------------------------------------------
const xesc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colName(n) {
  let s = '';
  n++;
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

const isNum = (v) => typeof v === 'number' || (typeof v === 'string' && v !== '' && /^-?\d+(\.\d+)?$/.test(v));

/**
 * Write a single-sheet workbook.
 * @param {object} args
 * @param {string} args.file           output path
 * @param {string} [args.sheetName]
 * @param {string[]} args.headers
 * @param {Array<Array<{v:any,fill?:string}|string|number>>} args.rows
 *        Each cell is a scalar OR { v, fill:'#RRGGBB' } to paint a background.
 */
export function writeXlsx({ file, sheetName = 'Sheet1', headers, rows }) {
  // Collect distinct fills.
  const fillIndex = new Map(); // hex -> style xf index
  const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>'];
  const cellXfs = ['<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>']; // 0 = default
  const headerXf = cellXfs.push('<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>') - 1;

  function fillXf(hex) {
    const key = hex.toUpperCase();
    if (fillIndex.has(key)) return fillIndex.get(key);
    const argb = 'FF' + key.replace('#', '');
    const fillId = fills.push(`<fill><patternFill patternType="solid"><fgColor rgb="${argb}"/><bgColor rgb="${argb}"/></patternFill></fill>`) - 1;
    const xfId = cellXfs.push(`<xf numFmtId="0" fontId="0" fillId="${fillId}" borderId="0" xfId="0" applyFill="1"/>`) - 1;
    fillIndex.set(key, xfId);
    return xfId;
  }

  // Shared strings.
  const shared = new Map();
  const sharedList = [];
  function sIdx(str) {
    if (shared.has(str)) return shared.get(str);
    const i = sharedList.push(str) - 1;
    shared.set(str, i);
    return i;
  }

  const allRows = [headers, ...rows];
  const rowXml = allRows.map((row, r) => {
    const cells = row.map((cell, c) => {
      const ref = `${colName(c)}${r + 1}`;
      let v = cell, fill = null;
      if (cell && typeof cell === 'object') { v = cell.v; fill = cell.fill; }
      const isHeader = r === 0;
      let sAttr = '';
      if (isHeader) sAttr = ` s="${headerXf}"`;
      else if (fill) sAttr = ` s="${fillXf(fill)}"`;
      if (v === '' || v == null) return `<c r="${ref}"${sAttr}/>`;
      if (!isHeader && isNum(v)) return `<c r="${ref}"${sAttr}><v>${v}</v></c>`;
      return `<c r="${ref}"${sAttr} t="s"><v>${sIdx(String(v))}</v></c>`;
    }).join('');
    return `<row r="${r + 1}">${cells}</row>`;
  }).join('');

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;

  const sharedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedList.length}" uniqueCount="${sharedList.length}">${sharedList.map((s) => `<si><t xml:space="preserve">${xesc(s)}</t></si>`).join('')}</sst>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="${fills.length}">${fills.join('')}</fills>
<borders count="1"><border/></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${cellXfs.length}">${cellXfs.join('')}</cellXfs>
</styleSheet>`;

  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xesc(sheetName).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
</Relationships>` },
    { name: 'xl/worksheets/sheet1.xml', data: sheetXml },
    { name: 'xl/styles.xml', data: stylesXml },
    { name: 'xl/sharedStrings.xml', data: sharedXml },
  ];

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, zip(files));
  return file;
}

export default writeXlsx;
