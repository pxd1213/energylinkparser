import OpenAI from 'openai';

export const testOpenAIConnection = async (): Promise<string> => {
  try {
    const openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY,
      dangerouslyAllowBrowser: true
    });

    // Test with a simple chat completion
    const completion = await openai.chat.completions.create({
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

    return `Successfully connected! Response: ${completion.choices[0].message.content}`;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return 'Unknown error occurred';
  }
};
