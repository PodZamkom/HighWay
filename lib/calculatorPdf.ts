import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@/lib/vendor/fontkit.cjs';
import type { CalculatorResultPayload } from '@/types/calculator';

const RU_TO_LAT: Record<string, string> = {
  А: 'A', а: 'a', Б: 'B', б: 'b', В: 'V', в: 'v', Г: 'G', г: 'g', Д: 'D', д: 'd',
  Е: 'E', е: 'e', Ё: 'E', ё: 'e', Ж: 'Zh', ж: 'zh', З: 'Z', з: 'z', И: 'I', и: 'i',
  Й: 'Y', й: 'y', К: 'K', к: 'k', Л: 'L', л: 'l', М: 'M', м: 'm', Н: 'N', н: 'n',
  О: 'O', о: 'o', П: 'P', п: 'p', Р: 'R', р: 'r', С: 'S', с: 's', Т: 'T', т: 't',
  У: 'U', у: 'u', Ф: 'F', ф: 'f', Х: 'Kh', х: 'kh', Ц: 'Ts', ц: 'ts', Ч: 'Ch', ч: 'ch',
  Ш: 'Sh', ш: 'sh', Щ: 'Sch', щ: 'sch', Ъ: '', ъ: '', Ы: 'Y', ы: 'y', Ь: '', ь: '',
  Э: 'E', э: 'e', Ю: 'Yu', ю: 'yu', Я: 'Ya', я: 'ya',
};

function toPdfText(value: string) {
  return value.split('').map((char) => RU_TO_LAT[char] ?? char).join('');
}

function formatMoney(value: number, currency: 'USD' | 'BYN') {
  const amount = value.toLocaleString('ru-RU', {
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  });
  return `${amount} ${currency}`;
}

function lineY(startY: number, index: number) {
  return startY - index * 24;
}

async function embedFonts(pdf: PDFDocument) {
  try {
    pdf.registerFontkit(fontkit as any);
    const [regularBytes, boldBytes] = await Promise.all([
      fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans.ttf')),
      fs.readFile(path.join(process.cwd(), 'public', 'fonts', 'DejaVuSans-Bold.ttf')),
    ]);
    const regular = await pdf.embedFont(regularBytes, { subset: true });
    const bold = await pdf.embedFont(boldBytes, { subset: true });
    return { regular, bold, needLatinFallback: false };
  } catch (error) {
    console.error('Не удалось загрузить кириллический шрифт для PDF, используем fallback:', error);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    return { regular, bold, needLatinFallback: true };
  }
}

export async function buildCalculatorPdf(result: CalculatorResultPayload) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  const { regular: font, bold: fontBold, needLatinFallback } = await embedFonts(pdf);
  const text = (value: string) => (needLatinFallback ? toPdfText(value) : value);

  page.drawRectangle({ x: 0, y: 545, width: 842, height: 50, color: rgb(0.13, 0.14, 0.16) });
  page.drawRectangle({ x: 0, y: 0, width: 842, height: 6, color: rgb(0.95, 0.43, 0.09) });

  const logoPath = path.join(process.cwd(), 'public', 'images', 'logo2.png');
  try {
    const logoBytes = await fs.readFile(logoPath);
    const image = await pdf.embedPng(logoBytes);
    page.drawImage(image, { x: 28, y: 542, width: 172, height: 52 });
  } catch {
    page.drawText(text('Е-ТРЕЙД'), { x: 28, y: 563, size: 18, font: fontBold, color: rgb(0.95, 0.43, 0.09) });
  }

  const now = new Date();
  const dateText = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  page.drawText(text('Расчет стоимости автомобиля'), { x: 28, y: 510, size: 24, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  page.drawText(text(`Дата расчета: ${dateText}`), { x: 28, y: 486, size: 12, font, color: rgb(0.3, 0.33, 0.36) });

  const leftX = 28;
  const rightX = 420;

  page.drawText(text('Покупка и доставка'), { x: leftX, y: 450, size: 15, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  page.drawText(text('Растаможка и оформление'), { x: rightX, y: 450, size: 15, font: fontBold, color: rgb(0.13, 0.14, 0.16) });

  const purchaseRows = [
    result.carPrice,
    result.auctionFee,
    result.deliveryToPortUSA,
    result.deliveryFromPortUSA,
    result.fromKlaipeda,
    result.ourServicePrice,
  ];
  const customsRows = [result.customDuty, result.customFee, result.junkFee, result.svxServicePrice];

  purchaseRows.forEach((item, index) => {
    const y = lineY(420, index);
    page.drawText(text(item.label), { x: leftX, y, size: 11, font, color: rgb(0.2, 0.23, 0.26) });
    page.drawText(formatMoney(item.value, item.currency), { x: 280, y, size: 11, font: fontBold, color: rgb(0.95, 0.28, 0.34) });
  });

  customsRows.forEach((item, index) => {
    const y = lineY(420, index);
    page.drawText(text(item.label), { x: rightX, y, size: 11, font, color: rgb(0.2, 0.23, 0.26) });
    page.drawText(formatMoney(item.value, item.currency), { x: 690, y, size: 11, font: fontBold, color: rgb(0.95, 0.28, 0.34) });
  });

  page.drawRectangle({ x: 28, y: 116, width: 786, height: 62, color: rgb(0.97, 0.97, 0.97), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 });

  page.drawText(text('ИТОГО'), { x: 44, y: 141, size: 20, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  page.drawText(formatMoney(result.total.value, result.total.currency), {
    x: 620,
    y: 141,
    size: 24,
    font: fontBold,
    color: rgb(0.95, 0.28, 0.34),
  });

  page.drawText(text('Суммы ориентировочные и могут изменяться на дату оформления сделки.'), {
    x: 44,
    y: 122,
    size: 10,
    font,
    color: rgb(0.45, 0.48, 0.5),
  });

  page.drawText(text('Е-ТРЕЙД'), { x: 730, y: 18, size: 10, font, color: rgb(0.45, 0.48, 0.5) });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
