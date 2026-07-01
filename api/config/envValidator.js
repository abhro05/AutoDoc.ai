// config/envValidator.js

import dotenv from 'dotenv';
dotenv.config();

// Required environment variables with descriptions and examples
const requiredEnvVars = {
  // Database
  MONGO_URI: {
    value: process.env.MONGO_URI,
    description: 'MongoDB connection string',
    example: 'mongodb://localhost:27017/your-db',
    required: true
  },
  
  // JWT
  JWT_SECRET: {
    value: process.env.JWT_SECRET,
    description: 'JWT secret key for authentication',
    example: 'your-secret-key-min-32-characters',
    required: true
  },
  
  // Server
  PORT: {
    value: process.env.PORT,
    description: 'Server port number',
    example: '5000',
    defaultValue: '5000',
    required: false
  },
  
  // Supabase
  SUPABASE_URL: {
    value: process.env.SUPABASE_URL,
    description: 'Supabase project URL',
    example: 'https://your-project.supabase.co',
    required: true
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    value: process.env.SUPABASE_SERVICE_ROLE_KEY,
    description: 'Supabase service role key',
    example: 'eyJhbGciOiJIUzI1NiIs...',
    required: true
  },
  VITE_SUPABASE_URL: {
    value: process.env.VITE_SUPABASE_URL,
    description: 'Supabase URL for frontend',
    example: 'https://your-project.supabase.co',
    required: true
  },
  VITE_SUPABASE_ANON_KEY: {
    value: process.env.VITE_SUPABASE_ANON_KEY,
    description: 'Supabase anonymous key for frontend',
    example: 'eyJhbGciOiJIUzI1NiIs...',
    required: true
  },
  
  // LLM Providers (at least one required)
  OPENAI_API_KEY: {
    value: process.env.OPENAI_API_KEY,
    description: 'OpenAI API key',
    example: 'sk-...',
    required: false,
    provider: 'OpenAI'
  },
  OPENAI_BASE_URL: {
    value: process.env.OPENAI_BASE_URL,
    description: 'OpenAI base URL',
    example: 'https://api.openai.com/v1',
    defaultValue: 'https://api.openai.com/v1',
    required: false
  },
  OPENAI_MODEL: {
    value: process.env.OPENAI_MODEL,
    description: 'OpenAI model name',
    example: 'gpt-4o-2024-08-06',
    defaultValue: 'gpt-4o-2024-08-06',
    required: false
  },
  
  GEMINI_API_KEY: {
    value: process.env.GEMINI_API_KEY,
    description: 'Google Gemini API key',
    example: 'AIzaSy...',
    required: false,
    provider: 'Gemini'
  },
  GEMINI_BASE_URL: {
    value: process.env.GEMINI_BASE_URL,
    description: 'Gemini base URL',
    example: 'https://generativelanguage.googleapis.com/v1beta',
    defaultValue: 'https://generativelanguage.googleapis.com/v1beta',
    required: false
  },
  GEMINI_MODEL: {
    value: process.env.GEMINI_MODEL,
    description: 'Gemini model name',
    example: 'models/gemini-pro',
    defaultValue: 'models/gemini-pro',
    required: false
  },
  
  ANTHROPIC_API_KEY: {
    value: process.env.ANTHROPIC_API_KEY,
    description: 'Anthropic API key',
    example: 'sk-ant-...',
    required: false,
    provider: 'Anthropic'
  },
  ANTHROPIC_BASE_URL: {
    value: process.env.ANTHROPIC_BASE_URL,
    description: 'Anthropic base URL',
    example: 'https://api.anthropic.com/v1',
    defaultValue: 'https://api.anthropic.com/v1',
    required: false
  },
  ANTHROPIC_MODEL: {
    value: process.env.ANTHROPIC_MODEL,
    description: 'Anthropic model name',
    example: 'claude-3-opus-20240229',
    required: false
  },
  ANTHROPIC_VERSION: {
    value: process.env.ANTHROPIC_VERSION,
    description: 'Anthropic API version',
    example: '2023-06-01',
    defaultValue: '2023-06-01',
    required: false
  },
  
  NVIDIA_API_KEY: {
    value: process.env.NVIDIA_API_KEY,
    description: 'NVIDIA API key',
    example: 'nv-...',
    required: false,
    provider: 'NVIDIA'
  },
  NVIDIA_BASE_URL: {
    value: process.env.NVIDIA_BASE_URL,
    description: 'NVIDIA base URL',
    example: 'https://integrate.api.nvidia.com/v1',
    defaultValue: 'https://integrate.api.nvidia.com/v1',
    required: false
  },
  NVIDIA_MODEL: {
    value: process.env.NVIDIA_MODEL,
    description: 'NVIDIA model name',
    example: 'meta/llama-3.1-70b-instruct',
    required: false
  },
  
  // LLM General
  LLM_PROVIDER: {
    value: process.env.LLM_PROVIDER,
    description: 'Default LLM provider',
    example: 'openai',
    defaultValue: 'openai',
    required: false
  },
  LLM_TEMPERATURE: {
    value: process.env.LLM_TEMPERATURE,
    description: 'LLM temperature (0.0 - 1.0)',
    example: '0.2',
    defaultValue: '0.2',
    required: false
  },
  LLM_MAX_TOKENS: {
    value: process.env.LLM_MAX_TOKENS,
    description: 'Maximum tokens for LLM responses',
    example: '4096',
    defaultValue: '4096',
    required: false
  },
  
  // Custom Provider
  CUSTOM_PROVIDER_TYPE: {
    value: process.env.CUSTOM_PROVIDER_TYPE,
    description: 'Custom provider type (openai, anthropic, etc.)',
    example: 'openai',
    required: false
  },
  CUSTOM_API_KEY: {
    value: process.env.CUSTOM_API_KEY,
    description: 'Custom provider API key',
    example: 'your-custom-api-key',
    required: false
  },
  CUSTOM_BASE_URL: {
    value: process.env.CUSTOM_BASE_URL,
    description: 'Custom provider base URL',
    example: 'https://your-custom-api.com/v1',
    required: false
  },
  CUSTOM_MODEL: {
    value: process.env.CUSTOM_MODEL,
    description: 'Custom provider model name',
    example: 'your-model-name',
    required: false
  },
  CUSTOM_ANTHROPIC_VERSION: {
    value: process.env.CUSTOM_ANTHROPIC_VERSION,
    description: 'Custom Anthropic API version',
    example: '2023-06-01',
    defaultValue: '2023-06-01',
    required: false
  },
  
  // GitHub Integration
  GITHUB_TOKEN: {
    value: process.env.GITHUB_TOKEN,
    description: 'GitHub personal access token',
    example: 'ghp_...',
    required: true
  },
  GITHUB_REPO_OWNER: {
    value: process.env.GITHUB_REPO_OWNER,
    description: 'GitHub repository owner',
    example: 'your-username',
    required: true
  },
  REPO_FILE_LIMIT: {
    value: process.env.REPO_FILE_LIMIT,
    description: 'Maximum files to process from repository',
    example: '24',
    defaultValue: '24',
    required: false
  },
  REPO_FILE_BYTES: {
    value: process.env.REPO_FILE_BYTES,
    description: 'Maximum file size in bytes',
    example: '6000',
    defaultValue: '6000',
    required: false
  },
  REPO_CONTEXT_BYTES: {
    value: process.env.REPO_CONTEXT_BYTES,
    description: 'Maximum context bytes',
    example: '90000',
    defaultValue: '90000',
    required: false
  },
  
  // Frontend
  VITE_API_BASE_URL: {
    value: process.env.VITE_API_BASE_URL,
    description: 'Frontend API base URL',
    example: 'http://localhost:5000/api',
    required: false
  }
};

// Optional but recommended variables
const optionalEnvVars = {
  NODE_ENV: {
    value: process.env.NODE_ENV,
    description: 'Node environment',
    defaultValue: 'development',
    validValues: ['development', 'production', 'test']
  },
  RATE_LIMIT_WINDOW_MS: {
    value: process.env.RATE_LIMIT_WINDOW_MS,
    description: 'Rate limit window in milliseconds',
    defaultValue: '900000'
  },
  RATE_LIMIT_MAX: {
    value: process.env.RATE_LIMIT_MAX,
    description: 'Maximum requests per window',
    defaultValue: '100'
  }
};

// Check if at least one LLM provider is configured
const hasLLMProvider = () => {
  const providers = ['OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'NVIDIA_API_KEY'];
  return providers.some(provider => process.env[provider] && process.env[provider].trim() !== '');
};

// Get configured LLM providers
const getConfiguredProviders = () => {
  const providers = [];
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '') providers.push('OpenAI');
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') providers.push('Gemini');
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim() !== '') providers.push('Anthropic');
  if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.trim() !== '') providers.push('NVIDIA');
  return providers;
};

// Validate function
export const validateEnv = () => {
  const errors = [];
  const warnings = [];

  console.log('Validating environment variables...');

  // Check required variables (non-optional)
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    if (config.required && (!config.value || config.value.trim() === '')) {
      errors.push({
        key,
        message: `Missing required environment variable: ${key}`,
        description: config.description,
        example: config.example
      });
    }
  }

  // Check at least one LLM provider
  if (!hasLLMProvider()) {
    errors.push({
      key: 'LLM_PROVIDER',
      message: 'At least one LLM provider API key is required',
      description: 'Set OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY, or NVIDIA_API_KEY',
      example: 'OPENAI_API_KEY=sk-...'
    });
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push({
      key: 'JWT_SECRET',
      message: 'JWT_SECRET should be at least 32 characters long for security',
      current: `${process.env.JWT_SECRET.length} characters`,
      suggestion: 'Generate a strong secret using: openssl rand -base64 32'
    });
  }

  // Validate MongoDB URI format
  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    warnings.push({
      key: 'MONGO_URI',
      message: 'MONGO_URI should start with "mongodb://" or "mongodb+srv://"',
      current: process.env.MONGO_URI.substring(0, 20) + '...'
    });
  }

  // Check optional variables
  for (const [key, config] of Object.entries(optionalEnvVars)) {
    if (!config.value || config.value.trim() === '') {
      warnings.push({
        key,
        message: `Optional variable ${key} not set, using default: ${config.defaultValue}`,
        defaultValue: config.defaultValue
      });
    }
  }

  // Check environment
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    warnings.push({
      key: 'NODE_ENV',
      message: `Invalid NODE_ENV value: ${process.env.NODE_ENV}`,
      validValues: ['development', 'production', 'test']
    });
  }

  // Log results
  if (errors.length > 0) {
    console.error('\nEnvironment validation failed!');
    console.error('='.repeat(50));
    errors.forEach(err => {
      console.error(`\n[ERROR] ${err.key}: ${err.message}`);
      if (err.description) console.error(`   Description: ${err.description}`);
      if (err.example) console.error(`   Example: ${err.example}`);
    });
    console.error('\n' + '='.repeat(50));
    console.error('Please fix the issues above and restart the server.\n');
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\nEnvironment warnings:');
    console.warn('='.repeat(50));
    warnings.forEach(warn => {
      console.warn(`\n[WARNING] ${warn.key}: ${warn.message}`);
      if (warn.suggestion) console.warn(`   Suggestion: ${warn.suggestion}`);
      if (warn.defaultValue) console.warn(`   Default: ${warn.defaultValue}`);
    });
    console.warn('\n' + '='.repeat(50) + '\n');
  }

  console.log('Environment validation passed!');
  const configuredProviders = getConfiguredProviders();
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${process.env.PORT || 5000}`);
  console.log(`Database: ${process.env.MONGO_URI ? 'Configured' : 'Missing'}`);
  console.log(`JWT: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}`);
  console.log(`LLM Providers: ${configuredProviders.length > 0 ? configuredProviders.join(', ') : 'None configured'}`);
  if (configuredProviders.length > 0) {
    console.log(`Default Provider: ${process.env.LLM_PROVIDER || 'openai'}`);
  }
  console.log('');

  return { errors, warnings };
};

// Export default
export default validateEnv;