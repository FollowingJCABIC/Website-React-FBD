import { ROLE_FULL, ROLE_VISITOR, readJsonBody, readSessionRole } from "../../server/auth.mjs";
import { addQuestion } from "../../server/school-db.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const role = readSessionRole(req);
  if (![ROLE_VISITOR, ROLE_FULL].includes(role)) {
    res.status(403).json({ error: "Sign in is required" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const author = String(body?.author || "").trim();
    const message = String(body?.message || "").trim();

    if (!message) {
      res.status(400).json({ error: "Question text is required" });
      return;
    }

    const question = addQuestion({ author, message });
    res.status(201).json({ question });
  } catch (_error) {
    res.status(400).json({ error: "Invalid request body" });
  }
}
