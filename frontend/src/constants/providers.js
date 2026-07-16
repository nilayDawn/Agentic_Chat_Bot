/**
 * constants/providers.js
 * Provider configuration used by SettingsModal.
 * Each provider maps to its API key env var name, input placeholder,
 * and a list of suggested model names.
 */

export const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    envVar: "GEMINI_API_KEY",
    placeholder: "AIzaSy...",
    suggestedModels: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ],
  },
  mistral: {
    name: "Mistral AI",
    envVar: "MISTRAL_API_KEY",
    placeholder: "mistral...",
    suggestedModels: [
      "mistral-small-latest",
      "mistral-medium-latest",
      "mistral-large-latest",
    ],
  },
  openai: {
    name: "OpenAI",
    envVar: "OPENAI_API_KEY",
    placeholder: "sk-proj-...",
    suggestedModels: ["gpt-5.5", "gpt-5.4-nano", "gpt-5.4-thinking"],
  },
  groq: {
    name: "Groq",
    envVar: "GROQ_API_KEY",
    placeholder: "gsk_...",
    suggestedModels: [
      "llama-3.3-70b-versatile",
      "meta-llama/llama-4-scout-17b-16e-instruct",
      "llama-3.1-8b-instant",
    ],
  },
};
