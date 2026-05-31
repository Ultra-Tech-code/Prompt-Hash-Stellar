/**
 * Build-time environment validation for PromptHash.
 * Run via: npx tsx scripts/validate-env.ts
 *
 * Fails fast with clear messages when required configuration is missing.
 * Does not expose secret values in logs.
 */

const requiredFrontendVars = [
  {
    key: "PUBLIC_STELLAR_NETWORK",
    description: "Stellar network (TESTNET/PUBLIC/LOCAL/FUTURENET/STANDALONE)",
  },
  {
    key: "PUBLIC_STELLAR_NETWORK_PASSPHRASE",
    description: "Stellar network passphrase",
  },
  { key: "PUBLIC_STELLAR_RPC_URL", description: "Stellar RPC URL" },
  { key: "PUBLIC_STELLAR_HORIZON_URL", description: "Stellar Horizon URL" },
  {
    key: "PUBLIC_PROMPT_HASH_CONTRACT_ID",
    description: "PromptHash contract ID",
  },
  {
    key: "PUBLIC_UNLOCK_PUBLIC_KEY",
    description: "Public key for unlock encryption",
  },
];

const requiredApiVars = [
  {
    key: "CHALLENGE_TOKEN_SECRET",
    description: "Secret for signing challenge tokens",
  },
  {
    key: "UNLOCK_PUBLIC_KEY",
    description: "Public key for unlock encryption (server-side)",
  },
  {
    key: "UNLOCK_PRIVATE_KEY",
    description: "Private key for unlock decryption",
  },
];

function validate(
  prefix: string,
  vars: Array<{ key: string; description: string }>,
): boolean {
  let valid = true;
  for (const { key, description } of vars) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      console.error(`  MISSING: ${key} — ${description}`);
      valid = false;
    } else if (
      value.includes("replace") ||
      value.includes("BASE64_") ||
      value.includes("XXXX")
    ) {
      console.error(
        `  PLACEHOLDER: ${key} — ${description} (still has placeholder value)`,
      );
      valid = false;
    }
  }
  return valid;
}

function main() {
  console.log("\nPromptHash Environment Validation");
  console.log("=".repeat(50));

  let allValid = true;

  console.log("\nFrontend (PUBLIC_*) variables:");
  const feValid = validate("PUBLIC_", requiredFrontendVars);
  if (feValid) console.log("  All frontend variables OK");
  allValid = allValid && feValid;

  console.log("\nAPI/Server secrets (CHALLENGE_TOKEN_SECRET, UNLOCK_*):");
  const apiValid = validate("", requiredApiVars);
  if (apiValid) console.log("  All API variables OK");
  allValid = allValid && apiValid;

  console.log("");
  if (allValid) {
    console.log("All required environment variables are configured.");
    process.exit(0);
  } else {
    console.error(
      "Some required environment variables are missing or still have placeholder values.",
    );
    console.error("Copy .env.example to .env and fill in the required values.");
    process.exit(1);
  }
}

main();
