import React from 'react';
import { Loader2, FileText, Bot, Table } from 'lucide-react';

interface ProcessingStatusProps {
  stage: 'parsing' | 'generating';
  progress: number;
  fileName: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ stage, progress, fileName }) => {
  const getStageInfo = () => {
    switch (stage) {
      case 'parsing':
        return {
          icon: Bot,
          title: 'AI Processing Document',
          description: 'Extracting text from PDF and analyzing with ChatGPT-4 for structured data extraction',
          color: 'blue'
        };
      case 'generating':
        return {
          icon: Table,
          title: 'Generating Excel File',
          description: 'Creating standardized Excel format with proper formatting and calculations',
          color: 'green'
        };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;

  return (
    <div className="p-12 text-center">
      <div className="mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-${stageInfo.color}-100 flex items-center justify-center`}>
          {stage === 'parsing' ? (
            <Loader2 className={`w-8 h-8 text-${stageInfo.color}-600 animate-spin`} />
          ) : (
            <Icon className={`w-8 h-8 text-${stageInfo.color}-600`} />
          )}
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {stageInfo.title}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {stageInfo.description}
        </p>
      </div>

      {/* File Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`bg-${stageInfo.color}-600 h-2 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Processing Steps */}
      <div className="mt-8 text-left max-w-md mx-auto">
        <div className="space-y-3">
          <div className={`flex items-center space-x-3 ${
            progress > 10 ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span className="text-sm">PDF text extraction</span>
          </div>
          <div className={`flex items-center space-x-3 ${
            progress > 30 ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span className="text-sm">AI analysis with ChatGPT-4</span>
          </div>
          <div className={`flex items-center space-x-3 ${
            progress > 75 ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span className="text-sm">Data validation & formatting</span>
          </div>
          <div className={`flex items-center space-x-3 ${
            progress > 90 ? 'text-blue-600' : 'text-gray-400'
          }`}>
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span className="text-sm">Excel file generation</span>
          </div>
        </div>
      </div>

      {stage === 'parsing' && (
        <div className="mt-6 text-xs text-gray-500">
          <p>This may take 30-60 seconds depending on document complexity</p>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;