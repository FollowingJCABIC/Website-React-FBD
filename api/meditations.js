import { loadPublicMeditations } from "../server/content.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const entries = loadPublicMeditations();
    res.status(200).json({ entries });
  } catch (_error) {
    res.status(500).json({ error: "Failed to load meditations" });
  }
}
