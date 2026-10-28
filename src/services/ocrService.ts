
import { createWorker } from 'tesseract.js';

export interface OcrWord {
  text: string;
  bbox?: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  confidence?: number;
}

export interface OcrResult {
  text: string;
  confidence?: number;
  imageWidth?: number;
  imageHeight?: number;
  words: OcrWord[];
}

/**
 * Load an image and return its natural dimensions.
 */
function getImageDimensions(
  source: string | File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl =
      typeof source === 'string' ? undefined : URL.createObjectURL(source);

    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;

      if (objectUrl) URL.revokeObjectURL(objectUrl);

      if (!width || !height) {
        reject(new Error('Unable to determine image dimensions.'));
        return;
      }

      resolve({ width, height });
    };

    image.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to load image for OCR.'));
    };

   if (typeof source === 'string') {
      image.src = source;
    } else {
      image.src = objectUrl!;
    }
  });
}

/**
 * Preprocess an image for OCR.
 * Returns a PNG data URL while preserving the original aspect ratio.
 */
async function preprocessImageForOcr(
  source: string | File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl =
      typeof source === 'string' ? undefined : URL.createObjectURL(source);

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      try {
        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;

        if (!originalWidth || !originalHeight) {
          throw new Error('Invalid image dimensions.');
        }

        const maxDimension = Math.max(originalWidth, originalHeight);

        // Upscale small images, but avoid unnecessarily large canvases.
        const scale =
          maxDimension < 1000
            ? Math.min(2, 1400 / maxDimension)
            : 1;

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(originalWidth * scale);
        canvas.height = Math.round(originalHeight * scale);

        const context = canvas.getContext('2d');

        if (!context) {
          cleanup();
          reject(new Error('Unable to initialize image preprocessing.'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const pixels = imageData.data;

        let minLuminance = 255;
        let maxLuminance = 0;

        for (let i = 0; i < pixels.length; i += 4) {
          const luminance =
            0.299 * pixels[i] +
            0.587 * pixels[i + 1] +
            0.114 * pixels[i + 2];

          minLuminance = Math.min(minLuminance, luminance);
          maxLuminance = Math.max(maxLuminance, luminance);
        }

        const range = maxLuminance - minLuminance;

        // Avoid destroying a nearly uniform image through contrast stretching.
        if (range > 20) {
          for (let i = 0; i < pixels.length; i += 4) {
            const luminance =
              0.299 * pixels[i] +
              0.587 * pixels[i + 1] +
              0.114 * pixels[i + 2];

            const normalized = Math.round(
              Math.max(
                0,
                Math.min(
                  255,
                  ((luminance - minLuminance) / range) * 255
                )
              )
            );

            pixels[i] = normalized;
            pixels[i + 1] = normalized;
            pixels[i + 2] = normalized;
          }

          context.putImageData(imageData, 0, 0);
        }

        const processedDataUrl = canvas.toDataURL('image/png');

        cleanup();
        resolve(processedDataUrl);
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    image.onerror = () => {
      cleanup();
      reject(new Error('Unable to load image for preprocessing.'));
    };

    if (typeof source === 'string') {
      image.src = source;
    } else {
      image.src = objectUrl!;
    }
  });
}

/**
 * Perform OCR and preserve the actual word coordinates returned by Tesseract.
 *
 * Note: bounding boxes refer to the processed image supplied to Tesseract.
 * If preprocessing changes image dimensions, the caller must use the
 * returned OCR image dimensions when mapping boxes to the original preview.
 */
export async function performOcr(
  imageSource: string | File,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;

  try {
    onProgress?.(5, 'Reading image dimensions...');

    const originalDimensions = await getImageDimensions(imageSource);

    onProgress?.(15, 'Preprocessing image...');

    const preprocessedImage = await preprocessImageForOcr(imageSource);

    const processedDimensions = await getImageDimensions(preprocessedImage);

    onProgress?.(30, 'Initializing OCR worker...');

    worker = await createWorker('eng', 1, {
      langPath: '/tesseract',
      gzip: false
    });

    onProgress?.(50, 'Recognizing text...');

    // In Tesseract.js v5+, { blocks: true } is required to retrieve the block/line/word layout hierarchy.
    const result = await worker.recognize(preprocessedImage, {}, { blocks: true });
    const data = result.data;

    onProgress?.(85, 'Extracting word positions...');

    const rawWords: Array<{
      text?: string;
      bbox?: { x0: number; y0: number; x1: number; y1: number };
      confidence?: number;
    }> = [];

    // Extract word-level objects from the layout blocks hierarchy
    if ('blocks' in data && Array.isArray(data.blocks)) {
      for (const block of data.blocks) {
        for (const paragraph of block.paragraphs || []) {
          for (const line of paragraph.lines || []) {
            for (const word of line.words || []) {
              rawWords.push(word);
            }
          }
        }
      }
    } else if ('words' in data && Array.isArray((data as any).words)) {
      rawWords.push(...(data as any).words);
    }

    const words: OcrWord[] = rawWords
      .filter((word) => Boolean(word.text?.trim()))
      .map((word) => {
        const bbox = word.bbox;

        const validBoundingBox =
          bbox &&
          Number.isFinite(bbox.x0) &&
          Number.isFinite(bbox.y0) &&
          Number.isFinite(bbox.x1) &&
          Number.isFinite(bbox.y1) &&
          bbox.x1 > bbox.x0 &&
          bbox.y1 > bbox.y0;

        return {
          text: word.text!.trim(),
          bbox: validBoundingBox
            ? {
                x0: bbox.x0,
                y0: bbox.y0,
                x1: bbox.x1,
                y1: bbox.y1,
              }
            : undefined,
          confidence: Number.isFinite(word.confidence)
            ? word.confidence
            : undefined,
        };
      });

    onProgress?.(100, 'OCR completed.');

    return {
      text: data.text?.trim() ?? '',
      confidence: Number.isFinite(data.confidence)
        ? data.confidence
        : undefined,

      // These dimensions describe the actual image sent to Tesseract.
      imageWidth: processedDimensions.width,
      imageHeight: processedDimensions.height,

      words,
    };
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  } finally {
    if (worker) {
      await worker.terminate().catch(() => undefined);
    }
  }
}
