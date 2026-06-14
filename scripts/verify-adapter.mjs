#!/usr/bin/env node
// Self-contained adapter verifier for CI — PUBLIC key only, no secrets, no deps.
// Verifies a `.mybiadapter` (mybi-adapter-v1) against the bundled MyBI PUBLIC key, so a
// GitHub Action (running as github-actions[bot]) can refuse to promote anything that isn't
// validly MyBI-signed — WITHOUT ever holding the private seed. Mirrors the app's verifier
// (src-tauri/src/plugin_sign.rs) + tools/plugin-signer/lib.mjs byte-for-byte.
//
//   node scripts/verify-adapter.mjs <file.mybiadapter>   → exit 0 if ✓ (mybi/verified), else 1
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

// MyBI's PUBLIC verification key (safe to commit — it can only verify, never sign).
// Must equal plugin_sign.rs::MYBI_PUBKEY / lib.mjs MYBI_PUBKEY.
const MYBI_PUBKEY = Buffer.from([
  238, 1, 251, 147, 113, 73, 30, 214, 7, 146, 91, 160, 47, 243, 77, 227, 108, 251,
  103, 211, 173, 29, 251, 167, 243, 44, 38, 196, 8, 213, 132, 252,
]);
const ADAPTER_PREFIX = Buffer.from("mybi-adapter-v1\n");
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const sha256 = (b) => crypto.createHash("sha256").update(b).digest();

const file = process.argv[2];
if (!file) { console.error("usage: verify-adapter.mjs <file.mybiadapter>"); process.exit(2); }

const entry = (n) => {
  try { return execFileSync("unzip", ["-p", file, n], { maxBuffer: 64 * 1024 * 1024 }); }
  catch { return null; }
};
const manifest = entry("manifest.json");
const bundle = entry("bundle.js");
const sig = entry("signature.json");
if (!manifest || !bundle) { console.error("✗ missing manifest.json or bundle.js"); process.exit(2); }
if (!sig) { console.error("✗ unsigned"); process.exit(1); }

const sf = JSON.parse(sig.toString("utf8"));
const m = JSON.parse(manifest.toString("utf8"));
if (sf.alg && sf.alg !== "ed25519") { console.error("✗ unsupported alg"); process.exit(1); }

const payload = Buffer.concat([
  ADAPTER_PREFIX,
  Buffer.from(String(m.id)), Buffer.from("\n"),
  Buffer.from(String(m.version ?? "")), Buffer.from("\n"),
  sha256(manifest), sha256(bundle),
]);
const pubKey = (raw) => crypto.createPublicKey({ key: Buffer.concat([SPKI_PREFIX, raw]), format: "der", type: "spki" });
const verify = (raw, msg, sigB64) => {
  try { return crypto.verify(null, msg, pubKey(raw), Buffer.from(String(sigB64), "base64")); } catch { return false; }
};

let ok = false, tier = "unverified";
if (sf.tier === "mybi") {
  ok = verify(MYBI_PUBKEY, payload, sf.sig);
} else if (sf.tier === "verified") {
  const pub = Buffer.from(sf.pubkey || "", "base64");
  ok = pub.length === 32 && verify(pub, payload, sf.sig) && verify(MYBI_PUBKEY, pub, sf.countersig);
}
if (ok) { tier = sf.tier; console.log(`✓ ${tier} — ${m.id}@${m.version}`); process.exit(0); }
console.error(`✗ unverified (declared tier=${sf.tier})`);
process.exit(1);
