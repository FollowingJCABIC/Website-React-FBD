import { ROLE_NONE, clearSessionCookie, readJsonBody, resolveRoleForCredentials, setSessionCookie } from "../../server/auth.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const role = resolveRoleForCredentials(body?.email, body?.password);

    if (role === ROLE_NONE) {
      clearSessionCookie(res);
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    setSessionCookie(res, role);
    res.status(200).json({ role });
  } catch (_error) {
    clearSessionCookie(res);
    res.status(400).json({ error: "Invalid request body" });
  }
}
