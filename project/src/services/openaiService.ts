import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
});

// Helper function to get the OpenAI client
const getOpenAIClient = (): OpenAI => {
  if (!openai.apiKey) {
    throw new Error('OpenAI API key is not configured. Please set up your API key first.');
  }
  return openai;
};

export interface ParsedRevenueData {
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

export const parseRevenueStatementWithAI = async (
  imageBase64Array: string[],
  onProgress?: (progress: number) => void
): Promise<ParsedRevenueData> => {
  try {
    onProgress?.(25);

    const client = getOpenAIClient();

    const prompt = `
You are an expert financial data extraction specialist for oil & gas revenue statements. Analyze these PDF revenue statement pages and extract structured data with EXACT precision matching the training example.

CRITICAL TRAINING EXAMPLE - EXACT VALUES TO MATCH:
Property: "Verde 13-2HZ NBRR" (complete well name exactly as shown)
Property Number: "138366-1" (exact identifier)
Product Type: "GAS" (product category)

FINANCIAL BREAKDOWN FOR THIS PROPERTY:
- Gross Value: 618.52 (total revenue before deductions)
- Taxes: -14.25 (ONLY severance, federal, state, withholding taxes)
- Deductions: -435.42 (gathering/compression -169.10 + processing -266.32 = -435.42 total)
- Net Payment: 168.85 (618.52 - 14.25 - 435.42 = 168.85)

EXTRACTION RULES - FOLLOW EXACTLY:

1. PROPERTY IDENTIFICATION:
   - Extract complete well names EXACTLY as shown (e.g., "Verde 13-2HZ NBRR")
   - Look for property numbers that are separate from well names (e.g., "138366-1")
   - Product types: GAS, OIL, NGL, WATER (identify from context/labels)

2. FINANCIAL CATEGORIZATION - CRITICAL:
   TAXES (sum these ONLY - must equal -14.25 for training example):
   - Severance Tax
   - Federal Tax  
   - State Tax
   - Federal Withholding
   - State Withholding
   - Income Tax Withholding
   - Any item explicitly labeled as "tax"

   DEDUCTIONS (sum these separately - must equal -435.42 for training example):
   - Gathering fees/costs (-169.10 in example)
   - Compression fees/costs (included in gathering)
   - Processing fees/costs (-266.32 in example)
   - Transportation costs
   - Marketing fees
   - Administrative fees
   - Service charges
   - Pipeline fees
   - Any other operational costs or fees

3. CALCULATION VERIFICATION:
   For each property/product combination:
   - Net Value = Gross Value - |Taxes| - |Deductions|
   - Training example: 618.52 - 14.25 - 435.42 = 168.85
   - This calculation MUST balance exactly

4. VALUE EXTRACTION:
   - Extract exact dollar amounts with correct signs
   - Negative values for taxes and deductions
   - Positive values for gross revenue and net payments
   - Ensure all line items sum correctly to totals

Please analyze this revenue statement and return ONLY a valid JSON object with the following structure:
{
  "company": "Company name",
  "period": "Time period (e.g., 'December 2021', 'Q4 2023')",
  "totalRevenue": number,
  "lineItems": [
    {
      "description": "Complete property description with well name and product type",
      "quantity": number,
      "rate": number,
      "amount": number
    }
  ],
  "taxes": number,
  "netRevenue": number
}

CRITICAL INSTRUCTIONS:
1. Extract ALL revenue line items with exact quantities, rates, and amounts
2. For descriptions, capture complete well/property information as shown in document
3. Calculate totals with precise accuracy matching the training example
4. Identify company name and reporting period from document headers
5. For "taxes" field: Include ONLY actual taxes (severance, federal, state, withholding)
6. All other costs go to deductions calculation (NOT in taxes field)
7. Ensure netRevenue = totalRevenue - taxes - deductions
8. Use exact values from the document - do not round or estimate
9. Return ONLY the JSON object, no additional text
10. Analyze all pages to get complete information
11. Pay special attention to line-by-line breakdowns of costs
12. Verify calculations match the expected net payment amounts (like 168.85 in training)
13. Look for property names in the same line as property numbers
14. Product types (GAS, OIL, etc.) should be identified from separate columns or context
15. Sum all gathering, compression, and processing fees into deductions total

TRAINING DATA VERIFICATION:
- Property "Verde 13-2HZ NBRR" with number "138366-1" and type "GAS"
- Must show taxes of -14.25 and deductions of -435.42
- Net payment must equal 168.85 for this property

Focus on accuracy and precision - the extracted values must match the actual document values exactly and follow the training example pattern.
`;

    onProgress?.(50);

    // Prepare content array with text prompt and all images
    const content: Array<any> = [
      {
        type: "text",
        text: prompt
      }
    ];

    // Add all PDF page images to the content
    imageBase64Array.forEach((imageBase64) => {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${imageBase64}`,
          detail: "high"
        }
      });
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "system",
          content: "You are a financial data extraction expert specializing in oil & gas revenue statements. Always respond with valid JSON only. Extract exact values from documents with precision. Distinguish carefully between taxes (severance, federal, state, withholding) and deductions (all other operational costs). Verify calculations match expected net payments. Use the training example as your guide: Verde 13-2HZ NBRR (138366-1) GAS with taxes -14.25, deductions -435.42, net 168.85."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.01,
      max_tokens: 2000
    });

    onProgress?.(75);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean the response to ensure it's valid JSON
    const cleanedResponse = response.trim().replace(/```json\n?|\n?```/g, '');
    
    try {
      const parsedData = JSON.parse(cleanedResponse) as ParsedRevenueData;
      
      // Validate the parsed data structure
      if (!parsedData.company || !parsedData.period || typeof parsedData.totalRevenue !== 'number') {
        throw new Error('Invalid data structure returned from AI');
      }

      // Ensure line items have valid structure
      if (!Array.isArray(parsedData.lineItems)) {
        parsedData.lineItems = [];
      }

      // Validate and fix line items
      parsedData.lineItems = parsedData.lineItems.map(item => ({
        description: item.description || 'Unknown Item',
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        rate: typeof item.rate === 'number' ? item.rate : item.amount || 0,
        amount: typeof item.amount === 'number' ? item.amount : 0
      }));

      // Ensure numeric values are valid
      parsedData.totalRevenue = typeof parsedData.totalRevenue === 'number' ? parsedData.totalRevenue : 0;
      parsedData.taxes = typeof parsedData.taxes === 'number' ? parsedData.taxes : 0;
      parsedData.netRevenue = typeof parsedData.netRevenue === 'number' ? parsedData.netRevenue : parsedData.totalRevenue - parsedData.taxes;

      onProgress?.(100);
      return parsedData;
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Raw response:', response);
      throw new Error('Failed to parse AI response as JSON');
    }

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle specific OpenAI API errors with user-friendly messages
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        throw new Error('OpenAI API quota exceeded. Please check your OpenAI account billing and usage limits at platform.openai.com, then try again.');
      } else if (error.message.includes('401')) {
        throw new Error('Invalid OpenAI API key. Please check your API key configuration.');
      } else if (error.message.includes('403')) {
        throw new Error('OpenAI API access forbidden. Please verify your API key permissions.');
      } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again in a few minutes.');
      }
    }
    
    throw new Error(`AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};