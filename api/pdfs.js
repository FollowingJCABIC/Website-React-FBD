import { ROLE_FULL, readSessionRole } from "../server/auth.mjs";
import { loadPdfLibrary } from "../server/content.mjs";

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
    const pdfLibrary = loadPdfLibrary();
    res.status(200).json({ pdfLibrary });
  } catch (_error) {
    res.status(500).json({ error: "Failed to load PDF library" });
  }
}
