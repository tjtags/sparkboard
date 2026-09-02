export function devSwitcherEnabled() {
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.NODE_ENV === "production") return false;
  return process.env.SPARKBOARD_DEV_SWITCHER === "1";
}
