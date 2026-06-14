# Signing & publishing an adapter

A `.mybiadapter` only runs in MyBI if its signature verifies. There are three tiers:

| Tier | Who signs | Badge |
|---|---|---|
| `mybi` | MyBI (first-party) | ✓ MyBI |
| `verified` | **you**, with a MyBI **countersign** of your key | ✓ Verified by MyBI |
| `community` | unsigned, registry-listed | consent prompt on install |

Your **private key never leaves your machine** — not in the repo, not in CI. CI only ever
*verifies* (with the public key) and publishes; it cannot sign.

## Verified (third-party) flow

1. **Generate a keypair** (Publisher Studio, or the signer CLI):
   ```sh
   mybi-plugin keygen        # → SEED (keep secret) + PUBLIC KEY (share)
   ```
2. **Send MyBI your PUBLIC key.** MyBI countersigns it and returns a small token
   (`countersign-<you>.json`) — proof MyBI vouches for your key. (MyBI never sees your seed.)
3. **Sign your adapter** with your seed + the token:
   ```sh
   PUBLISHER_SEED=<seed> mybi-plugin publisher-sign-adapter mychart.mybiadapter --token countersign-you.json
   ```
   → `mychart-signed.mybiadapter`, tier `verified`.
4. **Verify** (uses the public key — no secrets):
   ```sh
   node scripts/verify-adapter.mjs mychart-signed.mybiadapter
   ```
5. **Publish**: open a PR on `My-BI/plugin-registry` adding your engine to
   `charts/registry.json` (`adapterRepo`, `adapter: "ready"`), and attach the signed
   `.mybiadapter` to a release on your `adapterRepo`. CI verifies + promotes it.

The payload that's signed is `"mybi-adapter-v1\n" + id + "\n" + version + "\n" +
sha256(manifest.json) + sha256(bundle.js)` — so the manifest, the bundle and the identity
are all bound; changing any of them breaks the signature.

## Defense in depth

MyBI re-verifies the signature on **download** and on **every read**, and checks a revocation
list — so a CI bypass, a tampered release, or a later-revoked key can't run. A signature
proves **authorship**, not capability: adapters run in-process, so only install ones you
trust (that's what the tiers + consent are for).
