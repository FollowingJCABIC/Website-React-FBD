import { ROLE_FULL, ROLE_VISITOR, readJsonBody, readSessionRole } from "../../server/auth.mjs";
import {
  createWhiteboard,
  getWhiteboard,
  listWhiteboards,
  saveWhiteboard,
} from "../../server/school-db.mjs";

function hasSchoolAccess(role) {
  return role === ROLE_VISITOR || role === ROLE_FULL;
}

export default async function handler(req, res) {
  const role = readSessionRole(req);
  if (!hasSchoolAccess(role)) {
    res.status(403).json({ error: "Sign in is required" });
    return;
  }

  if (req.method === "GET") {
    const id = String(req.query?.id || "").trim();
    if (id) {
      const whiteboard = getWhiteboard(id);
      if (!whiteboard) {
        res.status(404).json({ error: "Whiteboard not found" });
        return;
      }

      res.status(200).json({ whiteboard });
      return;
    }

    res.status(200).json({ whiteboards: listWhiteboards() });
    return;
  }

  if (req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const title = String(body?.title || "").trim();
      const author = String(body?.author || "").trim();

      const created = createWhiteboard({
        title,
        author,
        paths: Array.isArray(body?.paths) ? body.paths : [],
        pageDrawings:
          body?.pageDrawings && typeof body.pageDrawings === "object" ? body.pageDrawings : undefined,
        pageOrder: Array.isArray(body?.pageOrder) ? body.pageOrder : undefined,
        pageLabels: body?.pageLabels && typeof body.pageLabels === "object" ? body.pageLabels : undefined,
        activePageKey: String(body?.activePageKey || "").trim(),
        previewImage: String(body?.previewImage || ""),
      });

      res.status(201).json(created);
      return;
    } catch (_error) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
  }

  if (req.method === "PUT") {
    try {
      const body = await readJsonBody(req);
      const id = String(body?.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "Whiteboard id is required" });
        return;
      }

      const updated = saveWhiteboard({
        id,
        title: String(body?.title || "").trim(),
        author: String(body?.author || "").trim(),
        paths: Array.isArray(body?.paths) ? body.paths : undefined,
        pageDrawings:
          body?.pageDrawings && typeof body.pageDrawings === "object" ? body.pageDrawings : undefined,
        pageOrder: Array.isArray(body?.pageOrder) ? body.pageOrder : undefined,
        pageLabels: body?.pageLabels && typeof body.pageLabels === "object" ? body.pageLabels : undefined,
        activePageKey: String(body?.activePageKey || "").trim(),
        previewImage: typeof body?.previewImage === "string" ? body.previewImage : undefined,
      });

      if (!updated) {
        res.status(404).json({ error: "Whiteboard not found" });
        return;
      }

      res.status(200).json(updated);
      return;
    } catch (_error) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
  }

  res.status(405).json({ error: "Method not allowed" });
}
