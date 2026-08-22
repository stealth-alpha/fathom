import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  verifyLicense,
  activate,
  saveLicense,
  loadLicense,
  currentTier,
  licensePath,
  maskKey,
  PRODUCT_ID,
} from "../src/license.js";

function tmpHome(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "fathom-lic-"));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  return home;
}

function okFetch(email = "dev@example.com") {
  return async () => ({
    status: 200,
    json: async () => ({
      success: true,
      uses: 1,
      purchase: { email, product_id: PRODUCT_ID },
    }),
  });
}

function failFetch(message = "That license does not exist for the provided product.") {
  return async () => ({
    status: 404,
    json: async () => ({ success: false, message }),
  });
}

describe("verifyLicense", () => {
  test("normalizes a successful verification", async () => {
    const rec = await verifyLicense("AAAA-BBBB-CCCC-DDDD-EEEE", { fetchImpl: okFetch() });
    assert.equal(rec.valid, true);
    assert.equal(rec.tier, "pro");
    assert.equal(rec.email, "dev@example.com");
    assert.equal(rec.productId, PRODUCT_ID);
  });

  test("normalizes a failed verification to free tier without throwing", async () => {
    const rec = await verifyLicense("NOPE-NOPE", { fetchImpl: failFetch() });
    assert.equal(rec.valid, false);
    assert.equal(rec.tier, "free");
    assert.match(rec.message, /does not exist/);
  });

  test("sends product id and key as form-encoded POST", async () => {
    let seen = null;
    await verifyLicense("KEY-1234", {
      fetchImpl: async (url, opts) => {
        seen = { url, opts };
        return { status: 200, json: async () => ({ success: true }) };
      },
    });
    assert.equal(seen.url, "https://api.gumroad.com/v2/licenses/verify");
    assert.equal(seen.opts.method, "POST");
    const body = seen.opts.body.toString();
    assert.ok(body.includes(`product_id=${encodeURIComponent(PRODUCT_ID)}`));
    assert.ok(body.includes("license_key=KEY-1234"));
  });

  test("network errors surface a clear message", async () => {
    await assert.rejects(
      () =>
        verifyLicense("K", {
          fetchImpl: async () => {
            throw new Error("ECONNREFUSED");
          },
        }),
      /ECONNREFUSED/
    );
  });
});

describe("save/load/tier", () => {
  test("activate writes license.json and tier flips to pro", async (t) => {
    const home = tmpHome(t);
    assert.equal(currentTier(home), "free");
    const { record, file } = await activate("AAAA-BBBB-CCCC-DDDD-EEEE", {
      fetchImpl: okFetch(),
      home,
    });
    assert.equal(record.valid, true);
    assert.equal(file, licensePath(home));
    const stored = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(stored.tier, "pro");
    assert.equal(stored.product_id, PRODUCT_ID);
    assert.equal(stored.license_key, "AAAA-BBBB-CCCC-DDDD-EEEE");
    assert.equal(currentTier(home), "pro");
  });

  test("failed activation writes nothing and stays free", async (t) => {
    const home = tmpHome(t);
    const { record, file } = await activate("BAD-KEY", { fetchImpl: failFetch(), home });
    assert.equal(record.valid, false);
    assert.equal(file, null);
    assert.equal(fs.existsSync(licensePath(home)), false);
    assert.equal(currentTier(home), "free");
  });

  test("loadLicense returns null for corrupt or foreign files", async (t) => {
    const home = tmpHome(t);
    fs.mkdirSync(path.dirname(licensePath(home)), { recursive: true });
    fs.writeFileSync(licensePath(home), "{not json");
    assert.equal(loadLicense(home), null);
    fs.writeFileSync(
      licensePath(home),
      JSON.stringify({ tier: "free", product_id: PRODUCT_ID })
    );
    assert.equal(loadLicense(home), null);
    fs.writeFileSync(
      licensePath(home),
      JSON.stringify({ tier: "pro", product_id: "other-product", license_key: "K" })
    );
    assert.equal(loadLicense(home), null);
  });

  test("saveLicense refuses unverified records", async (t) => {
    const home = tmpHome(t);
    assert.throws(() => saveLicense({ valid: false }, home), /unverified/);
  });
});

describe("maskKey", () => {
  test("keeps head and tail only", () => {
    assert.equal(maskKey("ABCDE-FGHI-JKLM-NOPQ-RSTU"), "ABCDE…RSTU");
    assert.equal(maskKey("short"), "****");
    assert.equal(maskKey(undefined), "****");
  });
});
