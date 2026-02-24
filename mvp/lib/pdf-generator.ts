import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const reiwaYear = y - 2018;
  return `令和${reiwaYear}年${m}月${d}日`;
}

/**
 * MVPのPDF生成
 * Phase 1：シンプルなPDFを生成して名前を記入するデモ
 * Phase 2以降：行政様式PDFに座標指定でテキストを配置する実装に移行
 */
export async function generatePDF(name: string, date: Date): Promise<void> {
  const pdfDoc = await PDFDocument.create();

  // 日本語フォント（Phase 2でカスタム日本語フォントに切り替え）
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const dateStr = formatDate(date);

  // 書類1: 経営届出書
  await addPage(pdfDoc, font, boldFont, {
    title: 'Cargo Light Vehicle Transport Business Registration',
    subtitle: '貨物軽自動車運送事業経営届出書',
    docNumber: '様式第1号',
    name,
    dateStr,
  });

  // 書類2: 運賃料金設定届出書
  await addPage(pdfDoc, font, boldFont, {
    title: 'Freight Fare Setting Notification',
    subtitle: '運賃料金設定届出書',
    docNumber: '様式第3号',
    name,
    dateStr,
  });

  // 書類5: 安全管理者選任届出書
  await addPage(pdfDoc, font, boldFont, {
    title: 'Safety Manager Appointment Notification',
    subtitle: '貨物軽自動車安全管理者選任届出書',
    docNumber: '（2025年4月義務化）',
    name,
    dateStr,
  });

  const pdfBytes = await pdfDoc.save();

  // ブラウザでダウンロード
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `黒ナンバー届出書類_${name}_MVP.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

interface PageConfig {
  title: string;
  subtitle: string;
  docNumber: string;
  name: string;
  dateStr: string;
}

async function addPage(
  pdfDoc: PDFDocument,
  font: Awaited<ReturnType<typeof pdfDoc.embedFont>>,
  boldFont: Awaited<ReturnType<typeof pdfDoc.embedFont>>,
  config: PageConfig
) {
  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();

  // 背景
  page.drawRectangle({
    x: 0, y: 0,
    width, height,
    color: rgb(1, 1, 1),
  });

  // 書類番号（右上）
  page.drawText(config.docNumber, {
    x: width - 120,
    y: height - 40,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  // タイトル（英語）
  page.drawText(config.title, {
    x: 50,
    y: height - 80,
    size: 14,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // サブタイトル（日本語表記）
  page.drawText(`(${config.subtitle})`, {
    x: 50,
    y: height - 100,
    size: 10,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // 仕切り線
  page.drawLine({
    start: { x: 50, y: height - 115 },
    end: { x: width - 50, y: height - 115 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // 日付
  page.drawText(`Date: ${config.dateStr}`, {
    x: width - 200,
    y: height - 145,
    size: 10,
    font,
    color: rgb(0, 0, 0),
  });

  // 届出者セクション
  page.drawRectangle({
    x: 350,
    y: height - 230,
    width: 195,
    height: 80,
    borderColor: rgb(0.5, 0.5, 0.5),
    borderWidth: 1,
  });
  page.drawText('Applicant / Declarant:', {
    x: 360,
    y: height - 155,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('Name:', {
    x: 360,
    y: height - 175,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  // 名前を強調表示
  page.drawRectangle({
    x: 390,
    y: height - 183,
    width: 145,
    height: 18,
    color: rgb(0.9, 0.95, 1),
  });
  page.drawText(config.name, {
    x: 395,
    y: height - 178,
    size: 11,
    font: boldFont,
    color: rgb(0, 0, 0.7),
  });
  page.drawText('Address:', {
    x: 360,
    y: height - 205,
    size: 9,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('(Phase 2 - To be filled)', {
    x: 395,
    y: height - 205,
    size: 9,
    font,
    color: rgb(0.7, 0.7, 0.7),
  });

  // メインテーブル
  const tableTop = height - 270;
  const tableLeft = 50;
  const tableWidth = width - 100;
  const rowHeight = 35;
  const rows = [
    ['Name / 氏名・名称', config.name, true],
    ['Office / 営業所', '(Phase 2 - Input required)', false],
    ['Vehicles / 車両台数', '(Phase 2 - Input required)', false],
    ['Start Date / 事業開始日', '(Phase 2 - Input required)', false],
    ['Garage / 車庫所在地', '(Phase 2 - Input required)', false],
  ];

  rows.forEach((row, i) => {
    const y = tableTop - i * rowHeight;
    // 行の背景
    page.drawRectangle({
      x: tableLeft,
      y: y - rowHeight,
      width: tableWidth,
      height: rowHeight,
      color: i % 2 === 0 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
    });
    // ラベル列
    page.drawText(String(row[0]), {
      x: tableLeft + 10,
      y: y - rowHeight + 11,
      size: 9,
      font: boldFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    // 値列
    if (row[2]) {
      // 自動入力された値を強調
      page.drawRectangle({
        x: tableLeft + 200,
        y: y - rowHeight + 5,
        width: tableWidth - 210,
        height: 22,
        color: rgb(0.88, 0.94, 1),
        borderColor: rgb(0.4, 0.6, 1),
        borderWidth: 0.5,
      });
      page.drawText(String(row[1]), {
        x: tableLeft + 205,
        y: y - rowHeight + 11,
        size: 11,
        font: boldFont,
        color: rgb(0, 0, 0.7),
      });
    } else {
      page.drawText(String(row[1]), {
        x: tableLeft + 205,
        y: y - rowHeight + 11,
        size: 10,
        font,
        color: rgb(0.6, 0.6, 0.6),
      });
    }
    // 仕切り線
    page.drawLine({
      start: { x: tableLeft + 195, y },
      end: { x: tableLeft + 195, y: y - rowHeight },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    });
  });

  // 注釈
  page.drawText('* Blue highlighted fields are auto-filled by the app (MVP Phase 1)', {
    x: 50,
    y: 80,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });
  page.drawText('* Other fields will be auto-filled in Phase 2', {
    x: 50,
    y: 65,
    size: 8,
    font,
    color: rgb(0.4, 0.4, 0.4),
  });

  // フッター
  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: width - 50, y: 50 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });
  page.drawText('Black Number Auto Generator - MVP v1.0', {
    x: 50,
    y: 35,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });
  page.drawText(`Generated: ${new Date().toLocaleDateString('ja-JP')}`, {
    x: width - 180,
    y: 35,
    size: 8,
    font,
    color: rgb(0.6, 0.6, 0.6),
  });
}
