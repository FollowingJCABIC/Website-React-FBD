import { ROLE_FULL, readJsonBody, readSessionRole } from "../../server/auth.mjs";
import { addAssignment } from "../../server/school-db.mjs";

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
    const dueDate = String(body?.dueDate || "").trim();
    const points = Number(body?.points);
    const author = String(body?.author || "Instructor").trim();

    if (!title) {
      res.status(400).json({ error: "Assignment title is required" });
      return;
    }

    const assignment = addAssignment({
      title,
      description,
      dueDate,
      points: Number.isFinite(points) ? points : 0,
      author,
    });

    res.status(201).json({ assignment });
  } catch (_error) {
    res.status(400).json({ error: "Invalid request body" });
  }
}
