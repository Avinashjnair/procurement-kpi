/**
 * exportCsv — converts an array of objects to a downloadable CSV file
 */
export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;

  const escape = (val: unknown): string => {
    const s = val == null ? '' : String(val);
    // wrap in quotes if the value contains commas, quotes, or newlines
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => headers.map(h => escape(row[h])).join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
