export const config = {
  openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY
} as const;

// Type assertion to ensure the API key is a string
export type Config = typeof config;

// Helper function to get the API key with type safety
export const getOpenAIKey = (): string => {
  if (!config.openaiApiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  return config.openaiApiKey;
};
