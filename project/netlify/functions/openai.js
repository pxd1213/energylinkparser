const OpenAI = require('openai');

exports.handler = async (event) => {
  try {
    const { type, data } = JSON.parse(event.body);
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'OpenAI API key not configured' })
      };
    }

    const client = new OpenAI({ apiKey });

    switch (type) {
      case 'test':
        const testResponse = await client.chat.completions.create({
          model: "gpt-4-vision-preview",
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
          body: JSON.stringify({ success: true, response: testResponse })
        };

      case 'parseRevenue':
        // Implement your revenue parsing logic here
        const response = await client.chat.completions.create({
          model: "gpt-4-vision-preview",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that helps parse revenue statements."
            },
            {
              role: "user",
              content: data.prompt
            }
          ]
        });
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, response: response })
        };

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid request type' })
        };
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
