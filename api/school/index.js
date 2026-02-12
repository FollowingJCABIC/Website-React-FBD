import { ROLE_FULL, ROLE_VISITOR, readSessionRole } from "../../server/auth.mjs";
import { listWhiteboards, readSchoolDb } from "../../server/school-db.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const role = readSessionRole(req);
  if (![ROLE_VISITOR, ROLE_FULL].includes(role)) {
    res.status(403).json({ error: "Sign in is required" });
    return;
  }

  try {
    const school = readSchoolDb();
    const whiteboards = listWhiteboards();
    res.status(200).json({
      school: {
        ...school,
        whiteboards,
      },
    });
  } catch (_error) {
    res.status(500).json({ error: "Failed to load school data" });
  }
}
