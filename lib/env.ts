export const env = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  cronSecret: process.env.CRON_SECRET,
  useMockSources: process.env.USE_MOCK_SOURCES === "true",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini"
};

export const hasSupabase = Boolean(env.supabaseUrl && env.supabaseKey);
export const hasOpenAI = Boolean(env.openaiApiKey);
