import { withObservability } from "../src/lib/observability/wrapper";
import { IndexerState } from "../server/src/models/IndexerState";
import connectDb from "../server/src/db/connectDb";

const requiredEnvVars = [
  "PUBLIC_STELLAR_RPC_URL",
  "PUBLIC_STELLAR_NETWORK_PASSPHRASE",
  "PUBLIC_PROMPT_HASH_CONTRACT_ID",
  "CHALLENGE_TOKEN_SECRET",
  "UNLOCK_PUBLIC_KEY",
  "UNLOCK_PRIVATE_KEY",
] as const;

function checkConfig(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const key of requiredEnvVars) {
    if (!process.env[key] || process.env[key]?.trim() === "") {
      missing.push(key);
    }
  }
  return { configured: missing.length === 0, missing };
}

async function handler(req: any, res: any) {
  await connectDb();
  const state = await IndexerState.findOne({ key: "prompt_hash_contract" });
  const config = checkConfig();

  const status = {
    status: config.configured ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    config: {
      configured: config.configured,
      missingCount: config.missing.length,
    },
    indexer: {
      lastProcessedLedger: state?.lastIndexedLedger || 0,
    },
  };

  res.status(config.configured ? 200 : 200).json(status);
}

export default withObservability(handler, "health");
