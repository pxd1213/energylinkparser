const OpenAI = require('openai');
const { Configuration, OpenAIApi } = OpenAI;

exports.handler = async (event) => {
  try {
    const { type, data } = JSON.parse(event.body);
    
    // Initialize OpenAI client
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    });
    const openai = new OpenAIApi(configuration);

    switch (type) {
      case 'test':
        // Test connection
        const testResponse = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant."
            },
            {
              role: "user",
              content: "Hello, what is your API version?"
            }
          ]
        });
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            response: testResponse.data
          })
        };

      case 'parseRevenue':
        // Parse revenue statement from PDF
        const { pdfBase64 } = data;
        
        // Convert base64 to buffer
        const buffer = Buffer.from(pdfBase64, 'base64');
        
        // Use OpenAI's document parsing capabilities
        const response = await openai.createChatCompletion({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "system",
              content: "You are an expert financial data extraction specialist for oil & gas revenue statements."
            },
            {
              role: "user",
              content: "Please analyze this EnergyLink revenue statement and extract the following information:\n\n1. Company name\n2. Statement period\n3. Total revenue\n4. Line items with quantities, rates, and amounts\n5. Taxes\n6. Net revenue\n\nFormat the response as a JSON object with the following structure:\n\n{\n  company: string,\n  period: string,\n  totalRevenue: number,\n  lineItems: [\n    {\n      description: string,\n      quantity: number,\n      rate: number,\n      amount: number\n    }\n  ],\n  taxes: number,\n  netRevenue: number\n}"
            },
            {
              role: "assistant",
              content: {
                type: "file",
                file: {
                  url: "data:application/pdf;base64," + pdfBase64
                }
              }
            }
          ]
        });
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            response: response.data.choices[0].message.content
          })
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: 'Invalid request type'
          })
        };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
