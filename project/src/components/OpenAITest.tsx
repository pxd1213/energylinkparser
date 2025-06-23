import React, { useState, useCallback } from 'react';
import { TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { testOpenAIConnection } from '../services/openaiTest';

const OpenAITest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = useCallback(async () => {
    setIsTesting(true);
    try {
      const result = await testOpenAIConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult('Error occurred during test');
    } finally {
      setIsTesting(false);
    }
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center space-x-2 mb-4">
        <TestTube className="w-6 h-6 text-blue-600" />
        <h2 className="text-lg font-semibold">OpenAI API Test</h2>
      </div>

      <button
        onClick={handleTest}
        disabled={isTesting}
        className={`px-6 py-2 rounded-lg transition-colors ${
          isTesting
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isTesting ? 'Testing...' : 'Test Connection'}
      </button>

      {testResult && (
        <div className="mt-4 p-4 rounded-lg ${
          testResult.includes('Error')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }">
          <div className="flex items-center space-x-2">
            {testResult.includes('Error') ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>{testResult}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpenAITest;
