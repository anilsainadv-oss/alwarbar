import type { FullJudgmentRecord } from '@/lib/precedents/judgment-store';

/**
 * Pure TypeScript standard PDF-1.4 generator for Indian Legal Judgments.
 * Generates 100% valid, multi-page PDF documents without any external dependencies.
 */

interface TextLine {
  text: string;
  font: 'F1' | 'F2' | 'F3'; // F1 = Times-Roman, F2 = Times-Bold, F3 = Times-Italic
  size: number;
  color?: [number, number, number]; // RGB 0..1
  align?: 'left' | 'center' | 'right';
  indent?: number;
}

interface PageContent {
  lines: {
    x: number;
    y: number;
    font: string;
    size: number;
    text: string;
    r: number;
    g: number;
    b: number;
  }[];
  rects: {
    x: number;
    y: number;
    w: number;
    h: number;
    fill?: [number, number, number];
    stroke?: [number, number, number];
    lineWidth?: number;
  }[];
}

export function generateJudgmentPDF(judgment: FullJudgmentRecord): Buffer {
  const PAGE_WIDTH = 595.28; // A4
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 45;
  const MARGIN_RIGHT = 45;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 50;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 505.28

  const pages: PageContent[] = [];
  let currentPage: PageContent = { lines: [], rects: [] };
  pages.push(currentPage);

  let currentY = PAGE_HEIGHT - MARGIN_TOP;

  function ensureSpace(neededHeight: number) {
    if (currentY - neededHeight < MARGIN_BOTTOM) {
      // New Page
      currentPage = { lines: [], rects: [] };
      pages.push(currentPage);
      currentY = PAGE_HEIGHT - MARGIN_TOP;

      // Add running header on subsequent pages
      currentPage.lines.push({
        x: MARGIN_LEFT,
        y: currentY,
        font: 'F3',
        size: 8,
        text: sanitizePdfText(`LAW REPORT: ${judgment.citation} — ${judgment.case_title}`),
        r: 0.4,
        g: 0.4,
        b: 0.4
      });
      currentPage.lines.push({
        x: PAGE_WIDTH - MARGIN_RIGHT - 60,
        y: currentY,
        font: 'F3',
        size: 8,
        text: `Page ${pages.length}`,
        r: 0.4,
        g: 0.4,
        b: 0.4
      });
      currentPage.rects.push({
        x: MARGIN_LEFT,
        y: currentY - 4,
        w: CONTENT_WIDTH,
        h: 0.5,
        stroke: [0.8, 0.8, 0.8],
        lineWidth: 0.5
      });
      currentY -= 20;
    }
  }

  function addTextLine(line: TextLine, spacingAfter = 14) {
    ensureSpace(spacingAfter + line.size);

    const safeText = sanitizePdfText(line.text);
    const charWidth = (line.font === 'F2' ? 0.55 : 0.48) * line.size;
    const textWidth = safeText.length * charWidth;

    let x = MARGIN_LEFT + (line.indent || 0);
    if (line.align === 'center') {
      x = MARGIN_LEFT + (CONTENT_WIDTH - textWidth) / 2;
      if (x < MARGIN_LEFT) x = MARGIN_LEFT;
    } else if (line.align === 'right') {
      x = PAGE_WIDTH - MARGIN_RIGHT - textWidth;
    }

    const [r, g, b] = line.color || [0.08, 0.1, 0.15];

    currentPage.lines.push({
      x,
      y: currentY,
      font: line.font,
      size: line.size,
      text: safeText,
      r,
      g,
      b
    });

    currentY -= spacingAfter;
  }

  function addParagraph(text: string, font: 'F1' | 'F2' | 'F3' = 'F1', size = 10, color?: [number, number, number], indent = 0) {
    const wrapped = wordWrap(text, CONTENT_WIDTH - indent, font, size);
    for (let i = 0; i < wrapped.length; i++) {
      addTextLine({
        text: wrapped[i],
        font,
        size,
        color,
        indent: i === 0 ? indent : indent
      }, size + 4);
    }
    currentY -= 4; // Paragraph gap
  }

  // ==========================================
  // PAGE 1: HEADER & METADATA
  // ==========================================

  // Supreme Court / High Court Heading
  addTextLine({
    text: judgment.court.toUpperCase(),
    font: 'F2',
    size: 15,
    color: [0.08, 0.15, 0.28], // Deep navy
    align: 'center'
  }, 18);

  addTextLine({
    text: 'CERTIFIED AUTHORITATIVE JUDICIAL PRECEDENT & LAW REPORT',
    font: 'F2',
    size: 8.5,
    color: [0.7, 0.4, 0.05], // Amber-gold
    align: 'center'
  }, 16);

  // Divider line
  currentPage.rects.push({
    x: MARGIN_LEFT,
    y: currentY + 4,
    w: CONTENT_WIDTH,
    h: 1.5,
    stroke: [0.1, 0.15, 0.25],
    lineWidth: 1.5
  });
  currentY -= 12;

  // Citation Banner Box
  const bannerHeight = 44;
  currentPage.rects.push({
    x: MARGIN_LEFT,
    y: currentY - bannerHeight,
    w: CONTENT_WIDTH,
    h: bannerHeight,
    fill: [0.97, 0.98, 0.99],
    stroke: [0.82, 0.86, 0.9],
    lineWidth: 1
  });
  // Amber left border
  currentPage.rects.push({
    x: MARGIN_LEFT,
    y: currentY - bannerHeight,
    w: 4,
    h: bannerHeight,
    fill: [0.85, 0.47, 0.05]
  });

  const bannerTextY = currentY - 14;
  currentPage.lines.push({
    x: MARGIN_LEFT + 14,
    y: bannerTextY,
    font: 'F2',
    size: 10,
    text: sanitizePdfText(`CITATION: ${judgment.citation}`),
    r: 0.1,
    g: 0.15,
    b: 0.25
  });
  currentPage.lines.push({
    x: PAGE_WIDTH - MARGIN_RIGHT - 170,
    y: bannerTextY,
    font: 'F2',
    size: 9.5,
    text: sanitizePdfText(`DECISION DATE: ${judgment.decision_date}`),
    r: 0.1,
    g: 0.15,
    b: 0.25
  });

  currentPage.lines.push({
    x: MARGIN_LEFT + 14,
    y: bannerTextY - 16,
    font: 'F1',
    size: 8.5,
    text: sanitizePdfText(`SUBJECT: ${judgment.statute_subject.slice(0, 85)}...`),
    r: 0.35,
    g: 0.4,
    b: 0.45
  });

  currentY -= (bannerHeight + 16);

  // Case Title
  addTextLine({
    text: judgment.case_title,
    font: 'F2',
    size: 13,
    color: [0.05, 0.1, 0.2],
    align: 'center'
  }, 16);

  // Bench line
  addTextLine({
    text: `Before: ${judgment.bench}`,
    font: 'F3',
    size: 9.5,
    color: [0.3, 0.35, 0.4],
    align: 'center'
  }, 16);

  // ==========================================
  // HEADNOTES BOX
  // ==========================================
  if (judgment.headnotes && judgment.headnotes.length > 0) {
    ensureSpace(80);
    addTextLine({
      text: 'HEADNOTES & SUBSTANTIVE LEGAL PRINCIPLES:',
      font: 'F2',
      size: 9,
      color: [0.5, 0.25, 0.05]
    }, 12);

    for (const hn of judgment.headnotes) {
      addParagraph(`* ${hn}`, 'F1', 8.5, [0.15, 0.2, 0.25], 10);
    }
    currentY -= 6;
  }

  // ==========================================
  // HELD (RATIO DECIDENDI)
  // ==========================================
  ensureSpace(70);
  addTextLine({
    text: 'HELD (RATIO DECIDENDI & BINDING PRECEDENT):',
    font: 'F2',
    size: 9.5,
    color: [0.08, 0.45, 0.18] // Emerald dark
  }, 12);

  addParagraph(judgment.held_proposition, 'F1', 9.5, [0.08, 0.35, 0.15], 8);
  currentY -= 10;

  // Divider
  currentPage.rects.push({
    x: MARGIN_LEFT,
    y: currentY,
    w: CONTENT_WIDTH,
    h: 0.5,
    stroke: [0.85, 0.85, 0.85],
    lineWidth: 0.5
  });
  currentY -= 14;

  // ==========================================
  // FULL JUDGMENT TEXT
  // ==========================================
  addTextLine({
    text: 'AUTHENTIC JUDGMENT TEXT & ORDERS:',
    font: 'F2',
    size: 10,
    color: [0.1, 0.15, 0.25]
  }, 14);

  const paragraphs = judgment.full_judgment_text.split('\n');
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      currentY -= 6;
      continue;
    }

    if (trimmed.startsWith('IN THE') || trimmed.startsWith('CORAM:') || trimmed.startsWith('JUDGMENT') || trimmed.startsWith('VERSUS')) {
      addTextLine({
        text: trimmed,
        font: 'F2',
        size: 9,
        color: [0.1, 0.15, 0.25],
        align: trimmed.startsWith('IN THE') || trimmed === 'VERSUS' ? 'center' : 'left'
      }, 12);
    } else {
      addParagraph(trimmed, 'F1', 9, [0.1, 0.15, 0.2]);
    }
  }

  // Footer on final page
  ensureSpace(35);
  currentPage.rects.push({
    x: MARGIN_LEFT,
    y: currentY,
    w: CONTENT_WIDTH,
    h: 0.5,
    stroke: [0.8, 0.8, 0.8],
    lineWidth: 0.5
  });
  currentY -= 12;

  addTextLine({
    text: 'Certified by District & Sessions Bar Association, Alwar — AI Judicial Precedent Vault',
    font: 'F3',
    size: 7.5,
    color: [0.5, 0.5, 0.5],
    align: 'center'
  }, 8);

  addTextLine({
    text: `Verified e-Law Report • Document Ref: ${judgment.id} • Official Portal: escr.sci.gov.in`,
    font: 'F1',
    size: 7,
    color: [0.6, 0.6, 0.6],
    align: 'center'
  }, 0);

  // ==========================================
  // COMPILE INTO PDF BINARY BUFFER
  // ==========================================
  return buildPdfBinary(pages, PAGE_WIDTH, PAGE_HEIGHT);
}

function sanitizePdfText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[^\x20-\x7E]/g, (char) => {
      // Map common typographic Unicode chars to ASCII
      if (char === '’' || char === '‘' || char === '`') return "'";
      if (char === '“' || char === '”') return '"';
      if (char === '—' || char === '–') return '-';
      if (char === '•') return '*';
      if (char === '…') return '...';
      if (char === '₹') return 'Rs.';
      if (char === '©') return '(c)';
      if (char === '®') return '(R)';
      return '';
    })
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wordWrap(text: string, maxWidth: number, font: 'F1' | 'F2' | 'F3', size: number): string[] {
  const avgCharWidth = (font === 'F2' ? 0.55 : 0.48) * size;
  const maxChars = Math.floor(maxWidth / avgCharWidth);

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function buildPdfBinary(pages: PageContent[], width: number, height: number): Buffer {
  const objects: string[] = [];
  const offsets: number[] = [];

  function addObject(content: string): number {
    const id = objects.length + 1;
    objects.push(content);
    return id;
  }

  // Object 1: Catalog
  addObject(`<< /Type /Catalog /Pages 2 0 R >>`);

  // We will build Pages object later, reserve ID 2
  objects.push(''); // placeholder for Pages (ID 2)

  // Standard Type 1 Fonts (IDs 3, 4, 5)
  const f1Id = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>`);
  const f2Id = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>`);
  const f3Id = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>`);

  const pageIds: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Build Content Stream
    let stream = '';

    // Draw Rectangles
    for (const r of page.rects) {
      stream += 'q\n';
      if (r.fill) {
        stream += `${r.fill[0].toFixed(3)} ${r.fill[1].toFixed(3)} ${r.fill[2].toFixed(3)} rg\n`;
      }
      if (r.stroke) {
        stream += `${r.stroke[0].toFixed(3)} ${r.stroke[1].toFixed(3)} ${r.stroke[2].toFixed(3)} RG\n`;
        stream += `${(r.lineWidth || 1).toFixed(2)} w\n`;
      }
      stream += `${r.x.toFixed(2)} ${r.y.toFixed(2)} ${r.w.toFixed(2)} ${r.h.toFixed(2)} re\n`;
      if (r.fill && r.stroke) {
        stream += 'B\n';
      } else if (r.fill) {
        stream += 'f\n';
      } else {
        stream += 'S\n';
      }
      stream += 'Q\n';
    }

    // Draw Texts
    for (const line of page.lines) {
      stream += 'BT\n';
      stream += `/${line.font} ${line.size.toFixed(2)} Tf\n`;
      stream += `${line.r.toFixed(3)} ${line.g.toFixed(3)} ${line.b.toFixed(3)} rg\n`;
      stream += `${line.x.toFixed(2)} ${line.y.toFixed(2)} Td\n`;
      stream += `(${line.text}) Tj\n`;
      stream += 'ET\n';
    }

    const streamLength = Buffer.byteLength(stream, 'utf-8');
    const contentStreamObj = `<< /Length ${streamLength} >>\nstream\n${stream}endstream`;
    const contentStreamId = addObject(contentStreamObj);

    // Page Object
    const pageObj = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width.toFixed(2)} ${height.toFixed(2)}] /Contents ${contentStreamId} 0 R /Resources << /Font << /F1 ${f1Id} 0 R /F2 ${f2Id} 0 R /F3 ${f3Id} 0 R >> >> >>`;
    const pageObjId = addObject(pageObj);
    pageIds.push(pageObjId);
  }

  // Now fill Object 2: Pages Catalog
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  // Assemble full PDF
  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  let byteOffset = Buffer.byteLength(pdf, 'utf-8');

  for (let i = 0; i < objects.length; i++) {
    offsets.push(byteOffset);
    const objStr = `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    pdf += objStr;
    byteOffset += Buffer.byteLength(objStr, 'utf-8');
  }

  const xrefOffset = byteOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += `${off.toString().padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  pdf += xref + trailer;

  return Buffer.from(pdf, 'utf-8');
}
