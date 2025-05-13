import { extractTextFromFile } from '../../utils/extractTextFromFile';
import axios from 'axios';
import pdfParse from 'pdf-parse';

// Mock axios and pdf-parse
jest.mock('axios');
jest.mock('pdf-parse');

describe('extractTextFromFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PDF Files', () => {
    it('should extract text from PDF file', async () => {
      const mockPdfBuffer = Buffer.from('mock pdf content');
      const mockPdfText = 'Extracted PDF text';

      (axios.get as jest.Mock).mockResolvedValue({ data: mockPdfBuffer });
      (pdfParse as jest.Mock).mockResolvedValue({ text: mockPdfText });

      const result = await extractTextFromFile('https://example.com/test.pdf');
      expect(result).toBe(mockPdfText);
      expect(axios.get).toHaveBeenCalledWith('https://example.com/test.pdf', { responseType: 'arraybuffer' });
      expect(pdfParse).toHaveBeenCalledWith(mockPdfBuffer);
    });

    it('should handle PDF extraction errors', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(extractTextFromFile('https://example.com/test.pdf')).rejects.toThrow('Network error');
    });
  });

  describe('Image Files', () => {
    it('should extract text from image file using OCR', async () => {
      const mockOcrResponse = {
        data: {
          ParsedResults: [{
            ParsedText: 'Extracted image text'
          }]
        }
      };

      process.env.OCR_SPACE_API_KEY = 'test-api-key';
      (axios.post as jest.Mock).mockResolvedValue(mockOcrResponse);

      const result = await extractTextFromFile('https://example.com/test.jpg');
      expect(result).toBe('Extracted image text');
      expect(axios.post).toHaveBeenCalledWith(
        'https://api.ocr.space/parse/image',
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            apikey: 'test-api-key',
            url: 'https://example.com/test.jpg'
          })
        })
      );
    });

    it('should handle missing OCR API key', async () => {
      delete process.env.OCR_SPACE_API_KEY;

      await expect(extractTextFromFile('https://example.com/test.jpg')).rejects.toThrow('OCR_SPACE_API_KEY not set');
    });

    it('should handle OCR API errors', async () => {
      process.env.OCR_SPACE_API_KEY = 'test-api-key';
      (axios.post as jest.Mock).mockRejectedValue(new Error('OCR API error'));

      await expect(extractTextFromFile('https://example.com/test.jpg')).rejects.toThrow('OCR API error');
    });
  });

  describe('Text Files', () => {
    it('should extract text from text file', async () => {
      const mockTextContent = 'Plain text content';
      (axios.get as jest.Mock).mockResolvedValue({ data: mockTextContent });

      const result = await extractTextFromFile('https://example.com/test.txt');
      expect(result).toBe(mockTextContent);
      expect(axios.get).toHaveBeenCalledWith('https://example.com/test.txt');
    });

    it('should handle text file download errors', async () => {
      (axios.get as jest.Mock).mockRejectedValue(new Error('Download error'));

      await expect(extractTextFromFile('https://example.com/test.txt')).rejects.toThrow('Download error');
    });
  });

  describe('Unsupported Files', () => {
    it('should return empty string for unsupported file types', async () => {
      const result = await extractTextFromFile('https://example.com/test.xyz');
      expect(result).toBe('');
    });
  });
}); 