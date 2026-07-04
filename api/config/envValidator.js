// ================= REQUIRED ENVIRONMENT VARIABLES =================
const REQUIRED_ENV_VARS = [
  // Backend
  "MONGO_URI",
  "JWT_SECRET",
  "PORT",

  // General
  "LLM_PROVIDER",
  "LLM_TEMPERATURE",
  "LLM_MAX_TOKENS",

  // OpenAI
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",

  // Gemini
  "GEMINI_API_KEY",
  "GEMINI_BASE_URL",
  "GEMINI_MODEL",

  // Anthropic
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_VERSION",

  // NVIDIA
  "NVIDIA_API_KEY",
  "NVIDIA_BASE_URL",
  "NVIDIA_MODEL",

  // Custom Provider
  "CUSTOM_PROVIDER_TYPE",
  "CUSTOM_API_KEY",
  "CUSTOM_BASE_URL",
  "CUSTOM_MODEL",
  "CUSTOM_ANTHROPIC_VERSION",

  // GitHub Integration
  "GITHUB_TOKEN",
  "GITHUB_REPO_OWNER",
  "REPO_FILE_LIMIT",
  "REPO_FILE_BYTES",
  "REPO_CONTEXT_BYTES",

  // Frontend
  "VITE_API_BASE_URL",

  // Supabase
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

// ================= VALIDATE ENV =================
export const validateEnv = () => {
  const missingVars = REQUIRED_ENV_VARS.filter((varName) => {
    const value = process.env[varName];
    return !value || value.trim() === "";
  });

  if (missingVars.length > 0) {
    console.error("Environment validation failed.");
    console.error(`Missing variables: ${missingVars.join(", ")}`);
    console.error("Please update your .env file before starting the server.");
    process.exit(1);
  }

  console.log("Environment variables validated successfully.");
}; 