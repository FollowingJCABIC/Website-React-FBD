import crypto from "node:crypto";

export const ROLE_NONE = "none";
export const ROLE_VISITOR = "visitor";
export const ROLE_FULL = "full";

const SESSION_COOKIE = "lds_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

const FALLBACK_VISITOR_EMAIL = "visitor@lastday.studio";
const FALLBACK_VISITOR_PASSWORD = "Visitor#2026";
const FALLBACK_FULL_EMAIL = "admin@lastday.studio";
const FALLBACK_FULL_PASSWORD = "LastDay#2026";
const FALLBACK_SECRET = "change-this-secret-in-vercel-env";

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return acc;
      const key = pair.slice(0, idx);
      const value = pair.slice(idx + 1);
      acc[key] = value;
      return acc;
    }, {});
}

function timingSafeEquals(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function sessionSecret() {
  return process.env.AUTH_SESSION_SECRET || FALLBACK_SECRET;
}

function signPayload(payload) {
  return crypto.createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function encodeToken(payload) {
  return Buffer.from(payload, "utf8").toString("base64url");
}

function decodeToken(token) {
  return Buffer.from(token, "base64url").toString("utf8");
}

export function resolveRoleForCredentials(emailInput, passwordInput) {
  const email = String(emailInput || "").trim().toLowerCase();
  const password = String(passwordInput || "");

  const visitorEmail = String(process.env.VISITOR_EMAIL || FALLBACK_VISITOR_EMAIL).trim().toLowerCase();
  const visitorPassword = String(process.env.VISITOR_PASSWORD || FALLBACK_VISITOR_PASSWORD);
  const fullEmail = String(process.env.FULL_EMAIL || FALLBACK_FULL_EMAIL).trim().toLowerCase();
  const fullPassword = String(process.env.FULL_PASSWORD || FALLBACK_FULL_PASSWORD);

  if (timingSafeEquals(email, fullEmail) && timingSafeEquals(password, fullPassword)) {
    return ROLE_FULL;
  }

  if (timingSafeEquals(email, visitorEmail) && timingSafeEquals(password, visitorPassword)) {
    return ROLE_VISITOR;
  }

  return ROLE_NONE;
}

export function readSessionRole(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) return ROLE_NONE;

  try {
    const decoded = decodeToken(token);
    const [role, expiresAtRaw, signature] = decoded.split(".");

    if (![ROLE_VISITOR, ROLE_FULL].includes(role)) return ROLE_NONE;

    const expiresAt = Number.parseInt(expiresAtRaw, 10);
    if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
      return ROLE_NONE;
    }

    const payload = `${role}.${expiresAtRaw}`;
    const expectedSignature = signPayload(payload);
    if (!timingSafeEquals(signature, expectedSignature)) {
      return ROLE_NONE;
    }

    return role;
  } catch (_error) {
    return ROLE_NONE;
  }
}

function cookieBase() {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  return ["Path=/", "HttpOnly", "SameSite=Lax", secure ? "Secure" : ""]
    .filter(Boolean)
    .join("; ");
}

export function setSessionCookie(res, role) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${role}.${expiresAt}`;
  const signature = signPayload(payload);
  const token = encodeToken(`${payload}.${signature}`);
  const cookie = `${SESSION_COOKIE}=${token}; Max-Age=${SESSION_TTL_SECONDS}; ${cookieBase()}`;
  res.setHeader("Set-Cookie", cookie);
}

export function clearSessionCookie(res) {
  const cookie = `${SESSION_COOKIE}=; Max-Age=0; ${cookieBase()}`;
  res.setHeader("Set-Cookie", cookie);
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
