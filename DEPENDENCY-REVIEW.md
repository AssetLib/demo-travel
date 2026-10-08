# Local dependency review — 2026-10-07

This is a dependency inventory, not a penetration test or a finding that every affected package is reachable in the app. The public examples are preview software. Do not expose the development server; use the exported static website for a public preview. Native distribution remains unverified.

`npx expo install --check` passed: **Dependencies are up to date** for SDK 57. The installed framework versions are Expo 57.0.27, Expo Router 57.0.25, React Native 0.86.3, and React 19.2.3.

`npm audit --omit=dev --json` reports **29 affected package entries: 19 high and 10 moderate**, flowing from **four root advisories**. `--omit=dev` does not mean these are all device/browser runtime vulnerabilities: Expo places significant CLI/build tooling in its dependency tree. Reproduce the current tree report with `npm audit --omit=dev --json`; local audit output is intentionally excluded from the repository.

| Installed dependency chain | Root advisory | App implication / remaining work |
| --- | --- | --- |
| Expo → Metro → metro-file-map → micromatch → **braces 3.0.3** | [Nested-pattern stack-exhaustion denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Observed in bundler/file-matching tooling. This is not proof of browser reachability. Review untrusted build inputs and upstream fix before production tooling use. |
| Expo Router 57.0.25 → query-string 7.1.3 → **decode-uri-component 0.2.2** | [Malformed-percent-input decoding denial of service](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Potentially relevant to router handling of externally supplied URLs. No exploit or exact runtime reachability was tested. This remaining runtime-adjacent issue must be reassessed before external distribution. |
| Expo CLI / code-signing-certificates → **node-forge 1.4.0** | [RSA signature-verification parsing issue](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Observed in CLI/signing tooling. The integrated Assetlib verifier uses Ed25519 through Noble, not this RSA implementation. The finding must still be assessed for Expo signing/build tooling; it is not evidence that the Assetlib verifier is affected. |
| Expo config-plugins → xcode 3.0.1 → **uuid 7.0.3** | [UUID buffer bounds issue](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Observed in native project-generation tooling. No native project generation was run. Recheck before building native releases. |

A non-mutating `npm audit fix --dry-run --json` on the original linked development tree still reported its same 28 affected package entries. It proposed dependency-tree bookkeeping but **zero changed packages and no reduction in findings**; it did not establish a safe SDK-compatible remediation. The local verification retained the raw report; reproduce it with `npm audit fix --dry-run --json` without applying changes.

The audit's force suggestions include Expo 44.0.6 and React Native 0.72.17 downgrades, or an Expo Router 58.0.16 upgrade outside the selected SDK 57 matrix. Those are not safe drop-in fixes for this app. No forced changes, speculative dependency overrides, or claim of a clean audit has been made.

Rechecked after adding the Assetlib SDK and Expo Image: the compatible tree reports 29 affected entries in this standalone package tree. The current advisory and registry checks found:

- **braces 3.0.3** and **node-forge 1.4.0** remain their registry's latest versions; their listed advisories have no patched release.
- **decode-uri-component 0.5.0** is patched. It is an ESM package outside query-string 7.1.3's declared `^0.2.2` range. Replacing it alone is not assumed to be a supported drop-in change. The router's URL-decoding availability risk remains a preview limitation; a tested supported dependency upgrade is needed before claiming it resolved.
- **uuid 11.1.1+** has a patch, but is outside xcode 3.0.1's declared `^7.0.3` range. This chain is native project-generation tooling, not established as delivered app code.

These are upstream dependency constraints, not reasons to run a forced framework downgrade. Recheck supported patches before a production adoption and keep public preview claims separate from a clean dependency audit.

The standalone install adds `@assetlib/sdk-expo` as an affected ancestor through its Expo/React Native peer relationships, increasing the linked-development-tree count from 28 to 29. This does not add a fifth root advisory or prove an additional runtime exploit.
