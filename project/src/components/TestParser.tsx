import React, { useState } from 'react';
import { parseRevenueStatement } from '../services/openaiService';
import { convertPDFPagesToImages } from '../services/pdfService';
import { ParsedData } from '../types/types';

export default function TestParser() {
  const [result, setResult] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    try {
      setIsLoading(true);
      
      // Create a sample PDF file for testing
      const samplePdf = new Blob([''], { type: 'application/pdf' });
      const file = new File([samplePdf], 'sample.pdf', { type: 'application/pdf' });

      // Convert PDF to images
      const images = await convertPDFPagesToImages(file);
      
      // Parse the first page
      const parsedResult = await parseRevenueStatement(images[0]);
      
      setResult(parsedResult);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during parsing';
      setError(errorMessage);
      console.error('Parsing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mt-8">
        <button
          onClick={handleTest}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Test Parser'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
            <div className="font-medium">Error</div>
            <div className="mt-1 text-sm text-red-600">{error}</div>
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
            <div className="font-medium">Parsed Data</div>
            <div className="mt-2">
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
