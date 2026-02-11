import { ROLE_NONE, readSessionRole } from "../../server/auth.mjs";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const role = readSessionRole(req) || ROLE_NONE;
  res.status(200).json({ role });
}
