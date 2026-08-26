/**
 * Export Service — CSV, XLSX (SpreadsheetML), and PDF report generation.
 * Pure TypeScript implementations with no external runtime dependencies so the
 * platform builds and runs without additional npm packages.
 */

const AMP = String.fromCharCode(38); // &
const LT = String.fromCharCode(60); // <
const GT = String.fromCharCode(62); // >
const QUOT = String.fromCharCode(34); // "
const APOS = String.fromCharCode(39); // '

function escapeXml(value: string): string {
  let out = value;
  out = out.split(AMP).join(AMP + 'amp;');
  out = out.split(LT).join(AMP + 'lt;');
  out = out.split(GT).join(AMP + 'gt;');
  out = out.split(QUOT).join(AMP + 'quot;');
  out = out.split(APOS).join(AMP + 'apos;');
  return out;
}

export class ExportService {
  static toCSV(data: any[], fields?: string[]): string {
    const headerFields = fields || Object.keys(data[0] || {});
    const header = headerFields.join(',');
    const rows = data.map((item) =>
      headerFields
        .map((field) => {
          const value = item[field];
          if (value === null || value === undefined) return '';
          const str = String(value);
          if (str.indexOf(',') >= 0 || str.indexOf('"') >= 0 || str.indexOf('\n') >= 0) {
            return '"' + str.split('"').join('""') + '"';
          }
          return str;
        })
        .join(',')
    );
    return [header, ...rows].join('\n');
  }

  /**
   * Generate an Office-Open-XML-compatible .xlsx worksheet (single sheet) that
   * opens natively in Excel.
   */
  static toXLSX(data: any[], name = 'Report'): Buffer {
    const headerFields = Object.keys(data[0] || {});
    const cellXml = (items: any[], styleId?: string) =>
      items
        .map((value) => {
          const str = value === null || value === undefined ? '' : String(value);
          return (
            '<Cell' +
            (styleId ? ' ss:StyleID="' + styleId + '"' : '') +
            '><Data ss:Type="String">' +
            escapeXml(str) +
            '</Data></Cell>'
          );
        })
        .join('');

    const rowsXml = data
      .map((row) => '<Row>' + cellXml(headerFields.map((f) => row[f])) + '</Row>')
      .join('');

    const xlsx =
      '<?xml version="1.0"?>\n' +
      '<?mso-application progid="Excel.Sheet"?>\n' +
      '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
      ' xmlns:o="urn:schemas-microsoft-com:office:office"\n' +
      ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n' +
      ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
      ' <Styles>\n' +
      '  <Style ss:ID="Default" ss:Name="Normal">\n' +
      '   <Alignment ss:Vertical="Bottom"/>\n' +
      '   <Borders/>\n' +
      '   <Font ss:FontName="Calibri" ss:Size="11"/>\n' +
      '   <Interior/>\n' +
      '   <NumberFormat/>\n' +
      '   <Protection/>\n' +
      '  </Style>\n' +
      '  <Style ss:ID="Header">\n' +
      '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
      '   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>\n' +
      '   <Interior ss:Color="#3B82F6" ss:Pattern="Solid"/>\n' +
      '  </Style>\n' +
      ' </Styles>\n' +
      ' <Worksheet ss:Name="' + escapeXml(name).slice(0, 30) + '">\n' +
      '  <Table>\n' +
      '   <Row>' + cellXml(headerFields, 'Header') + '</Row>\n' +
      rowsXml + '\n' +
      '  </Table>\n' +
      ' </Worksheet>\n' +
      '</Workbook>';

    return Buffer.from(xlsx, 'utf8');
  }

  /**
   * Minimal dependency-free PDF generator. Produces a valid multi-page PDF with
   * the report title and a tab-aligned table of the supplied data.
   */
  static toPDF(title: string, data: any[], fields?: string[]): Buffer {
    const headerFields = fields || Object.keys(data[0] || {});
    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;
    const lineHeight = 15;
    const fontSize = 9;

    const colWidth = (pageWidth - margin * 2) / Math.max(1, headerFields.length);
    const truncate = (s: string) => {
      const maxLen = Math.max(4, Math.floor(colWidth / (fontSize * 0.55)) - 2);
      return s.length > maxLen ? s.slice(0, maxLen - 1) + '~' : s;
    };

    // Build text lines
    const lines: string[] = [];
    lines.push(title);
    lines.push('Generated: ' + new Date().toISOString());
    lines.push('');
    lines.push('  ' + headerFields.map((f) => truncate(f.toUpperCase())).join('   '));
    lines.push('  ' + headerFields.map(() => '---').join('   '));
    data.forEach((row, idx) => {
      if (idx > 0 && idx % 32 === 0) lines.push('\f'); // form feed = page break
      lines.push(
        '  ' +
          headerFields
            .map((f) => {
              const value = row[f];
              return truncate(value === undefined || value === null ? '' : String(value));
            })
            .join('   ')
      );
    });

    const escapePdf = (s: string) =>
      s
        .split('\\').join('\\\\')
        .split('(').join('\\(')
        .split(')').join('\\)')
        .split('\n').join(' ')
        .split('\r').join(' ');

    // Split lines into pages
    const pageLines: string[][] = [];
    let current: string[] = [];
    let y = pageHeight - margin;
    for (const line of lines) {
      if (line === '\f') {
        if (current.length) pageLines.push(current);
        current = [];
        y = pageHeight - margin;
        continue;
      }
      if (y < margin) {
        pageLines.push(current);
        current = [];
        y = pageHeight - margin;
      }
      current.push(line);
      y -= lineHeight;
    }
    if (current.length) pageLines.push(current);

    const pageCount = Math.max(1, pageLines.length);
    const contentStreams: string[] = pageLines.map((page) =>
      page
        .map((line, i) => {
          const isTitle = i === 0;
          const size = isTitle ? 16 : fontSize;
          const f = isTitle ? 'F2' : 'F1';
          const ty = pageHeight - margin - i * lineHeight;
          return 'BT /' + f + ' ' + size + ' Tf ' + margin + ' ' + ty + ' Td (' + escapePdf(line) + ') Tj ET';
        })
        .join('\n')
    );

    // Assemble PDF objects
    const offsets: number[] = [];
    let body = '';
    const HEADER = '%PDF-1.4\n';
    let currentOffset = Buffer.byteLength(HEADER, 'latin1');

    const addObject = (objBody: string): number => {
      const id = offsets.length + 1;
      offsets.push(currentOffset);
      const entry = id + ' 0 obj\n' + objBody + '\nendobj\n';
      body += entry;
      currentOffset += Buffer.byteLength(entry, 'latin1');
      return id;
    };

    const fontNormal = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const fontBold = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    const contentIds: number[] = contentStreams.map((stream) =>
      addObject('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream')
    );
    const pageIds: number[] = contentIds.map(
      (contentId) =>
        addObject(
          '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' +
            pageWidth +
            ' ' +
            pageHeight +
            '] /Resources << /Font << /F1 ' +
            fontNormal +
            ' 0 R /F2 ' +
            fontBold +
            ' 0 R >> >> /Contents ' +
            contentId +
            ' 0 R >>'
        )
    );
    addObject('<< /Type /Pages /Kids [' + pageIds.map((p) => p + ' 0 R').join(' ') + '] /Count ' + pageCount + ' >>');
    const catalog = addObject('<< /Type /Catalog /Pages 2 0 R >>');

    let xref = 'xref\n0 ' + (offsets.length + 1) + '\n';
    xref += '0000000000 65535 f \n';
    for (let i = 0; i < offsets.length; i++) {
      xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
    }
    xref += 'trailer\n<< /Size ' + (offsets.length + 1) + ' /Root ' + catalog + ' 0 R >>\nstartxref\n' + currentOffset + '\n%%EOF\n';

    return Buffer.concat([
      Buffer.from(HEADER, 'latin1'),
      Buffer.from(body, 'latin1'),
      Buffer.from(xref, 'latin1'),
    ]);
  }

  static generateReportTitle(prefix: string): string {
    const date = new Date().toISOString().split('T')[0];
    return prefix + '_' + date;
  }
}

export const exportService = new ExportService();

