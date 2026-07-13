export interface DeploymentBlock {
  timestamp: number;
}

export interface DeploymentBlockProvider {
  getBlock(blockNumber: number): Promise<DeploymentBlock | null>;
}

export interface DeploymentTimestampOptions {
  attempts?: number;
  delayMs?: number;
  fallbackTimestamp?: Date;
  sleep?: (delayMs: number) => Promise<void>;
}

export interface DeploymentTimestamp {
  timestamp: string;
  source: "block" | "receipt-observed-at";
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_DELAY_MS = 1_000;

function wait(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function resolveDeploymentTimestamp(
  provider: DeploymentBlockProvider,
  blockNumber: number,
  options: DeploymentTimestampOptions = {},
): Promise<DeploymentTimestamp> {
  const attempts = options.attempts ?? DEFAULT_ATTEMPTS;
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;
  const fallbackTimestamp = options.fallbackTimestamp ?? new Date();
  const sleep = options.sleep ?? wait;

  if (!Number.isSafeInteger(blockNumber) || blockNumber < 0) {
    throw new Error("Deployment block number must be a non-negative safe integer.");
  }
  if (!Number.isSafeInteger(attempts) || attempts < 1) {
    throw new Error("Deployment block lookup attempts must be a positive integer.");
  }
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("Deployment block lookup delay must be non-negative.");
  }
  if (Number.isNaN(fallbackTimestamp.getTime())) {
    throw new Error("Deployment fallback timestamp must be a valid date.");
  }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const block = await provider.getBlock(blockNumber);
      if (block !== null) {
        return {
          timestamp: new Date(Number(block.timestamp) * 1_000).toISOString(),
          source: "block",
        };
      }
    } catch {
      // A mined deployment remains successful even if this read-only lookup is temporarily unavailable.
    }

    if (attempt < attempts) {
      await sleep(delayMs);
    }
  }

  return {
    timestamp: fallbackTimestamp.toISOString(),
    source: "receipt-observed-at",
  };
}
