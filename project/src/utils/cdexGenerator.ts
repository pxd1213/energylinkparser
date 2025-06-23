interface CDEXLineItem {
  accountCode: string;
  transactionDate: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  documentReference: string;
  transactionId: string;
}

interface CDEXData {
  header: {
    companyName: string;
    reportingPeriod: string;
    generatedDate: string;
    documentType: string;
    version: string;
  };
  transactions: CDEXLineItem[];
  summary: {
    totalDebits: number;
    totalCredits: number;
    transactionCount: number;
  };
}

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

// CDEX account code mapping for revenue statements
const ACCOUNT_CODE_MAPPING = {
  revenue: '4000', // Revenue accounts typically start with 4
  taxes: '2200',   // Tax liability accounts
  deductions: '6000', // Expense/deduction accounts
  receivables: '1200' // Accounts receivable
};

export const validateCDEXData = (data: ParsedData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.company || data.company.trim() === '') {
    errors.push('Company name is required');
  }

  if (!data.period || data.period.trim() === '') {
    errors.push('Reporting period is required');
  }

  if (typeof data.totalRevenue !== 'number' || data.totalRevenue < 0) {
    errors.push('Valid total revenue amount is required');
  }

  if (!Array.isArray(data.lineItems) || data.lineItems.length === 0) {
    errors.push('At least one revenue line item is required');
  }

  // Validate each line item
  data.lineItems.forEach((item, index) => {
    if (!item.description || item.description.trim() === '') {
      errors.push(`Line item ${index + 1}: Description is required`);
    }
    if (typeof item.amount !== 'number' || item.amount < 0) {
      errors.push(`Line item ${index + 1}: Valid amount is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

const generateTransactionId = (index: number, date: string): string => {
  const timestamp = new Date(date).getTime();
  return `TXN-${timestamp}-${String(index).padStart(4, '0')}`;
};

const formatDateForCDEX = (period: string): string => {
  // Try to parse common period formats
  const currentYear = new Date().getFullYear();
  
  // Handle formats like "December 2021", "Q4 2023", "2023-12", etc.
  if (period.includes('December') || period.includes('Dec')) {
    const year = period.match(/\d{4}/)?.[0] || currentYear.toString();
    return `${year}-12-31`;
  }
  
  if (period.includes('Q4')) {
    const year = period.match(/\d{4}/)?.[0] || currentYear.toString();
    return `${year}-12-31`;
  }
  
  if (period.includes('Q3')) {
    const year = period.match(/\d{4}/)?.[0] || currentYear.toString();
    return `${year}-09-30`;
  }
  
  if (period.includes('Q2')) {
    const year = period.match(/\d{4}/)?.[0] || currentYear.toString();
    return `${year}-06-30`;
  }
  
  if (period.includes('Q1')) {
    const year = period.match(/\d{4}/)?.[0] || currentYear.toString();
    return `${year}-03-31`;
  }
  
  // Default to end of current year
  return `${currentYear}-12-31`;
};

export const convertToCDEXFormat = (data: ParsedData, originalFileName: string): CDEXData => {
  const transactionDate = formatDateForCDEX(data.period);
  const documentRef = originalFileName.replace(/\.[^/.]+$/, ''); // Remove file extension
  
  const transactions: CDEXLineItem[] = [];
  
  // Add revenue line items as credit entries
  data.lineItems.forEach((item, index) => {
    transactions.push({
      accountCode: ACCOUNT_CODE_MAPPING.revenue,
      transactionDate,
      debitAmount: 0,
      creditAmount: item.amount,
      description: item.description,
      documentReference: documentRef,
      transactionId: generateTransactionId(index + 1, transactionDate)
    });
  });
  
  // Add accounts receivable debit entry (balancing entry for revenue)
  transactions.push({
    accountCode: ACCOUNT_CODE_MAPPING.receivables,
    transactionDate,
    debitAmount: data.totalRevenue,
    creditAmount: 0,
    description: `Accounts Receivable - ${data.company} Revenue`,
    documentReference: documentRef,
    transactionId: generateTransactionId(transactions.length + 1, transactionDate)
  });
  
  // Add tax liability entry if taxes exist
  if (data.taxes > 0) {
    transactions.push({
      accountCode: ACCOUNT_CODE_MAPPING.taxes,
      transactionDate,
      debitAmount: 0,
      creditAmount: data.taxes,
      description: 'Tax Liability',
      documentReference: documentRef,
      transactionId: generateTransactionId(transactions.length + 1, transactionDate)
    });
  }
  
  // Calculate totals
  const totalDebits = transactions.reduce((sum, txn) => sum + txn.debitAmount, 0);
  const totalCredits = transactions.reduce((sum, txn) => sum + txn.creditAmount, 0);
  
  return {
    header: {
      companyName: data.company,
      reportingPeriod: data.period,
      generatedDate: new Date().toISOString().split('T')[0],
      documentType: 'Revenue Statement',
      version: '1.0'
    },
    transactions,
    summary: {
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
      transactionCount: transactions.length
    }
  };
};

export const generateCDEXFile = (data: ParsedData, originalFileName: string): void => {
  // Validate data before export
  const validation = validateCDEXData(data);
  if (!validation.isValid) {
    throw new Error(`CDEX Export Error:\n${validation.errors.join('\n')}`);
  }
  
  try {
    const cdexData = convertToCDEXFormat(data, originalFileName);
    
    // Generate XML format for CDEX
    const xmlContent = generateCDEXXML(cdexData);
    
    // Create and download file
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    
    const cleanFileName = originalFileName.replace(/\.[^/.]+$/, '');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `${cleanFileName}_cdex_${timestamp}.xml`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('CDEX generation error:', error);
    throw new Error(`Failed to generate CDEX file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const generateCDEXXML = (cdexData: CDEXData): string => {
  const escapeXML = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<cdex:AccountingDocument xmlns:cdex="http://cdex.org/schema/v1.0" version="1.0">\n';
  
  // Header section
  xml += '  <cdex:Header>\n';
  xml += `    <cdex:CompanyName>${escapeXML(cdexData.header.companyName)}</cdex:CompanyName>\n`;
  xml += `    <cdex:ReportingPeriod>${escapeXML(cdexData.header.reportingPeriod)}</cdex:ReportingPeriod>\n`;
  xml += `    <cdex:GeneratedDate>${cdexData.header.generatedDate}</cdex:GeneratedDate>\n`;
  xml += `    <cdex:DocumentType>${escapeXML(cdexData.header.documentType)}</cdex:DocumentType>\n`;
  xml += `    <cdex:Version>${cdexData.header.version}</cdex:Version>\n`;
  xml += '  </cdex:Header>\n';
  
  // Transactions section
  xml += '  <cdex:Transactions>\n';
  cdexData.transactions.forEach(transaction => {
    xml += '    <cdex:Transaction>\n';
    xml += `      <cdex:TransactionId>${transaction.transactionId}</cdex:TransactionId>\n`;
    xml += `      <cdex:AccountCode>${transaction.accountCode}</cdex:AccountCode>\n`;
    xml += `      <cdex:TransactionDate>${transaction.transactionDate}</cdex:TransactionDate>\n`;
    xml += `      <cdex:DebitAmount>${transaction.debitAmount.toFixed(2)}</cdex:DebitAmount>\n`;
    xml += `      <cdex:CreditAmount>${transaction.creditAmount.toFixed(2)}</cdex:CreditAmount>\n`;
    xml += `      <cdex:Description>${escapeXML(transaction.description)}</cdex:Description>\n`;
    xml += `      <cdex:DocumentReference>${escapeXML(transaction.documentReference)}</cdex:DocumentReference>\n`;
    xml += '    </cdex:Transaction>\n';
  });
  xml += '  </cdex:Transactions>\n';
  
  // Summary section
  xml += '  <cdex:Summary>\n';
  xml += `    <cdex:TotalDebits>${cdexData.summary.totalDebits.toFixed(2)}</cdex:TotalDebits>\n`;
  xml += `    <cdex:TotalCredits>${cdexData.summary.totalCredits.toFixed(2)}</cdex:TotalCredits>\n`;
  xml += `    <cdex:TransactionCount>${cdexData.summary.transactionCount}</cdex:TransactionCount>\n`;
  xml += '  </cdex:Summary>\n';
  
  xml += '</cdex:AccountingDocument>\n';
  
  return xml;
};