import XLSX from 'xlsx';
import { ParsedData } from '../types/types';

export async function generateExcelFile(data: ParsedData): Promise<Blob> {
  const ws = XLSX.utils.json_to_sheet([
    { 'Company': data.company },
    { 'Period': data.period },
    { 'Total Revenue': data.totalRevenue },
    ...data.lineItems.map(item => ({
      'Description': item.description,
      'Amount': item.amount
    }))
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Revenue Statement');

  // Write to buffer
  const buffer = XLSX.write(wb, {
    type: 'array',
    bookType: 'xlsx'
  });

  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
