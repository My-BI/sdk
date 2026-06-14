# Signing & publishing a plugin

A `.mbip` runs in MyBI only if its signature verifies (or the user consents to an
unsigned/community one). Tiers: `mybi` (first-party) · `verified` (you sign, MyBI countersigns
your key) · `community` (registry-listed, unsigned, consent on install).

Your **private key never leaves your machine**.

## Verified (third-party) flow

```sh
mybi-plugin keygen                          # SEED (secret) + PUBLIC KEY (share)
# send MyBI your PUBLIC key → they return a countersign token over it
PUBLISHER_SEED=<seed> mybi-plugin publisher-sign mychart.mbip --token countersign-you.json
mybi-plugin verify mychart.mbip       # uses the public key — no secrets
```

The signed payload is `"mybi-plugin-v1\n" + id + "\n" + version + "\n" + sha256(manifest.json)
+ sha256(index.js)` — id, version and both files are bound; changing any breaks it.

MyBI re-verifies on import and at load (+ checks a revocation list). A signature proves
**authorship**, not capability — the iframe sandbox + tiers + per-dashboard policy bound what a
plugin can actually do.
