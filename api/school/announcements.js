import { ROLE_FULL, readJsonBody, readSessionRole } from "../../server/auth.mjs";
import { addAnnouncement } from "../../server/school-db.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const role = readSessionRole(req);
  if (role !== ROLE_FULL) {
    res.status(403).json({ error: "Full access is required" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const title = String(body?.title || "").trim();
    const message = String(body?.message || "").trim();
    const author = String(body?.author || "Instructor").trim();

    if (!title || !message) {
      res.status(400).json({ error: "Title and message are required" });
      return;
    }

    const announcement = addAnnouncement({ title, message, author });
    res.status(201).json({ announcement });
  } catch (_error) {
    res.status(400).json({ error: "Invalid request body" });
  }
}
