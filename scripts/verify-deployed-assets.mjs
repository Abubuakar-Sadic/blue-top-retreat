#!/usr/bin/env node
/**
 * Post-deploy asset verification.
 *
 * Confirms the branding/SEO assets referenced by index.html + site.webmanifest
 * are publicly reachable (HTTP 200) on the deployed site and served with the
 * expected content-type. Run after every deploy, e.g.:
 *
 *   node scripts/verify-deployed-assets.mjs https://www.bluetopvilla.com
 *
 * Exits non-zero if any required asset is missing/unreachable, so it can gate CI.
 */
const base = (process.argv[2] || "https://www.bluetopvilla.com").replace(/\/+$/, "");

const checks = [
  { path: "/favicon.ico", type: /icon|image|octet-stream/ },
  { path: "/favicon-16x16.png", type: /image\/png/ },
  { path: "/favicon-32x32.png", type: /image\/png/ },
  { path: "/apple-touch-icon.png", type: /image\/png/ },
  { path: "/android-chrome-192x192.png", type: /image\/png/ },
  { path: "/android-chrome-512x512.png", type: /image\/png/ },
  { path: "/site.webmanifest", type: /manifest|json/ },
  { path: "/og-image.jpg", type: /image\/jpe?g/ },
];

let failures = 0;
for (const c of checks) {
  const url = base + c.path;
  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    // Some hosts don't support HEAD for static assets — fall back to GET.
    if (res.status === 405 || res.status === 501) res = await fetch(url, { redirect: "follow" });
    const ct = res.headers.get("content-type") || "";
    const okType = c.type.test(ct);
    const ok = res.ok && okType;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${res.status}  ${c.path}  (${ct || "no content-type"})`);
  } catch (err) {
    failures++;
    console.log(`FAIL  ERR  ${c.path}  (${err.message})`);
  }
}

console.log(`\n${failures === 0 ? "All assets reachable ✔" : `${failures} asset(s) failed �’`}  — ${base}`);
process.exit(failures === 0 ? 0 : 1);
