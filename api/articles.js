import { ROLE_FULL, readSessionRole } from "../server/auth.mjs";
import { loadEntries } from "../server/content.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const role = readSessionRole(req);
  if (role !== ROLE_FULL) {
    res.status(403).json({ error: "Full access is required" });
    return;
  }

  try {
    const entries = loadEntries();
    res.status(200).json({ entries });
  } catch (_error) {
    res.status(500).json({ error: "Failed to load articles" });
  }
}
