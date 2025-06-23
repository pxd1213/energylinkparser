import React, { useState, useCallback } from 'react';
import { Upload, FileText, Download, CheckCircle, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import DataPreview from './components/DataPreview';
import ApiKeySetup from './components/ApiKeySetup';
import OpenAITest from './components/OpenAITest';
import TestParser from './components/TestParser';
import { parseRevenueStatement } from '../services/openaiService';
import { convertPDFPagesToImages } from '../services/pdfService';

type ProcessingStage = 'setup' | 'upload' | 'parsing' | 'generating' | 'complete' | 'error';

interface ParsedData {
  company: string;
  period: string;
  totalRevenue: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  taxes: number;
  netRevenue: number;
}

function App() {
  const [stage, setStage] = useState<ProcessingStage>('setup');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Check if API key is configured on component mount
  React.useEffect(() => {
    const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;
    if (hasApiKey) {
      setStage('upload');
    }
  }, []);

  const handleApiKeyConfigured = useCallback(() => {
    const hasApiKey = !!import.meta.env.VITE_OPENAI_API_KEY;
    if (hasApiKey) {
      setStage('upload');
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setStage('parsing');
    setProgress(0);
    setError(null);

    try {
      const data = await parseRevenueStatement(file, (progressValue) => {
        setProgress(progressValue);
      });
      
      setParsedData(data);
      setStage('generating');
      
      // Simulate Excel generation time
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(100);
      
      setStage('complete');
    } catch (err) {
      console.error('Processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during processing';
      setError(errorMessage);
      setStage('error');
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (parsedData) {
      generateExcelFile(parsedData, uploadedFile?.name || 'revenue-statement');
    }
  }, [parsedData, uploadedFile]);

  const handleReset = useCallback(() => {
    setStage('upload');
    setUploadedFile(null);
    setParsedData(null);
    setProgress(0);
    setError(null);
  }, []);

  // Check if error is related to OpenAI quota
  const isQuotaError = error?.includes('quota exceeded') || error?.includes('429');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Revenue Statement Parser</h1>
            </div>
            <div className="text-sm text-gray-500">
        </div>
        
        {/* Add API Test section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <OpenAITest />
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Upload Revenue Statement</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your PDF revenue statement and our AI will automatically parse the data 
            into a standardized Excel format for easy accounting and analysis.
          </p>
        </div>

        {/* Process Flow */}
        {stage !== 'setup' && (
          <div className="mb-12">
            <div className="flex items-center justify-center space-x-4 mb-8">
              {/* Step 1 */}
              <div className={`flex items-center space-x-2 ${
                stage === 'upload' ? 'text-blue-600' : 
                ['parsing', 'generating', 'complete'].includes(stage) ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage === 'upload' ? 'bg-blue-100 border-2 border-blue-600' :
                  ['parsing', 'generating', 'complete'].includes(stage) ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {['parsing', 'generating', 'complete'].includes(stage) ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                </div>
                <span className="font-medium">Upload</span>
              </div>

              <div className="w-8 h-px bg-gray-300"></div>

              {/* Step 2 */}
              <div className={`flex items-center space-x-2 ${
                stage === 'parsing' ? 'text-blue-600' : 
                ['generating', 'complete'].includes(stage) ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage === 'parsing' ? 'bg-blue-100 border-2 border-blue-600' :
                  ['generating', 'complete'].includes(stage) ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {stage === 'parsing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : ['generating', 'complete'].includes(stage) ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>
                <span className="font-medium">Parse</span>
              </div>

              <div className="w-8 h-px bg-gray-300"></div>

              {/* Step 3 */}
              <div className={`flex items-center space-x-2 ${
                stage === 'generating' ? 'text-blue-600' : 
                stage === 'complete' ? 'text-green-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  stage === 'generating' ? 'bg-blue-100 border-2 border-blue-600' :
                  stage === 'complete' ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  {stage === 'generating' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : stage === 'complete' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </div>
                <span className="font-medium">Download</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {stage === 'setup' && (
            <ApiKeySetup onConfigured={handleApiKeyConfigured} />
            <TestParser />
          )}

          {stage === 'upload' && (
            <FileUpload onFileUpload={handleFileUpload} />
          )}

          {(stage === 'parsing' || stage === 'generating') && (
            <ProcessingStatus 
              stage={stage}
              progress={progress}
              fileName={uploadedFile?.name || ''}
            />
          )}

          {stage === 'complete' && parsedData && (
            <DataPreview 
              data={parsedData}
              onDownload={handleDownload}
              onReset={handleReset}
            />
          )}

          {stage === 'error' && (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Processing Error</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              
              {/* Show additional help for quota errors */}
              {isQuotaError && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-lg mx-auto">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="font-medium text-yellow-800 mb-2">API Quota Exceeded</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Your OpenAI API usage has exceeded the current quota. To continue using the service:
                      </p>
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
                </div>
              )}
              
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {stage !== 'setup' && (
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
                <h4 className="font-semibold text-gray-900 mb-2">Excel Output</h4>
                <p className="text-sm text-gray-600">Standardized format ready for accounting software</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;