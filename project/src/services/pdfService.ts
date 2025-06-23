import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker using Vite's module resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();

// Convert PDF pages to base64 images for OpenAI processing
export const convertPDFPagesToImages = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string[]> => {
  try {
    onProgress?.(10);
    
    // Read the PDF file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(20);
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    onProgress?.(30);
    
    const images: string[] = [];
    
    // Convert each page to an image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Set up canvas for rendering
      const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render the page to canvas
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      // Convert canvas to base64 image
      const imageDataUrl = canvas.toDataURL('image/png', 0.9);
      const base64Image = imageDataUrl.split(',')[1]; // Remove data URL prefix
      images.push(base64Image);
      
      // Update progress
      const pageProgress = 30 + ((pageNum / numPages) * 60);
      onProgress?.(pageProgress);
    }
    
    onProgress?.(100);
    return images;
  } catch (error) {
    console.error('PDF to images conversion error:', error);
    throw new Error(`Failed to convert PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Convert PDF file to base64 for OpenAI processing (deprecated - use convertPDFPagesToImages instead)
export const convertPDFToBase64 = async (file: File): Promise<string> => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          // Remove the data URL prefix to get just the base64 content
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('PDF to base64 conversion error:', error);
    throw new Error(`Failed to convert PDF to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate PDF file
export const validatePDFFile = (file: File): void => {
  if (!file) {
    throw new Error('No file provided');
  }
  
  if (file.type !== 'application/pdf') {
    throw new Error('File must be a PDF');
  }
  
  // Check file size (limit to 20MB for OpenAI)
  const maxSize = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSize) {
    throw new Error('PDF file is too large. Maximum size is 20MB.');
  }
};