import * as pdfjsLib from 'pdfjs-dist';

// Set up worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF.js worker setup notice:', e);
}

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  pageTexts: string[];
}

export async function extractTextFromPdf(file: File): Promise<PdfExtractResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str || '')
      .join(' ');
    pageTexts.push(pageText);
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount: pdfDoc.numPages,
    pageTexts,
  };
}
