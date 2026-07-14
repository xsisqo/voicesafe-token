export function requireBaseScanApiKey(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0 || value === "YOUR_BASESCAN_API_KEY") {
    throw new Error("BASESCAN_API_KEY is required to verify the recorded deployment.");
  }

  return value;
}
