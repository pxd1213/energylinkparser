import React, { useState } from 'react';
import { parseRevenueStatement } from '../services/openaiService';
import { convertPDFPagesToImages } from '../services/pdfService';

export default function TestParser() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    try {
      setIsLoading(true);
      
      // Read the test PDF file
      const testPdf = await fetch('test.pdf');
      const blob = await testPdf.blob();
      const file = new File([blob], 'test.pdf', { type: 'application/pdf' });

      // Convert PDF to images
      const images = await convertPDFPagesToImages(file);
      
      // Parse the first page
      const result = await parseRevenueStatement(images[0]);
      
      setResult(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Parser</h1>
      <button
        onClick={handleTest}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Run Test'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
