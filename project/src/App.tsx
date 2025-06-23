import React, { useState, useCallback } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import DataPreview from './components/DataPreview';
import ApiKeySetup from './components/ApiKeySetup';
import TestParser from './components/TestParser';
import { openaiService } from '../services/openaiService';
import { pdfService } from '../services/pdfService';
import { excelService } from '../services/excelService';
import { ParsedData, ProcessingStage } from '../types/types';

// Remove unused AppProps interface


interface ProcessingStage {
  stage: 'setup' | 'upload' | 'processing' | 'preview' | 'error';
  progress?: number;
  error?: string;
}

function App() {
  const [stage, setStage] = useState<ProcessingStage>({
    stage: 'setup',
    progress: 0,
    error: ''
  });
  const [data, setData] = useState<ParsedData | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);

  const handleApiKeyConfigured = useCallback(() => {
    setStage({ stage: 'upload', progress: 0, error: '' });
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setStage({ stage: 'processing', progress: 0, error: '' });
      setIsQuotaError(false);

      // Convert PDF to images
      const images = await pdfService.convertPdfToImages(file);

      // Parse images using OpenAI
      const parsedData = await openaiService.parseRevenueStatement({
        images,
        onProgress: (value: number) => setStage((prev: ProcessingStage) => ({ ...prev, progress: value }))
      });

      // Update state with parsed data
      setData(parsedData);
      setStage({ stage: 'preview', progress: 100, error: '' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setStage({ stage: 'error', progress: 0, error: errorMessage });
      if (err instanceof Error && err.message.includes('quota')) {
        setIsQuotaError(true);
      }
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!data) return;

    try {
      const blob = await excelService.generateExcelFile(data);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'revenue_statement.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export data';
      setStage({ stage: 'error', progress: 0, error: errorMessage });
    }
  }, [data]);

  const handleReset = useCallback(() => {
    setStage({ stage: 'setup', progress: 0, error: '' });
    setData(null);
    setIsQuotaError(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Energylink Revenue Statement Parser</h1>
          <p className="text-gray-600">Extract and analyze revenue data from PDF statements using AI</p>
        </header>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6">
            {stage.stage === 'setup' && (
              <>
                <ApiKeySetup onConfigured={handleApiKeyConfigured} />
                <TestParser />
              </>
            )}

            {stage.stage === 'upload' && (
              <FileUpload onFileUpload={handleFileUpload} />
            )}

            {stage.stage === 'processing' && (
              <ProcessingStatus progress={stage.progress} />
            )}

            {stage.stage === 'preview' && data && (
              <DataPreview data={data} onExport={handleExport} />
            )}

            {stage.error && (
              <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="w-5 h-5 inline-block mr-2" />
                {stage.error}
              </div>
            )}

            {isQuotaError && (
              <div className="mt-6 p-4 bg-yellow-50 text-yellow-800 rounded-md">
                <AlertCircle className="w-5 h-5 inline-block mr-2" />
                <div className="space-y-2">
                  <p className="font-medium">OpenAI API Limit Reached</p>
                  <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1 mb-3">
                    <li>Visit your OpenAI account dashboard</li>
                    <li>Check your billing and usage limits</li>
                    <li>Add credits or upgrade your plan if needed</li>
                  </ol>
                  <a
                    href="https://platform.openai.com/account/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-sm font-medium text-yellow-800 hover:text-yellow-900"
                  >
                    <span>Open OpenAI Billing</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="mt-8">
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        {stage.stage !== 'setup' && (
          <div className="mt-12 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">AI-Powered</h4>
                <p className="text-sm text-gray-600">Uses ChatGPT-4 for intelligent data extraction</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Secure Processing</h4>
                <p className="text-sm text-gray-600">Your documents are processed securely and not stored</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Easy Export</h4>
                <p className="text-sm text-gray-600">Export parsed data to Excel with one click</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;