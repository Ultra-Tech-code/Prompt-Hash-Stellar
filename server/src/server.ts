import express from "express";
import { ImproveProxy } from "./controllers/controllers";
import { proxyrouter } from "./routes/proxyRoutes";
import { promptRouter } from "./routes/promptRoutes";
import { userRouter } from "./routes/userRoutes";
import { chatRouter } from "./routes/chatRoutes";
import { webhookRouter } from "./routes/webhookRoutes";
import { versioningRouter } from "./routes/versioningRoutes";
import { governanceRouter } from "./routes/governanceRoutes"; // Issue #113
import { runBackup, getBackupHealth } from "./services/backupService";
import { validateEnv } from "./env";

const app = express();

const port = 5000;

// Validate required environment variables at startup
const envErrors = validateEnv();
if (envErrors.length > 0) {
  console.error("\n[env] Server configuration errors:");
  for (const err of envErrors) {
    console.error(`  MISSING: ${err}`);
  }
  console.error(
    "[env] Server will start in degraded mode. Some features may not work.\n",
  );
}

app.use(express.json());

app.use("/api/improve-proxy", proxyrouter);

app.use("/api/prompts", promptRouter);

app.use("/api/user", userRouter);

app.use("/api/chat", chatRouter);
app.use("/api/webhooks", webhookRouter);
app.use("/api/versions", versioningRouter);
app.use("/api/governance", governanceRouter); // Issue #113

app.get("/health", async (req, res) => {
  const [state, backupHealth] = await Promise.all([
    IndexerState.findOne({ key: "prompt_hash_contract" }),
    getBackupHealth(),
  ]);
  res.json({
    status: "ok",
    config: envErrors.length === 0 ? "configured" : "degraded",
    indexer: {
      lastProcessedLedger: state?.lastIndexedLedger || 0,
      timestamp: new Date(),
    },
    backup: backupHealth,
  });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);

  // STARTS THE INDEXER HERE
  startIndexer().catch((err) => {
    console.error("Failed to start Soroban Indexer:", err);
  });

  // DAILY AUTOMATED BACKUP — runs immediately on startup then every 24 h.
  // Use BACKUP_S3_BUCKET env var to enable; silently skips if not configured.
  if (process.env.BACKUP_S3_BUCKET) {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const triggerBackup = () => {
      runBackup().catch((err) => {
        console.error("[backup] Scheduled backup failed:", err?.message ?? err);
      });
    };
    // Run once on startup, then on a 24-hour interval.
    triggerBackup();
    setInterval(triggerBackup, TWENTY_FOUR_HOURS);
    console.log("[backup] Daily backup scheduler started.");
  }
});
