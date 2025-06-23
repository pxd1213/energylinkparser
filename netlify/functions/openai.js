const OpenAI = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async function(event) {
  try {
    const { type, data } = JSON.parse(event.body);
    
    if (type === 'test') {
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }

    if (type === 'parseRevenue') {
      const { pdfBase64 } = data;
      
      // Convert base64 to image URL
      const imageUrl = `data:image/png;base64,${pdfBase64}`;
      
      // Call OpenAI Vision API with improved prompt
      const response = await client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a financial document parser. Extract financial data from revenue statements and return it in a structured JSON format.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please extract the following information from this revenue statement: company name, period, total revenue, line items with descriptions and amounts, taxes, and net revenue. Return the data in a JSON object with these fields.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      // Validate response
      if (!response.choices[0].message.content) {
        throw new Error('No content in OpenAI response');
      }

      return {
        statusCode: 200,
        body: JSON.stringify(response.choices[0].message.content)
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request type' })
    };
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during processing';
    return {
      statusCode: 500,
      body: JSON.stringify({ error: errorMessage })
    };
  }
};
