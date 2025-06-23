import React from 'react';
import { Download, RotateCcw, CheckCircle, DollarSign, Calendar, Building, FileSpreadsheet, FileCode } from 'lucide-react';
import { generateCDEXFile, validateCDEXData } from '../utils/cdexGenerator';

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

interface DataPreviewProps {
  data: ParsedData;
  onDownload: () => void;
  onReset: () => void;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, onDownload, onReset }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const handleCDEXDownload = () => {
    try {
      generateCDEXFile(data, 'revenue-statement');
    } catch (error) {
      alert(`CDEX Export Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Validate CDEX compatibility
  const cdexValidation = validateCDEXData(data);

  return (
    <div className="p-8">
      {/* Success Header */}
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Complete!
        </h3>
        <p className="text-gray-600">
          Your revenue statement has been successfully parsed and is ready for export.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Company</p>
              <p className="font-semibold text-gray-900">{data.company}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-green-600 font-medium">Period</p>
              <p className="font-semibold text-gray-900">{data.period}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-orange-600 font-medium">Net Revenue</p>
              <p className="font-semibold text-gray-900">{formatCurrency(data.netRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table Preview */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Extracted Line Items</h4>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Quantity</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.lineItems.slice(0, 5).map((item, index) => (
                  <tr key={index} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatNumber(item.quantity)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.rate)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                {data.lineItems.length > 5 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-sm text-gray-500 text-center italic">
                      ... and {data.lineItems.length - 5} more items
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Gross Revenue:</span>
            <span className="font-medium">{formatCurrency(data.totalRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxes & Deductions:</span>
            <span className="font-medium">{formatCurrency(data.taxes)}</span>
          </div>
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Net Revenue:</span>
              <span className="font-bold text-green-600">{formatCurrency(data.netRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Export Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Excel Export */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
              <div>
                <h5 className="font-medium text-gray-900">Excel Format</h5>
                <p className="text-sm text-gray-600">Standard spreadsheet format</p>
              </div>
            </div>
            <button
              onClick={onDownload}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Download Excel
            </button>
          </div>

          {/* CDEX Export */}
          <div className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
            <div className="flex items-center space-x-3 mb-3">
              <FileCode className="w-6 h-6 text-purple-600" />
              <div>
                <h5 className="font-medium text-gray-900">CDEX Format</h5>
                <p className="text-sm text-gray-600">Accounting system compatible</p>
              </div>
            </div>
            
            {!cdexValidation.isValid && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <p className="font-medium">Validation Issues:</p>
                <ul className="list-disc list-inside mt-1">
                  {cdexValidation.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <button
              onClick={handleCDEXDownload}
              disabled={!cdexValidation.isValid}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                cdexValidation.isValid
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4 inline mr-2" />
              Export as CDEX
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onReset}
          className="flex items-center justify-center px-8 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Process Another File
        </button>
      </div>

      {/* Additional Info */}
      <div className="mt-8 text-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-1">Excel Export</p>
            <p>Contains all extracted data with proper formatting and formulas for easy integration into spreadsheet applications.</p>
          </div>
          <div className="text-sm text-gray-500">
            <p className="font-medium mb-1">CDEX Export</p>
            <p>Structured XML format with account codes, transaction dates, and debit/credit entries for accounting system integration.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;