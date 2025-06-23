export interface ProcessingStage {
  stage: 'setup' | 'upload' | 'processing' | 'preview' | 'error';
  progress?: number;
  error?: string;
}

export interface ParsedData {
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

export interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
}

export interface DataPreviewProps {
  data: ParsedData;
  onExport: () => Promise<void>;
}

export interface ProcessingStatusProps {
  progress: number;
}

export interface ApiKeySetupProps {
  onConfigured: () => void;
}

export interface TestParserProps {
  // Add test parser props if needed
}
