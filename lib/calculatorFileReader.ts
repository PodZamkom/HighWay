import fs from 'fs/promises';
import path from 'path';
import * as XLSX from 'xlsx';

const TEXT_EXTENSIONS = new Set(['.txt', '.csv']);
const EXCEL_EXTENSIONS = new Set(['.xlsx', '.xls']);

export async function readCalculatorFileAsText(fullPath: string) {
  const extension = path.extname(fullPath).toLowerCase();

  if (TEXT_EXTENSIONS.has(extension)) {
    return fs.readFile(fullPath, 'utf-8');
  }

  if (EXCEL_EXTENSIONS.has(extension)) {
    const buffer = await fs.readFile(fullPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheetTexts: string[] = [];
    for (const name of workbook.SheetNames.slice(0, 5)) {
      const sheet = workbook.Sheets[name];
      if (!sheet) continue;
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        sheetTexts.push(`### ${name}\n${csv}`);
      }
    }

    return sheetTexts.join('\n\n').trim();
  }

  throw new Error('Unsupported file format. Please upload XLSX, XLS, CSV or TXT file.');
}
