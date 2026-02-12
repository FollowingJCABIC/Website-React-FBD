import { ROLE_FULL, readJsonBody, readSessionRole } from "../../server/auth.mjs";
import { addResource } from "../../server/school-db.mjs";

function isSafeHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return ["http:", "https:"].includes(parsed.protocol);
  } catch (_error) {
    return false;
  }
}

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
    const description = String(body?.description || "").trim();
    const url = String(body?.url || "").trim();
    const type = String(body?.type || "Resource").trim();

    if (!title || !url) {
      res.status(400).json({ error: "Resource title and URL are required" });
      return;
    }

    if (!isSafeHttpUrl(url)) {
      res.status(400).json({ error: "Resource URL must be an http or https link" });
      return;
    }

    const resource = addResource({ title, description, url, type });
    res.status(201).json({ resource });
  } catch (_error) {
    res.status(400).json({ error: "Invalid request body" });
  }
}
