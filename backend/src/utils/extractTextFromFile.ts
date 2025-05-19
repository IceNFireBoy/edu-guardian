import axios from 'axios';
import pdfParse from 'pdf-parse';
import { extname } from 'path';

/**
 * Extracts text from a file URL (PDF, image, or text file).
 * @param fileUrl The URL of the file to extract text from.
 * @returns The extracted text as a string.
 */
export async function extractTextFromFile(fileUrl: string): Promise<string> {
  const extension = extname(fileUrl).toLowerCase();
  if (extension === '.pdf') {
    // Download PDF and parse
    const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
    const data = await pdfParse(response.data);
    return data.text;
  }
  if ([ '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp' ].includes(extension)) {
    // Use OCR.space API for images
    const apiKey = process.env.OCR_SPACE_API_KEY;
    if (!apiKey) throw new Error('OCR_SPACE_API_KEY not set in environment');
    const ocrRes = await axios.post('https://api.ocr.space/parse/image', null, {
      params: {
        apikey: apiKey,
        url: fileUrl,
        language: 'eng',
        isOverlayRequired: false,
      },
      headers: { 'apikey': apiKey },
    });
    if (ocrRes.data && ocrRes.data.ParsedResults && ocrRes.data.ParsedResults[0]) {
      return ocrRes.data.ParsedResults[0].ParsedText ?? '';
    }
    throw new Error('OCR.space failed to extract text');
  }
  if ([ '.txt', '.csv' ].includes(extension)) {
    // Download and return as text
    const response = await axios.get(fileUrl);
    return response.data;
  }
  // For unsupported types, return empty string
  return '';
} 