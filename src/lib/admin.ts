import { createHash, timingSafeEqual } from "node:crypto";
import type { User } from "./types";

export function adminSecretOk(req: Request) {
  const secret = process.env.SPARKBOARD_ADMIN_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-sparkboard-admin") ?? "";
  if (!got) return false;
  const ha = createHash("sha256").update(secret).digest();
  const hb = createHash("sha256").update(got).digest();
  return timingSafeEqual(ha, hb);
}

export function isOracleUser(user: User) {
  if (user.system) return true;
  const email = process.env.SPARKBOARD_ADMIN_EMAIL?.trim().toLowerCase();
  if (email && user.email?.trim().toLowerCase() === email) return true;
  return false;
}
