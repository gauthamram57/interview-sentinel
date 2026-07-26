import psList from "ps-list";
import { matchesBlocklist } from "./blocklist.js";

/**
 * Scans running processes for known cheating-tool signatures.
 * @returns {Promise<Array<{kind: string, detail: string}>>}
 */
export async function scanProcesses() {
  const processes = await psList();
  const flags = [];

  for (const proc of processes) {
    const haystack = `${proc.name || ""} ${proc.cmd || ""}`;
    const match = matchesBlocklist(haystack);
    if (match) {
      flags.push({
        kind: match.kind,
        detail: `Process matching "${match.match}" (pid ${proc.pid}: ${proc.name})`,
      });
    }
  }

  return flags;
}
