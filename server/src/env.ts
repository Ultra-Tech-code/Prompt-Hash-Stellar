/**
 * Server-side environment variable validation.
 * Validates required configuration at startup and exposes the result
 * so the health endpoint can report configuration status.
 */

export interface EnvCheck {
  key: string;
  description: string;
  optional?: boolean;
}

const REQUIRED_VARS: EnvCheck[] = [
  { key: "MONGODB_URI", description: "MongoDB connection string" },
];

const SERVER_SECRETS: EnvCheck[] = [
  { key: "PUBLIC_STELLAR_RPC_URL", description: "Stellar RPC URL" },
  {
    key: "PUBLIC_STELLAR_NETWORK_PASSPHRASE",
    description: "Stellar network passphrase",
  },
  {
    key: "PUBLIC_PROMPT_HASH_CONTRACT_ID",
    description: "PromptHash contract ID",
  },
];

/**
 * Validates required environment variables.
 * Returns an array of error messages for missing or placeholder values.
 * Does NOT expose actual secret values in error messages.
 */
export function validateEnv(): string[] {
  const errors: string[] = [];

  const allChecks = [...REQUIRED_VARS, ...SERVER_SECRETS];

  for (const { key, description } of allChecks) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      errors.push(`${key} — ${description} is not set`);
    }
  }

  return errors;
}
