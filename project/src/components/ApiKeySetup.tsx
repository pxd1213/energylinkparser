import React, { useState } from 'react';
import { Key, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

interface ApiKeySetupProps {
  onConfigured: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onConfigured }) => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="p-12 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Key className="w-8 h-8 text-blue-600" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        OpenAI API Key Required
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        To use AI-powered PDF parsing, you need to configure your OpenAI API key. 
        This enables real-time document processing with ChatGPT-4.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 max-w-lg mx-auto">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="font-medium text-amber-800 mb-1">Environment Variable Required</h4>
            <p className="text-sm text-amber-700">
              Add your OpenAI API key as <code className="bg-amber-100 px-1 rounded">VITE_OPENAI_API_KEY</code> in your environment variables.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showInstructions ? 'Hide' : 'Show'} Setup Instructions
        </button>

        {showInstructions && (
          <div className="bg-gray-50 rounded-lg p-6 text-left max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 mb-4">Setup Instructions:</h4>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">1</span>
                <div>
                  <span>Get your OpenAI API key from </span>
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                  >
                    OpenAI Platform <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">2</span>
                <span>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file in your project root</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">3</span>
                <div>
                  <span>Add: </span>
                  <code className="bg-gray-200 px-2 py-1 rounded block mt-1">
                    VITE_OPENAI_API_KEY=your_api_key_here
                  </code>
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">4</span>
                <span>Restart your development server</span>
              </li>
            </ol>
          </div>
        )}

        <div className="pt-4">
          <button
            onClick={() => {
              // Check if API key is now available
              if (import.meta.env.VITE_OPENAI_API_KEY) {
                onConfigured();
              } else {
                alert('Please add your OpenAI API key to the environment variables and restart the server.');
              }
            }}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>I've Added My API Key</span>
          </button>
        </div>
      </div>

      <div className="mt-8 text-xs text-gray-500 max-w-lg mx-auto">
        <p>
          <strong>Note:</strong> Your API key is used directly in the browser for this demo. 
          In production, API calls should be made through your backend server for security.
        </p>
      </div>
    </div>
  );
};

export default ApiKeySetup;