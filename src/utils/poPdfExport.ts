'use client';
/**
 * POPdfExport.ts
 * Place at: src/utils/poPdfExport.ts
 *
 * Generates a styled PO PDF using jsPDF loaded via CDN.
 * Usage: import { exportPOAsPDF } from '@/utils/poPdfExport';
 *        await exportPOAsPDF(po, supplier, undefined, companyProfile);
 */

import type { PurchaseOrder } from '@/types';
import type { Supplier } from '@/types';
import type { CompanyProfile } from '@/types';

const DEFAULT_COMPANY: CompanyProfile = {
  id: '',
  name: 'Your Company Name',
  address: 'Your Company Address',
  email: 'procurement@yourcompany.com',
  phone: '+000 000 0000',
  taxRegNumber: '',
  logoUrl: '',
  currency: 'USD',
  country: '',
  subscriptionTier: 'essential',
};

// Dynamically load jsPDF from CDN (no npm install needed)
async function getJsPDF(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if ((window as any).jspdf?.jsPDF) return (window as any).jspdf.jsPDF;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => resolve((window as any).jspdf?.jsPDF);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Hex to RGB helper
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export async function exportPOAsPDF(
  po: PurchaseOrder,
  supplier: Supplier | undefined,
  onProgress?: (msg: string) => void,
  companyProfile?: CompanyProfile | null
): Promise<void> {
  const company = companyProfile ?? DEFAULT_COMPANY;
  onProgress?.('Loading PDF engine...');
  const JsPDF: any = await getJsPDF();
  if (!JsPDF) { alert('PDF library could not be loaded.'); return; }

  onProgress?.('Generating document...');
  const doc = new JsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 14;
  const contentW = pageW - margin * 2;

  // ── Colour palette ──────────────────────────────────────────
  const INDIGO:  [number,number,number] = [99, 102, 241];
  const DARK:    [number,number,number] = [15, 23, 42];
  const MUTED:   [number,number,number] = [100, 116, 139];
  const LIGHT_BG:[number,number,number] = [248, 250, 252];
  const WHITE:   [number,number,number] = [255, 255, 255];
  const BORDER:  [number,number,number] = [226, 232, 240];
  const GREEN:   [number,number,number] = [16, 185, 129];
  const AMBER:   [number,number,number] = [245, 158, 11];

  let y = 0;

  // ── Header band ─────────────────────────────────────────────
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageW, 38, 'F');

  // Company name
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(company.name, margin, 14);

  // Tagline
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 202, 255);
  doc.text(company.address, margin, 20);
  doc.text(`${company.email}  |  ${company.phone}${company.taxRegNumber ? '  |  TRN: ' + company.taxRegNumber : ''}`, margin, 25);

  // PO title (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...WHITE);
  doc.text('PURCHASE ORDER', pageW - margin, 14, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(200, 202, 255);
  doc.text(po.id, pageW - margin, 22, { align: 'right' });

  // Status badge
  const statusColor = po.deliveryStatus === 'Cancelled' ? [244, 63, 94] :
                      po.deliveryStatus === 'Delivered'  ? [16, 185, 129] :
                      po.deliveryStatus === 'Draft'      ? [100, 116, 139] :
                      [99, 102, 241];
  doc.setFillColor(...(statusColor as [number,number,number]));
  doc.roundedRect(pageW - margin - 30, 26, 30, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...WHITE);
  doc.text(po.deliveryStatus.toUpperCase(), pageW - margin - 15, 31, { align: 'center' });

  y = 44;

  // ── Parties row ──────────────────────────────────────────────
  const colW = (contentW - 4) / 2;

  // Buyer block
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER);
  doc.rect(margin, y, colW, 36, 'FD');

  doc.setFillColor(...INDIGO);
  doc.rect(margin, y, 3, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...INDIGO);
  doc.text('FROM (BUYER)', margin + 6, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(company.name, margin + 6, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  const buyerLines = doc.splitTextToSize(company.address, colW - 10);
  doc.text(buyerLines.slice(0, 2), margin + 6, y + 18);
  doc.text(company.email, margin + 6, y + 27);
  doc.text(company.phone, margin + 6, y + 31);

  // Supplier block
  const sx = margin + colW + 4;
  doc.setFillColor(...LIGHT_BG);
  doc.rect(sx, y, colW, 36, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(sx, y, 3, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(16, 185, 129);
  doc.text('TO (SUPPLIER)', sx + 6, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text(supplier?.name || po.supplierName, sx + 6, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  if (supplier?.address) {
    const supLines = doc.splitTextToSize(supplier.address, colW - 10);
    doc.text(supLines.slice(0, 2), sx + 6, y + 18);
  }
  if (supplier?.email) doc.text(supplier.email, sx + 6, y + 27);
  if (supplier?.phone) doc.text(supplier.phone, sx + 6, y + 31);

  y += 42;

  // ── Key info grid ────────────────────────────────────────────
  const infoFields = [
    { label: 'Issue Date',     value: po.dateOfIssue },
    { label: 'Due Date',       value: po.dueDate },
    { label: 'ETA / Complete', value: po.eta },
    { label: 'Payment Terms',  value: po.paymentTerms },
    { label: 'Incoterms',      value: po.incoterms },
    { label: 'Payment Status', value: po.paymentStatus },
  ];

  const cellW = contentW / 3;
  const cellH = 12;

  infoFields.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cx = margin + col * cellW;
    const cy = y + row * cellH;

    doc.setFillColor(col % 2 === 0 ? 248 : 252, 250, 252);
    doc.setDrawColor(...BORDER);
    doc.rect(cx, cy, cellW, cellH, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(f.label.toUpperCase(), cx + 4, cy + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text(f.value || '—', cx + 4, cy + 9);
  });

  y += Math.ceil(infoFields.length / 3) * cellH + 6;

  // References row (if present)
  const refs = [
    po.projectReference && { label: 'Project Reference', value: po.projectReference },
    po.requestNumber    && { label: 'Request Number',    value: po.requestNumber },
    po.approvalAuthority && { label: 'Approval Authority', value: po.approvalAuthority },
  ].filter(Boolean) as { label: string; value: string }[];

  if (refs.length > 0) {
    refs.forEach((ref, i) => {
      const cx = margin + i * cellW;
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(245, 158, 11);
      doc.rect(cx, y, cellW, 10, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...MUTED);
      doc.text(ref.label.toUpperCase(), cx + 4, y + 4);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...AMBER);
      doc.text(ref.value, cx + 4, y + 8.5);
    });
    y += 14;
  }

  // ── Pagination helpers ─────────────────────────────────────────
  // Usable content bottom on every page (the indigo footer band is drawn at y=285 on all pages).
  const CONTENT_TOP = 16;
  const CONTENT_BOTTOM = 278;
  const LINE_H = 3.6; // mm per wrapped text line at ~7-7.5pt

  // Table header is redrawn whenever the items table continues onto a new page.
  const cols = [
    { label: '#',          x: margin,                  w: 8,            align: 'left'  as const },
    { label: 'DESCRIPTION', x: margin + 8,             w: contentW - 75, align: 'left'  as const },
    { label: 'QTY',        x: margin + contentW - 67,  w: 18,           align: 'right' as const },
    { label: 'UNIT PRICE', x: margin + contentW - 49,  w: 24,           align: 'right' as const },
    { label: 'TOTAL',      x: margin + contentW - 25,  w: 25,           align: 'right' as const },
  ];

  const drawItemsTableHeader = () => {
    doc.setFillColor(...DARK);
    doc.rect(margin, y, contentW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...WHITE);
    cols.forEach(col => {
      doc.text(col.label, col.align === 'right' ? col.x + col.w : col.x + 2, y + 4.8, { align: col.align });
    });
    y += 7;
  };

  // Starts a fresh page with a lightweight continuation header, resets y to the content top.
  const startNewPage = () => {
    doc.addPage();
    y = CONTENT_TOP;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.text(`Purchase Order ${po.id} — continued`, margin, y);
    doc.setDrawColor(...BORDER);
    doc.line(margin, y + 2, margin + contentW, y + 2);
    y += 8;
  };

  // Ensures `neededH` mm of vertical space remains before the footer; else starts a new page.
  // `redrawTableHeader` re-emits the line-items header row when a table row spills onto the next page.
  const ensureSpace = (neededH: number, redrawTableHeader = false) => {
    if (y + neededH > CONTENT_BOTTOM) {
      startNewPage();
      if (redrawTableHeader) drawItemsTableHeader();
    }
  };

  // ── Line Items Table ─────────────────────────────────────────
  ensureSpace(15);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('LINE ITEMS', margin, y + 5);
  y += 8;

  drawItemsTableHeader();

  // Rows — height is computed per row from wrapped item name / description / service info,
  // so long descriptions no longer get truncated and rows are allowed to grow.
  po.items.forEach((item: any, i: number) => {
    const nameText = item.itemName + (item.isService ? ' [Service]' : '') + (item.isAsset ? ' [Asset]' : '');
    const nameLines: string[] = doc.splitTextToSize(nameText, cols[1].w - 4);
    const descLines: string[] = item.description ? doc.splitTextToSize(item.description, cols[1].w - 4) : [];
    const svcInfoLines: string[] = (item.isService && item.serviceDetails)
      ? doc.splitTextToSize(`${item.serviceDetails.billingType} · ${item.serviceDetails.duration}`, cols[1].w - 4)
      : [];
    const totalLines = nameLines.length + descLines.length + svcInfoLines.length;
    const rowH = Math.max(9, totalLines * LINE_H + 6);

    // Page break check — redraws the table header if the row moves to a new page.
    ensureSpace(rowH, true);

    const isEven = i % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.setDrawColor(...BORDER);
    doc.rect(margin, y, contentW, rowH, 'FD');

    const firstLineY = y + 5.5;

    // Row #
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(String(i + 1), margin + 2, firstLineY);

    // Item name (full text, wrapped across multiple lines — no more truncation)
    let textY = firstLineY;
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', item.isService ? 'italic' : 'normal');
    nameLines.forEach((line, li) => doc.text(line, margin + 10, textY + li * LINE_H));
    textY += nameLines.length * LINE_H;

    // Description (free-text scope entered at PO creation)
    if (descLines.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...MUTED);
      descLines.forEach((line, li) => doc.text(line, margin + 10, textY + li * LINE_H));
      textY += descLines.length * LINE_H;
      doc.setFontSize(7.5);
    }

    // Service billing/duration summary
    if (svcInfoLines.length) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(...INDIGO);
      svcInfoLines.forEach((line, li) => doc.text(line, margin + 10, textY + li * LINE_H));
      doc.setFontSize(7.5);
    }

    // Qty
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(item.quantity.toLocaleString(), margin + contentW - 67 + 18, firstLineY, { align: 'right' });

    // Unit price
    doc.setTextColor(...DARK);
    doc.text(`$${item.unitPrice.toFixed(2)}`, margin + contentW - 49 + 24, firstLineY, { align: 'right' });

    // Total
    doc.setFont('helvetica', 'bold');
    doc.text(`$${(item.quantity * item.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, margin + contentW, firstLineY, { align: 'right' });

    y += rowH;
  });

  // Totals
  y += 2;
  const totalRows = [
    { label: 'Subtotal',    value: `$${po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'Tax (VAT 5%)',value: `$${(po.totalAmount * 0.05).toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
    { label: 'GRAND TOTAL', value: `$${(po.totalAmount * 1.05).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, bold: true },
    { label: 'Amount Paid', value: `$${po.amountPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: GREEN },
    { label: 'Outstanding', value: `$${(po.totalAmount * 1.05 - po.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: [244, 63, 94] as [number,number,number] },
  ];

  ensureSpace(totalRows.length * 7 + 2);
  totalRows.forEach(row => {
    const rowW = 80;
    const rx = margin + contentW - rowW;
    doc.setFillColor(...(row.bold ? DARK : LIGHT_BG));
    doc.setDrawColor(...BORDER);
    doc.rect(rx, y, rowW, 7, 'FD');

    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setFontSize(row.bold ? 8 : 7.5);
    doc.setTextColor(...(row.bold ? WHITE : MUTED));
    doc.text(row.label, rx + 4, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(row.bold ? 9 : 8);
    doc.setTextColor(...(row.color || (row.bold ? WHITE : DARK)));
    doc.text(row.value, rx + rowW - 4, y + 5, { align: 'right' });
    y += 7;
  });

  y += 8;

  // ── Remarks ──────────────────────────────────────────────────
  if (po.remarks) {
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(...INDIGO);
    const remarkLines = doc.splitTextToSize(po.remarks, contentW - 12);
    const remarkH = remarkLines.length * 4.5 + 10;
    ensureSpace(remarkH);
    doc.rect(margin, y, contentW, remarkH, 'FD');

    doc.setFillColor(...INDIGO);
    doc.rect(margin, y, 3, remarkH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...INDIGO);
    doc.text('REMARKS & SPECIAL INSTRUCTIONS', margin + 6, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK);
    doc.text(remarkLines, margin + 6, y + 10);
    y += remarkH + 8;
  }

  // ── Signature blocks ─────────────────────────────────────────
  const sigW = (contentW - 8) / 2;

  ensureSpace(22);
  ['PREPARED BY — PROCUREMENT DEPT.', 'APPROVED BY — ' + (po.approvalAuthority?.toUpperCase() || 'AUTHORIZED SIGNATORY')].forEach((label, i) => {
    const sx2 = margin + i * (sigW + 8);
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER);
    doc.rect(sx2, y, sigW, 22, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text(label, sx2 + 5, y + 5.5);

    // Signature line
    doc.setDrawColor(...MUTED);
    doc.line(sx2 + 5, y + 15, sx2 + sigW - 5, y + 15);

    doc.setFontSize(6.5);
    doc.text('Signature & Stamp', sx2 + 5, y + 19);
    doc.text(`Date: ${new Date().toLocaleDateString('en-AE')}`, sx2 + sigW - 5, y + 19, { align: 'right' });
  });

  // ── Footer (drawn on every page once the final page count is known) ──
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...INDIGO);
    doc.rect(0, 285, pageW, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(200, 202, 255);
    doc.text(`This Purchase Order is legally binding. Issued by ${company.name} on ${new Date().toLocaleDateString('en-AE')}`, margin, 292);
    doc.text(`Page ${p} of ${totalPages}  |  ${po.id}`, pageW - margin, 292, { align: 'right' });
  }

  // ── Save ────────────────────────────────────────────────────
  const fileName = `PO_${po.id}_${po.supplierName.replace(/\s+/g, '_')}.pdf`;
  
  try {
    const blob = doc.output('blob');
    if (blob.size < 100) throw new Error('Generated PDF is too small, likely corrupted.');
    
    // Explicit verification of PDF header
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      if (!text.startsWith('%PDF-')) {
        console.error('Invalid PDF header detected');
      }
    };
    reader.readAsText(blob.slice(0, 5));

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    onProgress?.('Done');
  } catch (err) {
    console.error('PDF Export Error:', err);
    alert('Failed to generate a valid PDF. Please try again.');
  }
}
