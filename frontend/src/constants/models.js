/**
 * constants/models.js
 * Centralised list of all supported AI models and providers.
 * Used by ChatInput (dropdown) and SettingsModal (suggested models).
 */

export const MODELS = [
  // Gemini
  { value: "gemini-2.5-flash",      label: "Gemini 2.5 Flash",      provider: "gemini" },
  { value: "gemini-2.5-pro",        label: "Gemini 2.5 Pro",        provider: "gemini" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "gemini" },
  { value: "gemini-2.0-flash",      label: "Gemini 2.0 Flash",      provider: "gemini" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite", provider: "gemini" },
  // Mistral
  { value: "mistral-small-latest",  label: "Mistral Small",         provider: "mistral" },
  { value: "mistral-medium-latest", label: "Mistral Medium",        provider: "mistral" },
  { value: "mistral-large-latest",  label: "Mistral Large",         provider: "mistral" },
  // OpenAI
  { value: "gpt-5.5",              label: "GPT-5.5",               provider: "openai" },
  { value: "gpt-5.4-nano",         label: "GPT-5.4 Nano",          provider: "openai" },
  { value: "gpt-5.4-thinking",     label: "GPT-5.4 Thinking",      provider: "openai" },
  // Groq
  { value: "llama-3.3-70b-versatile",                        label: "Llama 3.3 70B",    provider: "groq" },
  { value: "meta-llama/llama-4-scout-17b-16e-instruct",      label: "Llama 4 Scout 17B", provider: "groq" },
  { value: "llama-3.1-8b-instant",                           label: "Llama 3.1 8B",     provider: "groq" },
];

/** Default model selected on first load. */
export const DEFAULT_MODEL = "gemini-2.5-flash";

/** Default provider selected on first load. */
export const DEFAULT_PROVIDER = "gemini";
