const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function normalizeInvite(code: string | undefined) {
  return (code ?? "")
    .trim()
    .toUpperCase()
    .replace(/[O]/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/[\s-]/g, "");
}

export function randomInvite(existing: Set<string>) {
  for (let n = 0; n < 32; n++) {
    let out = "";
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    for (const b of bytes) out += CROCKFORD[b % CROCKFORD.length];
    if (!existing.has(out)) return out;
  }
  throw new Error("Could not mint an invite code");
}
