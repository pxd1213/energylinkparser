import { convertPDFPagesToImages, validatePDFFile } from '../services/pdfService';
import { parseRevenueStatementWithAI, ParsedRevenueData } from '../services/openaiService';

export const parseRevenueStatement = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<ParsedRevenueData> => {
  try {
    // Step 1: Validate PDF file
    onProgress?.(5);
    validatePDFFile(file);
    
    // Step 2: Convert PDF pages to images (5-40%)
    onProgress?.(10);
    const imageBase64Array = await convertPDFPagesToImages(file, (pdfProgress) => {
      // Map PDF conversion progress from 10-40%
      const totalProgress = 10 + (pdfProgress * 0.3);
      onProgress?.(totalProgress);
    });
    onProgress?.(40);
    
    // Step 3: Parse with OpenAI Vision (40-100%)
    const result = await parseRevenueStatementWithAI(imageBase64Array, (aiProgress) => {
      // Map AI progress from 40-100%
      const totalProgress = 40 + (aiProgress * 0.6);
      onProgress?.(totalProgress);
    });
    
    return result;
  } catch (error) {
    console.error('Revenue statement parsing error:', error);
    throw error;
  }
};