import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";
export const PRODUCT_ID = "Rr_1nRzaI9mDlBLjfLD-yg=="; // Fathom Pro
export const TOOL_NAME = "fathom";

export function licensePath(home = os.homedir()) {
  return path.join(home, ".config", TOOL_NAME, "license.json");
}

/**
 * Verify a license key against Gumroad.
 * Returns a normalized record: { valid, tier, licenseKey, email, productId, raw }
 */
export async function verifyLicense(licenseKey, { fetchImpl = fetch, productId = PRODUCT_ID } = {}) {
  let res;
  try {
    res = await fetchImpl(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ product_id: productId, license_key: String(licenseKey).trim() }),
    });
  } catch (err) {
    throw new Error(`License verification request failed: ${err.message}`);
  }
  const data = await res.json().catch(() => null);
  if (!data || typeof data.success !== "boolean") {
    throw new Error(`License verification returned an unexpected response (HTTP ${res.status})`);
  }
  return normalizeVerification(data, { licenseKey, productId });
}

function normalizeVerification(data, { licenseKey, productId }) {
  if (!data.success) {
    return {
      valid: false,
      tier: "free",
      licenseKey,
      productId,
      email: null,
      message: data.message || "License is not valid for this product.",
      raw: data,
    };
  }
  return {
    valid: true,
    tier: "pro",
    licenseKey,
    productId,
    email: data.purchase?.email ?? null,
    message: "License verified.",
    raw: data,
  };
}

/** Persist a verified license to ~/.config/<tool>/license.json. */
export function saveLicense(record, home = os.homedir()) {
  if (!record || record.valid !== true) {
    throw new Error("Refusing to save an unverified license.");
  }
  const file = licensePath(home);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const payload = {
    tool: TOOL_NAME,
    tier: record.tier,
    product_id: record.productId,
    license_key: record.licenseKey,
    email: record.email,
    verified_at: new Date().toISOString(),
  };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n");
  return file;
}

/** Load a previously activated license, or null. Corrupt files read as free. */
export function loadLicense(home = os.homedir()) {
  try {
    const parsed = JSON.parse(fs.readFileSync(licensePath(home), "utf8"));
    if (parsed && parsed.tier === "pro" && parsed.product_id === PRODUCT_ID && parsed.license_key) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/** Current tier: "pro" when a verified license exists locally, else "free". */
export function currentTier(home = os.homedir()) {
  return loadLicense(home) ? "pro" : "free";
}

/** Mask a license key for display: keep first and last segment only. */
export function maskKey(key) {
  const s = String(key ?? "").trim();
  if (s.length <= 10) return "****";
  return `${s.slice(0, 5)}…${s.slice(-4)}`;
}

/** Verify + persist in one step. Returns { record, file } (file is null when invalid). */
export async function activate(licenseKey, opts = {}) {
  const record = await verifyLicense(licenseKey, opts);
  const file = record.valid ? saveLicense(record, opts.home) : null;
  return { record, file };
}
