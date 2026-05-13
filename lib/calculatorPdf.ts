import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, rgb, StandardFonts, type PDFPage, type PDFFont } from 'pdf-lib';
import fontkit from '@/lib/vendor/fontkit.cjs';
import type { CalculatorResultPayload, CalculatorResultV2 } from '@/types/calculator';

export type PdfMode = 'client' | 'internal';

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

function wrapText(value: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!value) return [''];
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  const fits = (text: string) => font.widthOfTextAtSize(text, size) <= maxWidth;

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (fits(candidate)) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
      current = '';
    }

    if (fits(word)) {
      current = word;
      continue;
    }

    let chunk = '';
    for (const char of word) {
      const nextChunk = `${chunk}${char}`;
      if (fits(nextChunk)) {
        chunk = nextChunk;
      } else {
        if (chunk) {
          lines.push(chunk);
          chunk = char;
        } else {
          lines.push(char);
        }
      }
    }
    current = chunk;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
}

function drawRowsInColumn(params: {
  page: PDFPage;
  rows: Array<{ label: string; value: number; currency: 'USD' | 'BYN' }>;
  font: PDFFont;
  fontBold: PDFFont;
  text: (value: string) => string;
  x: number;
  y: number;
  width: number;
}) {
  const { page, rows, font, fontBold, text, x, y, width } = params;
  const labelSize = 11;
  const valueSize = 11;
  const valueAreaWidth = 110;
  const gap = 12;
  const lineHeight = 16;
  const minRowHeight = 24;
  const labelMaxWidth = width - valueAreaWidth - gap;
  const valueRight = x + width;
  let cursorY = y;

  for (const item of rows) {
    const labelLines = wrapText(text(item.label), font, labelSize, labelMaxWidth);
    for (let i = 0; i < labelLines.length; i += 1) {
      page.drawText(labelLines[i], {
        x,
        y: cursorY - i * lineHeight,
        size: labelSize,
        font,
        color: rgb(0.2, 0.23, 0.26),
      });
    }

    const valueText = formatMoney(item.value, item.currency);
    const valueWidth = fontBold.widthOfTextAtSize(valueText, valueSize);
    const minValueX = x + labelMaxWidth + gap;
    const valueX = Math.max(minValueX, valueRight - valueWidth);
    page.drawText(valueText, {
      x: valueX,
      y: cursorY,
      size: valueSize,
      font: fontBold,
      color: rgb(0.95, 0.43, 0.09),
    });

    const rowHeight = Math.max(minRowHeight, labelLines.length * lineHeight);
    cursorY -= rowHeight;
  }
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
    const maxLogoWidth = 172;
    const maxLogoHeight = 42;
    const scale = Math.min(maxLogoWidth / image.width, maxLogoHeight / image.height);
    const logoWidth = image.width * scale;
    const logoHeight = image.height * scale;
    page.drawImage(image, {
      x: 28,
      y: 545 + (50 - logoHeight) / 2,
      width: logoWidth,
      height: logoHeight,
    });
  } catch {
    page.drawText(text('Е-ТРЕЙД'), { x: 28, y: 563, size: 18, font: fontBold, color: rgb(0.95, 0.43, 0.09) });
  }

  const now = new Date();
  const dateText = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  page.drawText(text('Расчет стоимости автомобиля'), { x: 28, y: 510, size: 24, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  page.drawText(text(`Дата расчета: ${dateText}`), { x: 28, y: 486, size: 12, font, color: rgb(0.3, 0.33, 0.36) });

  const leftX = 28;
  const columnGap = 36;
  const columnWidth = (786 - columnGap) / 2;
  const rightX = leftX + columnWidth + columnGap;

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

  drawRowsInColumn({
    page,
    rows: purchaseRows,
    font,
    fontBold,
    text,
    x: leftX,
    y: 420,
    width: columnWidth,
  });

  drawRowsInColumn({
    page,
    rows: customsRows,
    font,
    fontBold,
    text,
    x: rightX,
    y: 420,
    width: columnWidth,
  });

  page.drawRectangle({ x: 28, y: 116, width: 786, height: 62, color: rgb(0.97, 0.97, 0.97), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 });

  page.drawText(text('ИТОГО'), { x: 44, y: 141, size: 20, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  const totalText = formatMoney(result.total.value, result.total.currency);
  const totalRightX = 28 + 786 - 18;
  const totalWidth = fontBold.widthOfTextAtSize(totalText, 24);
  page.drawText(totalText, {
    x: totalRightX - totalWidth,
    y: 141,
    size: 24,
    font: fontBold,
    color: rgb(0.95, 0.43, 0.09),
  });

  page.drawText(text('Суммы ориентировочные и могут изменяться на дату оформления сделки.'), {
    x: 44,
    y: 122,
    size: 10,
    font,
    color: rgb(0.45, 0.48, 0.5),
  });

  page.drawText(text('E-TRADE · edelivery.by · +375 (33) 696-22-24'), {
    x: 28,
    y: 18,
    size: 10,
    font,
    color: rgb(0.45, 0.48, 0.5),
  });

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

// ===========================================================================
// V2 — per-stage cost + margin
// ===========================================================================

function formatUsd(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} USD`;
}

export async function buildCalculatorPdfV2(result: CalculatorResultV2, mode: PdfMode = 'client') {
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
    const maxLogoWidth = 172;
    const maxLogoHeight = 42;
    const scale = Math.min(maxLogoWidth / image.width, maxLogoHeight / image.height);
    page.drawImage(image, {
      x: 28,
      y: 545 + (50 - image.height * scale) / 2,
      width: image.width * scale,
      height: image.height * scale,
    });
  } catch {
    page.drawText(text('E-TRADE'), { x: 28, y: 563, size: 18, font: fontBold, color: rgb(0.95, 0.43, 0.09) });
  }

  const now = new Date();
  const dateText = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  page.drawText(text('Расчёт стоимости автомобиля'), {
    x: 28,
    y: 510,
    size: 24,
    font: fontBold,
    color: rgb(0.13, 0.14, 0.16),
  });
  page.drawText(text(`Дата расчёта: ${dateText}`), {
    x: 28,
    y: 486,
    size: 12,
    font,
    color: rgb(0.3, 0.33, 0.36),
  });

  if (result.meta.port) {
    page.drawText(
      text(
        `Маршрут: ${result.meta.port} → ${result.meta.route === 'poti' ? 'Поти (Грузия)' : 'Клайпеда (Литва)'}${result.meta.hazmat ? ' · Hazmat' : ''}`,
      ),
      {
        x: 28,
        y: 468,
        size: 11,
        font,
        color: rgb(0.4, 0.43, 0.46),
      },
    );
  }

  // Header row
  const headerY = 440;
  const leftX = 28;
  const labelWidth = 380;
  const costColumnX = leftX + labelWidth + 20;
  const marginColumnX = costColumnX + 130;

  page.drawText(text('Этап'), { x: leftX, y: headerY, size: 12, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  page.drawText(text('Стоимость'), { x: costColumnX, y: headerY, size: 12, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  if (mode === 'internal') {
    page.drawText(text('Маржа'), { x: marginColumnX, y: headerY, size: 12, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  }

  // Stage rows
  const rowGap = 24;
  let y = headerY - rowGap;
  for (const stage of result.stages) {
    page.drawText(text(stage.label), {
      x: leftX,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.23, 0.26),
    });

    const displayCost = mode === 'internal' ? stage.cost : stage.cost + stage.margin;
    page.drawText(formatUsd(displayCost), {
      x: costColumnX,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.95, 0.43, 0.09),
    });

    if (mode === 'internal') {
      page.drawText(formatUsd(stage.margin), {
        x: marginColumnX,
        y,
        size: 11,
        font,
        color: rgb(0.4, 0.43, 0.46),
      });
    }

    y -= rowGap;
  }

  // Total bar
  page.drawRectangle({
    x: 28,
    y: 116,
    width: 786,
    height: 62,
    color: rgb(0.97, 0.97, 0.97),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  });

  page.drawText(text('ИТОГО'), { x: 44, y: 141, size: 20, font: fontBold, color: rgb(0.13, 0.14, 0.16) });
  const totalText = formatUsd(result.total);
  const totalRightX = 28 + 786 - 18;
  const totalWidth = fontBold.widthOfTextAtSize(totalText, 24);
  page.drawText(totalText, {
    x: totalRightX - totalWidth,
    y: 141,
    size: 24,
    font: fontBold,
    color: rgb(0.95, 0.43, 0.09),
  });

  if (mode === 'internal') {
    page.drawText(text(`(в т.ч. маржа: ${formatUsd(result.totalMargin)})`), {
      x: 44,
      y: 122,
      size: 10,
      font,
      color: rgb(0.45, 0.48, 0.5),
    });
  } else {
    page.drawText(text('Суммы ориентировочные и могут изменяться на дату оформления сделки.'), {
      x: 44,
      y: 122,
      size: 10,
      font,
      color: rgb(0.45, 0.48, 0.5),
    });
  }

  page.drawText(text('E-TRADE · edelivery.by · +375 (33) 696-22-24'), {
    x: 28,
    y: 18,
    size: 10,
    font,
    color: rgb(0.45, 0.48, 0.5),
  });

  if (mode === 'internal') {
    page.drawText(text('INTERNAL — содержит маржу, не передавайте клиенту'), {
      x: 28,
      y: 565,
      size: 11,
      font: fontBold,
      color: rgb(0.85, 0.1, 0.1),
    });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
